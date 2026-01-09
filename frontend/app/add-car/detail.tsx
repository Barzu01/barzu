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
import { BODY_TYPES, CAR_FEATURES, ENGINE_VOLUMES, COLORS } from '../../constants/theme';
import SearchableSelect from '../../components/SearchableSelect';

interface Brand {
  name: string;
  make_id: number;
}

interface CarModel {
  name: string;
  model_id: number;
}

// Все модели Mercedes-Benz
const MERCEDES_MODELS: CarModel[] = [
  // A-Class
  { name: 'A-Class', model_id: 1 },
  { name: 'A 160', model_id: 2 },
  { name: 'A 180', model_id: 3 },
  { name: 'A 200', model_id: 4 },
  { name: 'A 220', model_id: 5 },
  { name: 'A 250', model_id: 6 },
  { name: 'A 35 AMG', model_id: 7 },
  { name: 'A 45 AMG', model_id: 8 },
  // B-Class
  { name: 'B-Class', model_id: 10 },
  { name: 'B 150', model_id: 11 },
  { name: 'B 170', model_id: 12 },
  { name: 'B 180', model_id: 13 },
  { name: 'B 200', model_id: 14 },
  { name: 'B 220', model_id: 15 },
  { name: 'B 250', model_id: 16 },
  // C-Class
  { name: 'C-Class', model_id: 20 },
  { name: 'C 160', model_id: 21 },
  { name: 'C 180', model_id: 22 },
  { name: 'C 200', model_id: 23 },
  { name: 'C 220', model_id: 24 },
  { name: 'C 230', model_id: 25 },
  { name: 'C 240', model_id: 26 },
  { name: 'C 250', model_id: 27 },
  { name: 'C 280', model_id: 28 },
  { name: 'C 300', model_id: 29 },
  { name: 'C 320', model_id: 30 },
  { name: 'C 350', model_id: 31 },
  { name: 'C 400', model_id: 32 },
  { name: 'C 43 AMG', model_id: 33 },
  { name: 'C 55 AMG', model_id: 34 },
  { name: 'C 63 AMG', model_id: 35 },
  // CLA-Class
  { name: 'CLA', model_id: 40 },
  { name: 'CLA 180', model_id: 41 },
  { name: 'CLA 200', model_id: 42 },
  { name: 'CLA 220', model_id: 43 },
  { name: 'CLA 250', model_id: 44 },
  { name: 'CLA 35 AMG', model_id: 45 },
  { name: 'CLA 45 AMG', model_id: 46 },
  // CLS-Class
  { name: 'CLS', model_id: 50 },
  { name: 'CLS 220', model_id: 51 },
  { name: 'CLS 250', model_id: 52 },
  { name: 'CLS 300', model_id: 53 },
  { name: 'CLS 350', model_id: 54 },
  { name: 'CLS 400', model_id: 55 },
  { name: 'CLS 450', model_id: 56 },
  { name: 'CLS 500', model_id: 57 },
  { name: 'CLS 53 AMG', model_id: 58 },
  { name: 'CLS 55 AMG', model_id: 59 },
  { name: 'CLS 63 AMG', model_id: 60 },
  // E-Class
  { name: 'E-Class', model_id: 70 },
  { name: 'E 200', model_id: 71 },
  { name: 'E 220', model_id: 72 },
  { name: 'E 230', model_id: 73 },
  { name: 'E 240', model_id: 74 },
  { name: 'E 250', model_id: 75 },
  { name: 'E 260', model_id: 76 },
  { name: 'E 280', model_id: 77 },
  { name: 'E 300', model_id: 78 },
  { name: 'E 320', model_id: 79 },
  { name: 'E 350', model_id: 80 },
  { name: 'E 400', model_id: 81 },
  { name: 'E 420', model_id: 82 },
  { name: 'E 430', model_id: 83 },
  { name: 'E 450', model_id: 84 },
  { name: 'E 500', model_id: 85 },
  { name: 'E 550', model_id: 86 },
  { name: 'E 43 AMG', model_id: 87 },
  { name: 'E 53 AMG', model_id: 88 },
  { name: 'E 55 AMG', model_id: 89 },
  { name: 'E 63 AMG', model_id: 90 },
  // S-Class
  { name: 'S-Class', model_id: 100 },
  { name: 'S 280', model_id: 101 },
  { name: 'S 300', model_id: 102 },
  { name: 'S 320', model_id: 103 },
  { name: 'S 350', model_id: 104 },
  { name: 'S 400', model_id: 105 },
  { name: 'S 420', model_id: 106 },
  { name: 'S 430', model_id: 107 },
  { name: 'S 450', model_id: 108 },
  { name: 'S 500', model_id: 109 },
  { name: 'S 550', model_id: 110 },
  { name: 'S 560', model_id: 111 },
  { name: 'S 580', model_id: 112 },
  { name: 'S 600', model_id: 113 },
  { name: 'S 63 AMG', model_id: 114 },
  { name: 'S 65 AMG', model_id: 115 },
  // G-Class
  { name: 'G-Class', model_id: 120 },
  { name: 'G 230', model_id: 121 },
  { name: 'G 270', model_id: 122 },
  { name: 'G 280', model_id: 123 },
  { name: 'G 290', model_id: 124 },
  { name: 'G 300', model_id: 125 },
  { name: 'G 320', model_id: 126 },
  { name: 'G 350', model_id: 127 },
  { name: 'G 400', model_id: 128 },
  { name: 'G 500', model_id: 129 },
  { name: 'G 550', model_id: 130 },
  { name: 'G 55 AMG', model_id: 131 },
  { name: 'G 63 AMG', model_id: 132 },
  { name: 'G 65 AMG', model_id: 133 },
  // GLA-Class
  { name: 'GLA', model_id: 140 },
  { name: 'GLA 180', model_id: 141 },
  { name: 'GLA 200', model_id: 142 },
  { name: 'GLA 220', model_id: 143 },
  { name: 'GLA 250', model_id: 144 },
  { name: 'GLA 35 AMG', model_id: 145 },
  { name: 'GLA 45 AMG', model_id: 146 },
  // GLB-Class
  { name: 'GLB', model_id: 150 },
  { name: 'GLB 180', model_id: 151 },
  { name: 'GLB 200', model_id: 152 },
  { name: 'GLB 220', model_id: 153 },
  { name: 'GLB 250', model_id: 154 },
  { name: 'GLB 35 AMG', model_id: 155 },
  // GLC-Class
  { name: 'GLC', model_id: 160 },
  { name: 'GLC 200', model_id: 161 },
  { name: 'GLC 220', model_id: 162 },
  { name: 'GLC 250', model_id: 163 },
  { name: 'GLC 300', model_id: 164 },
  { name: 'GLC 350', model_id: 165 },
  { name: 'GLC 400', model_id: 166 },
  { name: 'GLC 43 AMG', model_id: 167 },
  { name: 'GLC 63 AMG', model_id: 168 },
  { name: 'GLC Coupe', model_id: 169 },
  // GLE-Class
  { name: 'GLE', model_id: 170 },
  { name: 'GLE 250', model_id: 171 },
  { name: 'GLE 300', model_id: 172 },
  { name: 'GLE 350', model_id: 173 },
  { name: 'GLE 400', model_id: 174 },
  { name: 'GLE 450', model_id: 175 },
  { name: 'GLE 500', model_id: 176 },
  { name: 'GLE 53 AMG', model_id: 177 },
  { name: 'GLE 63 AMG', model_id: 178 },
  { name: 'GLE Coupe', model_id: 179 },
  // GLS-Class
  { name: 'GLS', model_id: 180 },
  { name: 'GLS 350', model_id: 181 },
  { name: 'GLS 400', model_id: 182 },
  { name: 'GLS 450', model_id: 183 },
  { name: 'GLS 500', model_id: 184 },
  { name: 'GLS 550', model_id: 185 },
  { name: 'GLS 580', model_id: 186 },
  { name: 'GLS 600 Maybach', model_id: 187 },
  { name: 'GLS 63 AMG', model_id: 188 },
  // ML-Class (старые)
  { name: 'ML-Class', model_id: 190 },
  { name: 'ML 230', model_id: 191 },
  { name: 'ML 250', model_id: 192 },
  { name: 'ML 270', model_id: 193 },
  { name: 'ML 280', model_id: 194 },
  { name: 'ML 300', model_id: 195 },
  { name: 'ML 320', model_id: 196 },
  { name: 'ML 350', model_id: 197 },
  { name: 'ML 400', model_id: 198 },
  { name: 'ML 430', model_id: 199 },
  { name: 'ML 450', model_id: 200 },
  { name: 'ML 500', model_id: 201 },
  { name: 'ML 550', model_id: 202 },
  { name: 'ML 55 AMG', model_id: 203 },
  { name: 'ML 63 AMG', model_id: 204 },
  // GL-Class (старые)
  { name: 'GL-Class', model_id: 210 },
  { name: 'GL 320', model_id: 211 },
  { name: 'GL 350', model_id: 212 },
  { name: 'GL 420', model_id: 213 },
  { name: 'GL 450', model_id: 214 },
  { name: 'GL 500', model_id: 215 },
  { name: 'GL 550', model_id: 216 },
  { name: 'GL 63 AMG', model_id: 217 },
  // GLK-Class
  { name: 'GLK', model_id: 220 },
  { name: 'GLK 200', model_id: 221 },
  { name: 'GLK 220', model_id: 222 },
  { name: 'GLK 250', model_id: 223 },
  { name: 'GLK 280', model_id: 224 },
  { name: 'GLK 300', model_id: 225 },
  { name: 'GLK 320', model_id: 226 },
  { name: 'GLK 350', model_id: 227 },
  // SL-Class
  { name: 'SL', model_id: 230 },
  { name: 'SL 280', model_id: 231 },
  { name: 'SL 300', model_id: 232 },
  { name: 'SL 320', model_id: 233 },
  { name: 'SL 350', model_id: 234 },
  { name: 'SL 380', model_id: 235 },
  { name: 'SL 400', model_id: 236 },
  { name: 'SL 450', model_id: 237 },
  { name: 'SL 500', model_id: 238 },
  { name: 'SL 550', model_id: 239 },
  { name: 'SL 55 AMG', model_id: 240 },
  { name: 'SL 63 AMG', model_id: 241 },
  { name: 'SL 65 AMG', model_id: 242 },
  // SLC/SLK-Class
  { name: 'SLK', model_id: 250 },
  { name: 'SLK 200', model_id: 251 },
  { name: 'SLK 230', model_id: 252 },
  { name: 'SLK 250', model_id: 253 },
  { name: 'SLK 280', model_id: 254 },
  { name: 'SLK 300', model_id: 255 },
  { name: 'SLK 320', model_id: 256 },
  { name: 'SLK 350', model_id: 257 },
  { name: 'SLK 55 AMG', model_id: 258 },
  { name: 'SLC 180', model_id: 259 },
  { name: 'SLC 200', model_id: 260 },
  { name: 'SLC 300', model_id: 261 },
  { name: 'SLC 43 AMG', model_id: 262 },
  // AMG GT
  { name: 'AMG GT', model_id: 270 },
  { name: 'AMG GT S', model_id: 271 },
  { name: 'AMG GT C', model_id: 272 },
  { name: 'AMG GT R', model_id: 273 },
  { name: 'AMG GT 43', model_id: 274 },
  { name: 'AMG GT 53', model_id: 275 },
  { name: 'AMG GT 63', model_id: 276 },
  { name: 'AMG GT 63 S', model_id: 277 },
  // EQ Electric
  { name: 'EQA', model_id: 280 },
  { name: 'EQA 250', model_id: 281 },
  { name: 'EQA 300', model_id: 282 },
  { name: 'EQA 350', model_id: 283 },
  { name: 'EQB', model_id: 284 },
  { name: 'EQB 250', model_id: 285 },
  { name: 'EQB 300', model_id: 286 },
  { name: 'EQB 350', model_id: 287 },
  { name: 'EQC', model_id: 288 },
  { name: 'EQC 400', model_id: 289 },
  { name: 'EQE', model_id: 290 },
  { name: 'EQE 300', model_id: 291 },
  { name: 'EQE 350', model_id: 292 },
  { name: 'EQE 500', model_id: 293 },
  { name: 'EQE 43 AMG', model_id: 294 },
  { name: 'EQE 53 AMG', model_id: 295 },
  { name: 'EQE SUV', model_id: 296 },
  { name: 'EQS', model_id: 297 },
  { name: 'EQS 450', model_id: 298 },
  { name: 'EQS 500', model_id: 299 },
  { name: 'EQS 580', model_id: 300 },
  { name: 'EQS 53 AMG', model_id: 301 },
  { name: 'EQS SUV', model_id: 302 },
  { name: 'EQV', model_id: 303 },
  // Maybach
  { name: 'Maybach S-Class', model_id: 310 },
  { name: 'Maybach S 560', model_id: 311 },
  { name: 'Maybach S 580', model_id: 312 },
  { name: 'Maybach S 600', model_id: 313 },
  { name: 'Maybach S 650', model_id: 314 },
  { name: 'Maybach S 680', model_id: 315 },
  // V-Class / Vito / Viano
  { name: 'V-Class', model_id: 320 },
  { name: 'V 200', model_id: 321 },
  { name: 'V 220', model_id: 322 },
  { name: 'V 250', model_id: 323 },
  { name: 'V 300', model_id: 324 },
  { name: 'Vito', model_id: 325 },
  { name: 'Viano', model_id: 326 },
  // Sprinter
  { name: 'Sprinter', model_id: 330 },
  // Vintage / Classic
  { name: 'W123', model_id: 340 },
  { name: 'W124', model_id: 341 },
  { name: 'W126', model_id: 342 },
  { name: 'W140', model_id: 343 },
  { name: 'W201 (190)', model_id: 344 },
  { name: 'W202', model_id: 345 },
  { name: 'W203', model_id: 346 },
  { name: 'W204', model_id: 347 },
  { name: 'W205', model_id: 348 },
  { name: 'W206', model_id: 349 },
  { name: 'W210', model_id: 350 },
  { name: 'W211', model_id: 351 },
  { name: 'W212', model_id: 352 },
  { name: 'W213', model_id: 353 },
  { name: 'W214', model_id: 354 },
  { name: 'W220', model_id: 355 },
  { name: 'W221', model_id: 356 },
  { name: 'W222', model_id: 357 },
  { name: 'W223', model_id: 358 },
  // R-Class
  { name: 'R-Class', model_id: 360 },
  { name: 'R 280', model_id: 361 },
  { name: 'R 300', model_id: 362 },
  { name: 'R 320', model_id: 363 },
  { name: 'R 350', model_id: 364 },
  { name: 'R 500', model_id: 365 },
  { name: 'R 63 AMG', model_id: 366 },
  // Другие
  { name: 'Другая модель', model_id: 999 },
];

