import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/api';
import { CarListing } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ModerationScreen() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCars: 0, approvedCars: 0, pendingCars: 0, totalUsers: 0 });
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pendingCars, statsData] = await Promise.all([
        adminAPI.getPendingCars(),
        adminAPI.getStats(),
      ]);
      setCars(pendingCars);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (carId: string) => {
    try {
      await adminAPI.approveCar(carId);
      Alert.alert(t('messages.success'), 'Объявление одобрено');
      loadData();
    } catch (error) {
      Alert.alert(t('messages.error'), 'Ошибка при одобрении');
    }
  };

  const handleReject = async (carId: string) => {
    Alert.alert(
      'Отклонить объявление?',
      'Вы уверены?',
      [
        { text: t('actions.cancel'), style: 'cancel' },
        {
          text: t('admin.reject'),
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.rejectCar(carId);
              Alert.alert(t('messages.success'), 'Объявление отклонено');
              loadData();
            } catch (error) {
              Alert.alert(t('messages.error'), 'Ошибка при отклонении');
            }
          },
        },
      ]
    );
  };

  const renderCarItem = ({ item }: { item: CarListing }) => (
    <View style={styles.carCard}>
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
        <Text style={styles.carPrice}>
          {item.price.toLocaleString()} {t('car.currency')}
        </Text>
        <View style={styles.carDetails}>
          <Text style={styles.carDetail}>{item.year}</Text>
          <Text style={styles.carDetail}>•</Text>
          <Text style={styles.carDetail}>{item.mileage.toLocaleString()} км</Text>
          <Text style={styles.carDetail}>•</Text>
          <Text style={styles.carDetail}>{item.sellerPhone}</Text>
        </View>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item._id!)}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>{t('admin.approve')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item._id!)}
          >
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>{t('admin.reject')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('admin.moderation')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalCars}</Text>
          <Text style={styles.statLabel}>Всего авто</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.approvedCars}</Text>
          <Text style={styles.statLabel}>Одобрено</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#FF9500' }]}>{stats.pendingCars}</Text>
          <Text style={styles.statLabel}>На модерации</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Пользователей</Text>
        </View>
      </View>

      <FlatList
        data={cars}
        renderItem={renderCarItem}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#34C759" />
            <Text style={styles.emptyText}>Нет объявлений на модерации</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
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
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
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
  description: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 16,
  },
});
