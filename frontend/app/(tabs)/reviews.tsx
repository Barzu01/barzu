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
  Modal,
  TextInput,
  KeyboardAvoidingView,
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

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://carmarket-38.preview.emergentagent.com';

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
  commentsCount?: number;
  likedBy: string[];
  savedBy: string[];
  status: string;
  createdAt: string;
  car?: {
    _id: string;
    brand: string;
    model: string;
    price: number;
    photos: string[];
    region: string;
  };
}

interface Comment {
  _id: string;
  videoId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

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
    commentsCount: 45,
    likedBy: [],
    savedBy: [],
    status: 'approved',
    createdAt: '2026-01-08T10:00:00Z',
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
    commentsCount: 23,
    likedBy: [],
    savedBy: [],
    status: 'approved',
    createdAt: '2026-01-07T14:30:00Z',
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
  onCommentPress,
  onFollow,
  onDelete,
  userId,
  isAdmin,
}: { 
  item: VideoReview; 
  isActive: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (item: VideoReview) => void;
  onCarPress: (carId: string) => void;
  onAuthorPress: (authorId: string) => void;
  onCommentPress: (video: VideoReview) => void;
  onFollow: (authorId: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  userId?: string;
  isAdmin?: boolean;
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(item.likedBy?.includes(userId || '') || false);
  const [isSaved, setIsSaved] = useState(item.savedBy?.includes(userId || '') || false);
  const [likesCount, setLikesCount] = useState(item.likesCount);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
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

  const handleFollow = async () => {
    const result = await onFollow(item.authorId);
    setIsFollowing(result);
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.'];
    return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <View style={styles.videoContainer}>
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={togglePlay}
        style={styles.videoTouchable}
      >
        <View style={styles.videoWrapper}>
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
        </View>
        
        {showPlayIcon && (
          <View style={styles.playIconOverlay}>
            <View style={styles.playIconCircle}>
              <Ionicons name="play" size={40} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </View>
          </View>
        )}
      </TouchableOpacity>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Карточка объявления - как в Manzili */}
      {item.car && (
        <TouchableOpacity 
          style={styles.listingCard}
          onPress={() => onCarPress(item.car!._id)}
          activeOpacity={0.9}
        >
          <Image 
            source={{ uri: item.car.photos[0] }} 
            style={styles.listingImage}
          />
          <View style={styles.listingInfo}>
            <View style={styles.listingBadge}>
              <Text style={styles.listingBadgeText}>ПРОДАЖА</Text>
            </View>
            <Text style={styles.listingTitle}>{item.car.brand} {item.car.model}</Text>
            <Text style={styles.listingLocation}>📍 {item.car.region}</Text>
            <View style={styles.listingPriceContainer}>
              <Text style={styles.listingPrice}>{item.car.price.toLocaleString()} с.</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Информация об авторе - спущена ниже */}
      <View style={styles.contentContainer}>
        <TouchableOpacity 
          style={styles.authorContainer}
          onPress={() => onAuthorPress(item.authorId)}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            {item.authorName ? (
              <Text style={styles.avatarText}>
                {item.authorName.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person" size={20} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>{item.authorName}</Text>
              <TouchableOpacity 
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={handleFollow}
              >
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Подписки' : 'Подписаться'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.dateText}>
              {formatDate(item.createdAt)} • {formatCount(item.viewsCount)} просмотров
            </Text>
          </View>
        </TouchableOpacity>

        {/* Описание с кнопкой "Ещё" */}
        <Text style={styles.description} numberOfLines={showFullDescription ? undefined : 1}>
          {item.title}
        </Text>
        
        {item.description && (
          <View>
            <Text style={styles.caption} numberOfLines={showFullDescription ? undefined : 1}>
              {item.description}
            </Text>
            {item.description.length > 50 && !showFullDescription && (
              <TouchableOpacity onPress={() => setShowFullDescription(true)}>
                <Text style={styles.moreBtn}>... ещё</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Кнопки справа - убрана жалоба */}
      <View style={styles.actionsColumn}>
        {/* Лайк */}
        <TouchableOpacity style={styles.actionItem} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={30} 
              color={isLiked ? "#FF3B5C" : "#FFFFFF"} 
            />
          </Animated.View>
          <Text style={styles.actionCount}>{formatCount(likesCount)}</Text>
        </TouchableOpacity>

        {/* Комментарии */}
        <TouchableOpacity style={styles.actionItem} onPress={() => onCommentPress(item)}>
          <Ionicons name="chatbubble-outline" size={28} color="#FFFFFF" />
          <Text style={styles.actionCount}>{formatCount(item.commentsCount || 0)}</Text>
        </TouchableOpacity>

        {/* Сохранить */}
        <TouchableOpacity style={styles.actionItem} onPress={handleSave}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={28} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>

        {/* Поделиться */}
        <TouchableOpacity style={styles.actionItem} onPress={() => onShare(item)}>
          <Ionicons name="arrow-redo-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Удалить (только для автора или админа) */}
        {(userId && (item.authorId === userId || isAdmin)) && (
          <TouchableOpacity style={styles.actionItem} onPress={() => onDelete(item._id)}>
            <Ionicons name="trash-outline" size={28} color="#FF3B30" />
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
  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  
  // Comments modal
  const [showComments, setShowComments] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoReview | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

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
          // Fetch car data for videos with carId
          const videosWithCars = await Promise.all(data.map(async (video: VideoReview) => {
            if (video.carId) {
              try {
                const carResponse = await fetch(`${API_URL}/api/cars/${video.carId}`);
                if (carResponse.ok) {
                  video.car = await carResponse.json();
                }
              } catch {}
            }
            return video;
          }));
          setVideos(videosWithCars);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchComments = async (videoId: string) => {
    try {
      setLoadingComments(true);
      const response = await fetch(`${API_URL}/api/videos/${videoId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch {} finally {
      setLoadingComments(false);
    }
  };

  const handleCommentPress = (video: VideoReview) => {
    setSelectedVideo(video);
    setShowComments(true);
    fetchComments(video._id);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedVideo || !user) return;
    
    try {
      const response = await fetch(
        `${API_URL}/api/videos/${selectedVideo._id}/comments?authorId=${encodeURIComponent(user.phone)}&authorName=${encodeURIComponent(user.name || 'Пользователь')}&text=${encodeURIComponent(newComment)}`,
        { method: 'POST' }
      );
      if (response.ok) {
        const comment = await response.json();
        setComments([comment, ...comments]);
        setNewComment('');
      }
    } catch {}
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user?.phone) return;
    try {
      const response = await fetch(
        `${API_URL}/api/videos/comments/${commentId}?userId=${encodeURIComponent(user.phone)}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        setComments(comments.filter(c => c._id !== commentId));
      }
    } catch {}
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!user?.phone) return;
    try {
      const response = await fetch(
        `${API_URL}/api/videos/${videoId}?userId=${encodeURIComponent(user.phone)}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        setVideos(videos.filter(v => v._id !== videoId));
      }
    } catch {}
  };

  const handleLike = async (videoId: string) => {
    if (!user?.phone) return;
    try {
      await fetch(`${API_URL}/api/videos/${videoId}/like?userId=${encodeURIComponent(user.phone)}`, {
        method: 'POST',
      });
    } catch {}
  };

  const handleSave = async (videoId: string) => {
    if (!user?.phone) return;
    try {
      await fetch(`${API_URL}/api/videos/${videoId}/save?userId=${encodeURIComponent(user.phone)}`, {
        method: 'POST',
      });
    } catch {}
  };

  const handleShare = async (video: VideoReview) => {
    try {
      await Share.share({
        message: `🚗 ${video.title}\n\nСмотрите в SafedAuto!`,
        title: video.title,
      });
    } catch {}
  };

  const handleCarPress = (carId: string) => {
    router.push(`/car/${carId}`);
  };

  const handleAuthorPress = (authorId: string) => {
    router.push(`/profile/user/${authorId}`);
  };

  const handleFollow = async (authorId: string): Promise<boolean> => {
    if (!user?.phone) return false;
    try {
      const response = await fetch(
        `${API_URL}/api/users/${encodeURIComponent(authorId)}/follow?followerId=${encodeURIComponent(user.phone)}`,
        { method: 'POST' }
      );
      if (response.ok) {
        const data = await response.json();
        return data.following;
      }
    } catch {}
    return false;
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
      if (videoId && !videoId.startsWith('demo') && videoId.length === 24) {
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
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Обзоры</Text>
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
            onCommentPress={handleCommentPress}
            onFollow={handleFollow}
            onDelete={handleDeleteVideo}
            userId={user?.phone}
            isAdmin={user?.isAdmin}
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

      {/* Comments Modal */}
      <Modal visible={showComments} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.commentsModal}
        >
          <TouchableOpacity 
            style={styles.commentsBackdrop} 
            onPress={() => setShowComments(false)}
            activeOpacity={1}
          />
          <View style={styles.commentsContainer}>
            <View style={styles.commentsHeader}>
              <View style={styles.commentsHandle} />
              <Text style={styles.commentsTitle}>Комментарии</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      {item.authorName ? (
                        <Text style={styles.commentAvatarText}>
                          {item.authorName.charAt(0).toUpperCase()}
                        </Text>
                      ) : (
                        <Ionicons name="person" size={18} color="#FFFFFF" />
                      )}
                    </View>
                    <View style={styles.commentContent}>
                      <Text style={styles.commentAuthor}>{item.authorName || 'Пользователь'}</Text>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </View>
                    {/* Кнопка удаления для админа или автора */}
                    {(user?.isAdmin || item.authorId === user?.phone) && (
                      <TouchableOpacity 
                        style={styles.deleteCommentBtn}
                        onPress={() => handleDeleteComment(item._id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.noComments}>Пока нет комментариев</Text>
                }
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}

            {user && (
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Написать комментарий..."
                  placeholderTextColor="#999"
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.sendCommentButton, !newComment.trim() && styles.sendCommentButtonDisabled]}
                  onPress={handleSendComment}
                  disabled={!newComment.trim()}
                >
                  <Ionicons 
                    name="send" 
                    size={22} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    // @ts-ignore - for web compatibility
    objectFit: 'contain',
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
    height: 400,
  },
  // Listing card - Manzili style
  listingCard: {
    position: 'absolute',
    bottom: 180,
    left: 12,
    right: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  listingImage: {
    width: 80,
    height: 80,
  },
  listingInfo: {
    flex: 1,
    padding: 10,
  },
  listingBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  listingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  listingLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  listingPriceContainer: {
    marginTop: 4,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066FF',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  // Content - спущен ещё ниже
  contentContainer: {
    position: 'absolute',
    bottom: 50,
    left: 12,
    right: 70,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  authorInfo: {
    marginLeft: 10,
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followBtn: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 4,
  },
  followingBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  followingBtnText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  caption: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
  },
  moreBtn: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  // Actions - спущены ещё ниже
  actionsColumn: {
    position: 'absolute',
    right: 12,
    bottom: 60,
    alignItems: 'center',
  },
  actionItem: {
    alignItems: 'center',
    marginBottom: 18,
  },
  actionCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  // Comments Modal
  commentsModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  commentsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  commentsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  commentsHandle: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  commentItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
    marginLeft: 10,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  commentText: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  noComments: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 14,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FAFAFA',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 80,
  },
  sendButton: {
    marginLeft: 10,
    padding: 8,
  },
  sendCommentButton: {
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendCommentButtonDisabled: {
    backgroundColor: '#CCC',
  },
  deleteCommentBtn: {
    padding: 8,
    marginLeft: 'auto',
  },
});
