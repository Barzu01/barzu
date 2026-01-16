import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://safewheels-dev.preview.emergentagent.com';
const MAX_DURATION = 120; // 2 минуты в секундах

interface CarListing {
  _id: string;
  brand: string;
  model: string;
  year: number;
}

type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'saving' | 'success' | 'error';

export default function AddVideoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<Video>(null);
  
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoAspectRatio, setVideoAspectRatio] = useState(9/16);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [myListings, setMyListings] = useState<CarListing[]>([]);
  const [showCarPicker, setShowCarPicker] = useState(false);
  
  // Upload state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (user?.phone) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cars?sellerId=${encodeURIComponent(user!.phone)}&status=approved`);
      if (response.ok) {
        const data = await response.json();
        setMyListings(data);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const pickVideo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Ошибка', 'Нужно разрешение для доступа к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: MAX_DURATION,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const duration = asset.duration ? asset.duration / 1000 : 0;
      
      if (duration > MAX_DURATION) {
        Alert.alert('Ошибка', `Видео слишком длинное. Максимум ${MAX_DURATION / 60} минуты.`);
        return;
      }
      
      setVideoUri(asset.uri);
      setVideoDuration(duration);
      
      // Определяем соотношение сторон
      if (asset.width && asset.height) {
        setVideoAspectRatio(asset.width / asset.height);
      }
    }
  };

  const recordVideo = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Ошибка', 'Нужно разрешение для доступа к камере');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: MAX_DURATION,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const duration = asset.duration ? asset.duration / 1000 : 0;
      
      if (duration > MAX_DURATION) {
        Alert.alert('Ошибка', `Видео слишком длинное. Максимум ${MAX_DURATION / 60} минуты.`);
        return;
      }
      
      setVideoUri(asset.uri);
      setVideoDuration(duration);
      
      if (asset.width && asset.height) {
        setVideoAspectRatio(asset.width / asset.height);
      }
    }
  };

  const showPreview = () => {
    if (!videoUri || !title.trim()) {
      Alert.alert('Ошибка', 'Добавьте видео и название');
      return;
    }
    setShowPreviewModal(true);
  };

  const uploadVideo = async () => {
    if (!videoUri || !title.trim() || !user?.phone) {
      return;
    }

    setShowPreviewModal(false);
    setUploadStatus('preparing');
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Подготовка к загрузке
      setUploadStatus('uploading');
      
      const response = await fetch(videoUri);
      const blob = await response.blob();
      
      const cleanPhone = user.phone.replace(/\+/g, '');
      const filename = `videos/${cleanPhone}/${Date.now()}.mp4`;
      const storageRef = ref(storage, filename);
      
      const uploadTask = uploadBytesResumable(storageRef, blob);

      await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Firebase upload error:', error);
            setUploadError('Ошибка загрузки. Проверьте интернет-соединение.');
            setUploadStatus('error');
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (e) {
              reject(e);
            }
          }
        );
      }).then(async (downloadURL) => {
        // Сохранение в базу данных
        setUploadStatus('saving');
        
        const videoData = {
          title: title.trim(),
          description: description.trim(),
          videoUrl: downloadURL,
          duration: Math.round(videoDuration),
          carId: selectedCarId,
          authorId: user.phone,
          authorName: user.name || 'Пользователь',
          viewsCount: 0,
          likesCount: 0,
          likedBy: [],
          savedBy: [],
          status: 'approved',
        };

        const apiResponse = await fetch(`${API_URL}/api/videos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(videoData),
        });

        if (apiResponse.ok) {
          setUploadStatus('success');
          
          // Показываем успешное сообщение и переходим
          setTimeout(() => {
            Alert.alert(
              '✅ Видео опубликовано!', 
              'Ваш обзор успешно добавлен в ленту',
              [{ text: 'Смотреть', onPress: () => router.push('/(tabs)/reviews') }]
            );
          }, 1000);
        } else {
          throw new Error('Ошибка сохранения');
        }
      });
      
    } catch (error) {
      console.error('Error uploading video:', error);
      setUploadError('Не удалось загрузить видео. Попробуйте снова.');
      setUploadStatus('error');
    }
  };

  const retryUpload = () => {
    setUploadStatus('idle');
    setUploadError(null);
    setUploadProgress(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'preparing': return 'Подготовка видео...';
      case 'uploading': return `Загрузка видео... ${uploadProgress}%`;
      case 'saving': return 'Сохранение...';
      case 'success': return '✅ Видео опубликовано!';
      case 'error': return '❌ Ошибка загрузки';
      default: return '';
    }
  };

  const selectedCar = myListings.find(car => car._id === selectedCarId);
  const isUploading = ['preparing', 'uploading', 'saving'].includes(uploadStatus);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={isUploading}>
          <Ionicons name="arrow-back" size={24} color={isUploading ? "#94A3B8" : "#0F172A"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новый видео-обзор</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Upload Progress Overlay */}
      {isUploading && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadCard}>
            <ActivityIndicator size="large" color="#0066FF" />
            <Text style={styles.uploadStatusText}>{getStatusText()}</Text>
            
            {/* Progress Bar */}
            {uploadStatus === 'uploading' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>{uploadProgress}%</Text>
              </View>
            )}
            
            <Text style={styles.uploadHint}>
              Не закрывайте приложение до завершения загрузки
            </Text>
          </View>
        </View>
      )}

      {/* Success Overlay */}
      {uploadStatus === 'success' && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            <Text style={styles.successText}>Видео опубликовано!</Text>
            <Text style={styles.successHint}>Переход в ленту обзоров...</Text>
          </View>
        </View>
      )}

      {/* Error Overlay */}
      {uploadStatus === 'error' && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadCard}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={64} color="#EF4444" />
            </View>
            <Text style={styles.errorText}>{uploadError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retryUpload}>
              <Text style={styles.retryButtonText}>Попробовать снова</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📹 Видео</Text>
          
          {!videoUri ? (
            <View style={styles.videoPickerContainer}>
              <TouchableOpacity style={styles.videoPickerButton} onPress={pickVideo}>
                <Ionicons name="images-outline" size={32} color="#0066FF" />
                <Text style={styles.videoPickerText}>Из галереи</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.videoPickerButton} onPress={recordVideo}>
                <Ionicons name="videocam-outline" size={32} color="#EF4444" />
                <Text style={styles.videoPickerText}>Записать</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.videoPreviewContainer}>
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.videoPreview}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                isLooping={false}
                useNativeControls
              />
              <View style={styles.videoDurationBadge}>
                <Text style={styles.videoDurationText}>{formatDuration(videoDuration)}</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeVideoButton}
                onPress={() => setVideoUri(null)}
              >
                <Ionicons name="close-circle" size={32} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.hint}>
            Максимум {MAX_DURATION / 60} минуты • Рекомендуем вертикальное видео
          </Text>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✏️ Название *</Text>
          <TextInput
            style={styles.input}
            placeholder="Например: Обзор BMW M5 2024"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Описание</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Расскажите о видео..."
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Link to Car Listing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 Привязать к объявлению</Text>
          
          <TouchableOpacity 
            style={styles.carPickerButton}
            onPress={() => setShowCarPicker(!showCarPicker)}
          >
            {selectedCar ? (
              <View style={styles.selectedCar}>
                <Ionicons name="car" size={24} color="#10B981" />
                <Text style={styles.selectedCarText}>
                  {selectedCar.brand} {selectedCar.model} {selectedCar.year}
                </Text>
                <TouchableOpacity onPress={() => setSelectedCarId(null)}>
                  <Ionicons name="close-circle" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noCarSelected}>
                <Ionicons name="add-circle-outline" size={24} color="#64748B" />
                <Text style={styles.noCarSelectedText}>Выбрать (необязательно)</Text>
              </View>
            )}
          </TouchableOpacity>

          {showCarPicker && myListings.length > 0 && (
            <View style={styles.carList}>
              {myListings.map((car) => (
                <TouchableOpacity
                  key={car._id}
                  style={[
                    styles.carListItem,
                    selectedCarId === car._id && styles.carListItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCarId(car._id);
                    setShowCarPicker(false);
                  }}
                >
                  <Text style={styles.carListItemText}>
                    {car.brand} {car.model} {car.year}
                  </Text>
                  {selectedCarId === car._id && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Preview & Publish Button */}
        <TouchableOpacity
          style={[styles.previewButton, (!videoUri || !title.trim()) && styles.buttonDisabled]}
          onPress={showPreview}
          disabled={!videoUri || !title.trim() || isUploading}
        >
          <Ionicons name="eye" size={24} color="#FFFFFF" />
          <Text style={styles.previewButtonText}>Предпросмотр и публикация</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Preview Modal */}
      <Modal visible={showPreviewModal} animationType="slide" transparent>
        <View style={styles.previewModalOverlay}>
          <View style={styles.previewModalContent}>
            <View style={styles.previewModalHeader}>
              <Text style={styles.previewModalTitle}>Предпросмотр</Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.previewVideoContainer}>
              {videoUri && (
                <Video
                  source={{ uri: videoUri }}
                  style={styles.previewVideo}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={true}
                  isLooping={true}
                  isMuted={false}
                />
              )}
              
              {/* Overlay info like in feed */}
              <View style={styles.previewInfoOverlay}>
                <Text style={styles.previewTitle}>{title}</Text>
                {description ? (
                  <Text style={styles.previewDescription} numberOfLines={2}>{description}</Text>
                ) : null}
              </View>
            </View>
            
            <View style={styles.previewModalFooter}>
              <Text style={styles.previewHint}>
                Так ваше видео будет выглядеть в ленте
              </Text>
              <TouchableOpacity
                style={styles.publishButton}
                onPress={uploadVideo}
              >
                <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
                <Text style={styles.publishButtonText}>Опубликовать</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  videoPickerContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  videoPickerButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  videoPickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
  },
  videoPreviewContainer: {
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    height: 280,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  removeVideoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  carPickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedCar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedCarText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  noCarSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noCarSelectedText: {
    fontSize: 15,
    color: '#64748B',
  },
  carList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  carListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  carListItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  carListItemText: {
    fontSize: 15,
    color: '#0F172A',
  },
  previewButton: {
    flexDirection: 'row',
    backgroundColor: '#0066FF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 40,
  },
  // Upload Overlay
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    width: SCREEN_WIDTH - 64,
    alignItems: 'center',
  },
  uploadStatusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 16,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
    textAlign: 'center',
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 16,
    textAlign: 'center',
  },
  successIcon: {
    marginBottom: 8,
  },
  successText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  successHint: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Preview Modal
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  previewModalContent: {
    flex: 1,
  },
  previewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  previewModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewVideoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewVideo: {
    flex: 1,
  },
  previewInfoOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 80,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  previewDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  previewModalFooter: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  previewHint: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 12,
  },
  publishButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
