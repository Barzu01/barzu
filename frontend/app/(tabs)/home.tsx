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
  Modal,
  ScrollView,
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
const HEADER_MAX_HEIGHT = 100; // Max height for categories only
const HEADER_MIN_HEIGHT = 0; // Min height (collapsed)

// Логотипы автопроизводителей (надёжные Wikipedia CDN ссылки)
const CAR_LOGOS: { [key: string]: string } = {
  'Toyota': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carancy%2C_emblem.svg/200px-Toyota_carancy%2C_emblem.svg.png',
  'Honda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/200px-Honda.svg.png',
  'BMW': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/200px-BMW.svg.png',
  'Mercedes-Benz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Benz_Logo_2010.svg/200px-Mercedes-Benz_Logo_2010.svg.png',
  'Mercedes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Benz_Logo_2010.svg/200px-Mercedes-Benz_Logo_2010.svg.png',
  'Audi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Audi-Logo_2016.svg/200px-Audi-Logo_2016.svg.png',
  'Volkswagen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/200px-Volkswagen_logo_2019.svg.png',
  'Hyundai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_Motor_Company_logo.svg/200px-Hyundai_Motor_Company_logo.svg.png',
  'Kia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/KIA_logo2.svg/200px-KIA_logo2.svg.png',
  'Nissan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Nissan_logo.svg/200px-Nissan_logo.svg.png',
  'Mazda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Mazda_logo_with_tagline.svg/200px-Mazda_logo_with_tagline.svg.png',
  'Ford': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/200px-Ford_logo_flat.svg.png',
  'Chevrolet': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Chevrolet-logo-2013.png/200px-Chevrolet-logo-2013.png',
  'Lexus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Lexus_division_emblem.svg/200px-Lexus_division_emblem.svg.png',
  'Porsche': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Porsche_logo.svg/200px-Porsche_logo.svg.png',
  'Land Rover': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Logo_della_Land_Rover.svg/200px-Logo_della_Land_Rover.svg.png',
  'Jeep': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Logo_della_Jeep.svg/200px-Logo_della_Jeep.svg.png',
  'Subaru': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Subaru_Logo.svg/200px-Subaru_Logo.svg.png',
  'Mitsubishi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Mitsubishi_logo.svg/200px-Mitsubishi_logo.svg.png',
  'Volvo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Volvo_logo.svg/200px-Volvo_logo.svg.png',
  'Peugeot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Logo_Peugeot_2021.svg/200px-Logo_Peugeot_2021.svg.png',
  'Renault': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Renault_2021_Text.svg/200px-Renault_2021_Text.svg.png',
  'Skoda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/%C5%A0koda_logo_2016.svg/200px-%C5%A0koda_logo_2016.svg.png',
  'Suzuki': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Suzuki_logo_2.svg/200px-Suzuki_logo_2.svg.png',
  'Fiat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Fiat_Automobiles_logo.svg/200px-Fiat_Automobiles_logo.svg.png',
  'Jaguar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Jaguar_Logo.svg/200px-Jaguar_Logo.svg.png',
  'Infiniti': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Infiniti_logo.svg/200px-Infiniti_logo.svg.png',
  'Acura': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Acura_logo.svg/200px-Acura_logo.svg.png',
  'Cadillac': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Cadillac_logo.svg/200px-Cadillac_logo.svg.png',
  'Chrysler': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Chrysler_logo.svg/200px-Chrysler_logo.svg.png',
  'Dodge': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Dodge_logo.svg/200px-Dodge_logo.svg.png',
  'Tesla': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Tesla_logo.png/200px-Tesla_logo.png',
  'Lada': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Lada_Logo.svg/200px-Lada_Logo.svg.png',
  'GAZ': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/GAZ_logo.svg/200px-GAZ_logo.svg.png',
  'UAZ': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/UAZ_logo.svg/200px-UAZ_logo.svg.png',
  'Daewoo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Daewoo_logo.svg/200px-Daewoo_logo.svg.png',
  'Geely': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Geely_Auto_logo.svg/200px-Geely_Auto_logo.svg.png',
  'Chery': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Chery_Logo.svg/200px-Chery_Logo.svg.png',
  'BYD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/BYD_Auto_Logo.svg/200px-BYD_Auto_Logo.svg.png',
  'Great Wall': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Great_Wall_Motor_logo.svg/200px-Great_Wall_Motor_logo.svg.png',
  'Haval': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Haval_logo.svg/200px-Haval_logo.svg.png',
  'JAC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/JAC_logo.svg/200px-JAC_logo.svg.png',
  'Lifan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Lifan_logo.svg/200px-Lifan_logo.svg.png',
  'Ravon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Ravon_logo.svg/200px-Ravon_logo.svg.png',
  'ZAZ': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/ZAZ_logo.svg/200px-ZAZ_logo.svg.png',
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
  const [partsModalVisible, setPartsModalVisible] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Подкатегории запчастей и аксессуаров
  const partsSubcategories = [
    { value: 'auto_parts', label: 'Автозапчасти', icon: 'construct', color: '#0066FF' },
    { value: 'moto_parts', label: 'Мотозапчасти', icon: 'bicycle', color: '#F59E0B' },
    { value: 'tires_wheels', label: 'Шины и диски', icon: 'ellipse-outline', color: '#1A1A1A' },
    { value: 'oils_chemistry', label: 'Масла и автохимия', icon: 'water', color: '#10B981' },
    { value: 'accessories', label: 'Аксессуары', icon: 'car', color: '#8B5CF6' },
    { value: 'audio_video', label: 'Аудио и видео', icon: 'musical-notes', color: '#EC4899' },
    { value: 'gps_video', label: 'GPS и видеорегистраторы', icon: 'navigate', color: '#06B6D4' },
    { value: 'roof_racks', label: 'Багажники и рейлинги', icon: 'cube', color: '#84CC16' },
    { value: 'anti_theft', label: 'Противоугонные системы', icon: 'lock-closed', color: '#EF4444' },
    { value: 'special_parts', label: 'Спецтехника', icon: 'cog', color: '#F97316' },
    { value: 'moto_accessories', label: 'Мотоаксессуары', icon: 'speedometer', color: '#6366F1' },
    { value: 'for_parts', label: 'Авто на запчасти', icon: 'car-sport', color: '#64748B' },
  ];

  const handlePartsSubcategorySelect = (subcategory: string) => {
    setPartsModalVisible(false);
    // Переход на страницу подкатегории запчастей
    router.push(`/parts/${subcategory}`);
  };

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
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCars();
      if (user) {
        await loadUnreadCount();
        await loadFavorites();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
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
        
        {/* Номер объявления */}
        {item.listingNumber && (
          <Text style={styles.listingNumber}>№ {item.listingNumber}</Text>
        )}
        
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
        <View>
          <Text style={styles.headerGreeting}>{t('app.welcome')} 👋</Text>
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

      {/* Expandable Header - Categories hide on scroll */}
      <Animated.View style={[styles.expandableHeader, { height: expandableHeaderHeight, opacity: expandableHeaderOpacity }]}>
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

      {/* Car List */}
      <FlatList
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
        ListHeaderComponent={
          <>
            {/* Запчасти и аксессуары - баннер */}
            <TouchableOpacity 
              style={styles.partsBanner}
              onPress={() => setPartsModalVisible(true)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.partsBannerGradient}
              >
                <View style={styles.partsBannerContent}>
                  <View style={styles.partsBannerIcon}>
                    <Ionicons name="construct" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.partsBannerText}>
                    <Text style={styles.partsBannerTitle}>🔧 Запчасти и аксессуары</Text>
                    <Text style={styles.partsBannerSubtitle}>Шины, масла, автозвук и другое</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Section title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory && selectedCategory !== 'all' 
                  ? categories.find(c => c.id === selectedCategory)?.name 
                  : t('categories.allListings')}
              </Text>
              <Text style={styles.sectionCount}>{filteredCars.length}</Text>
            </View>
          </>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#0066FF"
            colors={['#0066FF', '#10B981']}
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

      {/* Модальное окно подкатегорий запчастей */}
      <Modal
        visible={partsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPartsModalVisible(false)}
      >
        <View style={styles.partsModalOverlay}>
          <View style={styles.partsModalContent}>
            <View style={styles.partsModalHeader}>
              <Text style={styles.partsModalTitle}>🔧 Запчасти и аксессуары</Text>
              <TouchableOpacity onPress={() => setPartsModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.partsModalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.partsGrid}>
                {partsSubcategories.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={styles.partsGridItem}
                    onPress={() => handlePartsSubcategorySelect(item.value)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.partsGridIcon, { backgroundColor: item.color + '15' }]}>
                      <Ionicons name={item.icon as any} size={28} color={item.color} />
                    </View>
                    <Text style={styles.partsGridText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  stickyHeader: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 0,
  },
  expandableHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 0,
    paddingTop: 8,
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
  headerGreeting: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0066FF',
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
    paddingHorizontal: 0,
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
    marginBottom: 4,
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  listingNumber: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 10,
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
  // Стили для баннера "Запчасти и аксессуары"
  partsBanner: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  partsBannerGradient: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  partsBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partsBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  partsBannerText: {
    flex: 1,
  },
  partsBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  partsBannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  // Стили для модального окна подкатегорий
  partsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  partsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  partsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  partsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  partsModalScroll: {
    padding: 16,
  },
  partsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 32,
  },
  partsGridItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  partsGridIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  partsGridText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
