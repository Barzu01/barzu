from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from bson import ObjectId
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Helper to convert MongoDB _id
def serialize_doc(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc


# ===== BRANDS AND MODELS =====
class CarBrand(BaseModel):
    name: str
    make_id: int
    
class CarModel(BaseModel):
    name: str
    model_id: int
    make_id: int


async def fetch_brands_from_api():
    """Fetch all car brands from NHTSA API"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get("https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json")
            data = response.json()
            brands = []
            for item in data.get('Results', []):
                brands.append({
                    'name': item.get('Make_Name'),
                    'make_id': item.get('Make_ID'),
                })
            return brands
    except Exception as e:
        logging.error(f"Error fetching brands: {e}")
        return []


async def fetch_models_for_brand(make_id: int):
    """Fetch all models for a specific brand"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeId/{make_id}?format=json"
            )
            data = response.json()
            models = []
            for item in data.get('Results', []):
                models.append({
                    'name': item.get('Model_Name'),
                    'model_id': item.get('Model_ID'),
                    'make_id': make_id,
                })
            return models
    except Exception as e:
        logging.error(f"Error fetching models for make {make_id}: {e}")
        return []


@api_router.post("/brands/sync")
async def sync_brands(background_tasks: BackgroundTasks):
    """Sync car brands from NHTSA API"""
    brands = await fetch_brands_from_api()
    if brands:
        # Clear existing brands
        await db.car_brands.delete_many({})
        # Insert new brands
        await db.car_brands.insert_many(brands)
        return {"message": f"Synced {len(brands)} brands", "count": len(brands)}
    return {"message": "No brands fetched", "count": 0}


@api_router.get("/brands")
async def get_brands(search: Optional[str] = None, limit: int = 100):
    """Get all car brands with optional search"""
    query = {}
    if search:
        query['name'] = {'$regex': search, '$options': 'i'}
    
    brands = await db.car_brands.find(query).sort('name', 1).limit(limit).to_list(limit)
    return [{'name': b['name'], 'make_id': b['make_id']} for b in brands]


@api_router.get("/brands/{make_id}/models")
async def get_models_for_brand(make_id: int):
    """Get all models for a specific brand"""
    # Check if models exist in cache
    models = await db.car_models.find({'make_id': make_id}).sort('name', 1).to_list(1000)
    
    if not models:
        # Fetch from API and cache
        models_data = await fetch_models_for_brand(make_id)
        if models_data:
            await db.car_models.insert_many(models_data)
            models = models_data
    
    return [{'name': m['name'], 'model_id': m.get('model_id', 0)} for m in models]


@api_router.get("/models/search")
async def search_models(make_id: int, search: str, limit: int = 50):
    """Search models for a specific brand"""
    query = {
        'make_id': make_id,
        'name': {'$regex': search, '$options': 'i'}
    }
    models = await db.car_models.find(query).sort('name', 1).limit(limit).to_list(limit)
    return [{'name': m['name'], 'model_id': m.get('model_id', 0)} for m in models]


# Define Models
class User(BaseModel):
    phone: str
    name: Optional[str] = None
    isAdmin: bool = False
    favorites: List[str] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(User):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True


class CarListing(BaseModel):
    brand: str
    model: str
    year: int
    price: float
    mileage: int
    engineType: Literal['petrol', 'diesel', 'electric', 'hybrid', 'gas']
    engineVolume: Optional[float] = None  # Объем двигателя в литрах
    transmission: Literal['manual', 'automatic']
    driveType: Literal['front', 'rear', 'awd']
    bodyType: Optional[str] = None  # Тип кузова
    condition: Literal['new', 'used']
    customsCleared: Optional[bool] = True  # Растаможен в РТ
    color: str
    region: str
    category: str = 'cars'
    subcategory: Optional[str] = None  # Подкатегория для запчастей
    description: str
    features: List[str] = Field(default_factory=list)  # Дополнительные опции
    photos: List[str] = Field(default_factory=list, max_length=10)
    sellerPhone: str
    sellerId: str
    status: Literal['pending', 'approved', 'rejected'] = 'pending'
    isPromoted: bool = False  # Продвигаемое объявление
    promotedUntil: Optional[datetime] = None  # До какого времени продвигается
    viewsCount: int = 0  # Количество просмотров
    priceHistory: List[dict] = Field(default_factory=list)  # История изменения цен
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class CarListingResponse(CarListing):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True


