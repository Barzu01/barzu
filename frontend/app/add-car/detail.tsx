import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { carAPI } from '../../services/api';
import { CAR_BRANDS, REGIONS, ENGINE_TYPES, TRANSMISSIONS, DRIVE_TYPES, CONDITIONS, COLORS } from '../../constants/carData';
import { Picker } from '@react-native-picker/picker';

export default function AddCarDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

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
    description: '',
  });

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
        [{ text: 'OK', onPress: () => router.back() }]
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.engineType}
              onValueChange={(value) => setFormData({ ...formData, engineType: value })}
              style={styles.picker}
            >
              <Picker.Item label={t('car.petrol')} value="petrol" />
              <Picker.Item label={t('car.diesel')} value="diesel" />
              <Picker.Item label={t('car.electric')} value="electric" />
              <Picker.Item label={t('car.hybrid')} value="hybrid" />
            </Picker>
          </View>
        </View>

        {/* Transmission */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('car.transmission')} *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.transmission}
              onValueChange={(value) => setFormData({ ...formData, transmission: value })}
              style={styles.picker}
            >
              <Picker.Item label={t('car.manual')} value="manual" />
              <Picker.Item label={t('car.automatic')} value="automatic" />
            </Picker>
          </View>
        </View>

        {/* Drive Type */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('car.driveType')} *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.driveType}
              onValueChange={(value) => setFormData({ ...formData, driveType: value })}
              style={styles.picker}
            >
              <Picker.Item label={t('car.front')} value="front" />
              <Picker.Item label={t('car.rear')} value="rear" />
              <Picker.Item label={t('car.awd')} value="awd" />
            </Picker>
          </View>
        </View>

        {/* Condition */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('car.condition')} *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.condition}
              onValueChange={(value) => setFormData({ ...formData, condition: value })}
              style={styles.picker}
            >
              <Picker.Item label={t('car.new')} value="new" />
              <Picker.Item label={t('car.used')} value="used" />
            </Picker>
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
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.region}
              onValueChange={(value) => setFormData({ ...formData, region: value })}
              style={styles.picker}
            >
              {REGIONS.map((region) => (
                <Picker.Item key={region.value} label={t(region.label)} value={region.value} />
              ))}
            </Picker>
          </View>
        </View>

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
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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