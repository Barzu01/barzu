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
import { myListingsAPI, carAPI } from '../../services/api';
import { CarListing } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function MyListingsScreen() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    if (!user) return;
    try {
      const data = await myListingsAPI.getAll(user.phone);
      setCars(data);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteListing = async (carId: string) => {
    Alert.alert(
      t('actions.delete'),
      'Вы уверены, что хотите удалить это объявление?',
      [
        { text: t('actions.cancel'), style: 'cancel' },
        {
          text: t('actions.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await carAPI.delete(carId);
              Alert.alert(t('messages.success'), t('messages.carDeleted'));
              loadListings();
            } catch (error) {
              Alert.alert(t('messages.error'), 'Ошибка при удалении');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'rejected':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Одобрено';
      case 'pending':
        return 'На модерации';
      case 'rejected':
        return 'Отклонено';
      default:
        return status;
    }
  };

  const renderCarItem = ({ item }: { item: CarListing }) => (
    <TouchableOpacity
      style={styles.carCard}
      onPress={() => router.push({ pathname: '/car-details', params: { id: item._id } })}
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
        <View style={styles.titleRow}>
          <Text style={styles.carTitle}>
            {item.brand} {item.model}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.carPrice}>
          {item.price.toLocaleString()} {t('car.currency')}
        </Text>
        <View style={styles.carDetails}>
          <Text style={styles.carDetail}>{item.year}</Text>
          <Text style={styles.carDetail}>•</Text>
          <Text style={styles.carDetail}>{item.mileage.toLocaleString()} км</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteListing(item._id!)}
          >
            <Ionicons name="trash" size={20} color="#FF3B30" />
            <Text style={styles.deleteText}>{t('actions.delete')}</Text>
          </TouchableOpacity>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.myListings')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={cars}
        renderItem={renderCarItem}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={80} color="#C7C7CC" />
            <Text style={styles.emptyText}>У вас пока нет объявлений</Text>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
    marginBottom: 12,
  },
  carDetail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
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