# Report model
class Report(BaseModel):
    carId: str
    reporterId: str
    reason: Literal['fake', 'scam', 'inappropriate', 'duplicate', 'other']
    description: Optional[str] = None
    status: Literal['pending', 'reviewed', 'resolved'] = 'pending'
    createdAt: datetime = Field(default_factory=datetime.utcnow)


# Recently viewed model
class RecentlyViewed(BaseModel):
    userId: str
    carId: str
    viewedAt: datetime = Field(default_factory=datetime.utcnow)


class Notification(BaseModel):
    userId: str
    carId: Optional[str] = None
    type: Literal['approved', 'rejected', 'price_drop', 'chat', 'promotion']
    message: str
    isRead: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class NotificationResponse(Notification):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True


# ===== VIDEO REVIEWS =====
class VideoReview(BaseModel):
    title: str
    description: Optional[str] = None
    videoUrl: str  # URL видео в Firebase Storage
    thumbnailUrl: Optional[str] = None  # URL превью
    duration: int = 0  # Длительность в секундах
    carId: Optional[str] = None  # Привязка к объявлению (опционально)
    authorId: str  # ID автора
    authorName: str  # Имя автора
    authorAvatar: Optional[str] = None  # Аватар автора
    viewsCount: int = 0
    likesCount: int = 0
    likedBy: List[str] = Field(default_factory=list)  # Список ID пользователей
    savedBy: List[str] = Field(default_factory=list)  # Избранное
    status: Literal['pending', 'approved', 'rejected'] = 'pending'
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class VideoReviewResponse(VideoReview):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True


class SearchFilters(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    yearFrom: Optional[int] = None
    yearTo: Optional[int] = None
    priceFrom: Optional[float] = None
    priceTo: Optional[float] = None
    mileageFrom: Optional[int] = None
    mileageTo: Optional[int] = None
    region: Optional[str] = None
    engineType: Optional[str] = None
    transmission: Optional[str] = None
    condition: Optional[str] = None
    sortBy: Optional[Literal['newest', 'priceAsc', 'priceDesc']] = 'newest'


# Helper to normalize phone number
def normalize_phone(phone: str) -> str:
    """Normalize phone number - replace spaces with + and clean up"""
    phone = phone.strip()
    # Replace leading space with +
    if phone.startswith(' '):
        phone = '+' + phone[1:]
    # Ensure it starts with +
    if not phone.startswith('+') and phone[0].isdigit():
        phone = '+' + phone
    return phone


# Helper to find user by phone (tries multiple formats)
async def find_user_by_phone(phone: str):
    """Find user by phone, trying different formats"""
    phone = normalize_phone(phone)
    # Try with + first
    user = await db.users.find_one({"phone": phone})
    if user:
        return user
    # Try with space (legacy format)
    phone_with_space = ' ' + phone[1:] if phone.startswith('+') else phone
    user = await db.users.find_one({"phone": phone_with_space})
    if user:
        # Update phone format to use +
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"phone": phone}})
        user["phone"] = phone
        return user
    return None


# ===== USER ENDPOINTS =====
@api_router.post("/users", response_model=UserResponse)
async def create_or_get_user(phone: str):
    """Create or get user by phone number"""
    phone = normalize_phone(phone)
    existing_user = await find_user_by_phone(phone)
    if existing_user:
        return serialize_doc(existing_user)
    
    user = User(phone=phone)
    result = await db.users.insert_one(user.model_dump())
    new_user = await db.users.find_one({"_id": result.inserted_id})
    return serialize_doc(new_user)


