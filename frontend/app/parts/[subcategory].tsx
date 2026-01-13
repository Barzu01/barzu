import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { carAPI, favoritesAPI } from '../../services/api';
import { CarListing } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

// Названия подкатегорий
const subcategoryNames: { [key: string]: string } = {
  'auto_parts': 'Автозапчасти',
  'moto_parts': 'Мотозапчасти',
  'tires_wheels': 'Шины и диски',
  'oils_chemistry': 'Масла и автохимия',
  'accessories': 'Аксессуары',
  'audio_video': 'Аудио и видео',
  'gps_video': 'GPS и видеорегистраторы',
  'roof_racks': 'Багажники и рейлинги',
  'anti_theft': 'Противоугонные системы',
  'special_parts': 'Спецтехника',
  'moto_accessories': 'Мотоаксессуары',
  'for_parts': 'Авто на запчасти',
};

// Иконки подкатегорий
const subcategoryIcons: { [key: string]: string } = {
  'auto_parts': 'construct',
  'moto_parts': 'bicycle',
  'tires_wheels': 'ellipse-outline',
  'oils_chemistry': 'water',
  'accessories': 'car',
  'audio_video': 'musical-notes',
  'gps_video': 'navigate',
  'roof_racks': 'cube',
  'anti_theft': 'lock-closed',
  'special_parts': 'cog',
  'moto_accessories': 'speedometer',
  'for_parts': 'car-sport',
};

export default function PartsSubcategoryScreen() {
  const { subcategory } = useLocalSearchParams<{ subcategory: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [items, setItems] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const subcategoryName = subcategoryNames[subcategory || ''] || 'Запчасти';
  const subcategoryIcon = subcategoryIcons[subcategory || ''] || 'construct';

  useEffect(() => {
    loadItems();
    if (user) {
      loadFavorites();
    }
  }, [subcategory, user]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await carAPI.getBySubcategory(subcategory || '');
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const favorites = await favoritesAPI.getAll(user.phone);
      const ids = new Set(favorites.map((item: CarListing) => item._id!));
      setFavoriteIds(ids);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const toggleFavorite = async (itemId: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    try {
      if (favoriteIds.has(itemId)) {
        await favoritesAPI.remove(user.phone, itemId);
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      } else {
        await favoritesAPI.add(user.phone, itemId);
        setFavoriteIds(prev => new Set([...prev, itemId]));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const renderItem = ({ item }: { item: CarListing }) => {
    const isFavorite = favoriteIds.has(item._id!);
    const imageUrl = item.photos && item.photos.length > 0 ? item.photos[0] : null;
    
    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => router.push(`/car/${item._id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Ionicons name={subcategoryIcon as any} size={40} color="#94A3B8" />
            </View>
          )}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item._id!)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#EF4444' : '#FFFFFF'}
            />
          </TouchableOpacity>
          {item.isPromoted && (
            <View style={styles.promotedBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.promotedText}>VIP</Text>
            </View>
          )}
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.productName || `${item.brand} ${item.model}`}
          </Text>
          <Text style={styles.itemPrice}>{formatPrice(item.price)} TJS</Text>
          {item.description && (
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.itemFooter}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#64748B" />
              <Text style={styles.locationText}>{item.region || 'Душанбе'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name={subcategoryIcon as any} size={22} color="#0066FF" />
          <Text style={styles.headerTitle}>{subcategoryName}</Text>
        </View>
        <View style={styles.itemCount}>
          <Text style={styles.itemCountText}>{items.length}</Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name={subcategoryIcon as any} size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Пока нет объявлений</Text>
          <Text style={styles.emptySubtitle}>
            В категории "{subcategoryName}" ещё нет товаров
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-car')}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Добавить объявление</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0066FF"
              colors={['#0066FF']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemCount: {
    backgroundColor: '#E8F1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  itemCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  itemCard: {
    width: (width - 36) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promotedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  promotedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066FF',
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
});
