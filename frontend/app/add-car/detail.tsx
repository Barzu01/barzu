import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { carAPI, brandsAPI } from '../../services/api';
import { REGIONS } from '../../constants/carData';
import SearchableSelect from '../../components/SearchableSelect';

interface Brand {
  name: string;
  make_id: number;
}

interface CarModel {
  name: string;
  model_id: number;
}

export default function AddCarDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Brands and Models state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
  
  // Cache for models
  const [modelsCache, setModelsCache] = useState<{ [key: number]: CarModel[] }>({});

  const categories = [
    { value: 'cars', label: 'Автомобили' },
    { value: 'electric', label: 'Электромобили' },
    { value: 'motorcycles', label: 'Мотоциклы' },
    { value: 'trucks', label: 'Грузовики' },
    { value: 'parts', label: 'Запчасти' },
    { value: 'rent', label: 'Аренда авто' },
  ];

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    price: '',
    mileage: '',
    engineType: 'petrol',
    transmission: 'manual',
    driveType: 'front',
    condition: 'used',
    color: 'Белый',
    region: 'dushanbe',
    category: 'cars',
    description: '',
  });

  // Load initial brands on mount
  useEffect(() => {
    loadBrands('');
  }, []);

  // Load brands with search
  const loadBrands = useCallback(async (search: string) => {
    setBrandsLoading(true);
    try {
      const data = await brandsAPI.getAll(search, 100);
      setBrands(data);
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setBrandsLoading(false);
    }
  }, []);

  // Load models for selected brand
  const loadModels = useCallback(async (makeId: number) => {
    // Check cache first
    if (modelsCache[makeId]) {
      setModels(modelsCache[makeId]);
      return;
    }

    setModelsLoading(true);
    try {
      const data = await brandsAPI.getModels(makeId);
      setModels(data);
      // Cache the models
      setModelsCache(prev => ({ ...prev, [makeId]: data }));
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setModelsLoading(false);
    }
  }, [modelsCache]);

  // Handle brand selection
  const handleBrandSelect = (option: { label: string; value: string | number; id?: number }) => {
    const brand = brands.find(b => b.name === option.label);
    if (brand) {
      setSelectedBrand(brand);
      setFormData(prev => ({ ...prev, brand: brand.name, model: '' }));
      setSelectedModel(null);
      setModels([]);
      loadModels(brand.make_id);
    }
  };

  // Handle model selection
  const handleModelSelect = (option: { label: string; value: string | number }) => {
    const model = models.find(m => m.name === option.label);
    if (model) {
      setSelectedModel(model);
      setFormData(prev => ({ ...prev, model: model.name }));
    }
  };

  // Convert brands to options for SearchableSelect
  const brandOptions = brands.map(b => ({
    label: b.name,
    value: b.make_id.toString(),
    id: b.make_id,
  }));

  // Convert models to options for SearchableSelect
  const modelOptions = models.map(m => ({
    label: m.name,
    value: m.model_id?.toString() || m.name,
    id: m.model_id,
  }));

  const pickImage = async () => {
    if (photos.length >= 10) {
      Alert.alert(t('messages.error'), 'Максимум 10 фотографий');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('messages.error'), 'Нужно разрешение на доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotos([...photos, base64Image]);
    }
  };

  const takePhoto = async () => {
    if (photos.length >= 10) {
      Alert.alert(t('messages.error'), 'Максимум 10 фотографий');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('messages.error'), 'Нужно разрешение на доступ к камере');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotos([...photos, base64Image]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.brand || !formData.model) {
      Alert.alert(t('messages.error'), 'Заполните марку и модель');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert(t('messages.error'), 'Укажите корректную цену');
      return false;
    }
    if (!formData.mileage || parseInt(formData.mileage) < 0) {
      Alert.alert(t('messages.error'), 'Укажите корректный пробег');
      return false;
    }
    if (photos.length === 0) {
      Alert.alert(t('messages.error'), 'Добавьте хотя бы одну фотографию');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      const carData = {
        ...formData,
        year: parseInt(formData.year),
        price: parseFloat(formData.price),
        mileage: parseInt(formData.mileage),
        photos,
        sellerPhone: user.phone,
        sellerId: user._id || user.phone,
        status: 'pending' as const,
      };

      await carAPI.create(carData as any);
      Alert.alert(
        t('messages.success'),
        'Объявление отправлено на модерацию',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
      );
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert(t('messages.error'), 'Не удалось создать объявление');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.replace('/(tabs)/home')} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('tabs.addCar')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('car.photos')} *</Text>
          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 10 && (
              <View style={styles.addPhotoButtons}>
                <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={32} color="#0066CC" />
                  <Text style={styles.addPhotoText}>{t('actions.takePhoto')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                  <Ionicons name="images" size={32} color="#0066CC" />
                  <Text style={styles.addPhotoText}>{t('actions.chooseFromGallery')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.hint}>Добавлено {photos.length} из 10 фото</Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Категория *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Text style={styles.selectButtonText}>
              {categories.find(c => c.value === formData.category)?.label || 'Выберите категорию'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Category Modal */}
        <Modal
          visible={categoryModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Категория</Text>
                <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#000000" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={categories}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setFormData({ ...formData, category: item.value });
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item.label}</Text>
                    {formData.category === item.value && (
                      <Ionicons name="checkmark" size={24} color="#0066CC" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Brand & Model */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('car.brand')} *</Text>
          <TextInput
            style={styles.input}
            value={formData.brand}
            onChangeText={(text) => setFormData({ ...formData, brand: text })}
            placeholder="Toyota, Honda, Mercedes-Benz..."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('car.model')} *</Text>
          <TextInput
            style={styles.input}
            value={formData.model}
            onChangeText={(text) => setFormData({ ...formData, model: text })}
            placeholder="Camry, Accord, E-Class..."
          />
        </View>

        {/* Year & Price */}
        <View style={styles.row}>
          <View style={styles.halfSection}>
            <Text style={styles.label}>{t('car.year')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.year}
              onChangeText={(text) => setFormData({ ...formData, year: text })}
              keyboardType="numeric"
              placeholder="2020"
            />
          </View>
          <View style={styles.halfSection}>
            <Text style={styles.label}>{t('car.price')} (TJS) *</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
              placeholder="85000"
            />
          </View>
        </View>

        {/* Mileage */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('car.mileage')} (км) *</Text>
          <TextInput
            style={styles.input}
            value={formData.mileage}
            onChangeText={(text) => setFormData({ ...formData, mileage: text })}
            keyboardType="numeric"
            placeholder="45000"
          />
        </View>

        {/* Engine Type */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('car.engineType')} *</Text>
          <View style={styles.optionsGrid}>
            <TouchableOpacity
              style={[styles.optionButton, formData.engineType === 'petrol' && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, engineType: 'petrol' })}
            >
              <Text style={[styles.optionText, formData.engineType === 'petrol' && styles.optionTextActive]}>
                {t('car.petrol')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, formData.engineType === 'diesel' && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, engineType: 'diesel' })}
            >
              <Text style={[styles.optionText, formData.engineType === 'diesel' && styles.optionTextActive]}>
                {t('car.diesel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, formData.engineType === 'electric' && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, engineType: 'electric' })}
            >
              <Text style={[styles.optionText, formData.engineType === 'electric' && styles.optionTextActive]}>
                {t('car.electric')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, formData.engineType === 'hybrid' && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, engineType: 'hybrid' })}
            >
              <Text style={[styles.optionText, formData.engineType === 'hybrid' && styles.optionTextActive]}>
                {t('car.hybrid')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transmission */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('car.transmission')} *</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionButtonLarge, formData.transmission === 'manual' && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, transmission: 'manual' })}
            >
              <Text style={[styles.optionText, formData.transmission === 'manual' && styles.optionTextActive]}>
                {t('car.manual')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButtonLarge, formData.transmission === 'automatic' && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, transmission: 'automatic' })}
            >
              <Text style={[styles.optionText, formData.transmission === 'automatic' && styles.optionTextActive]}>
                {t('car.automatic')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Drive Type */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('car.driveType')} *</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionButton, formData.driveType === 'front' && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, driveType: 'front' })}
            >
              <Text style={[styles.optionText, formData.driveType === 'front' && styles.optionTextActive]}>
                {t('car.front')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, formData.driveType === 'rear' && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, driveType: 'rear' })}
            >
              <Text style={[styles.optionText, formData.driveType === 'rear' && styles.optionTextActive]}>
                {t('car.rear')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, formData.driveType === 'awd' && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, driveType: 'awd' })}
            >
              <Text style={[styles.optionText, formData.driveType === 'awd' && styles.optionTextActive]}>
                {t('car.awd')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Condition */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('car.condition')} *</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionButtonLarge, formData.condition === 'new' && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, condition: 'new' })}
            >
              <Text style={[styles.optionText, formData.condition === 'new' && styles.optionTextActive]}>
                {t('car.new')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButtonLarge, formData.condition === 'used' && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, condition: 'used' })}
            >
              <Text style={[styles.optionText, formData.condition === 'used' && styles.optionTextActive]}>
                {t('car.used')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Color */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('car.color')} *</Text>
          <TextInput
            style={styles.input}
            value={formData.color}
            onChangeText={(text) => setFormData({ ...formData, color: text })}
            placeholder="Черный, Белый, Синий..."
          />
        </View>

        {/* Region */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('car.region')} *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setRegionModalVisible(true)}
          >
            <Text style={styles.selectButtonText}>
              {t(`regions.${formData.region}`)}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Region Modal */}
        <Modal
          visible={regionModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setRegionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('car.region')}</Text>
                <TouchableOpacity onPress={() => setRegionModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#000000" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={REGIONS}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setFormData({ ...formData, region: item.value });
                      setRegionModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{t(item.label)}</Text>
                    {formData.region === item.value && (
                      <Ionicons name="checkmark" size={24} color="#0066CC" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('car.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Опишите состояние автомобиля, комплектацию..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>{t('actions.publish')}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfSection: {
    flex: 1,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    minWidth: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  optionButtonLarge: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  optionButtonActive: {
    backgroundColor: '#E5F0FF',
    borderColor: '#0066CC',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  optionTextActive: {
    color: '#0066CC',
    fontWeight: 'bold',
  },
  selectButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000000',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  addPhotoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0066CC',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 10,
    color: '#0066CC',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});