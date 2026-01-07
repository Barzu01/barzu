from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
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
    engineType: Literal['petrol', 'diesel', 'electric', 'hybrid']
    transmission: Literal['manual', 'automatic']
    driveType: Literal['front', 'rear', 'awd']
    condition: Literal['new', 'used']
    color: str
    region: str
    description: str
    photos: List[str] = Field(default_factory=list, max_length=10)  # base64 images
    sellerPhone: str
    sellerId: str
    status: Literal['pending', 'approved', 'rejected'] = 'pending'
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class CarListingResponse(CarListing):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True


class Notification(BaseModel):
    userId: str
    carId: str
    type: Literal['approved', 'rejected']
    message: str
    isRead: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class NotificationResponse(Notification):
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


# ===== USER ENDPOINTS =====
@api_router.post("/users", response_model=UserResponse)
async def create_or_get_user(phone: str):
    """Create or get user by phone number"""
    existing_user = await db.users.find_one({"phone": phone})
    if existing_user:
        return serialize_doc(existing_user)
    
    user = User(phone=phone)
    result = await db.users.insert_one(user.model_dump())
    new_user = await db.users.find_one({"_id": result.inserted_id})
    return serialize_doc(new_user)


@api_router.get("/users/{phone}", response_model=UserResponse)
async def get_user(phone: str):
    """Get user by phone"""
    user = await db.users.find_one({"phone": phone})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(user)


@api_router.put("/users/{phone}", response_model=UserResponse)
async def update_user(phone: str, name: Optional[str] = None):
    """Update user profile"""
    update_data = {}
    if name is not None:
        update_data["name"] = name
    
    if update_data:
        await db.users.update_one({"phone": phone}, {"$set": update_data})
    
    user = await db.users.find_one({"phone": phone})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(user)


# ===== CAR LISTING ENDPOINTS =====
@api_router.post("/cars", response_model=CarListingResponse)
async def create_car_listing(car: CarListing):
    """Create new car listing"""
    car_dict = car.model_dump()
    result = await db.cars.insert_one(car_dict)
    new_car = await db.cars.find_one({"_id": result.inserted_id})
    return serialize_doc(new_car)


@api_router.get("/cars", response_model=List[CarListingResponse])
async def get_car_listings(
    status: Optional[str] = 'approved',
    limit: int = 50,
    skip: int = 0
):
    """Get car listings"""
    query = {}
    if status:
        query["status"] = status
    
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
