import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { carAPI, notificationAPI, favoritesAPI } from '../../services/api';
import { CarListing } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    loadCars();
    if (user) {
      loadUnreadCount();
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const favorites = await favoritesAPI.getAll(user.phone);
      const ids = new Set(favorites.map((car: CarListing) => car._id!));
      setFavoriteIds(ids);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const data = await notificationAPI.getUnreadCount(user.phone);
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const toggleFavorite = async (carId: string, e: any) => {
    e.stopPropagation();
    if (!user) return;
    
    try {
      if (favoriteIds.has(carId)) {
        await favoritesAPI.remove(user.phone, carId);
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(carId);
          return newSet;
        });
      } else {
        await favoritesAPI.add(user.phone, carId);
        setFavoriteIds(prev => new Set(prev).add(carId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    try {
      const data = await carAPI.getAll('approved', 50, 0);
      setCars(data);
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCars();
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} ${t('car.currency')}`;
  };

  const categories = [
    { id: '1', name: 'Автомобили', icon: '🚗', filter: null },
    { id: '2', name: 'Электромобили', icon: '⚡', filter: { engineType: 'electric' } },
    { id: '3', name: 'Мотоциклы', icon: '🏍️', filter: null },
    { id: '4', name: 'Грузовики', icon: '🚚', filter: null },
    { id: '5', name: 'Запчасти', icon: '🔧', filter: null },
    { id: '6', name: 'Аренда авто', icon: '🔑', filter: null },
  ];

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => {
        if (item.filter) {
          // TODO: Фильтрация по категории
        }
      }}
    >
      <View style={styles.categoryIconContainer}>
        <Text style={styles.categoryIcon}>{item.icon}</Text>
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderCarItem = ({ item }: { item: CarListing }) => (
    <TouchableOpacity
      style={styles.carCard}
      onPress={() => router.push({ pathname: '/car/[id]', params: { id: item._id } })}
    >
      {item.photos && item.photos.length > 0 ? (
        <Image
          source={{ uri: item.photos[0] }}
          style={styles.carImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.carImage, styles.noImage]}>
          <Ionicons name="car-outline" size={60} color="#C7C7CC" />
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.favoriteButton}
        onPress={(e) => toggleFavorite(item._id!, e)}
      >
        <Ionicons 
          name={favoriteIds.has(item._id!) ? "heart" : "heart-outline"} 
          size={24} 
          color={favoriteIds.has(item._id!) ? "#FF3B30" : "#FFFFFF"} 
        />
      </TouchableOpacity>

      <View style={styles.carInfo}>
        <Text style={styles.carTitle}>
          {item.brand} {item.model}
        </Text>
        <Text style={styles.carPrice}>{formatPrice(item.price)}</Text>
        <View style={styles.carDetails}>
          <Text style={styles.carDetail}>{item.year} {t('car.year')}</Text>
          <Text style={styles.carDetail}>•</Text>
          <Text style={styles.carDetail}>
            {item.mileage.toLocaleString()} {t('car.km')}
          </Text>
          <Text style={styles.carDetail}>•</Text>
          <Text style={styles.carDetail}>{t(`car.${item.transmission}`)}</Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#8E8E93" />
          <Text style={styles.location}>{t(`regions.${item.region}`)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('app.name')}</Text>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={26} color="#000000" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <FlatList
          horizontal
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        />
      </View>

      <FlatList
        data={cars}
        renderItem={renderCarItem}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={80} color="#C7C7CC" />
            <Text style={styles.emptyText}>{t('messages.noResults')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  categoriesSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryCard: {
    alignItems: 'center',
    marginHorizontal: 4,
    width: 85,
  },
  categoryIconContainer: {
    width: 75,
    height: 75,
    borderRadius: 20,
    backgroundColor: '#F0F6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 36,
  },
  categoryName: {
    fontSize: 13,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    gap: 20,
  },
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F8F9FA',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  carInfo: {
    padding: 20,
  },
  carTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  carPrice: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0066CC',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  carDetails: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  carDetail: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 20,
    color: '#9CA3AF',
    marginTop: 20,
    fontWeight: '600',
  },
});