@api_router.get("/users/{phone}", response_model=UserResponse)
async def get_user(phone: str):
    """Get user by phone"""
    phone = normalize_phone(phone)
    user = await find_user_by_phone(phone)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(user)


@api_router.put("/users/{phone}", response_model=UserResponse)
async def update_user(phone: str, name: Optional[str] = None):
    """Update user profile"""
    phone = normalize_phone(phone)
    user = await find_user_by_phone(phone)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {}
    if name is not None:
        update_data["name"] = name
    
    if update_data:
        await db.users.update_one({"phone": phone}, {"$set": update_data})
    
    user = await db.users.find_one({"phone": phone})
    return serialize_doc(user)


# ===== CAR LISTING ENDPOINTS =====
@api_router.post("/cars", response_model=CarListingResponse)
async def create_car_listing(car: CarListing):
    """Create new car listing"""
    car_dict = car.model_dump()
    result = await db.cars.insert_one(car_dict)
    new_car = await db.cars.find_one({"_id": result.inserted_id})
    return serialize_doc(new_car)


@api_router.get("/cars/user/{user_id}", response_model=List[CarListingResponse])
async def get_user_car_listings(user_id: str, limit: int = 50, skip: int = 0):
    """Get all car listings for a specific user"""
    cars = await db.cars.find({
        "$or": [
            {"sellerId": user_id},
            {"sellerPhone": user_id}
        ]
    }).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    return [serialize_doc(car) for car in cars]


