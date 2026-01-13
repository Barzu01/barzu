import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../config/firebase';

const storage = getStorage(app);

/**
 * Загрузка изображения в Firebase Storage
 * @param uri - URI изображения (base64 или file://)
 * @param path - Путь в Storage (например: 'cars/123/photo1.jpg')
 * @returns URL загруженного изображения
 */
export const uploadImage = async (uri: string, path: string): Promise<string> => {
  try {
    console.log('Uploading image to:', path);
    
    // Создаём ссылку на файл в Storage
    const storageRef = ref(storage, path);
    
    let blob: Blob;
    
    // Проверяем, это base64 или URI
    if (uri.startsWith('data:')) {
      // Base64 строка
      const response = await fetch(uri);
      blob = await response.blob();
    } else if (uri.startsWith('http')) {
      // URL изображения
      const response = await fetch(uri);
      blob = await response.blob();
    } else {
      // File URI (для мобильных)
      const response = await fetch(uri);
      blob = await response.blob();
    }
    
    // Загружаем файл
    const snapshot = await uploadBytes(storageRef, blob);
    console.log('Upload successful:', snapshot.metadata.fullPath);
    
    // Получаем URL для скачивания
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Загрузка нескольких изображений
 * @param uris - Массив URI изображений
 * @param basePath - Базовый путь (например: 'cars/123')
 * @returns Массив URL загруженных изображений
 */
export const uploadMultipleImages = async (uris: string[], basePath: string): Promise<string[]> => {
  const uploadPromises = uris.map((uri, index) => {
    const fileName = `photo_${Date.now()}_${index}.jpg`;
    const path = `${basePath}/${fileName}`;
    return uploadImage(uri, path);
  });
  
  return Promise.all(uploadPromises);
};

/**
 * Генерирует уникальный путь для фото автомобиля
 */
export const generateCarPhotoPath = (carId: string, index: number): string => {
  const timestamp = Date.now();
  return `cars/${carId}/photo_${timestamp}_${index}.jpg`;
};
