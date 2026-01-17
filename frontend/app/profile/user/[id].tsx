import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://safewheels-dev.preview.emergentagent.com';

interface UserProfile {
  phone: string;
  name: string;
  avatar?: string;
  isAdmin: boolean;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  listingsCount: number;
  videosCount: number;
  isFollowing: boolean;
}

interface CarListing {
  _id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  photos: string[];
  region: string;
}

interface VideoReview {
  _id: string;
  title: string;
  thumbnailUrl?: string;
  videoUrl: string;
  viewsCount: number;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<CarListing[]>([]);
  const [videos, setVideos] = useState<VideoReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'listings' | 'details' | 'reels'>('listings');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const fetchProfile = async () => {
    if (!id) return;
    
    try {
      const viewerId = user?.phone ? `&viewer_id=${encodeURIComponent(user.phone)}` : '';
      const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(id)}/profile?${viewerId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchListings = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(id)}/listings`);
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const fetchVideos = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/${encodeURIComponent(id)}/videos`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchListings(), fetchVideos()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleFollow = async () => {
    if (!user?.phone || !id) return;
    
    try {
      const response = await fetch(
        `${API_URL}/api/users/${encodeURIComponent(id)}/follow?followerId=${encodeURIComponent(user.phone)}`,
        { method: 'POST' }
      );
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.following);
        setFollowersCount(prev => data.following ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleChat = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    router.push(`/chat/${id}`);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' с.';
  };

  const renderListingCard = ({ item }: { item: CarListing }) => (
    <TouchableOpacity 
      style={styles.listingCard}
      onPress={() => router.push(`/car/${item._id}`)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.photos[0] }} 
        style={styles.listingImage}
        resizeMode="cover"
      />
      <View style={styles.listingCardInfo}>
        <Text style={styles.listingCardPrice}>{formatPrice(item.price)}</Text>
        <Text style={styles.listingCardTitle} numberOfLines={1}>
          {item.brand} {item.model}
        </Text>
        <View style={styles.listingCardMeta}>
          <Ionicons name="location-outline" size={12} color="#666" />
          <Text style={styles.listingCardLocation}>{item.region}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderVideoCard = ({ item }: { item: VideoReview }) => (
    <TouchableOpacity 
      style={styles.videoCard}
      onPress={() => router.push(`/(tabs)/reviews`)}
      activeOpacity={0.8}
    >
      <View style={styles.videoThumbnail}>
        <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
      </View>
      <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.videoViews}>👁 {item.viewsCount} просмотров</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Пользователь не найден</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnProfile = user?.phone === id;

  return (
    <View style={styles.container}>
      {/* Header - Blue gradient like Manzili */}
      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerAction}>
                <Ionicons name="share-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerAction}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileSection}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followersCount}</Text>
                <Text style={styles.statLabel}>Подписчики</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.followingCount}</Text>
                <Text style={styles.statLabel}>Подписки</Text>
              </View>
            </View>

            <Text style={styles.userName}>{profile.name}</Text>
            <View style={styles.userTypeBadge}>
              <Text style={styles.userTypeText}>
                {profile.isAdmin ? 'Админ' : 'Покупатель'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {isOwnProfile ? (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => router.push('/(tabs)/profile')}
                >
                  <Ionicons name="pencil" size={18} color="#0066FF" />
                  <Text style={styles.editButtonText}>Редактировать</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity 
                    style={[styles.followButton, isFollowing && styles.followingButton]}
                    onPress={handleFollow}
                  >
                    <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                      {isFollowing ? 'Подписан' : 'Подписаться'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
                    <Ionicons name="chatbubble-ellipses" size={20} color="#0066FF" />
                    <Text style={styles.chatButtonText}>Чат</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'listings' && styles.activeTab]}
          onPress={() => setActiveTab('listings')}
        >
          <Text style={[styles.tabText, activeTab === 'listings' && styles.activeTabText]}>
            Объявления
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
            Подробности
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
          onPress={() => setActiveTab('reels')}
        >
          <Text style={[styles.tabText, activeTab === 'reels' && styles.activeTabText]}>
            Обзоры авто
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'listings' && (
        <FlatList
          data={listings}
          renderItem={renderListingCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.listingsGrid}
          columnWrapperStyle={styles.listingsRow}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>Нет объявлений</Text>
            </View>
          }
        />
      )}

      {activeTab === 'details' && (
        <ScrollView 
          style={styles.detailsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <Text style={styles.detailText}>{profile.phone}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.detailText}>
              Зарегистрирован: {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="car-outline" size={20} color="#666" />
            <Text style={styles.detailText}>
              Объявлений: {profile.listingsCount}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="videocam-outline" size={20} color="#666" />
            <Text style={styles.detailText}>
              Видео: {profile.videosCount}
            </Text>
          </View>
        </ScrollView>
      )}

      {activeTab === 'reels' && (
        <FlatList
          data={videos}
          renderItem={renderVideoCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.listingsGrid}
          columnWrapperStyle={styles.listingsRow}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="videocam-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>Нет видео</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  headerBackground: {
    backgroundColor: '#0066FF',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerAction: {
    padding: 4,
  },
  profileSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  userTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  userTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  followButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
  },
  followingButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  followButtonText: {
    color: '#0066FF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#FFFFFF',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  chatButtonText: {
    color: '#0066FF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#0066FF',
    fontWeight: '600',
  },
  listingsGrid: {
    padding: 12,
  },
  listingsRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listingCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listingImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0F0F0',
  },
  listingCardInfo: {
    padding: 10,
  },
  listingCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066FF',
  },
  listingCardTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
  listingCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  listingCardLocation: {
    fontSize: 11,
    color: '#666',
  },
  videoCard: {
    width: CARD_WIDTH,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: 150,
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    padding: 10,
  },
  videoViews: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});