@api_router.get("/cars", response_model=List[CarListingResponse])
async def get_car_listings(
    status: Optional[str] = 'approved',
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get car listings with optional category/subcategory filter"""
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if subcategory:
        query["subcategory"] = subcategory
    
    cars = await db.cars.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    return [serialize_doc(car) for car in cars]


@api_router.get("/cars/{car_id}", response_model=CarListingResponse)
async def get_car_by_id(car_id: str):
    """Get car by ID"""
    try:
        car = await db.cars.find_one({"_id": ObjectId(car_id)})
        if not car:
            raise HTTPException(status_code=404, detail="Car not found")
        return serialize_doc(car)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid car ID")


@api_router.put("/cars/{car_id}", response_model=CarListingResponse)
async def update_car_listing(car_id: str, car: CarListing):
    """Update car listing"""
    try:
        car_dict = car.model_dump()
        car_dict["updatedAt"] = datetime.utcnow()
        await db.cars.update_one({"_id": ObjectId(car_id)}, {"$set": car_dict})
        updated_car = await db.cars.find_one({"_id": ObjectId(car_id)})
        if not updated_car:
            raise HTTPException(status_code=404, detail="Car not found")
        return serialize_doc(updated_car)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid car ID")


@api_router.delete("/cars/{car_id}")
async def delete_car_listing(car_id: str):
    """Delete car listing"""
    try:
        result = await db.cars.delete_one({"_id": ObjectId(car_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Car not found")
        return {"message": "Car deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid car ID")


@api_router.post("/cars/search", response_model=List[CarListingResponse])
async def search_cars(filters: SearchFilters, limit: int = 50, skip: int = 0):
    """Search cars with filters"""
    query = {"status": "approved"}
    
    if filters.brand:
        query["brand"] = {"$regex": filters.brand, "$options": "i"}
    if filters.model:
        query["model"] = {"$regex": filters.model, "$options": "i"}
    if filters.yearFrom or filters.yearTo:
        query["year"] = {}
        if filters.yearFrom:
            query["year"]["$gte"] = filters.yearFrom
        if filters.yearTo:
            query["year"]["$lte"] = filters.yearTo
    if filters.priceFrom or filters.priceTo:
        query["price"] = {}
        if filters.priceFrom:
            query["price"]["$gte"] = filters.priceFrom
        if filters.priceTo:
            query["price"]["$lte"] = filters.priceTo
    if filters.mileageFrom or filters.mileageTo:
        query["mileage"] = {}
        if filters.mileageFrom:
            query["mileage"]["$gte"] = filters.mileageFrom
        if filters.mileageTo:
            query["mileage"]["$lte"] = filters.mileageTo
    if filters.region:
        query["region"] = filters.region
    if filters.engineType:
        query["engineType"] = filters.engineType
    if filters.transmission:
        query["transmission"] = filters.transmission
    if filters.condition:
        query["condition"] = filters.condition
    
    # Sorting
    sort_field = "createdAt"
    sort_order = -1
    if filters.sortBy == "priceAsc":
        sort_field = "price"
        sort_order = 1
    elif filters.sortBy == "priceDesc":
        sort_field = "price"
        sort_order = -1
    
    cars = await db.cars.find(query).sort(sort_field, sort_order).skip(skip).limit(limit).to_list(limit)
    return [serialize_doc(car) for car in cars]


# ===== FAVORITES ENDPOINTS =====
@api_router.post("/favorites/{phone}/{car_id}")
async def add_to_favorites(phone: str, car_id: str):
    """Add car to favorites"""
    await db.users.update_one(
        {"phone": phone},
        {"$addToSet": {"favorites": car_id}}
    )
    return {"message": "Added to favorites"}


@api_router.delete("/favorites/{phone}/{car_id}")
async def remove_from_favorites(phone: str, car_id: str):
    """Remove car from favorites"""
    await db.users.update_one(
        {"phone": phone},
        {"$pull": {"favorites": car_id}}
    )
    return {"message": "Removed from favorites"}


@api_router.get("/favorites/{phone}", response_model=List[CarListingResponse])
async def get_favorites(phone: str):
    """Get user's favorite cars"""
    user = await db.users.find_one({"phone": phone})
    if not user or not user.get("favorites"):
        return []
    
    favorite_ids = [ObjectId(fav_id) for fav_id in user["favorites"] if ObjectId.is_valid(fav_id)]
    cars = await db.cars.find({"_id": {"$in": favorite_ids}}).to_list(100)
    return [serialize_doc(car) for car in cars]


# ===== MY LISTINGS =====
@api_router.get("/my-listings/{phone}", response_model=List[CarListingResponse])
async def get_my_listings(phone: str):
    """Get user's car listings"""
    cars = await db.cars.find({"sellerPhone": phone}).sort("createdAt", -1).to_list(100)
    return [serialize_doc(car) for car in cars]


# ===== ADMIN ENDPOINTS =====
@api_router.get("/admin/cars/pending", response_model=List[CarListingResponse])
async def get_pending_cars():
    """Get pending car listings for moderation"""
    cars = await db.cars.find({"status": "pending"}).sort("createdAt", -1).to_list(100)
    return [serialize_doc(car) for car in cars]


@api_router.put("/admin/cars/{car_id}/approve")
async def approve_car(car_id: str):
    """Approve car listing"""
    try:
        car = await db.cars.find_one({"_id": ObjectId(car_id)})
        if not car:
            raise HTTPException(status_code=404, detail="Car not found")
            
        await db.cars.update_one(
            {"_id": ObjectId(car_id)},
            {"$set": {"status": "approved", "updatedAt": datetime.utcnow()}}
        )
        
        # Create notification
        notification = Notification(
            userId=car["sellerId"],
            carId=car_id,
            type="approved",
            message=f"Ваше объявление {car['brand']} {car['model']} одобрено!"
        )
        await db.notifications.insert_one(notification.model_dump())
        
        return {"message": "Car approved"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid car ID")


@api_router.put("/admin/cars/{car_id}/reject")
async def reject_car(car_id: str):
    """Reject car listing"""
    try:
        car = await db.cars.find_one({"_id": ObjectId(car_id)})
        if not car:
            raise HTTPException(status_code=404, detail="Car not found")
            
        await db.cars.update_one(
            {"_id": ObjectId(car_id)},
            {"$set": {"status": "rejected", "updatedAt": datetime.utcnow()}}
        )
        
        # Create notification
        notification = Notification(
            userId=car["sellerId"],
            carId=car_id,
            type="rejected",
            message=f"Ваше объявление {car['brand']} {car['model']} отклонено"
        )
        await db.notifications.insert_one(notification.model_dump())
        
        return {"message": "Car rejected"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid car ID")


@api_router.put("/admin/users/{phone}/block")
async def block_user(phone: str):
    """Block user"""
    await db.users.update_one({"phone": phone}, {"$set": {"isBlocked": True}})
    # Also reject all their listings
    await db.cars.update_many({"sellerPhone": phone}, {"$set": {"status": "rejected"}})
    return {"message": "User blocked"}


@api_router.get("/admin/stats")
async def get_admin_stats():
    """Get admin statistics"""
    total_cars = await db.cars.count_documents({})
    approved_cars = await db.cars.count_documents({"status": "approved"})
    pending_cars = await db.cars.count_documents({"status": "pending"})
    total_users = await db.users.count_documents({})
    
    return {
        "totalCars": total_cars,
        "approvedCars": approved_cars,
        "pendingCars": pending_cars,
        "totalUsers": total_users
    }


# ===== NOTIFICATIONS ENDPOINTS =====
@api_router.get("/notifications/{user_id}", response_model=List[NotificationResponse])
async def get_notifications(user_id: str):
    """Get user notifications"""
    notifications = await db.notifications.find({"userId": user_id}).sort("createdAt", -1).to_list(100)
    return [serialize_doc(notif) for notif in notifications]


@api_router.get("/notifications/{user_id}/unread-count")
async def get_unread_count(user_id: str):
    """Get unread notifications count"""
    count = await db.notifications.count_documents({"userId": user_id, "isRead": False})
    return {"count": count}


@api_router.put("/notifications/{notification_id}/read")
async def mark_as_read(notification_id: str):
    """Mark notification as read"""
    try:
        await db.notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"isRead": True}}
        )
        return {"message": "Marked as read"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid notification ID")


@api_router.put("/notifications/{user_id}/read-all")
async def mark_all_as_read(user_id: str):
    """Mark all user notifications as read"""
    await db.notifications.update_many(
        {"userId": user_id},
        {"$set": {"isRead": True}}
    )
    return {"message": "All notifications marked as read"}


# Health check
@api_router.get("/")
async def root():
    return {"message": "SafedAuto API", "version": "1.0.0"}


# ===== CHAT MODELS =====
class ChatMessage(BaseModel):
    chatId: str
    senderId: str
    receiverId: str
    message: str
    carId: Optional[str] = None
    carTitle: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    isRead: bool = False

class ChatMessageResponse(ChatMessage):
    id: Optional[str] = Field(alias='_id')

class Chat(BaseModel):
    participants: List[str]  # [senderId, receiverId]
    carId: Optional[str] = None
    carTitle: Optional[str] = None
    lastMessage: Optional[str] = None
    lastMessageAt: datetime = Field(default_factory=datetime.utcnow)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ChatResponse(Chat):
    id: Optional[str] = Field(alias='_id')


# ===== CHAT ENDPOINTS =====
@api_router.get("/chats/{user_id}")
async def get_user_chats(user_id: str):
    """Get all chats for a user"""
    chats = await db.chats.find({
        "participants": user_id
    }).sort("lastMessageAt", -1).to_list(100)
    
    result = []
    for chat in chats:
        chat_data = serialize_doc(chat)
        # Get other participant info
        other_user_id = [p for p in chat['participants'] if p != user_id][0] if len(chat['participants']) > 1 else None
        if other_user_id:
            other_user = await db.users.find_one({"phone": other_user_id})
            if other_user:
                chat_data['otherUserName'] = other_user.get('name', 'Пользователь')
                chat_data['otherUserPhone'] = other_user.get('phone')
        
        # Get unread count
        unread_count = await db.chat_messages.count_documents({
            "chatId": str(chat['_id']),
            "receiverId": user_id,
            "isRead": False
        })
        chat_data['unreadCount'] = unread_count
        result.append(chat_data)
    
    return result


@api_router.post("/chats")
async def create_or_get_chat(
    senderId: str,
    receiverId: str,
    carId: Optional[str] = None,
    carTitle: Optional[str] = None
):
    """Create a new chat or get existing one"""
    # Check if chat already exists
    existing_chat = await db.chats.find_one({
        "participants": {"$all": [senderId, receiverId]},
        "carId": carId
    })
    
    if existing_chat:
        return serialize_doc(existing_chat)
    
    # Create new chat
    chat = Chat(
        participants=[senderId, receiverId],
        carId=carId,
        carTitle=carTitle
    )
    result = await db.chats.insert_one(chat.model_dump())
    new_chat = await db.chats.find_one({"_id": result.inserted_id})
    return serialize_doc(new_chat)


@api_router.get("/chats/{chat_id}/messages")
async def get_chat_messages(chat_id: str, limit: int = 50, skip: int = 0):
    """Get messages for a chat"""
    messages = await db.chat_messages.find({
        "chatId": chat_id
    }).sort("createdAt", 1).skip(skip).limit(limit).to_list(limit)
    return [serialize_doc(msg) for msg in messages]


@api_router.post("/chats/{chat_id}/messages")
async def send_message(
    chat_id: str,
    senderId: str,
    receiverId: str,
    message: str,
    carId: Optional[str] = None,
    carTitle: Optional[str] = None
):
    """Send a message"""
    chat_message = ChatMessage(
        chatId=chat_id,
        senderId=senderId,
        receiverId=receiverId,
        message=message,
        carId=carId,
        carTitle=carTitle
    )
    result = await db.chat_messages.insert_one(chat_message.model_dump())
    
    # Update chat's last message
    await db.chats.update_one(
        {"_id": ObjectId(chat_id)},
        {
            "$set": {
                "lastMessage": message,
                "lastMessageAt": datetime.utcnow()
            }
        }
    )
    
    # Create simple notification for receiver (without carId/type requirement)
    chat_notification = {
        "userId": receiverId,
        "message": f"Новое сообщение: {message[:50]}...",
        "isRead": False,
        "createdAt": datetime.utcnow(),
        "type": "chat"
    }
    await db.notifications.insert_one(chat_notification)
    
    new_message = await db.chat_messages.find_one({"_id": result.inserted_id})
    return serialize_doc(new_message)


@api_router.put("/chats/{chat_id}/read")
async def mark_messages_as_read(chat_id: str, user_id: str):
    """Mark all messages as read for a user in a chat"""
    await db.chat_messages.update_many(
        {"chatId": chat_id, "receiverId": user_id, "isRead": False},
        {"$set": {"isRead": True}}
    )
    return {"message": "Messages marked as read"}


@api_router.get("/chats/unread-count/{user_id}")
async def get_unread_messages_count(user_id: str):
    """Get total unread messages count for a user"""
    count = await db.chat_messages.count_documents({
        "receiverId": user_id,
        "isRead": False
    })
    return {"count": count}


# ===== ADMIN ENDPOINTS =====
@api_router.get("/admin/cars/pending")
async def get_pending_cars(limit: int = 50, skip: int = 0):
    """Get all cars pending moderation"""
    cars = await db.cars.find({"status": "pending"}).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    return [serialize_doc(car) for car in cars]


@api_router.get("/admin/cars/all")
async def get_all_cars_admin(status: Optional[str] = None, limit: int = 50, skip: int = 0):
    """Get all cars for admin"""
    query = {}
    if status:
        query["status"] = status
    cars = await db.cars.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    return [serialize_doc(car) for car in cars]


@api_router.put("/admin/cars/{car_id}/approve")
async def approve_car(car_id: str):
    """Approve a car listing"""
    car = await db.cars.find_one({"_id": ObjectId(car_id)})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    await db.cars.update_one(
        {"_id": ObjectId(car_id)},
        {"$set": {"status": "approved", "updatedAt": datetime.utcnow()}}
    )
    
    # Create notification for seller
    notification = {
        "userId": car.get("sellerId") or car.get("sellerPhone"),
        "carId": car_id,
        "type": "approved",
        "message": f"Ваше объявление «{car['brand']} {car['model']}» одобрено и опубликовано!",
        "isRead": False,
        "createdAt": datetime.utcnow()
    }
    await db.notifications.insert_one(notification)
    
    return {"message": "Car approved", "carId": car_id}


@api_router.put("/admin/cars/{car_id}/reject")
async def reject_car(car_id: str, reason: str = "Не соответствует правилам"):
    """Reject a car listing"""
    car = await db.cars.find_one({"_id": ObjectId(car_id)})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    await db.cars.update_one(
        {"_id": ObjectId(car_id)},
        {"$set": {"status": "rejected", "rejectReason": reason, "updatedAt": datetime.utcnow()}}
    )
    
    # Create notification for seller
    notification = {
        "userId": car.get("sellerId") or car.get("sellerPhone"),
        "carId": car_id,
        "type": "rejected",
        "message": f"Ваше объявление «{car['brand']} {car['model']}» отклонено. Причина: {reason}",
        "isRead": False,
        "createdAt": datetime.utcnow()
    }
    await db.notifications.insert_one(notification)
    
    return {"message": "Car rejected", "carId": car_id}


@api_router.get("/admin/stats")
async def get_admin_stats():
    """Get statistics for admin dashboard"""
    total_cars = await db.cars.count_documents({})
    pending_cars = await db.cars.count_documents({"status": "pending"})
    approved_cars = await db.cars.count_documents({"status": "approved"})
    rejected_cars = await db.cars.count_documents({"status": "rejected"})
    total_users = await db.users.count_documents({})
    pending_reports = await db.reports.count_documents({"status": "pending"})
    
    return {
        "totalCars": total_cars,
        "pendingCars": pending_cars,
        "approvedCars": approved_cars,
        "rejectedCars": rejected_cars,
        "totalUsers": total_users,
        "pendingReports": pending_reports
    }


# ===== ADVANCED SEARCH =====
@api_router.post("/cars/search/advanced")
async def advanced_search(filters: SearchFilters, limit: int = 50, skip: int = 0):
    """Advanced search with multiple filters"""
    query = {"status": "approved"}
    
    if filters.brand:
        query["brand"] = {"$regex": filters.brand, "$options": "i"}
    if filters.model:
        query["model"] = {"$regex": filters.model, "$options": "i"}
    if filters.yearFrom:
        query["year"] = {"$gte": filters.yearFrom}
    if filters.yearTo:
        query.setdefault("year", {})["$lte"] = filters.yearTo
    if filters.priceFrom:
        query["price"] = {"$gte": filters.priceFrom}
    if filters.priceTo:
        query.setdefault("price", {})["$lte"] = filters.priceTo
    if filters.mileageFrom:
        query["mileage"] = {"$gte": filters.mileageFrom}
    if filters.mileageTo:
        query.setdefault("mileage", {})["$lte"] = filters.mileageTo
    if filters.region:
        query["region"] = filters.region
    if filters.engineType:
        query["engineType"] = filters.engineType
    if filters.transmission:
        query["transmission"] = filters.transmission
    if filters.condition:
        query["condition"] = filters.condition
    
    # Sorting
    sort_field = [("isPromoted", -1)]  # Promoted cars first
    if filters.sortBy == "newest":
        sort_field.append(("createdAt", -1))
    elif filters.sortBy == "priceAsc":
        sort_field.append(("price", 1))
    elif filters.sortBy == "priceDesc":
        sort_field.append(("price", -1))
    
    cars = await db.cars.find(query).sort(sort_field).skip(skip).limit(limit).to_list(limit)
    total = await db.cars.count_documents(query)
    
    return {"cars": [serialize_doc(car) for car in cars], "total": total}


# ===== REPORTS =====
@api_router.post("/reports")
async def create_report(carId: str, reporterId: str, reason: str, description: Optional[str] = None):
    """Create a report for a car listing"""
    report = Report(
        carId=carId,
        reporterId=reporterId,
        reason=reason,
        description=description
    )
    result = await db.reports.insert_one(report.model_dump())
    return {"message": "Report submitted", "reportId": str(result.inserted_id)}


@api_router.get("/admin/reports")
async def get_reports(status: str = "pending", limit: int = 50, skip: int = 0):
    """Get all reports for admin"""
    reports = await db.reports.find({"status": status}).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    return [serialize_doc(report) for report in reports]


@api_router.put("/admin/reports/{report_id}/resolve")
async def resolve_report(report_id: str, action: str = "resolved"):
    """Resolve a report"""
    await db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"status": action}}
    )
    return {"message": "Report resolved"}


