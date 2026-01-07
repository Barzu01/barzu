import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { carAPI } from '../../services/api';
import { CarListing } from '../../types';

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    try {
      // Ищем по марке и модели
      const results = await carAPI.search({
        brand: searchText,
        model: searchText,
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} ${t('car.currency')}`;
  };

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('tabs.search')}</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Напр: Toyota Camry, BMW X5..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.searchButton, !searchText.trim() && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={!searchText.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Найти</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Поиск автомобилей...</Text>
        </View>
      ) : hasSearched ? (
        <FlatList
          data={searchResults}
          renderItem={renderCarItem}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={80} color="#C7C7CC" />
              <Text style={styles.emptyText}>
                Ничего не найдено
              </Text>
              <Text style={styles.emptySubtext}>
                Попробуйте изменить запрос
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Популярные марки:</Text>
            <View style={styles.brandButtons}>
              {['Toyota', 'Honda', 'Mercedes-Benz', 'BMW', 'Hyundai', 'Lada'].map(brand => (
                <TouchableOpacity
                  key={brand}
                  style={styles.brandButton}
                  onPress={() => {
                    setSearchText(brand);
                    setTimeout(handleSearch, 100);
                  }}
                >
                  <Text style={styles.brandButtonText}>{brand}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.tipsContainer}>
            <Ionicons name="information-circle" size={24} color="#0066CC" />
            <View style={styles.tipsText}>
              <Text style={styles.tipsTitle}>Советы по поиску:</Text>
              <Text style={styles.tip}>• Введите марку: "Toyota"</Text>
              <Text style={styles.tip}>• Марку и модель: "Toyota Camry"</Text>
              <Text style={styles.tip}>• Только модель: "Camry"</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#000000',
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#0066CC',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    minWidth: 80,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  carImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F2F2F7',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  carInfo: {
    padding: 16,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  carPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 8,
  },
  carDetails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  carDetail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
  suggestionsContainer: {
    marginBottom: 32,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  brandButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  brandButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  brandButtonText: {
    fontSize: 15,
    color: '#0066CC',
    fontWeight: '600',
  },
  tipsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5F0FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tipsText: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  tip: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
});