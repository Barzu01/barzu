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
  Animated,
  Image,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 70;
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

// Демо видео
const DEMO_VIDEOS: VideoReview[] = [
  {
    _id: '1',
    title: 'Обзор BMW M5 Competition 2024',
    description: '🔥 Полный обзор нового BMW M5! 625 л.с., разгон до 100 за 3.3 сек',
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
    title: 'Mercedes-AMG GT 63 S',
    description: '🚗 Тестируем Mercedes-AMG GT 63 S на трассе!',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: 15,
    authorId: 'demo2',
    authorName: 'CarReviews',
    viewsCount: 8934,
    likesCount: 567,
    likedBy: [],
    savedBy: [],
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    _id: '3',
    title: 'Audi RS6 Avant',
    description: '👨‍👩‍👧‍👦 Идеальный семейный спорткар!',
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
];

const VideoItem = React.memo(({ 
  item, 
  isActive, 
  onLike, 
  onSave, 
  onShare, 
  onCarPress,
  onAuthorPress,
  userId,
}: { 
  item: VideoReview; 
  isActive: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (item: VideoReview) => void;
  onCarPress: (carId: string) => void;
  onAuthorPress: (authorId: string) => void;
  userId?: string;
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(item.likedBy?.includes(userId || '') || false);
  const [isSaved, setIsSaved] = useState(item.savedBy?.includes(userId || '') || false);
  const [likesCount, setLikesCount] = useState(item.likesCount);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const likeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      videoRef.current?.playAsync();
      setIsPlaying(true);
      setShowPlayIcon(false);
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
      setShowPlayIcon(true);
    } else {
      await videoRef.current?.playAsync();
      setIsPlaying(true);
      setShowPlayIcon(false);
    }
  };

  const handleLike = () => {
    // Анимация лайка
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    
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
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={isActive}
          isMuted={false}
          volume={1.0}
        />
        
        {/* Play/Pause Icon */}
        {showPlayIcon && (
          <View style={styles.playIconOverlay}>
            <View style={styles.playIconCircle}>
              <Ionicons name="play" size={40} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Градиент снизу - Instagram style */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Контент слева внизу - Instagram style */}
      <View style={styles.contentContainer}>
        {/* Автор */}
        <TouchableOpacity 
          style={styles.authorContainer}
          onPress={() => onAuthorPress(item.authorId)}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.authorName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.authorName}>{item.authorName}</Text>
          <View style={styles.followButton}>
            <Text style={styles.followText}>Подписаться</Text>
          </View>
        </TouchableOpacity>

        {/* Описание */}
        <Text style={styles.description} numberOfLines={2}>
          {item.title}
        </Text>
        
        {item.description && (
          <Text style={styles.caption} numberOfLines={1}>
            {item.description}
          </Text>
        )}

        {/* Музыка/Звук - как в Instagram */}
        <View style={styles.soundRow}>
          <Ionicons name="musical-notes" size={12} color="#FFFFFF" />
          <Text style={styles.soundText} numberOfLines={1}>
            Оригинальный звук · {item.authorName}
          </Text>
        </View>
      </View>

      {/* Кнопки справа - Instagram style */}
      <View style={styles.actionsColumn}>
        {/* Лайк */}
        <TouchableOpacity style={styles.actionItem} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={28} 
              color={isLiked ? "#FF3B5C" : "#FFFFFF"} 
            />
          </Animated.View>
          <Text style={styles.actionCount}>{formatCount(likesCount)}</Text>
        </TouchableOpacity>

        {/* Комментарии */}
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={26} color="#FFFFFF" />
          <Text style={styles.actionCount}>{formatCount(Math.floor(item.likesCount / 10))}</Text>
        </TouchableOpacity>

        {/* Поделиться */}
        <TouchableOpacity style={styles.actionItem} onPress={() => onShare(item)}>
          <Ionicons name="paper-plane-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Сохранить */}
        <TouchableOpacity style={styles.actionItem} onPress={handleSave}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={26} 
            color={isSaved ? "#FFFFFF" : "#FFFFFF"} 
          />
        </TouchableOpacity>

        {/* Ещё */}
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Аватар автора с музыкой - как в Instagram */}
        <View style={styles.musicDisc}>
          <View style={styles.musicDiscInner}>
            <Text style={styles.musicDiscText}>
              {item.authorName.charAt(0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Привязка к авто (если есть) */}
      {item.carId && (
        <TouchableOpacity 
          style={styles.carBadge}
          onPress={() => onCarPress(item.carId!)}
          activeOpacity={0.8}
        >
          <Ionicons name="car-sport" size={16} color="#FFFFFF" />
          <Text style={styles.carBadgeText}>Смотреть авто</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

export default function ReviewsScreen() {
  const [videos, setVideos] = useState<VideoReview[]>(DEMO_VIDEOS);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setIsAppActive(nextAppState === 'active');
    });
    return () => subscription?.remove();
  }, []);

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
      // Using demo videos
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
    } catch (error) {}
  };

  const handleSave = async (videoId: string) => {
    if (!user?.phone) return;
    try {
      await fetch(`${API_URL}/api/videos/${videoId}/save?userId=${encodeURIComponent(user.phone)}`, {
        method: 'POST',
      });
    } catch (error) {}
  };

  const handleShare = async (video: VideoReview) => {
    try {
      await Share.share({
        message: `🚗 ${video.title}\n\nСмотрите в SafedAuto!`,
        title: video.title,
      });
    } catch (error) {}
  };

  const handleCarPress = (carId: string) => {
    router.push(`/car/${carId}`);
  };

  const handleAuthorPress = (authorId: string) => {
    // TODO: Navigate to author profile
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
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header - Instagram style */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reels</Text>
        <TouchableOpacity style={styles.cameraButton} onPress={handleAddVideo}>
          <Ionicons name="camera-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

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
            onAuthorPress={handleAuthorPress}
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
        getItemLayout={(_, index) => ({
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
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraButton: {
    padding: 4,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000000',
  },
  videoTouchable: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 350,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 80,
    left: 12,
    right: 70,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E1306C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
  },
  followButton: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  followText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    lineHeight: 20,
  },
  caption: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    marginBottom: 10,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  soundText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 6,
    maxWidth: 180,
  },
  actionsColumn: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    alignItems: 'center',
  },
  actionItem: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  musicDisc: {
    width: 35,
    height: 35,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3D3D3D',
    overflow: 'hidden',
    marginTop: 5,
  },
  musicDiscInner: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicDiscText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  carBadge: {
    position: 'absolute',
    bottom: 85,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  carBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});
