import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Share,
  Platform,
  StatusBar,
  AppState,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 70;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const VIDEO_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT;

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://safewheels-dev.preview.emergentagent.com';

interface VideoReview {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  carId?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  viewsCount: number;
  likesCount: number;
  likedBy: string[];
  savedBy: string[];
  status: string;
  createdAt: string;
}

// Тестовые видео для демонстрации
const DEMO_VIDEOS: VideoReview[] = [
  {
    _id: '1',
    title: 'Обзор BMW M5 Competition 2024',
    description: '🔥 Полный обзор нового BMW M5 Competition! 625 л.с., разгон до 100 за 3.3 сек. Смотрите детали в этом видео! #BMW #M5 #обзор',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 15,
    authorId: 'demo1',
    authorName: 'AutoExpert',
    viewsCount: 15420,
    likesCount: 892,
    likedBy: [],
    savedBy: [],
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    _id: '2',
    title: 'Mercedes-AMG GT 63 S - тест-драйв',
    description: '🚗 Тестируем Mercedes-AMG GT 63 S на трассе! Невероятная мощь и комфорт в одном автомобиле. #Mercedes #AMG #тестдрайв',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: 15,
    authorId: 'demo2',
    authorName: 'CarReviews TJ',
    viewsCount: 8934,
    likesCount: 567,
    likedBy: [],
    savedBy: [],
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    _id: '3',
    title: 'Audi RS6 Avant - семейный спорткар',
    description: '👨‍👩‍👧‍👦 Audi RS6 Avant - идеальный семейный автомобиль для тех, кто любит скорость! 600+ л.с. и огромный багажник. #Audi #RS6 #семья',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    duration: 60,
    authorId: 'demo3',
    authorName: 'AvtoMir',
    viewsCount: 23100,
    likesCount: 1240,
    likedBy: [],
    savedBy: [],
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    _id: '4',
    title: 'Porsche 911 GT3 на треке',
    description: '🏁 Porsche 911 GT3 - настоящий трек-монстр! Смотрите как он проходит повороты на скорости. #Porsche #911GT3 #трек',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    duration: 15,
    authorId: 'demo4',
    authorName: 'SpeedMaster',
    viewsCount: 45200,
    likesCount: 3420,
    likedBy: [],
    savedBy: [],
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    _id: '5',
    title: 'Toyota Land Cruiser 300 - обзор',
    description: '🌍 Новый Toyota Land Cruiser 300 - король бездорожья! Полный обзор внедорожника мечты. #Toyota #LandCruiser #внедорожник',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    duration: 15,
    authorId: 'demo5',
    authorName: 'OffRoad TJ',
    viewsCount: 67800,
    likesCount: 4521,
    likedBy: [],
    savedBy: [],
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
];

const VideoItem = React.memo(({ 
  item, 
  isActive, 
  onLike, 
  onSave, 
  onShare, 
  onCarPress,
  userId,
}: { 
  item: VideoReview; 
  isActive: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (item: VideoReview) => void;
  onCarPress: (carId: string) => void;
  userId?: string;
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(item.likedBy?.includes(userId || '') || false);
  const [isSaved, setIsSaved] = useState(item.savedBy?.includes(userId || '') || false);
  const [likesCount, setLikesCount] = useState(item.likesCount);
  const [showPlayButton, setShowPlayButton] = useState(false);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.playAsync();
      setIsPlaying(true);
      setShowPlayButton(false);
    } else {
      videoRef.current?.pauseAsync();
      videoRef.current?.setPositionAsync(0);
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
      setIsPlaying(false);
      setShowPlayButton(true);
    } else {
      await videoRef.current?.playAsync();
      setIsPlaying(true);
      setShowPlayButton(false);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike(item._id);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave(item._id);
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <View style={styles.videoContainer}>
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={togglePlay}
        style={styles.videoTouchable}
      >
        <Video
          ref={videoRef}
          source={{ uri: item.videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          shouldPlay={isActive}
          isMuted={false}
          volume={1.0}
        />
        
        {/* Play button overlay */}
        {showPlayButton && (
          <View style={styles.playButtonOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={50} color="#FFFFFF" />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Градиент снизу */}
      <View style={styles.gradient} />

      {/* Информация об авторе и описание */}
      <View style={styles.infoContainer}>
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorInitial}>
              {item.authorName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.authorName}>@{item.authorName}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.statsRow}>
          <Ionicons name="eye-outline" size={14} color="#FFFFFF" />
          <Text style={styles.statsText}>{formatCount(item.viewsCount)} просмотров</Text>
        </View>
      </View>

      {/* Кнопки справа */}
      <View style={styles.actionsContainer}>
        {/* Лайк */}
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={32} 
            color={isLiked ? "#EF4444" : "#FFFFFF"} 
          />
          <Text style={styles.actionText}>{formatCount(likesCount)}</Text>
        </TouchableOpacity>

        {/* Сохранить */}
        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={32} 
            color={isSaved ? "#F59E0B" : "#FFFFFF"} 
          />
          <Text style={styles.actionText}>Сохранить</Text>
        </TouchableOpacity>

        {/* Поделиться */}
        <TouchableOpacity style={styles.actionButton} onPress={() => onShare(item)}>
          <Ionicons name="share-social-outline" size={32} color="#FFFFFF" />
          <Text style={styles.actionText}>Поделиться</Text>
        </TouchableOpacity>

        {/* Перейти к объявлению */}
        {item.carId && (
          <TouchableOpacity style={styles.actionButton} onPress={() => onCarPress(item.carId!)}>
            <Ionicons name="car-sport-outline" size={32} color="#FFFFFF" />
            <Text style={styles.actionText}>Авто</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

export default function ReviewsScreen() {
  const [videos, setVideos] = useState<VideoReview[]>(DEMO_VIDEOS);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const isFocused = useIsFocused(); // Мгновенное отслеживание фокуса
  const [isAppActive, setIsAppActive] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // Остановка видео когда приложение уходит в фон
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setIsAppActive(nextAppState === 'active');
    });

    return () => subscription?.remove();
  }, []);

  // Загрузка видео с сервера
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/videos?status=approved`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setVideos(data);
        }
      }
    } catch (error) {
      // console.log('Using demo videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleLike = async (videoId: string) => {
    if (!user?.phone) return;
    try {
      await fetch(`${API_URL}/api/videos/${videoId}/like?userId=${encodeURIComponent(user.phone)}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleSave = async (videoId: string) => {
    if (!user?.phone) return;
    try {
      await fetch(`${API_URL}/api/videos/${videoId}/save?userId=${encodeURIComponent(user.phone)}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error saving video:', error);
    }
  };

  const handleShare = async (video: VideoReview) => {
    try {
      await Share.share({
        message: `🚗 ${video.title}\n\nСмотрите обзор авто в SafedAuto!\n\n${video.description}`,
        title: video.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCarPress = (carId: string) => {
    router.push(`/car/${carId}`);
  };

  const handleAddVideo = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    router.push('/add-video');
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
      
      // Track view
      const videoId = viewableItems[0].item._id;
      if (videoId && !videoId.startsWith('demo')) {
        fetch(`${API_URL}/api/videos/${videoId}/view`, { method: 'POST' }).catch(() => {});
      }
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (loading && videos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Загрузка видео...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Заголовок */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <Text style={styles.headerTitle}>🎬 Обзоры авто</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddVideo}>
          <Ionicons name="add-circle" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Видео лента */}
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={({ item, index }) => (
          <VideoItem
            item={item}
            isActive={index === activeIndex && isFocused && isAppActive}
            onLike={handleLike}
            onSave={handleSave}
            onShare={handleShare}
            onCarPress={handleCarPress}
            userId={user?.phone}
          />
        )}
        keyExtractor={(item) => item._id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={VIDEO_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: VIDEO_HEIGHT,
          offset: VIDEO_HEIGHT * index,
          index,
        })}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + 8 : 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  addButton: {
    padding: 4,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#0A0A0A',
  },
  videoTouchable: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 80,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  actionsContainer: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
