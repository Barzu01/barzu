import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';
import { CarListing } from '../../types';

export default function AdminModerationScreen() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const [carsData, statsData] = await Promise.all([
        adminAPI.getPendingCars(),
        adminAPI.getStats()
      ]);
      setCars(carsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleApprove = async (carId: string, carTitle: string) => {
    Alert.alert(
      'Одобрить объявление',
      `Одобрить "${carTitle}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Одобрить',
          onPress: async () => {
            try {
              await adminAPI.approveCar(carId);
              setCars(cars.filter(car => car._id !== carId));
              Alert.alert('Успешно', 'Объявление одобрено');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось одобрить объявление');
            }
          }
        }
      ]
    );
  };

  const handleReject = async (carId: string, carTitle: string) => {
    Alert.alert(
      'Отклонить объявление',
      `Отклонить "${carTitle}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отклонить',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.rejectCar(carId);
              setCars(cars.filter(car => car._id !== carId));
              Alert.alert('Успешно', 'Объявление отклонено');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось отклонить объявление');
            }
          }
        }
      ]
    );
  };

  const formatPrice = (price: number) => `${price.toLocaleString()} TJS`;

  const renderCarItem = ({ item }: { item: CarListing }) => (
    <View style={styles.carCard}>
      <TouchableOpacity
        style={styles.cardContent}
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
          <Text style={styles.carTitle} numberOfLines={1}>
            {item.brand} {item.model}
          </Text>
          <Text style={styles.carPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.carSpecs}>
            {item.year} • {item.mileage.toLocaleString()} км
          </Text>
          <Text style={styles.sellerPhone}>📱 {item.sellerPhone}</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleApprove(item._id!, `${item.brand} ${item.model}`)}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.approveButtonText}>Одобрить</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleReject(item._id!, `${item.brand} ${item.model}`)}
        >
          <Ionicons name="close-circle" size={20} color="#FFFFFF" />
          <Text style={styles.rejectButtonText}>Отклонить</Text>
        </TouchableOpacity>
      </View>
    </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛡️ Модерация</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pendingCars}</Text>
            <Text style={styles.statLabel}>Ожидают</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.approvedCars}</Text>
            <Text style={styles.statLabel}>Одобрено</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.rejectedCars}</Text>
            <Text style={styles.statLabel}>Отклонено</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#8B5CF6' }]}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Юзеры</Text>
          </View>
        </View>
      )}

      <FlatList
        data={cars}
        renderItem={renderCarItem}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle" size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>Всё проверено!</Text>
            <Text style={styles.emptySubtitle}>Нет объявлений для модерации</Text>
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
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  carImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  carInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  carTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  carPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0066FF',
    marginBottom: 4,
  },
  carSpecs: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  sellerPhone: {
    fontSize: 12,
    color: '#94A3B8',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 12,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
});
