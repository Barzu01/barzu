import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
  Share,
  Modal,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { carAPI, favoritesAPI, reportAPI, viewAPI, recentlyViewedAPI, adminAPI } from '../../services/api';
import { CarListing } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageViewer from 'react-native-image-zoom-viewer';

const { width } = Dimensions.get('window');
const COMPARE_STORAGE_KEY = 'compare_cars';

export default function CarDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [car, setCar] = useState<CarListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCompare, setIsInCompare] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sellerName, setSellerName] = useState<string>('Загрузка...');
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Проверяем, является ли пользователь администратором/модератором
  const isAdmin = user?.isAdmin === true;

  useEffect(() => {
    loadCar();
    trackView();
    checkCompareStatus();
  }, [id]);

  const checkCompareStatus = async () => {
    if (!id) return;
    try {
      const storedIds = await AsyncStorage.getItem(COMPARE_STORAGE_KEY);
      if (storedIds) {
        const ids = JSON.parse(storedIds) as string[];
        setIsInCompare(ids.includes(id));
      }
    } catch (error) {
      console.error('Error checking compare status:', error);
    }
  };

  const toggleCompare = async () => {
    if (!id || !car) return;
    try {
      const storedIds = await AsyncStorage.getItem(COMPARE_STORAGE_KEY);
      let ids: string[] = storedIds ? JSON.parse(storedIds) : [];
      
      if (ids.includes(id)) {
        ids = ids.filter(existingId => existingId !== id);
        setIsInCompare(false);
        Alert.alert('Удалено', `${car.brand} ${car.model} удалён из сравнения`);
      } else {
        if (ids.length >= 4) {
          Alert.alert('Лимит', 'Можно сравнивать максимум 4 автомобиля');
          return;
        }
        ids.push(id);
        setIsInCompare(true);
        Alert.alert('Добавлено', `${car.brand} ${car.model} добавлен в сравнение`);
      }
      
      await AsyncStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error('Error toggling compare:', error);
    }
  };

  const trackView = async () => {
    if (!id) return;
    try {
      await viewAPI.trackView(id, user?.phone);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const loadCar = async () => {
    if (!id) return;
    try {
      const data = await carAPI.getById(id as string);
      setCar(data);
      
      // Загружаем имя продавца
      if (data.sellerPhone) {
        try {
          console.log('SELLER_DEBUG: Loading seller for phone:', data.sellerPhone);
          const { userAPI } = await import('../../services/api');
          const sellerData = await userAPI.getUser(data.sellerPhone);
          console.log('SELLER_DEBUG: Got seller data:', sellerData);
          if (sellerData && sellerData.name && sellerData.name.trim()) {
            console.log('SELLER_DEBUG: Setting name to:', sellerData.name);
            setSellerName(sellerData.name);
          } else {
            console.log('SELLER_DEBUG: No name, setting to Имя не указано');
            setSellerName('Имя не указано');
          }
        } catch (e) {
          console.log('SELLER_DEBUG: Error loading seller:', e);
          setSellerName('Имя не указано');
        }
      } else {
        console.log('SELLER_DEBUG: No seller phone');
        setSellerName('Имя не указано');
      }
      
      if (user) {
        const favorites = await favoritesAPI.getAll(user.phone);
        setIsFavorite(favorites.some((fav: CarListing) => fav._id === id));
      }
    } catch (error) {
      console.error('Error loading car:', error);
      Alert.alert(t('messages.error'), 'Не удалось загрузить объявление');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !car) return;
    try {
      if (isFavorite) {
        await favoritesAPI.remove(user.phone, car._id!);
        setIsFavorite(false);
      } else {
        await favoritesAPI.add(user.phone, car._id!);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const callSeller = () => {
    if (car?.sellerPhone) {
      Linking.openURL(`tel:${car.sellerPhone}`);
    }
  };

  const openChat = () => {
    if (!user || !car) return;
    router.push({
      pathname: '/chat/[id]',
      params: { 
        id: car._id,
        sellerId: car.sellerId || car.sellerPhone,
        sellerPhone: car.sellerPhone,
        carTitle: `${car.brand} ${car.model}`
      }
    });
  };

  // Share functions
  const shareToWhatsApp = () => {
    if (!car) return;
    const message = `🚗 ${car.brand} ${car.model} (${car.year})\n💰 ${car.price.toLocaleString()} TJS\n📍 ${car.region}\n\nПодробнее в SafedAuto`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
    setShareModalVisible(false);
  };

  const shareToTelegram = () => {
    if (!car) return;
    const message = `🚗 ${car.brand} ${car.model} (${car.year})\n💰 ${car.price.toLocaleString()} TJS\n📍 ${car.region}\n\nПодробнее в SafedAuto`;
    Linking.openURL(`tg://msg?text=${encodeURIComponent(message)}`);
    setShareModalVisible(false);
  };

  const shareGeneral = async () => {
    if (!car) return;
    try {
      await Share.share({
        message: `${car.brand} ${car.model} (${car.year}) - ${car.price.toLocaleString()} TJS\n\nSafedAuto`,
        title: `${car.brand} ${car.model}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
    setShareModalVisible(false);
  };

  // Report function
  const submitReport = async (reason: string) => {
    if (!user || !car) return;
    try {
      await reportAPI.create(car._id!, user.phone, reason);
      Alert.alert('Спасибо', 'Ваша жалоба отправлена на рассмотрение');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить жалобу');
    }
    setReportModalVisible(false);
  };

  // Delete function for admins
  const handleDeleteCar = async () => {
    if (!car?._id) return;
    setDeleteLoading(true);
    try {
      await adminAPI.deleteCar(car._id);
      setDeleteModalVisible(false);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error deleting car:', error);
      Alert.alert('Ошибка', 'Не удалось удалить объявление');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleImageScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentImageIndex(slideIndex);
  };

  const openFullScreen = (index: number) => {
    setFullScreenIndex(index);
    setFullScreenVisible(true);
  };

  const closeFullScreen = () => {
    setFullScreenVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="car-sport-outline" size={64} color="#CBD5E1" />
        <Text style={styles.notFoundText}>Объявление не найдено</Text>
        <TouchableOpacity style={styles.backToHomeBtn} onPress={() => router.back()}>
          <Text style={styles.backToHomeText}>Вернуться назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = user && (user.phone === car.sellerPhone || user.phone === car.sellerId);

  return (
    <View style={styles.container}>
      {/* Image Gallery */}
      <View style={styles.imageSection}>
        {car.photos && car.photos.length > 0 ? (
          <>
            <ScrollView 
              ref={scrollViewRef}
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              onScroll={handleImageScroll}
              scrollEventThrottle={16}
            >
              {car.photos.map((photo, index) => (
                <TouchableOpacity 
                  key={index} 
                  activeOpacity={0.95}
                  onPress={() => openFullScreen(index)}
                >
                  <Image
                    source={{ uri: photo }}
                    style={styles.carImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {car.photos.length > 1 && (
              <View style={styles.pagination}>
                {car.photos.map((_, index) => (
                  <View 
                    key={index} 
                    style={[styles.paginationDot, currentImageIndex === index && styles.paginationDotActive]} 
                  />
                ))}
              </View>
            )}
            
            <View style={styles.imageCounter}>
              <Ionicons name="images" size={14} color="#FFFFFF" />
              <Text style={styles.imageCounterText}>{currentImageIndex + 1}/{car.photos.length}</Text>
            </View>
          </>
        ) : (
          <View style={[styles.carImage, styles.noImage]}>
            <Ionicons name="car-sport" size={80} color="#CBD5E1" />
          </View>
        )}
        
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent']} style={styles.topGradient} />
        
        {/* Header buttons */}
        <SafeAreaView style={styles.headerButtons} edges={['top']}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleCompare} style={[styles.headerBtn, isInCompare && styles.headerBtnActive]}>
              <Ionicons name="git-compare" size={22} color={isInCompare ? '#0066FF' : '#FFFFFF'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShareModalVisible(true)} style={styles.headerBtn}>
              <Ionicons name="share-social" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFavorite} style={styles.headerBtn}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#EF4444' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Promoted badge */}
        {car.isPromoted && (
          <View style={styles.promotedBadge}>
            <Ionicons name="star" size={14} color="#FFFFFF" />
            <Text style={styles.promotedText}>TOP</Text>
          </View>
        )}

        {/* Views count */}
        {car.viewsCount > 0 && (
          <View style={styles.viewsBadge}>
            <Ionicons name="eye" size={14} color="#FFFFFF" />
            <Text style={styles.viewsText}>{car.viewsCount}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {/* Title & Price */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{car.brand} {car.model}</Text>
            <View style={styles.yearBadge}>
              <Text style={styles.yearText}>{car.year}</Text>
            </View>
          </View>
          <Text style={styles.price}>{car.price.toLocaleString()} <Text style={styles.currency}>TJS</Text></Text>
          {/* Номер объявления */}
          {car.listingNumber && (
            <Text style={styles.listingNumberDetail}>№ объявления: {car.listingNumber}</Text>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Ionicons name="speedometer" size={20} color="#0066FF" />
            <Text style={styles.statValue}>{car.mileage.toLocaleString()}</Text>
            <Text style={styles.statLabel}>км</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="cog" size={20} color="#0066FF" />
            <Text style={styles.statValue}>{t(`car.${car.transmission}`)}</Text>
            <Text style={styles.statLabel}>КПП</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="flash" size={20} color="#0066FF" />
            <Text style={styles.statValue}>{t(`car.${car.engineType}`)}</Text>
            <Text style={styles.statLabel}>Двигатель</Text>
          </View>
        </View>

        {/* Specifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Характеристики</Text>
          <View style={styles.specGrid}>
            <SpecItem icon="car" label="Привод" value={t(`car.${car.driveType}`)} />
            <SpecItem icon="location" label="Регион" value={t(`regions.${car.region}`)} />
          </View>
        </View>

        {/* Condition */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Состояние</Text>
          <View style={styles.conditionBadge}>
            <Ionicons 
              name={car.condition === 'new' ? 'sparkles' : 'checkmark-circle'} 
              size={20} 
              color={car.condition === 'new' ? '#10B981' : '#0066FF'} 
            />
            <Text style={[styles.conditionText, car.condition === 'new' && styles.conditionNew]}>
              {t(`car.${car.condition}`)}
            </Text>
          </View>
        </View>

        {/* Color */}
        {car.color && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Цвет</Text>
            <View style={styles.colorBadge}>
              <Ionicons name="color-palette" size={20} color="#64748B" />
              <Text style={styles.colorText}>{car.color}</Text>
            </View>
          </View>
        )}

        {/* Features/Options */}
        {car.features && car.features.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Опции и комплектация</Text>
            <View style={styles.featuresGrid}>
              {car.features.map((feature, index) => (
                <View key={index} style={styles.featureBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {car.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Описание</Text>
            <Text style={styles.description}>{car.description}</Text>
          </View>
        )}

        {/* Seller Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Продавец</Text>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerAvatar}>
              <Ionicons name="person" size={24} color="#64748B" />
            </View>
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{sellerName}</Text>
              <View style={styles.sellerLocationRow}>
                <Ionicons name="location" size={12} color="#64748B" />
                <Text style={styles.sellerLocation}>{t(`regions.${car.region}`)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Report button */}
        {!isOwner && (
          <TouchableOpacity style={styles.reportButton} onPress={() => setReportModalVisible(true)}>
            <Ionicons name="flag-outline" size={18} color="#EF4444" />
            <Text style={styles.reportText}>Пожаловаться на объявление</Text>
          </TouchableOpacity>
        )}

        {/* Edit button for owner */}
        {isOwner && (
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => router.push({ pathname: '/edit-car/[id]', params: { id: car._id } })}
          >
            <Ionicons name="create-outline" size={20} color="#0066FF" />
            <Text style={styles.editButtonText}>Редактировать объявление</Text>
          </TouchableOpacity>
        )}

        {/* Admin Delete Button */}
        {isAdmin && (
          <TouchableOpacity 
            style={styles.adminDeleteButton} 
            onPress={() => setDeleteModalVisible(true)}
          >
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={styles.adminDeleteText}>🛡️ Удалить объявление (Модератор)</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Actions */}
      {!isOwner && (
        <View style={styles.bottomActions}>
          {showPhone ? (
            <TouchableOpacity onPress={callSeller} style={styles.callButton}>
              <Ionicons name="call" size={22} color="#FFFFFF" />
              <Text style={styles.callButtonText}>{car.sellerPhone}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.chatButton} onPress={openChat}>
                <Ionicons name="chatbubbles" size={22} color="#0066FF" />
                <Text style={styles.chatButtonText}>Написать</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.phoneButton} onPress={() => setShowPhone(true)}>
                <Ionicons name="call" size={22} color="#FFFFFF" />
                <Text style={styles.phoneButtonText}>Показать номер</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Share Modal */}
      <Modal visible={shareModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Поделиться</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <View style={styles.shareOptions}>
              <TouchableOpacity style={styles.shareOption} onPress={shareToWhatsApp}>
                <View style={[styles.shareIcon, { backgroundColor: '#25D366' }]}>
                  <Ionicons name="logo-whatsapp" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.shareLabel}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareOption} onPress={shareToTelegram}>
                <View style={[styles.shareIcon, { backgroundColor: '#0088CC' }]}>
                  <Ionicons name="paper-plane" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.shareLabel}>Telegram</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareOption} onPress={shareGeneral}>
                <View style={[styles.shareIcon, { backgroundColor: '#64748B' }]}>
                  <Ionicons name="share-outline" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.shareLabel}>Другое</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={reportModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Причина жалобы</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            {[
              { value: 'fake', label: '🚫 Фейковое объявление' },
              { value: 'scam', label: '⚠️ Мошенничество' },
              { value: 'inappropriate', label: '🔞 Неприемлемый контент' },
              { value: 'duplicate', label: '📋 Дубликат' },
              { value: 'other', label: '❓ Другое' },
            ].map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={styles.reportOption}
                onPress={() => submitReport(reason.value)}
              >
                <Text style={styles.reportOptionText}>{reason.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Gallery Modal */}
      <Modal 
        visible={fullScreenVisible} 
        transparent 
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeFullScreen}
      >
        <View style={styles.fullScreenOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          
          {/* Image Viewer with Zoom - как на auto.ru */}
          <ImageViewer
            imageUrls={(car?.photos || []).map(url => ({ url }))}
            index={fullScreenIndex}
            onChange={(index) => setFullScreenIndex(index || 0)}
            enableSwipeDown={true}
            onSwipeDown={closeFullScreen}
            saveToLocalByLongPress={false}
            backgroundColor="rgba(0,0,0,0.95)"
            enablePreload={true}
            maxOverflow={300}
            flipThreshold={60}
            swipeDownThreshold={80}
            doubleClickInterval={250}
            minScale={0.6}
            maxScale={3}
            renderIndicator={(currentIndex, allSize) => (
              <View style={styles.imageViewerIndicator}>
                <Text style={styles.imageViewerIndicatorText}>
                  {(currentIndex || 0) + 1} / {allSize}
                </Text>
              </View>
            )}
            renderHeader={() => (
              <SafeAreaView style={styles.imageViewerHeader} edges={['top']}>
                <TouchableOpacity 
                  onPress={closeFullScreen} 
                  style={styles.imageViewerCloseBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </SafeAreaView>
            )}
            renderFooter={(currentIndex) => (
              <View style={styles.imageViewerFooter}>
                {/* Миниатюры фото как на auto.ru */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailsContainer}
                >
                  {car?.photos?.map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setFullScreenIndex(index)}
                      style={[
                        styles.thumbnailWrapper,
                        currentIndex === index && styles.thumbnailWrapperActive
                      ]}
                    >
                      <Image
                        source={{ uri: photo }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            loadingRender={() => (
              <View style={styles.imageLoading}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
            failImageSource={{ url: 'https://via.placeholder.com/400x300?text=Ошибка' }}
          />
        </View>
      </Modal>

      {/* Admin Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalIcon}>
              <Ionicons name="warning" size={48} color="#DC2626" />
            </View>
            <Text style={styles.deleteModalTitle}>🗑️ Удалить объявление?</Text>
            <Text style={styles.deleteModalSubtitle}>
              {car?.brand} {car?.model} ({car?.year})
            </Text>
            <Text style={styles.deleteModalWarning}>
              ⚠️ Это действие нельзя отменить!
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={styles.deleteModalCancelBtn}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleteLoading}
              >
                <Text style={styles.deleteModalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteModalConfirmBtn}
                onPress={handleDeleteCar}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Удалить</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SpecItem = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.specItem}>
    <View style={styles.specIconWrapper}>
      <Ionicons name={icon as any} size={18} color="#64748B" />
    </View>
    <View>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', gap: 16 },
  notFoundText: { fontSize: 18, color: '#64748B', fontWeight: '600' },
  backToHomeBtn: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#0066FF', borderRadius: 12 },
  backToHomeText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  imageSection: { position: 'relative', height: 320 },
  carImage: { width: width, height: 320, backgroundColor: '#E2E8F0' },
  noImage: { justifyContent: 'center', alignItems: 'center' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
  headerButtons: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center' },
  headerBtnActive: { backgroundColor: '#FFFFFF' },
  pagination: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  paginationDotActive: { backgroundColor: '#FFFFFF', width: 24 },
  imageCounter: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(15, 23, 42, 0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  imageCounterText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  promotedBadge: { position: 'absolute', top: 70, left: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  promotedText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  viewsBadge: { position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(15, 23, 42, 0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  viewsText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  content: { flex: 1, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#F8FAFC' },
  contentContainer: { paddingTop: 24, paddingHorizontal: 20 },
  titleSection: { marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { flex: 1, fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  yearBadge: { backgroundColor: '#E8F1FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  yearText: { fontSize: 14, fontWeight: '700', color: '#0066FF' },
  price: { fontSize: 32, fontWeight: '800', color: '#0066FF' },
  currency: { fontSize: 20, fontWeight: '600', color: '#64748B' },
  listingNumberDetail: { fontSize: 13, color: '#94A3B8', marginTop: 8 },
  quickStats: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 6 },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  specItem: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
  specIconWrapper: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  specLabel: { fontSize: 12, color: '#64748B' },
  specValue: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginTop: 2 },
  description: { fontSize: 15, color: '#475569', lineHeight: 24 },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sellerAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  sellerDetails: { flex: 1 },
  sellerName: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  sellerLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerLocation: { fontSize: 14, color: '#64748B' },
  reportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginBottom: 16 },
  reportText: { fontSize: 14, color: '#EF4444', fontWeight: '500' },
  editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E8F1FF', paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  editButtonText: { fontSize: 16, color: '#0066FF', fontWeight: '600' },
  bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 10 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  chatButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E8F1FF', paddingVertical: 16, borderRadius: 14 },
  chatButtonText: { fontSize: 16, fontWeight: '700', color: '#0066FF' },
  phoneButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0066FF', paddingVertical: 16, borderRadius: 14 },
  phoneButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  callButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 14 },
  callButtonText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  shareOptions: { flexDirection: 'row', justifyContent: 'center', gap: 32, padding: 32 },
  shareOption: { alignItems: 'center' },
  shareIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  shareLabel: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  reportOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  reportOptionText: { fontSize: 16, color: '#0F172A' },
  // Image Viewer styles (как на auto.ru)
  fullScreenOverlay: { 
    flex: 1, 
    backgroundColor: '#000000',
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: 8,
  },
  imageViewerCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  imageViewerIndicatorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageViewerFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  thumbnailsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  thumbnailWrapper: {
    width: 60,
    height: 45,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    marginRight: 8,
  },
  thumbnailWrapperActive: {
    borderColor: '#0066FF',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  imageViewerHint: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    paddingBottom: 8,
  },
  imageLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Condition badge
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  conditionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  conditionNew: {
    color: '#10B981',
  },
  // Color badge
  colorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  colorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  // Features grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  featureText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  // Admin delete button
  adminDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
  },
  adminDeleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Delete Modal styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  deleteModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalWarning: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  deleteModalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
