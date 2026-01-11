import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
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
const HEADER_MAX_HEIGHT = 200; // Max height of expandable header
const HEADER_MIN_HEIGHT = 0; // Min height (collapsed)

// Логотипы автопроизводителей
const CAR_LOGOS: { [key: string]: string } = {
  'Toyota': 'https://www.carlogos.org/car-logos/toyota-logo-2019-3700x1200.png',
  'Honda': 'https://www.carlogos.org/car-logos/honda-logo-1700x1150.png',
  'BMW': 'https://www.carlogos.org/car-logos/bmw-logo-2020-grey.png',
  'Mercedes-Benz': 'https://www.carlogos.org/car-logos/mercedes-benz-logo-2011-1920x1080.png',
  'Mercedes': 'https://www.carlogos.org/car-logos/mercedes-benz-logo-2011-1920x1080.png',
  'Audi': 'https://www.carlogos.org/car-logos/audi-logo-2016.png',
  'Volkswagen': 'https://www.carlogos.org/car-logos/volkswagen-logo-2019-1500x1500.png',
  'Hyundai': 'https://www.carlogos.org/car-logos/hyundai-logo-2011-1920x1080.png',
  'Kia': 'https://www.carlogos.org/car-logos/kia-logo-2021-2560x1440.png',
  'Nissan': 'https://www.carlogos.org/car-logos/nissan-logo-2020-black.png',
  'Mazda': 'https://www.carlogos.org/car-logos/mazda-logo-2018-1920x1080.png',
  'Ford': 'https://www.carlogos.org/car-logos/ford-logo-2017-1500x1101.png',
  'Chevrolet': 'https://www.carlogos.org/car-logos/chevrolet-logo-2013-2560x1440.png',
  'Lexus': 'https://www.carlogos.org/car-logos/lexus-logo-1988-1920x1080.png',
  'Porsche': 'https://www.carlogos.org/car-logos/porsche-logo-2014-1920x1080.png',
  'Land Rover': 'https://www.carlogos.org/car-logos/land-rover-logo-2020-green.png',
  'Jeep': 'https://www.carlogos.org/car-logos/jeep-logo-1993-1920x1080.png',
  'Subaru': 'https://www.carlogos.org/car-logos/subaru-logo-2019-1920x1080.png',
  'Mitsubishi': 'https://www.carlogos.org/car-logos/mitsubishi-logo-2000x2500.png',
  'Volvo': 'https://www.carlogos.org/car-logos/volvo-logo-2014-1920x1080.png',
  'Peugeot': 'https://www.carlogos.org/car-logos/peugeot-logo-2010-1920x1080.png',
  'Renault': 'https://www.carlogos.org/car-logos/renault-logo-2021-1920x1080.png',
  'Skoda': 'https://www.carlogos.org/car-logos/skoda-logo-2016-1920x1080.png',
  'Suzuki': 'https://www.carlogos.org/car-logos/suzuki-logo-1920x1080.png',
  'Fiat': 'https://www.carlogos.org/car-logos/fiat-logo-2020-1920x1080.png',
  'Jaguar': 'https://www.carlogos.org/car-logos/jaguar-logo-2012-1920x1080.png',
  'Infiniti': 'https://www.carlogos.org/car-logos/infiniti-logo-1989-1920x1080.png',
  'Acura': 'https://www.carlogos.org/car-logos/acura-logo-1990-1920x1080.png',
  'Cadillac': 'https://www.carlogos.org/car-logos/cadillac-logo-2014-1920x1080.png',
  'Chrysler': 'https://www.carlogos.org/car-logos/chrysler-logo-2010-1920x1080.png',
  'Dodge': 'https://www.carlogos.org/car-logos/dodge-logo-2011-1920x1080.png',
  'Tesla': 'https://www.carlogos.org/car-logos/tesla-logo-2007-1920x1080.png',
  'Lada': 'https://www.carlogos.org/car-logos/lada-logo-2015-1920x1080.png',
  'GAZ': 'https://www.carlogos.org/car-logos/gaz-logo-1920x1080.png',
  'UAZ': 'https://www.carlogos.org/car-logos/uaz-logo-2016-1920x1080.png',
  'Daewoo': 'https://www.carlogos.org/car-logos/daewoo-logo-1920x1080.png',
  'Geely': 'https://www.carlogos.org/car-logos/geely-logo-2019-1920x1080.png',
  'Chery': 'https://www.carlogos.org/car-logos/chery-logo-2013-1920x1080.png',
  'BYD': 'https://www.carlogos.org/car-logos/byd-logo-2007-1920x1080.png',
  'Great Wall': 'https://www.carlogos.org/car-logos/great-wall-logo-2007-1920x1080.png',
  'Haval': 'https://www.carlogos.org/car-logos/haval-logo-2020-1920x1080.png',
  'JAC': 'https://www.carlogos.org/car-logos/jac-logo-2016-1920x1080.png',
  'Lifan': 'https://www.carlogos.org/car-logos/lifan-logo-2011-1920x1080.png',
  'Ravon': 'https://www.carlogos.org/car-logos/ravon-logo-2015-1920x1080.png',
  'ZAZ': 'https://www.carlogos.org/car-logos/zaz-logo-2018-1920x1080.png',
};

