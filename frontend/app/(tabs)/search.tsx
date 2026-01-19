import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { carAPI, favoritesAPI, advancedSearchAPI } from '../../services/api';
import { CarListing } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { REGIONS } from '../../constants/carData';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://auto-social-hub-2.preview.emergentagent.com';

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    yearFrom: '',
    yearTo: '',
    priceFrom: '',
    priceTo: '',
    mileageFrom: '',
    mileageTo: '',
    region: '',
    engineType: '',
    transmission: '',
    condition: '',
    sortBy: 'newest' as 'newest' | 'priceAsc' | 'priceDesc',
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.yearFrom || filters.yearTo) count++;
    if (filters.priceFrom || filters.priceTo) count++;
    if (filters.mileageFrom || filters.mileageTo) count++;
    if (filters.region) count++;
    if (filters.engineType) count++;
    if (filters.transmission) count++;
    if (filters.condition) count++;
    setActiveFiltersCount(count);
  }, [filters]);

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

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const trimmedText = searchText.trim().toUpperCase();
      
      // Проверяем, не ищут ли по номеру объявления (SA-XXXXXX или просто XXXXXX)
      if (trimmedText.startsWith('SA-') || /^\d{1,6}$/.test(trimmedText)) {
        const listingNumber = trimmedText.startsWith('SA-') 
          ? trimmedText 
          : `SA-${trimmedText.padStart(6, '0')}`;
        
        try {
          const response = await fetch(`${API_URL}/api/cars/by-number/${listingNumber}`);
          if (response.ok) {
            const car = await response.json();
            // Нашли объявление - переходим на его страницу
            router.push(`/car/${car._id}`);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Если не нашли по номеру, продолжаем обычный поиск
        }
      }
      
      const searchFilters: any = {};
      
      // Text search
      if (searchText.trim()) {
        const words = searchText.trim().split(' ');
        if (words.length === 1) {
          searchFilters.brand = searchText.trim();
        } else {
          searchFilters.brand = words[0];
          searchFilters.model = words.slice(1).join(' ');
        }
      }
      
      // Advanced filters
      if (filters.yearFrom) searchFilters.yearFrom = parseInt(filters.yearFrom);
      if (filters.yearTo) searchFilters.yearTo = parseInt(filters.yearTo);
      if (filters.priceFrom) searchFilters.priceFrom = parseFloat(filters.priceFrom);
      if (filters.priceTo) searchFilters.priceTo = parseFloat(filters.priceTo);
      if (filters.mileageFrom) searchFilters.mileageFrom = parseInt(filters.mileageFrom);
      if (filters.mileageTo) searchFilters.mileageTo = parseInt(filters.mileageTo);
      if (filters.region) searchFilters.region = filters.region;
      if (filters.engineType) searchFilters.engineType = filters.engineType;
      if (filters.transmission) searchFilters.transmission = filters.transmission;
      if (filters.condition) searchFilters.condition = filters.condition;
      searchFilters.sortBy = filters.sortBy;

      const response = await advancedSearchAPI.search(searchFilters);
      setSearchResults(response.cars || []);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to simple search
      try {
        const results = await carAPI.search({ brand: searchText.trim() });
        setSearchResults(results);
      } catch (e) {
        setSearchResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const clearFilters = () => {
    setFilters({
      yearFrom: '',
      yearTo: '',
      priceFrom: '',
      priceTo: '',
      mileageFrom: '',
      mileageTo: '',
      region: '',
      engineType: '',
      transmission: '',
      condition: '',
      sortBy: 'newest',
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} ${t('car.currency')}`;
  };

  // Популярные бренды с цветами (максимум 6)
  const popularBrands = [
    { name: 'Toyota', color: '#EB0A1E', letter: 'T', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carance%2C_emblem.svg/200px-Toyota_carancy%2C_emblem.svg.png' },
    { name: 'Mercedes-Benz', color: '#333333', letter: 'M', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Logo.svg/200px-Mercedes-Logo.svg.png' },
    { name: 'BMW', color: '#0066B1', letter: 'B', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/200px-BMW.svg.png' },
    { name: 'Hyundai', color: '#002C5F', letter: 'H', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_Motor_Company_logo.svg/200px-Hyundai_Motor_Company_logo.svg.png' },
    { name: 'Honda', color: '#E40521', letter: 'H', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/200px-Honda.svg.png' },
    { name: 'Lexus', color: '#1A1A1A', letter: 'L', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Lexus_division_emblem.svg/200px-Lexus_division_emblem.svg.png' },
  ];

  // Состояние для выбранного бренда
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandResults, setBrandResults] = useState<CarListing[]>([]);
  const [loadingBrand, setLoadingBrand] = useState(false);

  // Функция поиска по бренду
  const searchByBrand = async (brandName: string) => {
    setSelectedBrand(brandName);
    setLoadingBrand(true);
    setHasSearched(true);
    try {
      const allCars = await carAPI.getAll();
      const filtered = allCars.filter((car: CarListing) => 
        car.brand?.toLowerCase().includes(brandName.toLowerCase())
      );
      setBrandResults(filtered);
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching by brand:', error);
    } finally {
      setLoadingBrand(false);
    }
  };

  // Сбросить фильтр по бренду
  const clearBrandFilter = () => {
    setSelectedBrand(null);
    setBrandResults([]);
    setSearchResults([]);
    setHasSearched(false);
    setSearchText('');
  };

  const FilterChip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderCarItem = ({ item }: { item: CarListing }) => (
    <TouchableOpacity
      style={styles.carCard}
      onPress={() => router.push({ pathname: '/car/[id]', params: { id: item._id } })}
      activeOpacity={0.9}
    >
      {item.photos && item.photos.length > 0 ? (
        <Image
          source={{ uri: item.photos[0] }}
          style={styles.carImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.carImage, styles.noImage]}>
          <Ionicons name="car-outline" size={48} color="#CBD5E1" />
        </View>
      )}
      
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

      <View style={styles.carInfo}>
        <Text style={styles.carTitle} numberOfLines={1}>
          {item.brand} {item.model}
        </Text>
        <Text style={styles.carPrice}>{formatPrice(item.price)}</Text>
        <View style={styles.carSpecs}>
          <View style={styles.specBadge}>
            <Text style={styles.specText}>{item.year}</Text>
          </View>
          <View style={styles.specBadge}>
            <Text style={styles.specText}>{item.mileage.toLocaleString()} км</Text>
          </View>
          <View style={styles.specBadge}>
            <Text style={styles.specText}>{t(`car.${item.transmission}`)}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="#64748B" />
          <Text style={styles.location}>{t(`regions.${item.region}`)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('tabs.search')}</Text>
        <Text style={styles.headerSubtitle}>{t('search.findPerfectCar')}</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Toyota Camry, BMW X5..."
            placeholderTextColor="#94A3B8"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Button */}
        <TouchableOpacity 
          style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={22} color={activeFiltersCount > 0 ? "#FFFFFF" : "#0066FF"} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.searchButton, !searchText.trim() && activeFiltersCount === 0 && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>{t('search.searchingCars')}</Text>
        </View>
      ) : hasSearched ? (
        <FlatList
          data={searchResults}
          renderItem={renderCarItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={4}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={48} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>{t('messages.noResults')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('search.tryChangingParams')}
              </Text>
            </View>
          }
          ListHeaderComponent={
            searchResults.length > 0 ? (
              <Text style={styles.resultsCount}>
                {t('search.found')}: {searchResults.length} {t('search.listings')}
              </Text>
            ) : null
          }
        />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.suggestionsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Selected Brand Header */}
          {selectedBrand && (
            <View style={styles.selectedBrandHeader}>
              <View style={styles.selectedBrandInfo}>
                <Text style={styles.selectedBrandTitle}>Марка: {selectedBrand}</Text>
                <Text style={styles.selectedBrandCount}>{brandResults.length} объявлений</Text>
              </View>
              <TouchableOpacity style={styles.clearBrandButton} onPress={clearBrandFilter}>
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}

          {/* Brand Results */}
          {selectedBrand && loadingBrand && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066FF" />
            </View>
          )}

          {selectedBrand && !loadingBrand && brandResults.length > 0 && (
            <View style={styles.brandResultsContainer}>
              {brandResults.map((car) => (
                <TouchableOpacity
                  key={car._id}
                  style={styles.carCard}
                  onPress={() => router.push({ pathname: '/car/[id]', params: { id: car._id } })}
                  activeOpacity={0.9}
                >
                  {car.photos && car.photos.length > 0 ? (
                    <Image
                      source={{ uri: car.photos[0] }}
                      style={styles.carImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.carImage, styles.noImage]}>
                      <Ionicons name="car-outline" size={48} color="#CBD5E1" />
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.favoriteButton}
                    onPress={(e) => toggleFavorite(car._id!, e)}
                  >
                    <Ionicons 
                      name={favoriteIds.has(car._id!) ? "heart" : "heart-outline"} 
                      size={22} 
                      color={favoriteIds.has(car._id!) ? "#EF4444" : "#FFFFFF"} 
                    />
                  </TouchableOpacity>
                  <View style={styles.carInfo}>
                    <Text style={styles.carTitle} numberOfLines={1}>
                      {car.brand} {car.model}
                    </Text>
                    <Text style={styles.carPrice}>{formatPrice(car.price)}</Text>
                    <View style={styles.carSpecs}>
                      <View style={styles.specBadge}>
                        <Text style={styles.specText}>{car.year}</Text>
                      </View>
                      {car.mileage && (
                        <View style={styles.specBadge}>
                          <Text style={styles.specText}>{car.mileage} км</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedBrand && !loadingBrand && brandResults.length === 0 && (
            <View style={styles.emptyBrandResults}>
              <Ionicons name="car-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyBrandText}>Нет объявлений марки {selectedBrand}</Text>
            </View>
          )}

          {/* Popular Brands - показываем всегда или только когда нет выбранного бренда */}
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>🔥 {t('search.popularBrands')}</Text>
            <View style={styles.brandsGrid}>
              {popularBrands.map(brand => (
                <TouchableOpacity
                  key={brand.name}
                  style={[
                    styles.brandCard,
                    selectedBrand === brand.name && styles.brandCardSelected
                  ]}
                  onPress={() => searchByBrand(brand.name)}
                >
                  <View style={[styles.brandLogoContainer, { backgroundColor: brand.color }]}>
                    <Image
                      source={{ uri: brand.logo }}
                      style={styles.brandLogoImage}
                      resizeMode="contain"
                      defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' }}
                    />
                  </View>
                  <Text style={[
                    styles.brandName,
                    selectedBrand === brand.name && styles.brandNameSelected
                  ]}>{brand.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tips - показываем только когда нет выбранного бренда */}
          {!selectedBrand && (
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb" size={24} color="#F59E0B" />
                <Text style={styles.tipsTitle}>{t('search.searchTips')}</Text>
              </View>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>{t('search.tipBrand')}</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>{t('search.tipBrandModel')}</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>{t('search.tipModel')}</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Filters Modal */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.filterContainer}>
          {/* Filter Header */}
          <View style={styles.filterHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.closeFilterButton}>
              <Ionicons name="close" size={28} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.filterHeaderTitle}>🔎 {t('search.filters')}</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>{t('search.resetFilters')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.filterContent} showsVerticalScrollIndicator={false}>
            {/* Price */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>💰 {t('search.priceFrom')} - {t('search.priceTo')} (TJS)</Text>
              <View style={styles.filterRow}>
                <TextInput
                  style={[styles.filterInput, styles.halfInput]}
                  placeholder={t('search.priceFrom')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={filters.priceFrom}
                  onChangeText={(text) => setFilters({ ...filters, priceFrom: text })}
                />
                <TextInput
                  style={[styles.filterInput, styles.halfInput]}
                  placeholder={t('search.priceTo')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={filters.priceTo}
                  onChangeText={(text) => setFilters({ ...filters, priceTo: text })}
                />
              </View>
            </View>

            {/* Year */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>📅 {t('search.yearFrom')} - {t('search.yearTo')}</Text>
              <View style={styles.filterRow}>
                <TextInput
                  style={[styles.filterInput, styles.halfInput]}
                  placeholder={t('search.yearFrom')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={filters.yearFrom}
                  onChangeText={(text) => setFilters({ ...filters, yearFrom: text })}
                />
                <TextInput
                  style={[styles.filterInput, styles.halfInput]}
                  placeholder={t('search.yearTo')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={filters.yearTo}
                  onChangeText={(text) => setFilters({ ...filters, yearTo: text })}
                />
              </View>
            </View>

            {/* Mileage */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>🛣️ {t('search.mileageFrom')} - {t('search.mileageTo')} (км)</Text>
              <View style={styles.filterRow}>
                <TextInput
                  style={[styles.filterInput, styles.halfInput]}
                  placeholder={t('search.mileageFrom')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={filters.mileageFrom}
                  onChangeText={(text) => setFilters({ ...filters, mileageFrom: text })}
                />
                <TextInput
                  style={[styles.filterInput, styles.halfInput]}
                  placeholder={t('search.mileageTo')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={filters.mileageTo}
                  onChangeText={(text) => setFilters({ ...filters, mileageTo: text })}
                />
              </View>
            </View>

            {/* Region */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>📍 {t('search.allRegions')}</Text>
              <TouchableOpacity
                style={styles.selectField}
                onPress={() => setRegionModalVisible(true)}
              >
                <Text style={filters.region ? styles.selectText : styles.selectPlaceholder}>
                  {filters.region ? t(`regions.${filters.region}`) : t('search.allRegions')}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Engine Type */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>⛽ {t('car.engineType')}</Text>
              <View style={styles.chipContainer}>
                <FilterChip label={t('categories.all')} selected={!filters.engineType} onPress={() => setFilters({ ...filters, engineType: '' })} />
                <FilterChip label={t('car.petrol')} selected={filters.engineType === 'petrol'} onPress={() => setFilters({ ...filters, engineType: 'petrol' })} />
                <FilterChip label={t('car.diesel')} selected={filters.engineType === 'diesel'} onPress={() => setFilters({ ...filters, engineType: 'diesel' })} />
                <FilterChip label={t('car.electric')} selected={filters.engineType === 'electric'} onPress={() => setFilters({ ...filters, engineType: 'electric' })} />
                <FilterChip label={t('car.hybrid')} selected={filters.engineType === 'hybrid'} onPress={() => setFilters({ ...filters, engineType: 'hybrid' })} />
              </View>
            </View>

            {/* Transmission */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>⚙️ {t('car.transmission')}</Text>
              <View style={styles.chipContainer}>
                <FilterChip label={t('categories.all')} selected={!filters.transmission} onPress={() => setFilters({ ...filters, transmission: '' })} />
                <FilterChip label={t('car.manual')} selected={filters.transmission === 'manual'} onPress={() => setFilters({ ...filters, transmission: 'manual' })} />
                <FilterChip label={t('car.automatic')} selected={filters.transmission === 'automatic'} onPress={() => setFilters({ ...filters, transmission: 'automatic' })} />
              </View>
            </View>

            {/* Condition */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>✨ {t('car.condition')}</Text>
              <View style={styles.chipContainer}>
                <FilterChip label={t('categories.all')} selected={!filters.condition} onPress={() => setFilters({ ...filters, condition: '' })} />
                <FilterChip label={t('car.new')} selected={filters.condition === 'new'} onPress={() => setFilters({ ...filters, condition: 'new' })} />
                <FilterChip label={t('car.used')} selected={filters.condition === 'used'} onPress={() => setFilters({ ...filters, condition: 'used' })} />
              </View>
            </View>

            {/* Sort */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>📊 {t('search.sortBy')}</Text>
              <View style={styles.chipContainer}>
                <FilterChip label={t('search.sortNewest')} selected={filters.sortBy === 'newest'} onPress={() => setFilters({ ...filters, sortBy: 'newest' })} />
                <FilterChip label={t('search.sortPriceAsc')} selected={filters.sortBy === 'priceAsc'} onPress={() => setFilters({ ...filters, sortBy: 'priceAsc' })} />
                <FilterChip label={t('search.sortPriceDesc')} selected={filters.sortBy === 'priceDesc'} onPress={() => setFilters({ ...filters, sortBy: 'priceDesc' })} />
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.applyButtonContainer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                setShowFilters(false);
                handleSearch();
              }}
            >
              <Ionicons name="search" size={22} color="#FFFFFF" />
              <Text style={styles.applyButtonText}>{t('search.applyFilters')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Region Modal */}
      <Modal visible={regionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('search.allRegions')}</Text>
              <TouchableOpacity onPress={() => setRegionModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => { setFilters({ ...filters, region: '' }); setRegionModalVisible(false); }}
            >
              <Text style={styles.modalItemText}>{t('search.allRegions')}</Text>
              {!filters.region && <Ionicons name="checkmark" size={24} color="#0066FF" />}
            </TouchableOpacity>
            <FlatList
              data={REGIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setFilters({ ...filters, region: item.value }); setRegionModalVisible(false); }}
                >
                  <Text style={styles.modalItemText}>{t(`regions.${item.value}`)}</Text>
                  {filters.region === item.value && <Ionicons name="checkmark" size={24} color="#0066FF" />}
                </TouchableOpacity>
              )}
            />
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#0F172A',
  },
  filterButton: {
    width: 52,
    height: 52,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0066FF',
  },
  filterButtonActive: {
    backgroundColor: '#0066FF',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchButton: {
    width: 52,
    height: 52,
    backgroundColor: '#0066FF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carInfo: {
    padding: 16,
  },
  carTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  carPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0066FF',
    marginBottom: 12,
  },
  carSpecs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  specBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  specText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: '#64748B',
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
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  suggestionsContent: {
    padding: 20,
  },
  suggestionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  brandCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  brandCardSelected: {
    backgroundColor: '#E8F1FF',
    borderColor: '#0066FF',
    borderWidth: 2,
  },
  brandLogoContainer: {
    width: 52,
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  brandLogoImage: {
    width: 36,
    height: 36,
  },
  brandLogo: {
    width: 36,
    height: 36,
  },
  brandLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  brandNameSelected: {
    color: '#0066FF',
    fontWeight: '700',
  },
  // Стили для результатов поиска по бренду
  selectedBrandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F1FF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  selectedBrandInfo: {
    flex: 1,
  },
  selectedBrandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066FF',
  },
  selectedBrandCount: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  clearBrandButton: {
    padding: 8,
  },
  brandResultsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyBrandResults: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyBrandText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  tipText: {
    fontSize: 14,
    color: '#92400E',
  },
  // Filter styles
  filterContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterHeader: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  closeFilterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  filterContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  halfInput: {
    flex: 1,
  },
  selectField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectText: {
    fontSize: 16,
    color: '#0F172A',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#94A3B8',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#E8F1FF',
    borderColor: '#0066FF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#0066FF',
  },
  applyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  applyButton: {
    backgroundColor: '#0066FF',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemText: {
    fontSize: 16,
    color: '#0F172A',
  },
});
