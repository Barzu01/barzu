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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { recentlyViewedAPI } from '../../services/api';
import { CarListing } from '../../types';

export default function RecentlyViewedScreen() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = async () => {
    if (!user) return;
    
    try {
      const data = await recentlyViewedAPI.getAll(user.phone);
      setCars(data);
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecentlyViewed();
  };

  const formatPrice = (price: number) => `${price.toLocaleString()} TJS`;

  const renderCarItem = ({ item }: { item: CarListing }) => (
    <TouchableOpacity
      style={styles.carCard}
      onPress={() => router.push({ pathname: '/car/[id]', params: { id: item._id } })}
      activeOpacity={0.9}
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
      </View>
      
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>🕐 Недавно просмотренные</Text>
        <View style={{ width: 44 }} />
      </View>

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
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>История пуста</Text>
            <Text style={styles.emptySubtitle}>
              Здесь будут отображаться просмотренные вами автомобили
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Ionicons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.browseButtonText}>Смотреть объявления</Text>
            </TouchableOpacity>
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
  listContainer: {
    padding: 16,
    gap: 12,
  },
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  carImage: {
    width: 80,
    height: 80,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#0066FF',
    marginBottom: 4,
  },
  carSpecs: {
    fontSize: 13,
    color: '#64748B',
  },
  arrowContainer: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
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
});
