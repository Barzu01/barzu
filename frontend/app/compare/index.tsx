import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { carAPI } from '../../services/api';
import { CarListing } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COMPARE_STORAGE_KEY = 'compare_cars';

export default function CompareScreen() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    loadCompareCars();
  }, []);

  const loadCompareCars = async () => {
    try {
      const storedIds = await AsyncStorage.getItem(COMPARE_STORAGE_KEY);
      if (storedIds) {
        const ids = JSON.parse(storedIds) as string[];
        const carPromises = ids.map(id => carAPI.getById(id).catch(() => null));
        const loadedCars = await Promise.all(carPromises);
        setCars(loadedCars.filter(car => car !== null) as CarListing[]);
      }
    } catch (error) {
      console.error('Error loading compare cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeCar = async (carId: string) => {
    try {
      const storedIds = await AsyncStorage.getItem(COMPARE_STORAGE_KEY);
      if (storedIds) {
        const ids = JSON.parse(storedIds) as string[];
        const newIds = ids.filter(id => id !== carId);
        await AsyncStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(newIds));
        setCars(cars.filter(car => car._id !== carId));
      }
    } catch (error) {
      console.error('Error removing car from compare:', error);
    }
  };

  const clearAll = async () => {
    Alert.alert(
      'Очистить список',
      'Удалить все автомобили из сравнения?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(COMPARE_STORAGE_KEY);
            setCars([]);
          }
        }
      ]
    );
  };

  const formatPrice = (price: number) => `${price.toLocaleString()} TJS`;

  const CompareRow = ({ label, values, highlight = false }: { label: string; values: (string | number)[]; highlight?: boolean }) => {
    const minValue = Math.min(...values.filter(v => typeof v === 'number') as number[]);
    const maxValue = Math.max(...values.filter(v => typeof v === 'number') as number[]);
    
    return (
      <View style={styles.compareRow}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowValues}>
          {values.map((value, index) => {
            let isHighlight = false;
            if (highlight && typeof value === 'number') {
              isHighlight = label.includes('Цена') || label.includes('Пробег') ? value === minValue : value === maxValue;
            }
            return (
              <View key={index} style={styles.valueCell}>
                <Text style={[styles.valueText, isHighlight && styles.valueHighlight]}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </Text>
              </View>
            );
          })}
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
        <Text style={styles.headerTitle}>⚖️ Сравнение</Text>
        {cars.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
            <Text style={styles.clearText}>Очистить</Text>
          </TouchableOpacity>
        )}
        {cars.length === 0 && <View style={{ width: 60 }} />}
      </View>

      {cars.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="git-compare-outline" size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Список пуст</Text>
          <Text style={styles.emptySubtitle}>
            Добавьте автомобили для сравнения из карточки объявления
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Ionicons name="search" size={20} color="#FFFFFF" />
            <Text style={styles.browseButtonText}>Смотреть объявления</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Car images and titles */}
            <View style={styles.carsHeader}>
              <View style={styles.labelColumn}>
                <Text style={styles.sectionLabel}>Автомобиль</Text>
              </View>
              {cars.map((car, index) => (
                <View key={car._id} style={styles.carColumn}>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeCar(car._id!)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/car/[id]', params: { id: car._id } })}
                  >
                    {car.photos && car.photos.length > 0 ? (
                      <Image source={{ uri: car.photos[0] }} style={styles.carImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.carImage, styles.noImage]}>
                        <Ionicons name="car-outline" size={32} color="#CBD5E1" />
                      </View>
                    )}
                    <Text style={styles.carName} numberOfLines={2}>
                      {car.brand} {car.model}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Price */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>💰 Цена</Text>
              </View>
              <CompareRow label="Цена (TJS)" values={cars.map(c => c.price)} highlight />

              {/* Basic Info */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📋 Основное</Text>
              </View>
              <CompareRow label="Год выпуска" values={cars.map(c => c.year)} highlight />
              <CompareRow label="Пробег (км)" values={cars.map(c => c.mileage)} highlight />
              <CompareRow label="Состояние" values={cars.map(c => t(`car.${c.condition}`))} />

              {/* Technical */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>⚙️ Технические</Text>
              </View>
              <CompareRow label="Двигатель" values={cars.map(c => t(`car.${c.engineType}`))} />
              <CompareRow label="КПП" values={cars.map(c => t(`car.${c.transmission}`))} />
              <CompareRow label="Привод" values={cars.map(c => t(`car.${c.driveType}`))} />
              <CompareRow label="Объём (л)" values={cars.map(c => c.engineVolume || '-')} />
              <CompareRow label="Кузов" values={cars.map(c => c.bodyType || '-')} />

              {/* Other */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📍 Прочее</Text>
              </View>
              <CompareRow label="Цвет" values={cars.map(c => c.color)} />
              <CompareRow label="Регион" values={cars.map(c => t(`regions.${c.region}`))} />

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </ScrollView>
      )}
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
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0066FF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  carsHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 16,
  },
  labelColumn: {
    width: 120,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  carColumn: {
    width: 140,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: 0,
    zIndex: 1,
  },
  carImage: {
    width: 100,
    height: 75,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  carName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  sectionHeader: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  compareRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    minHeight: 48,
    alignItems: 'center',
  },
  rowLabel: {
    width: 120,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#64748B',
  },
  rowValues: {
    flexDirection: 'row',
  },
  valueCell: {
    width: 140,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  valueHighlight: {
    color: '#10B981',
  },
});
