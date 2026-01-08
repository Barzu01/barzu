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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { carAPI, brandsAPI } from '../../services/api';
import { REGIONS } from '../../constants/carData';
import { BODY_TYPES, CAR_FEATURES, ENGINE_VOLUMES } from '../../constants/theme';
import SearchableSelect from '../../components/SearchableSelect';

interface Brand {
  name: string;
  make_id: number;
}

interface CarModel {
  name: string;
  model_id: number;
}

export default function EditCarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [bodyTypeModalVisible, setBodyTypeModalVisible] = useState(false);
  const [engineVolumeModalVisible, setEngineVolumeModalVisible] = useState(false);
  const [featuresModalVisible, setFeaturesModalVisible] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
  const [modelsCache, setModelsCache] = useState<{ [key: number]: CarModel[] }>({});

  const categories = [
    { value: 'cars', label: 'Автомобили', icon: '🚗' },
    { value: 'electric', label: 'Электромобили', icon: '⚡' },
    { value: 'motorcycles', label: 'Мотоциклы', icon: '🏍️' },
    { value: 'trucks', label: 'Грузовики', icon: '🚚' },
    { value: 'parts', label: 'Запчасти', icon: '🔧' },
    { value: 'rent', label: 'Аренда авто', icon: '🔑' },
  ];

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    engineType: 'petrol',
    engineVolume: null as number | null,
    bodyType: '',
    transmission: 'manual',
    driveType: 'front',
    condition: 'used',
    color: '',
    region: 'dushanbe',
    category: 'cars',
    description: '',
    features: [] as string[],
  });

  useEffect(() => {
    loadCar();
    loadBrands('');
  }, [id]);

  const loadCar = async () => {
    if (!id) return;
    
    try {
      const car = await carAPI.getById(id);
      setFormData({
        brand: car.brand || '',
        model: car.model || '',
        year: car.year?.toString() || '',
        price: car.price?.toString() || '',
        mileage: car.mileage?.toString() || '',
        engineType: car.engineType || 'petrol',
        engineVolume: car.engineVolume || null,
        bodyType: car.bodyType || '',
        transmission: car.transmission || 'manual',
        driveType: car.driveType || 'front',
        condition: car.condition || 'used',
        color: car.color || '',
        region: car.region || 'dushanbe',
        category: car.category || 'cars',
        description: car.description || '',
        features: car.features || [],
      });
      setPhotos(car.photos || []);
    } catch (error) {
      console.error('Error loading car:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные автомобиля');
      router.back();
    } finally {
      setLoading(false);
    }
  };

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

  const loadModels = useCallback(async (makeId: number) => {
    if (modelsCache[makeId]) {
      setModels(modelsCache[makeId]);
      return;
    }

    setModelsLoading(true);
    try {
      const data = await brandsAPI.getModels(makeId);
      setModels(data);
      setModelsCache(prev => ({ ...prev, [makeId]: data }));
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setModelsLoading(false);
    }
  }, [modelsCache]);

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

  const handleModelSelect = (option: { label: string; value: string | number }) => {
    const model = models.find(m => m.name === option.label);
    if (model) {
      setSelectedModel(model);
      setFormData(prev => ({ ...prev, model: model.name }));
    }
  };

  const brandOptions = brands.map(b => ({
    label: b.name,
    value: b.make_id.toString(),
    id: b.make_id,
  }));

  const modelOptions = models.map(m => ({
    label: m.name,
    value: m.model_id?.toString() || m.name,
    id: m.model_id,
  }));

  const toggleFeature = (featureValue: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureValue)
        ? prev.features.filter(f => f !== featureValue)
        : [...prev.features, featureValue]
    }));
  };

  const pickImage = async () => {
    if (photos.length >= 10) {
      Alert.alert('Ошибка', 'Максимум 10 фотографий');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нужно разрешение на доступ к галерее');
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
      Alert.alert('Ошибка', 'Максимум 10 фотографий');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нужно разрешение на доступ к камере');
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
      Alert.alert('Ошибка', 'Заполните марку и модель');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Ошибка', 'Укажите корректную цену');
      return false;
    }
    if (!formData.mileage || parseInt(formData.mileage) < 0) {
      Alert.alert('Ошибка', 'Укажите корректный пробег');
      return false;
    }
    if (photos.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы одну фотографию');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!user || !id) return;
    if (!validateForm()) return;

    setSaving(true);
    try {
      const carData = {
        ...formData,
        year: parseInt(formData.year),
        price: parseFloat(formData.price),
        mileage: parseInt(formData.mileage),
        photos,
        sellerPhone: user.phone,
        sellerId: user._id || user.phone,
      };

      await carAPI.update(id, carData);
      Alert.alert(
        'Успешно',
        'Объявление обновлено',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating car:', error);
      Alert.alert('Ошибка', 'Не удалось обновить объявление');
    } finally {
      setSaving(false);
    }
  };

  const SectionHeader = ({ title, required = false }: { title: string; required?: boolean }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {required && <Text style={styles.requiredBadge}>Обязательно</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Загрузка данных...</Text>
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
        <Text style={styles.headerTitle}>Редактирование</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos */}
        <View style={styles.card}>
          <SectionHeader title="📷 Фотографии" required />
          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 10 && (
              <>
                <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={28} color="#0066FF" />
                  <Text style={styles.addPhotoText}>Камера</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                  <Ionicons name="images" size={28} color="#0066FF" />
                  <Text style={styles.addPhotoText}>Галерея</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <Text style={styles.photoCount}>{photos.length}/10 фото</Text>
        </View>

        {/* Brand & Model */}
        <View style={styles.card}>
          <SectionHeader title="🚗 Марка и модель" required />
          <Text style={styles.fieldLabel}>Марка</Text>
          <SearchableSelect
            title="Выберите марку"
            placeholder="Например: Toyota, BMW..."
            value={formData.brand}
            options={brandOptions}
            onSelect={handleBrandSelect}
            onSearch={loadBrands}
            loading={brandsLoading}
            emptyText="Марки не найдены"
          />
          
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Модель</Text>
          <SearchableSelect
            title="Выберите модель"
            placeholder="Выберите модель"
            value={formData.model}
            options={modelOptions}
            onSelect={handleModelSelect}
            loading={modelsLoading}
            disabled={!selectedBrand && !formData.brand}
            disabledPlaceholder="Сначала выберите марку"
            emptyText="Модели не найдены"
          />
        </View>

        {/* Price Section */}
        <View style={styles.card}>
          <SectionHeader title="💰 Цена" required />
          <View style={styles.priceInputContainer}>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
              placeholder="85,000"
              placeholderTextColor="#94A3B8"
            />
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>TJS</Text>
            </View>
          </View>
        </View>

        {/* Main Specs */}
        <View style={styles.card}>
          <SectionHeader title="📊 Характеристики" required />
          
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Год</Text>
              <TextInput
                style={styles.input}
                value={formData.year}
                onChangeText={(text) => setFormData({ ...formData, year: text })}
                keyboardType="numeric"
                placeholder="2020"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Пробег (км)</Text>
              <TextInput
                style={styles.input}
                value={formData.mileage}
                onChangeText={(text) => setFormData({ ...formData, mileage: text })}
                keyboardType="numeric"
                placeholder="50000"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Body Type */}
          <Text style={styles.fieldLabel}>Тип кузова</Text>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setBodyTypeModalVisible(true)}
          >
            <Text style={[styles.selectFieldText, !formData.bodyType && styles.placeholder]}>
              {formData.bodyType ? BODY_TYPES.find(b => b.value === formData.bodyType)?.label : 'Выберите тип кузова'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Engine Type */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Тип двигателя</Text>
          <View style={styles.chipContainer}>
            {[
              { value: 'petrol', label: 'Бензин', icon: '⛽' },
              { value: 'diesel', label: 'Дизель', icon: '🛢️' },
              { value: 'electric', label: 'Электро', icon: '⚡' },
              { value: 'hybrid', label: 'Гибрид', icon: '🔋' },
            ].map(type => (
              <TouchableOpacity
                key={type.value}
                style={[styles.chip, formData.engineType === type.value && styles.chipActive]}
                onPress={() => setFormData({ ...formData, engineType: type.value })}
              >
                <Text style={styles.chipIcon}>{type.icon}</Text>
                <Text style={[styles.chipText, formData.engineType === type.value && styles.chipTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Engine Volume */}
          {formData.engineType !== 'electric' && (
            <>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Объём двигателя</Text>
              <TouchableOpacity
                style={styles.selectField}
                onPress={() => setEngineVolumeModalVisible(true)}
              >
                <Text style={[styles.selectFieldText, !formData.engineVolume && styles.placeholder]}>
                  {formData.engineVolume ? `${formData.engineVolume} л` : 'Выберите объём'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </>
          )}

          {/* Transmission */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>КПП</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, formData.transmission === 'manual' && styles.toggleActive]}
              onPress={() => setFormData({ ...formData, transmission: 'manual' })}
            >
              <Text style={[styles.toggleText, formData.transmission === 'manual' && styles.toggleTextActive]}>
                Механика
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, formData.transmission === 'automatic' && styles.toggleActive]}
              onPress={() => setFormData({ ...formData, transmission: 'automatic' })}
            >
              <Text style={[styles.toggleText, formData.transmission === 'automatic' && styles.toggleTextActive]}>
                Автомат
              </Text>
            </TouchableOpacity>
          </View>

          {/* Drive Type */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Привод</Text>
          <View style={styles.chipContainer}>
            {[
              { value: 'front', label: 'Передний' },
              { value: 'rear', label: 'Задний' },
              { value: 'awd', label: 'Полный' },
            ].map(type => (
              <TouchableOpacity
                key={type.value}
                style={[styles.chip, styles.chipSmall, formData.driveType === type.value && styles.chipActive]}
                onPress={() => setFormData({ ...formData, driveType: type.value })}
              >
                <Text style={[styles.chipText, formData.driveType === type.value && styles.chipTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Condition & Color */}
        <View style={styles.card}>
          <SectionHeader title="🎨 Состояние и цвет" />
          
          <Text style={styles.fieldLabel}>Состояние</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, formData.condition === 'new' && styles.toggleActiveGreen]}
              onPress={() => setFormData({ ...formData, condition: 'new' })}
            >
              <Text style={[styles.toggleText, formData.condition === 'new' && styles.toggleTextActive]}>
                ✨ Новый
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, formData.condition === 'used' && styles.toggleActive]}
              onPress={() => setFormData({ ...formData, condition: 'used' })}
            >
              <Text style={[styles.toggleText, formData.condition === 'used' && styles.toggleTextActive]}>
                С пробегом
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Цвет</Text>
          <TextInput
            style={styles.input}
            value={formData.color}
            onChangeText={(text) => setFormData({ ...formData, color: text })}
            placeholder="Белый, Чёрный металлик..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Features */}
        <View style={styles.card}>
          <SectionHeader title="✅ Опции" />
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setFeaturesModalVisible(true)}
          >
            <Text style={[styles.selectFieldText, formData.features.length === 0 && styles.placeholder]}>
              {formData.features.length > 0 
                ? `Выбрано: ${formData.features.length} опций`
                : 'Выберите опции'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.card}>
          <SectionHeader title="📍 Регион" required />
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setRegionModalVisible(true)}
          >
            <Ionicons name="location" size={20} color="#0066FF" />
            <Text style={styles.selectFieldText}>
              {t(`regions.${formData.region}`)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <SectionHeader title="📝 Описание" />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Описание автомобиля..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.saveText}>Сохранить изменения</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      {/* Body Type Modal */}
      <Modal visible={bodyTypeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Тип кузова</Text>
              <TouchableOpacity onPress={() => setBodyTypeModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={BODY_TYPES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, bodyType: item.value });
                    setBodyTypeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.bodyType === item.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Engine Volume Modal */}
      <Modal visible={engineVolumeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Объём двигателя</Text>
              <TouchableOpacity onPress={() => setEngineVolumeModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ENGINE_VOLUMES}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, engineVolume: item.value });
                    setEngineVolumeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.engineVolume === item.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Region Modal */}
      <Modal visible={regionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите регион</Text>
              <TouchableOpacity onPress={() => setRegionModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
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
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Features Modal */}
      <Modal visible={featuresModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Опции ({formData.features.length})</Text>
              <TouchableOpacity onPress={() => setFeaturesModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CAR_FEATURES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, formData.features.includes(item.value) && styles.modalItemSelected]}
                  onPress={() => toggleFeature(item.value)}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  <View style={[styles.checkbox, formData.features.includes(item.value) && styles.checkboxActive]}>
                    {formData.features.includes(item.value) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => setFeaturesModalVisible(false)}
              >
                <Text style={styles.modalDoneText}>Готово</Text>
              </TouchableOpacity>
            </View>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0066FF',
    backgroundColor: '#E8F1FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    fontSize: 20,
    fontWeight: '700',
  },
  currencyBadge: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  currencyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  selectField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  selectFieldText: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  placeholder: {
    color: '#94A3B8',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSmall: {
    flex: 1,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#E8F1FF',
    borderColor: '#0066FF',
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#0066FF',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: '#0066FF',
  },
  toggleActiveGreen: {
    backgroundColor: '#10B981',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#FFFFFF',
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
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 90,
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0066FF',
  },
  photoCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  modalItemSelected: {
    backgroundColor: '#F8FAFC',
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalDoneButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