# ===== RECENTLY VIEWED =====
@api_router.post("/recently-viewed")
async def add_recently_viewed(userId: str, carId: str):
    """Add a car to recently viewed"""
    # Remove old entry if exists
    await db.recently_viewed.delete_one({"userId": userId, "carId": carId})
    
    # Add new entry
    viewed = RecentlyViewed(userId=userId, carId=carId)
    await db.recently_viewed.insert_one(viewed.model_dump())
    
    # Keep only last 20 items
    count = await db.recently_viewed.count_documents({"userId": userId})
    if count > 20:
        oldest = await db.recently_viewed.find({"userId": userId}).sort("viewedAt", 1).limit(count - 20).to_list(count - 20)
        for item in oldest:
            await db.recently_viewed.delete_one({"_id": item["_id"]})
    
    return {"message": "Added to recently viewed"}


@api_router.get("/recently-viewed/{user_id}")
async def get_recently_viewed(user_id: str, limit: int = 20):
    """Get recently viewed cars for a user"""
    viewed_items = await db.recently_viewed.find({"userId": user_id}).sort("viewedAt", -1).limit(limit).to_list(limit)
    
    cars = []
    for item in viewed_items:
        car = await db.cars.find_one({"_id": ObjectId(item["carId"]), "status": "approved"})
        if car:
            cars.append(serialize_doc(car))
    
    return cars


