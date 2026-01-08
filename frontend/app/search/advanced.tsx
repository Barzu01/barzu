import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { advancedSearchAPI } from '../../services/api';
import { REGIONS } from '../../constants/carData';
import { CarListing } from '../../types';

export default function AdvancedSearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CarListing[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  const [filters, setFilters] = useState({
    brand: '',
    model: '',
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

  const handleSearch = async () => {
    setLoading(true);
    try {
      const searchFilters: any = {};
      if (filters.brand) searchFilters.brand = filters.brand;
      if (filters.model) searchFilters.model = filters.model;
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
      setResults(response.cars);
      setTotalResults(response.total);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      model: '',
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
    setShowResults(false);
    setResults([]);
  };

  const FilterChip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const formatPrice = (price: number) => `${price.toLocaleString()} TJS`;

  const renderCarItem = ({ item }: { item: CarListing }) => (
    <TouchableOpacity
      style={styles.carCard}
      onPress={() => router.push({ pathname: '/car/[id]', params: { id: item._id } })}
    >
      {item.photos && item.photos.length > 0 ? (
        <Image source={{ uri: item.photos[0] }} style={styles.carImage} resizeMode="cover" />
      ) : (
        <View style={[styles.carImage, styles.noImage]}>
          <Ionicons name="car-outline" size={32} color="#CBD5E1" />
        </View>
      )}
      <View style={styles.carInfo}>
        <Text style={styles.carTitle} numberOfLines={1}>{item.brand} {item.model}</Text>
        <Text style={styles.carPrice}>{formatPrice(item.price)}</Text>
        <Text style={styles.carSpecs}>{item.year} • {item.mileage.toLocaleString()} км</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔎 Расширенный поиск</Text>
        <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
          <Text style={styles.clearText}>Сброс</Text>
        </TouchableOpacity>
      </View>

      {showResults ? (
        // Results View
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>Найдено: {totalResults}</Text>
            <TouchableOpacity onPress={() => setShowResults(false)}>
              <Text style={styles.editFiltersText}>Изменить фильтры</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={results}
            renderItem={renderCarItem}
            keyExtractor={(item) => item._id || Math.random().toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#94A3B8" />
                <Text style={styles.emptyText}>Ничего не найдено</Text>
              </View>
            }
          />
        </View>
      ) : (
        // Filters View
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Brand & Model */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚗 Марка и модель</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Марка"
                placeholderTextColor="#94A3B8"
                value={filters.brand}
                onChangeText={(text) => setFilters({ ...filters, brand: text })}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Модель"
                placeholderTextColor="#94A3B8"
                value={filters.model}
                onChangeText={(text) => setFilters({ ...filters, model: text })}
              />
            </View>
          </View>

          {/* Price */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Цена (TJS)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="От"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={filters.priceFrom}
                onChangeText={(text) => setFilters({ ...filters, priceFrom: text })}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="До"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={filters.priceTo}
                onChangeText={(text) => setFilters({ ...filters, priceTo: text })}
              />
            </View>
          </View>

          {/* Year */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Год выпуска</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="От"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={filters.yearFrom}
                onChangeText={(text) => setFilters({ ...filters, yearFrom: text })}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="До"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={filters.yearTo}
                onChangeText={(text) => setFilters({ ...filters, yearTo: text })}
              />
            </View>
          </View>

          {/* Mileage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛣️ Пробег (км)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="От"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={filters.mileageFrom}
                onChangeText={(text) => setFilters({ ...filters, mileageFrom: text })}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="До"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={filters.mileageTo}
                onChangeText={(text) => setFilters({ ...filters, mileageTo: text })}
              />
            </View>
          </View>

          {/* Region */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Регион</Text>
            <TouchableOpacity
              style={styles.selectField}
              onPress={() => setRegionModalVisible(true)}
            >
              <Text style={filters.region ? styles.selectText : styles.selectPlaceholder}>
                {filters.region ? t(`regions.${filters.region}`) : 'Все регионы'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Engine Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⛽ Тип двигателя</Text>
            <View style={styles.chipContainer}>
              <FilterChip label="Все" selected={!filters.engineType} onPress={() => setFilters({ ...filters, engineType: '' })} />
              <FilterChip label="Бензин" selected={filters.engineType === 'petrol'} onPress={() => setFilters({ ...filters, engineType: 'petrol' })} />
              <FilterChip label="Дизель" selected={filters.engineType === 'diesel'} onPress={() => setFilters({ ...filters, engineType: 'diesel' })} />
              <FilterChip label="Электро" selected={filters.engineType === 'electric'} onPress={() => setFilters({ ...filters, engineType: 'electric' })} />
              <FilterChip label="Гибрид" selected={filters.engineType === 'hybrid'} onPress={() => setFilters({ ...filters, engineType: 'hybrid' })} />
            </View>
          </View>

          {/* Transmission */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ КПП</Text>
            <View style={styles.chipContainer}>
              <FilterChip label="Все" selected={!filters.transmission} onPress={() => setFilters({ ...filters, transmission: '' })} />
              <FilterChip label="Механика" selected={filters.transmission === 'manual'} onPress={() => setFilters({ ...filters, transmission: 'manual' })} />
              <FilterChip label="Автомат" selected={filters.transmission === 'automatic'} onPress={() => setFilters({ ...filters, transmission: 'automatic' })} />
            </View>
          </View>

          {/* Condition */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Состояние</Text>
            <View style={styles.chipContainer}>
              <FilterChip label="Все" selected={!filters.condition} onPress={() => setFilters({ ...filters, condition: '' })} />
              <FilterChip label="Новый" selected={filters.condition === 'new'} onPress={() => setFilters({ ...filters, condition: 'new' })} />
              <FilterChip label="С пробегом" selected={filters.condition === 'used'} onPress={() => setFilters({ ...filters, condition: 'used' })} />
            </View>
          </View>

          {/* Sort */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Сортировка</Text>
            <View style={styles.chipContainer}>
              <FilterChip label="Новые" selected={filters.sortBy === 'newest'} onPress={() => setFilters({ ...filters, sortBy: 'newest' })} />
              <FilterChip label="Дешевле" selected={filters.sortBy === 'priceAsc'} onPress={() => setFilters({ ...filters, sortBy: 'priceAsc' })} />
              <FilterChip label="Дороже" selected={filters.sortBy === 'priceDesc'} onPress={() => setFilters({ ...filters, sortBy: 'priceDesc' })} />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Search Button */}
      {!showResults && (
        <View style={styles.searchButtonContainer}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="search" size={22} color="#FFFFFF" />
                <Text style={styles.searchButtonText}>Найти автомобили</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Region Modal */}
      <Modal visible={regionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите регион</Text>
              <TouchableOpacity onPress={() => setRegionModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => { setFilters({ ...filters, region: '' }); setRegionModalVisible(false); }}
            >
              <Text style={styles.modalItemText}>Все регионы</Text>
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
                  <Text style={styles.modalItemText}>{t(item.label)}</Text>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#0F172A' },
  clearButton: { paddingHorizontal: 12, paddingVertical: 8 },
  clearText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, fontSize: 16, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0' },
  halfInput: { flex: 1 },
  selectField: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0' },
  selectText: { fontSize: 16, color: '#0F172A' },
  selectPlaceholder: { fontSize: 16, color: '#94A3B8' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#F1F5F9', borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  chipActive: { backgroundColor: '#E8F1FF', borderColor: '#0066FF' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#0066FF' },
  searchButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  searchButton: { backgroundColor: '#0066FF', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  searchButtonText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  resultsContainer: { flex: 1 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  resultsCount: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  editFiltersText: { fontSize: 14, fontWeight: '600', color: '#0066FF' },
  listContainer: { padding: 16, gap: 12 },
  carCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', flexDirection: 'row', padding: 12, gap: 12, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  carImage: { width: 100, height: 80, borderRadius: 10, backgroundColor: '#F1F5F9' },
  noImage: { justifyContent: 'center', alignItems: 'center' },
  carInfo: { flex: 1, justifyContent: 'center' },
  carTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  carPrice: { fontSize: 17, fontWeight: '800', color: '#0066FF', marginVertical: 2 },
  carSpecs: { fontSize: 13, color: '#64748B' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalItemText: { fontSize: 16, color: '#0F172A' },
});
