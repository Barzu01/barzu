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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI } from '../../services/api';

interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    id: string;
    sellerId: string;
    sellerPhone: string;
    carTitle: string;
  }>();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    if (chatId) {
      loadMessages();
      const interval = setInterval(loadMessages, 5000); // Poll for new messages
      return () => clearInterval(interval);
    }
  }, [chatId]);

  const initChat = async () => {
    if (!user || !params.sellerPhone) return;
    
    try {
      const chat = await chatAPI.createOrGetChat(
        user.phone,
        params.sellerPhone,
        params.id,
        params.carTitle
      );
      setChatId(chat._id);
      await chatAPI.markAsRead(chat._id, user.phone);
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!chatId) return;
    
    try {
      const data = await chatAPI.getMessages(chatId);
      setMessages(data);
      if (user) {
        await chatAPI.markAsRead(chatId, user.phone);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || !user || !params.sellerPhone) return;

    setSending(true);
    try {
      await chatAPI.sendMessage(
        chatId,
        user.phone,
        params.sellerPhone,
        newMessage.trim(),
        params.id,
        params.carTitle
      );
      setNewMessage('');
      await loadMessages();
      flatListRef.current?.scrollToEnd({ animated: true });
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
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.senderId === user?.phone;
    const showDate = index === 0 || 
      formatDate(item.createdAt) !== formatDate(messages[index - 1].createdAt);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
        ]}>
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.theirMessage
          ]}>
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText
            ]}>
              {item.message}
            </Text>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime
            ]}>
              {formatTime(item.createdAt)}
              {isMyMessage && (
                <Ionicons 
                  name={item.isRead ? "checkmark-done" : "checkmark"} 
                  size={14} 
                  color={item.isRead ? "#34D399" : "rgba(255,255,255,0.6)"} 
                />
              )}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {params.carTitle || 'Чат'}
          </Text>
          <Text style={styles.headerSubtitle}>{params.sellerPhone}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Car Info Banner */}
      {params.carTitle && (
        <TouchableOpacity 
          style={styles.carBanner}
          onPress={() => router.push({ pathname: '/car/[id]', params: { id: params.id } })}
        >
          <Ionicons name="car" size={20} color="#0066FF" />
          <Text style={styles.carBannerText} numberOfLines={1}>{params.carTitle}</Text>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={48} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Начните диалог</Text>
              <Text style={styles.emptySubtitle}>
                Напишите сообщение продавцу
              </Text>
            </View>
          }
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Введите сообщение..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
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
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  carBanner: {
    backgroundColor: '#E8F1FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  carBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 4,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: '#0066FF',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#0F172A',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#94A3B8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    color: '#0F172A',
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
    backgroundColor: '#CBD5E1',
  },
});
