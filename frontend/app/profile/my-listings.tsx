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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { carAPI, promotionAPI } from '../../services/api';
import { CarListing } from '../../types';

export default function MyListingsScreen() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promoteModalVisible, setPromoteModalVisible] = useState(false);
  const [selectedCarForPromotion, setSelectedCarForPromotion] = useState<CarListing | null>(null);
  const [promoting, setPromoting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadMyCars();
  }, []);

  const loadMyCars = async () => {
    if (!user) return;
    
    try {
      const data = await carAPI.getUserCars(user.phone);
      setCars(data);
    } catch (error) {
      console.error('Error loading my cars:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMyCars();
  };

  const handleDelete = (carId: string, carTitle: string) => {
    Alert.alert(
      'Удалить объявление',
      `Вы уверены, что хотите удалить "${carTitle}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await carAPI.delete(carId);
              setCars(cars.filter(car => car._id !== carId));
              Alert.alert('Успешно', 'Объявление удалено');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить объявление');
            }
          }
        }
      ]
    );
  };

  const openPromoteModal = (car: CarListing) => {
    setSelectedCarForPromotion(car);
    setPromoteModalVisible(true);
  };

  const handlePromote = async (days: number) => {
    if (!selectedCarForPromotion) return;
    
    setPromoting(true);
    try {
      await promotionAPI.promote(selectedCarForPromotion._id!, days);
      setCars(cars.map(car => 
        car._id === selectedCarForPromotion._id 
          ? { ...car, isPromoted: true } 
          : car
      ));
      setPromoteModalVisible(false);
      Alert.alert('Успешно! 🎉', `Ваше объявление "${selectedCarForPromotion.brand} ${selectedCarForPromotion.model}" продвинуто на ${days} дней!`);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось продвинуть объявление');
    } finally {
      setPromoting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Активно', color: '#10B981', bg: '#D1FAE5' };
      case 'pending':
        return { label: 'На модерации', color: '#F59E0B', bg: '#FEF3C7' };
      case 'rejected':
        return { label: 'Отклонено', color: '#EF4444', bg: '#FEE2E2' };
      default:
        return { label: status, color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} TJS`;
  };

  const renderCarItem = ({ item }: { item: CarListing }) => {
    const statusBadge = getStatusBadge(item.status);
    
    return (
      <View style={styles.carCard}>
        {/* Promoted badge */}
        {item.isPromoted && (
          <View style={styles.promotedBadge}>
            <Ionicons name="star" size={12} color="#FFFFFF" />
            <Text style={styles.promotedBadgeText}>TOP</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.cardContent}
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
              <Ionicons name="car-outline" size={32} color="#CBD5E1" />
            </View>
          )}
          
          <View style={styles.carInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.carTitle} numberOfLines={1}>
                {item.brand} {item.model}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                <Text style={[styles.statusText, { color: statusBadge.color }]}>
                  {statusBadge.label}
                </Text>
              </View>
            </View>
            
            <Text style={styles.carPrice}>{formatPrice(item.price)}</Text>
            
            <Text style={styles.carSpecs}>
              {item.year} • {item.mileage.toLocaleString()} км
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Action buttons */}
        <View style={styles.actions}>
          {!item.isPromoted && item.status === 'approved' && (
            <TouchableOpacity
              style={styles.promoteButton}
              onPress={() => openPromoteModal(item)}
            >
              <Ionicons name="rocket" size={18} color="#FFFFFF" />
              <Text style={styles.promoteButtonText}>Продвинуть</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.editButton, !item.isPromoted && item.status === 'approved' && { flex: 0.5 }]}
            onPress={() => router.push({ pathname: '/edit-car/[id]', params: { id: item._id } })}
          >
            <Ionicons name="create-outline" size={20} color="#0066FF" />
            <Text style={styles.editButtonText}>Изменить</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item._id!, `${item.brand} ${item.model}`)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Удалить</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Мои объявления</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/add-car')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
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
              <Ionicons name="car-outline" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>Нет объявлений</Text>
            <Text style={styles.emptySubtitle}>
              Вы ещё не добавили ни одного автомобиля
            </Text>
            <TouchableOpacity 
              style={styles.addCarButton}
              onPress={() => router.push('/(tabs)/add-car')}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addCarButtonText}>Добавить автомобиль</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Promote Modal */}
      <Modal visible={promoteModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚀 Продвинуть объявление</Text>
              <TouchableOpacity onPress={() => setPromoteModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Выберите срок продвижения для "{selectedCarForPromotion?.brand} {selectedCarForPromotion?.model}"
            </Text>
            
            <View style={styles.promoteOptions}>
              {[
                { days: 3, price: '20 TJS', popular: false },
                { days: 7, price: '40 TJS', popular: true },
                { days: 14, price: '60 TJS', popular: false },
                { days: 30, price: '80 TJS', popular: false },
              ].map((option) => (
                <TouchableOpacity
                  key={option.days}
                  style={[styles.promoteOption, option.popular && styles.promoteOptionPopular]}
                  onPress={() => handlePromote(option.days)}
                  disabled={promoting}
                >
                  {option.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>Популярно</Text>
                    </View>
                  )}
                  <Text style={styles.promoteDays}>{option.days} дней</Text>
                  <Text style={styles.promotePrice}>{option.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {promoting && (
              <View style={styles.promotingOverlay}>
                <ActivityIndicator size="large" color="#0066FF" />
              </View>
            )}
            
            <Text style={styles.promoteNote}>
              * Ваше объявление будет отображаться выше остальных и помечено значком TOP
            </Text>
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    gap: 16,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  carTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
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
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 12,
    gap: 8,
  },
  promoteButton: {
    flex: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    borderRadius: 10,
  },
  promoteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E8F1FF',
    paddingVertical: 10,
    borderRadius: 10,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  promotedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  promotedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
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
  addCarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0066FF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addCarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  promoteOptions: {
    gap: 12,
    marginBottom: 16,
  },
  promoteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  promoteOptionPopular: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  promoteDays: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  promotePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0066FF',
  },
  promotingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  promoteNote: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
});
