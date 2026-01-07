import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { carAPI, favoritesAPI } from '../../services/api';
import { CarListing } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function CarDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [car, setCar] = useState<CarListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    loadCar();
  }, [id]);

  const loadCar = async () => {
    if (!id) return;
    try {
      const data = await carAPI.getById(id as string);
      setCar(data);
      
      // Check if in favorites
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
        Alert.alert(t('messages.success'), t('messages.removedFromFavorites'));
      } else {
        await favoritesAPI.add(user.phone, car._id!);
        setIsFavorite(true);
        Alert.alert(t('messages.success'), t('messages.addedToFavorites'));
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.centerContainer}>
        <Text>Объявление не найдено</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#FF3B30' : '#000000'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {car.photos && car.photos.length > 0 ? (
          <ScrollView horizontal pagingEnabled style={styles.imageScroll}>
            {car.photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.carImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.carImage, styles.noImage]}>
            <Ionicons name="car-outline" size={100} color="#C7C7CC" />
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>
            {car.brand} {car.model}
          </Text>
          <Text style={styles.price}>
            {car.price.toLocaleString()} {t('car.currency')}
          </Text>

          <View style={styles.detailsCard}>
            <DetailRow icon="calendar" label={t('car.year')} value={car.year.toString()} />
            <DetailRow
              icon="speedometer"
              label={t('car.mileage')}
              value={`${car.mileage.toLocaleString()} ${t('car.km')}`}
            />
            <DetailRow icon="cog" label={t('car.transmission')} value={t(`car.${car.transmission}`)} />
            <DetailRow icon="flash" label={t('car.engineType')} value={t(`car.${car.engineType}`)} />
            <DetailRow icon="car" label={t('car.driveType')} value={t(`car.${car.driveType}`)} />
            <DetailRow icon="color-palette" label={t('car.color')} value={car.color} />
            <DetailRow
              icon="location"
              label={t('car.region')}
              value={t(`regions.${car.region}`)}
            />
            <DetailRow
              icon="checkbox"
              label={t('car.condition')}
              value={t(`car.${car.condition}`)}
            />
          </View>

          {car.description && (
            <View style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>{t('car.description')}</Text>
              <Text style={styles.description}>{car.description}</Text>
            </View>
          )}

          <View style={styles.contactCard}>
            <Text style={styles.sectionTitle}>{t('car.sellerPhone')}</Text>
            {showPhone ? (
              <TouchableOpacity onPress={callSeller} style={styles.phoneButton}>
                <Ionicons name="call" size={20} color="#0066CC" />
                <Text style={styles.phoneText}>{car.sellerPhone}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setShowPhone(true)}
                style={styles.showPhoneButton}
              >
                <Text style={styles.showPhoneText}>{t('actions.showPhone')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon as any} size={20} color="#8E8E93" />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageScroll: {
    height: 300,
  },
  carImage: {
    width: 400,
    height: 300,
    backgroundColor: '#F2F2F7',
  },
  noImage: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  descriptionCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
  },
  contactCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  phoneText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066CC',
  },
  showPhoneButton: {
    padding: 16,
    backgroundColor: '#0066CC',
    borderRadius: 8,
    alignItems: 'center',
  },
  showPhoneText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});