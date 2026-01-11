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
import { useTranslation } from 'react-i18next';
import { favoritesAPI } from '../../services/api';
import { CarListing } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

export default function FavoritesScreen() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const data = await favoritesAPI.getAll(user.phone);
      setCars(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const removeFavorite = async (carId: string) => {
    if (!user) return;
    try {
      await favoritesAPI.remove(user.phone, carId);
      setCars(cars.filter(car => car._id !== carId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} ${t('car.currency')}`;
  };

  const renderCarItem = ({ item }: { item: CarListing }) => (
    <TouchableOpacity
      style={styles.carCard}
      onPress={() => router.push({ pathname: '/car/[id]', params: { id: item._id } })}
      activeOpacity={0.9}
    >
      <View style={styles.cardContent}>
        {item.photos && item.photos.length > 0 ? (
          <Image
            source={{ uri: item.photos[0] }}
            style={styles.carImage}
            resizeMode="cover"
          />
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
          <View style={styles.carSpecs}>
            <Text style={styles.specText}>{item.year} • {item.mileage.toLocaleString()} км</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color="#64748B" />
            <Text style={styles.location}>{t(`regions.${item.region}`)}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeFavorite(item._id!)}
        >
          <Ionicons name="heart" size={22} color="#EF4444" />
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>{t('tabs.favorites')}</Text>
        {cars.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{cars.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={cars}
        renderItem={renderCarItem}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#0066FF"
            colors={['#0066FF', '#10B981']}
            title="Обновление..."
            titleColor="#64748B"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="heart-outline" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>{t('favorites.nothingYet')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('favorites.addToFavoritesHint')}
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Text style={styles.browseButtonText}>{t('favorites.browseListings')}</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
    marginBottom: 6,
  },
  carSpecs: {
    marginBottom: 4,
  },
  specText: {
    fontSize: 13,
    color: '#64748B',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: '#64748B',
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
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
    lineHeight: 22,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
