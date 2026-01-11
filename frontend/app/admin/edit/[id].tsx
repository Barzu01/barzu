import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { carAPI, adminAPI } from '../../../services/api';
import { CarListing } from '../../../types';

const { width } = Dimensions.get('window');

export default function EditCarScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [car, setCar] = useState<CarListing | null>(null);
  const [messageModal, setMessageModal] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ visible: false, type: 'success', message: '' });

  // Editable fields
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    engineType: '',
    transmission: '',
    driveType: '',
    condition: '',
    color: '',
    region: '',
    description: '',
  });

  useEffect(() => {
    fetchCar();
  }, [id]);

  const fetchCar = async () => {
    try {
      setLoading(true);
      const data = await carAPI.getById(id as string);
      setCar(data);
      setFormData({
        brand: data.brand || '',
        model: data.model || '',
        year: data.year?.toString() || '',
        price: data.price?.toString() || '',
        mileage: data.mileage?.toString() || '',
        engineType: data.engineType || '',
        transmission: data.transmission || '',
        driveType: data.driveType || '',
        condition: data.condition || '',
        color: data.color || '',
        region: data.region || '',
        description: data.description || '',
      });
    } catch (error) {
      console.error('Error fetching car:', error);
      showMessage('error', 'Не удалось загрузить объявление');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', message: string) => {
    setMessageModal({ visible: true, type, message });
  };

  const handleSave = async () => {
    if (!car?._id) return;

    setSaving(true);
    try {
      const updatedData = {
        ...car,
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year) || car.year,
        price: parseFloat(formData.price) || car.price,
        mileage: parseInt(formData.mileage) || car.mileage,
        engineType: formData.engineType,
        transmission: formData.transmission,
        driveType: formData.driveType,
        condition: formData.condition,
        color: formData.color,
        region: formData.region,
        description: formData.description,
      };

      await carAPI.update(car._id, updatedData);
      showMessage('success', 'Объявление успешно обновлено');
    } catch (error) {
      console.error('Error updating car:', error);
      showMessage('error', 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!car) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Объявление не найдено</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Редактирование</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Сохранить</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Photo Preview */}
          {car.photos && car.photos.length > 0 && (
            <View style={styles.photoSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {car.photos.map((photo, index) => (
                  <Image 
                    key={index}
                    source={{ uri: photo }} 
                    style={styles.photoPreview}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              <Text style={styles.photoCount}>{car.photos.length} фото</Text>
            </View>
          )}

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Основная информация</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Марка</Text>
              <TextInput
                style={styles.input}
                value={formData.brand}
                onChangeText={(text) => setFormData({ ...formData, brand: text })}
                placeholder="Например: Toyota"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Модель</Text>
              <TextInput
                style={styles.input}
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
                placeholder="Например: Camry"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Год</Text>
                <TextInput
                  style={styles.input}
                  value={formData.year}
                  onChangeText={(text) => setFormData({ ...formData, year: text })}
                  placeholder="2020"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.inputLabel}>Пробег (км)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mileage}
                  onChangeText={(text) => setFormData({ ...formData, mileage: text })}
                  placeholder="50000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Цена (TJS)</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="100000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Technical Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Технические данные</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Тип двигателя</Text>
              <View style={styles.optionsRow}>
                {['petrol', 'diesel', 'electric', 'hybrid'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      formData.engineType === type && styles.optionButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, engineType: type })}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      formData.engineType === type && styles.optionButtonTextActive
                    ]}>
                      {type === 'petrol' ? 'Бензин' : 
                       type === 'diesel' ? 'Дизель' : 
                       type === 'electric' ? 'Электро' : 'Гибрид'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>КПП</Text>
              <View style={styles.optionsRow}>
                {['manual', 'automatic'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      formData.transmission === type && styles.optionButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, transmission: type })}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      formData.transmission === type && styles.optionButtonTextActive
                    ]}>
                      {type === 'manual' ? 'Механика' : 'Автомат'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Привод</Text>
              <View style={styles.optionsRow}>
                {['front', 'rear', 'awd'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      formData.driveType === type && styles.optionButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, driveType: type })}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      formData.driveType === type && styles.optionButtonTextActive
                    ]}>
                      {type === 'front' ? 'Передний' : 
                       type === 'rear' ? 'Задний' : 'Полный'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Состояние</Text>
              <View style={styles.optionsRow}>
                {['new', 'used'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      formData.condition === type && styles.optionButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, condition: type })}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      formData.condition === type && styles.optionButtonTextActive
                    ]}>
                      {type === 'new' ? 'Новый' : 'С пробегом'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Цвет</Text>
              <TextInput
                style={styles.input}
                value={formData.color}
                onChangeText={(text) => setFormData({ ...formData, color: text })}
                placeholder="Например: Белый"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 Описание</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Описание объявления..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Seller Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Продавец</Text>
            <View style={styles.sellerInfo}>
              <Ionicons name="call" size={20} color="#64748B" />
              <Text style={styles.sellerPhone}>{car.sellerPhone}</Text>
            </View>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Статус</Text>
            <View style={[
              styles.statusBadge,
              car.status === 'approved' ? styles.statusApproved :
              car.status === 'rejected' ? styles.statusRejected : styles.statusPending
            ]}>
              <Text style={styles.statusText}>
                {car.status === 'approved' ? '✓ Одобрено' :
                 car.status === 'rejected' ? '✕ Отклонено' : '⏳ На модерации'}
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Message Modal */}
        <Modal visible={messageModal.visible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[
                styles.modalIcon,
                messageModal.type === 'success' ? styles.modalIconSuccess : styles.modalIconError
              ]}>
                <Ionicons 
                  name={messageModal.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
                  size={48} 
                  color={messageModal.type === 'success' ? '#10B981' : '#EF4444'} 
                />
              </View>
              <Text style={styles.modalMessage}>{messageModal.message}</Text>
              <TouchableOpacity 
                style={[styles.modalButton, messageModal.type === 'success' && styles.modalButtonSuccess]}
                onPress={() => {
                  setMessageModal({ ...messageModal, visible: false });
                  if (messageModal.type === 'success') {
                    router.back();
                  }
                }}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  photoSection: {
    marginBottom: 20,
  },
  photoPreview: {
    width: 120,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  photoCount: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionButtonActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerPhone: {
    fontSize: 16,
    color: '#0F172A',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusApproved: {
    backgroundColor: '#D1FAE5',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconSuccess: {
    backgroundColor: '#ECFDF5',
  },
  modalIconError: {
    backgroundColor: '#FEF2F2',
  },
  modalMessage: {
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
  },
  modalButtonSuccess: {
    backgroundColor: '#10B981',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