export default function AddCarDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [bodyTypeModalVisible, setBodyTypeModalVisible] = useState(false);
  const [engineVolumeModalVisible, setEngineVolumeModalVisible] = useState(false);
  const [featuresModalVisible, setFeaturesModalVisible] = useState(false);

  // Brands and Models state - только Mercedes-Benz
  const [brands] = useState<Brand[]>([{ name: 'Mercedes-Benz', make_id: 449 }]);
  const [models] = useState<CarModel[]>(MERCEDES_MODELS);
  const [brandsLoading] = useState(false);
  const [modelsLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>({ name: 'Mercedes-Benz', make_id: 449 });
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);

  const categories = [
    { value: 'cars', label: 'Автомобили', icon: '🚗' },
    { value: 'electric', label: 'Электромобили', icon: '⚡' },
    { value: 'motorcycles', label: 'Мотоциклы', icon: '🏍️' },
    { value: 'trucks', label: 'Грузовики', icon: '🚚' },
    { value: 'parts', label: 'Запчасти', icon: '🔧' },
    { value: 'rent', label: 'Аренда авто', icon: '🔑' },
  ];

  const [formData, setFormData] = useState({
    brand: 'Mercedes-Benz',
    model: '',
    year: new Date().getFullYear().toString(),
    price: '',
    mileage: '',
    engineType: 'petrol',
    engineVolume: null as number | null,
    bodyType: '',
    transmission: 'automatic',
    driveType: 'rear',
    condition: 'used',
    color: '',
    region: 'dushanbe',
    category: 'cars',
    description: '',
    features: [] as string[],
  });

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

  const SectionHeader = ({ title, required = false }: { title: string; required?: boolean }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {required && <Text style={styles.requiredBadge}>Обязательно</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.replace('/(tabs)/home')} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новое объявление</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos Section */}
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
          <View style={styles.photoProgress}>
            <View style={[styles.photoProgressBar, { width: `${(photos.length / 10) * 100}%` }]} />
          </View>
          <Text style={styles.photoCount}>{photos.length}/10 фото</Text>
        </View>

        {/* Category */}
        <View style={styles.card}>
          <SectionHeader title="📁 Категория" required />
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setCategoryModalVisible(true)}
          >
            <View style={styles.selectFieldContent}>
              <Text style={styles.selectFieldIcon}>
                {categories.find(c => c.value === formData.category)?.icon}
              </Text>
              <Text style={styles.selectFieldText}>
                {categories.find(c => c.value === formData.category)?.label}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Brand & Model */}
        <View style={styles.card}>
          <SectionHeader title="🚗 Mercedes-Benz" required />
          <View style={styles.brandHeader}>
            <Image 
              source={{ uri: 'https://www.carlogos.org/car-logos/mercedes-benz-logo-2011-1920x1080.png' }} 
              style={styles.brandHeaderLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandHeaderText}>Mercedes-Benz</Text>
          </View>
          
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Модель</Text>
          <SearchableSelect
            title="Выберите модель Mercedes-Benz"
            placeholder="Например: E 200, S 500, GLC 300..."
            value={formData.model}
            options={modelOptions}
            onSelect={handleModelSelect}
            loading={modelsLoading}
            emptyText="Модели не найдены"
          />
        </View>

        {/* Main Specs */}
        <View style={styles.card}>
          <SectionHeader title="📊 Основные характеристики" required />
          
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Год выпуска</Text>
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

          <Text style={styles.fieldLabel}>Цена (TJS)</Text>
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

        {/* Technical Specs */}
        <View style={styles.card}>
          <SectionHeader title="⚙️ Технические данные" />
          
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
            placeholder="Например: Белый, Чёрный металлик"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Features */}
        <View style={styles.card}>
          <SectionHeader title="✅ Опции и комплектация" />
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setFeaturesModalVisible(true)}
          >
            <Text style={[styles.selectFieldText, formData.features.length === 0 && styles.placeholder]}>
              {formData.features.length > 0 
                ? `Выбрано: ${formData.features.length} опций`
                : 'Выберите опции автомобиля'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
          
          {formData.features.length > 0 && (
            <View style={styles.selectedFeatures}>
              {formData.features.slice(0, 5).map(f => (
                <View key={f} style={styles.featureTag}>
                  <Text style={styles.featureTagText}>
                    {CAR_FEATURES.find(cf => cf.value === f)?.label}
                  </Text>
                </View>
              ))}
              {formData.features.length > 5 && (
                <View style={styles.featureTag}>
                  <Text style={styles.featureTagText}>+{formData.features.length - 5}</Text>
                </View>
              )}
            </View>
          )}
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
            placeholder="Расскажите о состоянии автомобиля, истории обслуживания, причине продажи..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
              <Text style={styles.submitText}>Опубликовать объявление</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Объявление будет проверено модератором перед публикацией
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      {/* Category Modal */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите категорию</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
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
                  <Text style={styles.modalItemIcon}>{item.icon}</Text>
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.category === item.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

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
    height: 120,
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
  },
  currencyBadge: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  currencyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
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
  selectFieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  selectFieldIcon: {
    fontSize: 24,
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
  selectedFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  featureTag: {
    backgroundColor: '#E8F1FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  featureTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066FF',
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
  photoProgress: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  photoProgressBar: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 2,
  },
  photoCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#0066FF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
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
  modalItemIcon: {
    fontSize: 24,
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
