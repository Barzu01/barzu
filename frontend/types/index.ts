export interface User {
  _id?: string;
  phone: string;
  name?: string;
  isAdmin: boolean;
  favorites: string[];
  createdAt?: string;
}

export interface CarListing {
  _id?: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  engineType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  transmission: 'manual' | 'automatic';
  driveType: 'front' | 'rear' | 'awd';
  condition: 'new' | 'used';
  color: string;
  region: string;
  description: string;
  photos: string[]; // base64 encoded images
  sellerPhone: string;
  sellerId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
  // New fields
  engineVolume?: number;
  bodyType?: string;
  features?: string[];
  isPromoted?: boolean;
  promotedUntil?: string;
  viewsCount?: number;
  priceHistory?: { price: number; date: string }[];
}

export interface SearchFilters {
  brand?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  region?: string;
  engineType?: string;
  transmission?: string;
  condition?: string;
  sortBy?: 'newest' | 'priceAsc' | 'priceDesc';
}

export interface Notification {
  _id?: string;
  userId: string;
  carId: string;
  type: 'approved' | 'rejected';
  message: string;
  isRead: boolean;
  createdAt?: string;
}