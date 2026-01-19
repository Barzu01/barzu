import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://auto-social-hub-2.preview.emergentagent.com';

interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface ChatInfo {
  _id: string;
  participants: string[];
  otherUserName?: string;
  otherUserPhone: string;
  carId?: string;
  carTitle?: string;
}

export default function ChatScreen() {
  const { id: otherUserId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [otherUserHasListings, setOtherUserHasListings] = useState(false);
  const [otherUserName, setOtherUserName] = useState<string>('');

  // Проверить есть ли у собеседника объявления
  const checkOtherUserListings = async () => {
    if (!otherUserId) return;
    try {
      const response = await fetch(`${API_URL}/api/my-listings/${encodeURIComponent(otherUserId)}`);
      if (response.ok) {
        const listings = await response.json();
        setOtherUserHasListings(listings.length > 0);
      }
    } catch (error) {
      console.error('Error checking listings:', error);
    }
  };

  // Пометить сообщения как прочитанные
  const markMessagesAsRead = async () => {
    if (!chatInfo?._id || !user?.phone) return;
    try {
      await fetch(`${API_URL}/api/chats/${chatInfo._id}/mark-read?user_phone=${encodeURIComponent(user.phone)}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Функция звонка
  const handleCall = () => {
    if (otherUserId) {
      Linking.openURL(`tel:${otherUserId}`);
    }
  };

  // Найти или создать чат
  const findOrCreateChat = async () => {
    if (!user?.phone || !otherUserId) return null;
    
    try {
      // Получить список чатов пользователя
      const response = await fetch(`${API_URL}/api/chats/${encodeURIComponent(user.phone)}`);
      if (response.ok) {
        const chats = await response.json();
        // Найти чат с этим пользователем
        const existingChat = chats.find((chat: ChatInfo) => 
          chat.otherUserPhone === otherUserId || 
          chat.participants?.includes(otherUserId)
        );
        
        if (existingChat) {
          setChatInfo(existingChat);
          setOtherUserName(existingChat.otherUserName || otherUserId);
          return existingChat._id;
        }
      }
      
      // Если чата нет - создадим при первом сообщении
      // Пока получим имя пользователя
      const userResponse = await fetch(`${API_URL}/api/users/${encodeURIComponent(otherUserId)}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setOtherUserName(userData.name || otherUserId);
      } else {
        setOtherUserName(otherUserId);
      }
      
      return null;
    } catch (error) {
      console.error('Error finding chat:', error);
      return null;
    }
  };

  const fetchMessages = async () => {
    if (!chatInfo?._id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/chats/${chatInfo._id}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await findOrCreateChat();
      await checkOtherUserListings();
      setLoading(false);
    };
    init();
  }, [otherUserId, user?.phone]);

  useEffect(() => {
    if (chatInfo?._id) {
      fetchMessages();
      markMessagesAsRead(); // Отметить как прочитанные
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages();
        markMessagesAsRead();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [chatInfo?._id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user?.phone || !otherUserId) return;
    
    setSending(true);
    
    try {
      let chatId = chatInfo?._id;
      
      // Если чата нет - создаём
      if (!chatId) {
        const createResponse = await fetch(
          `${API_URL}/api/chats?senderId=${encodeURIComponent(user.phone)}&receiverId=${encodeURIComponent(otherUserId)}`,
          { method: 'POST' }
        );
        if (createResponse.ok) {
          const newChat = await createResponse.json();
          chatId = newChat._id;
          setChatInfo(newChat);
        } else {
          const errorText = await createResponse.text();
          console.error('Failed to create chat:', errorText);
          throw new Error('Failed to create chat');
        }
      }
      
      // Отправляем сообщение
      const response = await fetch(
        `${API_URL}/api/chats/${chatId}/messages?senderId=${encodeURIComponent(user.phone)}&receiverId=${encodeURIComponent(otherUserId)}&message=${encodeURIComponent(newMessage.trim())}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        const errorText = await response.text();
        console.error('Failed to send message:', errorText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.senderId === user?.phone;
    const showDate = index === 0 || 
      formatDate(item.createdAt) !== formatDate(messages[index - 1]?.createdAt);
    
    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
          <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
            {item.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.timeText, isMyMessage ? styles.myTimeText : styles.theirTimeText]}>
              {formatTime(item.createdAt)}
            </Text>
            {isMyMessage && (
              <Ionicons 
                name={item.isRead ? "checkmark-done" : "checkmark"} 
                size={14} 
                color={item.isRead ? "#34B7F1" : "rgba(255,255,255,0.7)"} 
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!user) {
    router.replace('/auth/login');
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => router.push(`/profile/user/${otherUserId}`)}
        >
          <View style={styles.avatar}>
            {otherUserName ? (
              <Text style={styles.avatarText}>
                {otherUserName.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person" size={20} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{otherUserName || 'Пользователь'}</Text>
            <Text style={styles.userStatus}>онлайн</Text>
          </View>
        </TouchableOpacity>
        
        {otherUserHasListings && (
          <TouchableOpacity style={styles.headerAction} onPress={handleCall}>
            <Ionicons name="call-outline" size={24} color="#0066FF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066FF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={60} color="#CCC" />
                <Text style={styles.emptyText}>Начните общение</Text>
                <Text style={styles.emptySubtext}>
                  Напишите первое сообщение
                </Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Сообщение..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userStatus: {
    fontSize: 12,
    color: '#10B981',
  },
  headerAction: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0066FF',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
  },
  myTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirTimeText: {
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
});
