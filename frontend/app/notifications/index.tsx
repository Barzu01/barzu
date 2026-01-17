import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { notificationAPI } from '../../services/api';

interface Notification {
  _id: string;
  userId: string;
  carId?: string;
  videoId?: string;
  fromUserId?: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationAPI.getAll(user.phone);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await notificationAPI.markAsRead(notification._id);
      setNotifications(notifications.map(n => 
        n._id === notification._id ? { ...n, isRead: true } : n
      ));
    }
    
    // Переход в зависимости от типа уведомления
    if (notification.videoId) {
      router.push('/(tabs)/reviews');
    } else if (notification.carId) {
      router.push(`/car/${notification.carId}`);
    } else if (notification.fromUserId) {
      router.push(`/profile/user/${notification.fromUserId}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await notificationAPI.markAllAsRead(user.phone);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'video_like':
        return 'heart';
      case 'video_comment':
        return 'chatbubble';
      case 'new_follower':
        return 'person-add';
      case 'chat':
        return 'chatbubbles';
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'price_drop':
        return 'pricetag';
      case 'promotion':
        return 'megaphone';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'video_like':
        return '#FF3B5C';
      case 'video_comment':
        return '#0066FF';
      case 'new_follower':
        return '#10B981';
      case 'chat':
        return '#8B5CF6';
      case 'approved':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      case 'price_drop':
        return '#F59E0B';
      case 'promotion':
        return '#EC4899';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU');
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
        <Ionicons 
          name={getNotificationIcon(item.type) as any} 
          size={24} 
          color={getNotificationColor(item.type)} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.message, !item.isRead && styles.unreadText]}>
          {item.message}
        </Text>
        <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Уведомления</Text>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Прочитать все</Text>
          </TouchableOpacity>
        )}
        {!notifications.some(n => !n.isRead) && <View style={{ width: 90 }} />}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={80} color="#C7C7CC" />
            <Text style={styles.emptyText}>Нет уведомлений</Text>
            <Text style={styles.emptySubtext}>
              Здесь будут уведомления о лайках, комментариях и подписчиках
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  markAllText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#F0F7FF',
    borderLeftWidth: 3,
    borderLeftColor: '#0066FF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  unreadText: {
    fontWeight: '600',
    color: '#000000',
  },
  time: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0066FF',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
});
