import React, { useState, useEffect } from 'react';
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
  Image,
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

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://safedauto-2.preview.emergentagent.com';
const MAX_DURATION = 120; // 2 минуты в секундах

interface CarListing {
  _id: string;
  brand: string;
  model: string;
  year: number;
}

export default function AddVideoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [myListings, setMyListings] = useState<CarListing[]>([]);
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    }
  };

  const uploadVideo = async () => {
    if (!videoUri) {
      Alert.alert('Ошибка', 'Выберите видео');
      return;
    }
    
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Введите название');
      return;
    }

    if (!user?.phone) {
      Alert.alert('Ошибка', 'Необходимо авторизоваться');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let finalVideoUrl = '';
      
      // Загружаем в Firebase Storage
      const response = await fetch(videoUri);
      const blob = await response.blob();
      
      const cleanPhone = user.phone.replace(/\+/g, '');
      const filename = `videos/${cleanPhone}/${Date.now()}.mp4`;
      const storageRef = ref(storage, filename);
      
      console.log('Starting upload to Firebase Storage:', filename);
      
      const uploadTask = uploadBytesResumable(storageRef, blob);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot: any) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload progress:', progress);
            setUploadProgress(progress * 0.9); // 90% для загрузки
          },
          (error: any) => {
            console.error('Firebase upload error:', error);
            reject(error);
          },
          async () => {
            try {
              finalVideoUrl = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Video uploaded, URL:', finalVideoUrl);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        );
      });
      
      if (!finalVideoUrl) {
        throw new Error('Failed to get video URL');
      }
      
      setUploadProgress(95);
      
      // Сохраняем метаданные в базу
      const videoData = {
        title: title.trim(),
        description: description.trim(),
        videoUrl: finalVideoUrl,
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

      console.log('Saving video metadata:', videoData);

      const apiResponse = await fetch(`${API_URL}/api/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData),
      });

      setUploadProgress(100);

      if (apiResponse.ok) {
        Alert.alert(
          '✅ Успешно!', 
          'Видео опубликовано! Оно появится в разделе "Обзоры авто".',
          [{ text: 'OK', onPress: () => router.push('/(tabs)/reviews') }]
        );
      } else {
        throw new Error('Failed to save video metadata');
      }
      
      setUploading(false);
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить видео. Попробуйте снова.');
      setUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedCar = myListings.find(car => car._id === selectedCarId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новый видео-обзор</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📹 Видео</Text>
          
          {!videoUri ? (
            <View style={styles.videoPickerContainer}>
              <TouchableOpacity style={styles.videoPickerButton} onPress={pickVideo}>
                <Ionicons name="images-outline" size={32} color="#0066FF" />
                <Text style={styles.videoPickerText}>Выбрать из галереи</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.videoPickerButton} onPress={recordVideo}>
                <Ionicons name="videocam-outline" size={32} color="#EF4444" />
                <Text style={styles.videoPickerText}>Записать видео</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.videoPreview}>
              <Video
                source={{ uri: videoUri }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isLooping={false}
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
            Максимальная длительность: {MAX_DURATION / 60} минуты
          </Text>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✏️ Название</Text>
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
          <Text style={styles.hint}>
            Если видео связано с вашим объявлением, покупатели смогут перейти к нему
          </Text>
          
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
                <Text style={styles.noCarSelectedText}>Выбрать объявление (необязательно)</Text>
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

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.uploadButton, (!videoUri || !title.trim()) && styles.uploadButtonDisabled]}
          onPress={uploadVideo}
          disabled={!videoUri || !title.trim() || uploading}
        >
          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>
                Загрузка {Math.round(uploadProgress)}%
              </Text>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>Опубликовать видео</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    textAlign: 'center',
  },
  videoPreview: {
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
  },
  video: {
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
    marginTop: 8,
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
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#0066FF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  uploadButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomPadding: {
    height: 40,
  },
});