# ===== PROMOTION =====
@api_router.post("/cars/{car_id}/promote")
async def promote_car(car_id: str, days: int = 7):
    """Promote a car listing"""
    car = await db.cars.find_one({"_id": ObjectId(car_id)})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    promoted_until = datetime.utcnow() + timedelta(days=days)
    
    await db.cars.update_one(
        {"_id": ObjectId(car_id)},
        {"$set": {"isPromoted": True, "promotedUntil": promoted_until}}
    )
    
    return {"message": f"Car promoted for {days} days", "promotedUntil": promoted_until}


@api_router.get("/cars/promoted")
async def get_promoted_cars(limit: int = 10):
    """Get promoted cars"""
    cars = await db.cars.find({
        "status": "approved",
        "isPromoted": True,
        "promotedUntil": {"$gte": datetime.utcnow()}
    }).sort("promotedUntil", -1).limit(limit).to_list(limit)
    return [serialize_doc(car) for car in cars]


# ===== PRICE HISTORY =====
@api_router.get("/cars/{car_id}/price-history")
async def get_price_history(car_id: str):
    """Get price history for a car"""
    car = await db.cars.find_one({"_id": ObjectId(car_id)})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    return car.get("priceHistory", [])


# ===== VIEW TRACKING =====
@api_router.post("/cars/{car_id}/view")
async def track_car_view(car_id: str, userId: Optional[str] = None):
    """Track a view on a car listing"""
    await db.cars.update_one(
        {"_id": ObjectId(car_id)},
        {"$inc": {"viewsCount": 1}}
    )
    
    # Add to recently viewed if user is logged in
    if userId:
        await add_recently_viewed(userId, car_id)
    
    return {"message": "View tracked"}


# Import timedelta for promotions
from datetime import timedelta


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
