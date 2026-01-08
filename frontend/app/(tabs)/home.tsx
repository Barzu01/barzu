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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { carAPI, notificationAPI, favoritesAPI } from '../../services/api';
import { CarListing } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
    if (user) {
      loadUnreadCount();
      loadFavorites();
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString();
  };

  const categories = [
    { id: 'all', name: 'Все', icon: '🚙', gradient: ['#6366F1', '#8B5CF6'] },
    { id: 'cars', name: 'Авто', icon: '🚗', gradient: ['#0066FF', '#00D4FF'] },
    { id: 'electric', name: 'Электро', icon: '⚡', gradient: ['#10B981', '#34D399'] },
    { id: 'motorcycles', name: 'Мото', icon: '🏍️', gradient: ['#F59E0B', '#FBBF24'] },
    { id: 'trucks', name: 'Грузовики', icon: '🚚', gradient: ['#EF4444', '#F87171'] },
    { id: 'rent', name: 'Аренда', icon: '🔑', gradient: ['#8B5CF6', '#A78BFA'] },
  ];

  const filteredCars = selectedCategory && selectedCategory !== 'all'
    ? cars.filter(car => {
        if (selectedCategory === 'electric') return car.engineType === 'electric';
        if (selectedCategory === 'cars') return car.category === 'cars';
        return car.category === selectedCategory;
      })
    : cars;

  const renderCategory = ({ item }: { item: typeof categories[0] }) => {
    const isSelected = selectedCategory === item.id || (!selectedCategory && item.id === 'all');
    return (
      <TouchableOpacity 
        style={styles.categoryCard}
        onPress={() => setSelectedCategory(item.id === 'all' ? null : item.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.categoryIconWrapper, isSelected && styles.categoryIconWrapperActive]}>
          <Text style={styles.categoryIcon}>{item.icon}</Text>
        </View>
        <Text style={[styles.categoryName, isSelected && styles.categoryNameActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCarItem = ({ item, index }: { item: CarListing; index: number }) => (
    <TouchableOpacity
      style={[styles.carCard, index === 0 && styles.carCardFirst]}
      onPress={() => router.push({ pathname: '/car/[id]', params: { id: item._id } })}
      activeOpacity={0.95}
    >
      <View style={styles.imageContainer}>
        {item.photos && item.photos.length > 0 ? (
          <Image
            source={{ uri: item.photos[0] }}
            style={styles.carImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.carImage, styles.noImage]}>
            <Ionicons name="car-sport" size={60} color="#CBD5E1" />
          </View>
        )}
        
        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={styles.imageGradient}
        />
        
        {/* Photo count badge */}
        {item.photos && item.photos.length > 1 && (
          <View style={styles.photoCountBadge}>
            <Ionicons name="images" size={12} color="#FFFFFF" />
            <Text style={styles.photoCountText}>{item.photos.length}</Text>
          </View>
        )}
        
        {/* Favorite button */}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={(e) => toggleFavorite(item._id!, e)}
        >
          <Ionicons 
            name={favoriteIds.has(item._id!) ? "heart" : "heart-outline"} 
            size={22} 
            color={favoriteIds.has(item._id!) ? "#EF4444" : "#FFFFFF"} 
          />
        </TouchableOpacity>

        {/* Condition badge */}
        {item.condition === 'new' && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>Новый</Text>
          </View>
        )}
      </View>

      <View style={styles.carInfo}>
        <View style={styles.carHeader}>
          <Text style={styles.carTitle} numberOfLines={1}>
            {item.brand} {item.model}
          </Text>
          <Text style={styles.carYear}>{item.year}</Text>
        </View>
        
        <Text style={styles.carPrice}>
          {formatPrice(item.price)} <Text style={styles.currency}>TJS</Text>
        </Text>
        
        <View style={styles.specRow}>
          <View style={styles.specItem}>
            <Ionicons name="speedometer-outline" size={14} color="#64748B" />
            <Text style={styles.specText}>{item.mileage.toLocaleString()} км</Text>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.specItem}>
            <Ionicons name="cog-outline" size={14} color="#64748B" />
            <Text style={styles.specText}>{t(`car.${item.transmission}`)}</Text>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.specItem}>
            <Ionicons name="flash-outline" size={14} color="#64748B" />
            <Text style={styles.specText}>{t(`car.${item.engineType}`)}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="#0066FF" />
          <Text style={styles.location}>{t(`regions.${item.region}`)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Загрузка объявлений...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Добро пожаловать 👋</Text>
          <Text style={styles.headerTitle}>SafedAuto</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications" size={24} color="#0F172A" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity 
        style={styles.searchBar}
        onPress={() => router.push('/(tabs)/search')}
        activeOpacity={0.8}
      >
        <Ionicons name="search" size={20} color="#94A3B8" />
        <Text style={styles.searchPlaceholder}>Поиск по марке или модели...</Text>
      </TouchableOpacity>

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

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory && selectedCategory !== 'all' 
            ? categories.find(c => c.id === selectedCategory)?.name 
            : 'Все объявления'}
        </Text>
        <Text style={styles.sectionCount}>{filteredCars.length}</Text>
      </View>

      {/* Car List */}
      <FlatList
        data={filteredCars}
        renderItem={renderCarItem}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#0066FF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="car-sport-outline" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>Нет объявлений</Text>
            <Text style={styles.emptySubtitle}>
              В этой категории пока нет автомобилей
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
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  notificationButton: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#94A3B8',
  },
  categoriesSection: {
    paddingBottom: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryCard: {
    alignItems: 'center',
    width: 72,
  },
  categoryIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconWrapperActive: {
    backgroundColor: '#0066FF',
  },
  categoryIcon: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#0066FF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  carCardFirst: {
    marginTop: 0,
  },
  imageContainer: {
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F1F5F9',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  carInfo: {
    padding: 16,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  carTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  carYear: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  carPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0066FF',
    marginBottom: 12,
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  specDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 13,
    color: '#0066FF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
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
    textAlign: 'center',
  },
});