const getCarLogo = (brand: string): string | null => {
  // Проверяем точное совпадение
  if (CAR_LOGOS[brand]) return CAR_LOGOS[brand];
  
  // Проверяем частичное совпадение (без учёта регистра)
  const brandLower = brand.toLowerCase();
  for (const [key, value] of Object.entries(CAR_LOGOS)) {
    if (key.toLowerCase() === brandLower || brandLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  return null;
};

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
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animation interpolations
  const expandableHeaderHeight = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const expandableHeaderOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

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
    { id: 'all', name: t('categories.all'), icon: 'apps' as const, gradient: ['#6366F1', '#8B5CF6'] },
    { id: 'cars', name: t('categories.cars'), icon: 'car-sport' as const, gradient: ['#0066FF', '#00D4FF'] },
    { id: 'electric', name: t('categories.electric'), icon: 'flash' as const, gradient: ['#10B981', '#34D399'] },
    { id: 'motorcycles', name: t('categories.motorcycles'), icon: 'bicycle' as const, gradient: ['#F59E0B', '#FBBF24'] },
    { id: 'trucks', name: t('categories.trucks'), icon: 'bus' as const, gradient: ['#EF4444', '#F87171'] },
    { id: 'rent', name: t('categories.rent'), icon: 'key' as const, gradient: ['#8B5CF6', '#A78BFA'] },
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
        <LinearGradient
          colors={isSelected ? item.gradient : ['#F1F5F9', '#F8FAFC']}
          style={[styles.categoryIconWrapper, isSelected && styles.categoryIconWrapperActive]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons 
            name={item.icon} 
            size={26} 
            color={isSelected ? '#FFFFFF' : '#64748B'} 
          />
        </LinearGradient>
        <Text style={[styles.categoryName, isSelected && styles.categoryNameActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCarItem = ({ item, index }: { item: CarListing; index: number }) => {
    const logoUrl = getCarLogo(item.brand);
    
    return (
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
            <Text style={styles.newBadgeText}>{t('car.new')}</Text>
          </View>
        )}
      </View>

      <View style={styles.carInfo}>
        <View style={styles.carHeader}>
          {/* Brand logo + title */}
          <View style={styles.brandRow}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.brandLogoPlaceholder}>
                <Ionicons name="car" size={16} color="#64748B" />
              </View>
            )}
            <Text style={styles.carTitle} numberOfLines={1}>
              {item.brand} {item.model}
            </Text>
          </View>
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
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>{t('messages.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Sticky Header - Always visible */}
      <View style={styles.stickyHeader}>
        <Text style={styles.headerTitle}>SafedAuto</Text>
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

      {/* Expandable Header - Hides on scroll */}
      <Animated.View style={[styles.expandableHeader, { height: expandableHeaderHeight, opacity: expandableHeaderOpacity }]}>
        <Text style={styles.headerGreeting}>{t('app.welcome')} 👋</Text>
        
        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color="#94A3B8" />
          <Text style={styles.searchPlaceholder}>{t('search.searchCars')}...</Text>
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
      </Animated.View>

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory && selectedCategory !== 'all' 
            ? categories.find(c => c.id === selectedCategory)?.name 
            : t('categories.allListings')}
        </Text>
        <Text style={styles.sectionCount}>{filteredCars.length}</Text>
      </View>

      {/* Car List */}
      <Animated.FlatList
        data={filteredCars}
        renderItem={renderCarItem}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
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
            <Text style={styles.emptyTitle}>{t('messages.noResults')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('messages.noCarsInCategory')}
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
    paddingHorizontal: 12,
    gap: 6,
  },
  categoryCard: {
    alignItems: 'center',
    width: 76,
  },
  categoryIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryIconWrapperActive: {
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  categoryIcon: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#0066FF',
    fontWeight: '700',
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  brandLogoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
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
