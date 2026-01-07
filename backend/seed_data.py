"""
Seed data script for SafedAuto application
Creates test users and car listings for development
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Test users
test_users = [
    {
        "phone": "+992900123456",
        "name": "Алишер Рахимов",
        "isAdmin": True,
        "favorites": [],
        "createdAt": datetime.utcnow()
    },
    {
        "phone": "+992901234567",
        "name": "Фарход Саидов",
        "isAdmin": False,
        "favorites": [],
        "createdAt": datetime.utcnow()
    }
]

# Test car listings
test_cars = [
    {
        "brand": "Toyota",
        "model": "Camry",
        "year": 2020,
        "price": 85000,
        "mileage": 45000,
        "engineType": "petrol",
        "transmission": "automatic",
        "driveType": "front",
        "condition": "used",
        "color": "Черный",
        "region": "dushanbe",
        "description": "Отличное состояние, один владелец, полная комплектация. Обслуживание только у официального дилера.",
        "photos": [],
        "sellerPhone": "+992900123456",
        "sellerId": "user1",
        "status": "approved",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    },
    {
        "brand": "Honda",
        "model": "Accord",
        "year": 2019,
        "price": 72000,
        "mileage": 60000,
        "engineType": "hybrid",
        "transmission": "automatic",
        "driveType": "front",
        "condition": "used",
        "color": "Серый",
        "region": "khujand",
        "description": "Гибридный двигатель, экономичный расход топлива. В отличном состоянии, все документы в порядке.",
        "photos": [],
        "sellerPhone": "+992901234567",
        "sellerId": "user2",
        "status": "approved",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    },
    {
        "brand": "Mercedes-Benz",
        "model": "E-Class",
        "year": 2021,
        "price": 180000,
        "mileage": 25000,
        "engineType": "diesel",
        "transmission": "automatic",
        "driveType": "rear",
        "condition": "used",
        "color": "Белый",
        "region": "dushanbe",
        "description": "Премиум седан в идеальном состоянии. Полная комплектация AMG пакет, панорамная крыша.",
        "photos": [],
        "sellerPhone": "+992900123456",
        "sellerId": "user1",
        "status": "approved",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    },
    {
        "brand": "BMW",
        "model": "X5",
        "year": 2022,
        "price": 220000,
        "mileage": 15000,
        "engineType": "petrol",
        "transmission": "automatic",
        "driveType": "awd",
        "condition": "used",
        "color": "Синий",
        "region": "dushanbe",
        "description": "Премиальный кроссовер с полным приводом. Максимальная комплектация, все опции.",
        "photos": [],
        "sellerPhone": "+992901234567",
        "sellerId": "user2",
        "status": "approved",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    },
    {
        "brand": "Hyundai",
        "model": "Sonata",
        "year": 2018,
        "price": 52000,
        "mileage": 80000,
        "engineType": "petrol",
        "transmission": "manual",
        "driveType": "front",
        "condition": "used",
        "color": "Серебристый",
        "region": "kulob",
        "description": "Надежный седан в хорошем состоянии. Регулярное ТО, не битый, не крашенный.",
        "photos": [],
        "sellerPhone": "+992900123456",
        "sellerId": "user1",
        "status": "approved",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    },
    {
        "brand": "Lada",
        "model": "Vesta",
        "year": 2023,
        "price": 38000,
        "mileage": 5000,
        "engineType": "petrol",
        "transmission": "manual",
        "driveType": "front",
        "condition": "new",
        "color": "Красный",
        "region": "qurghonteppa",
        "description": "Новый автомобиль, под заказ. Возможна рассрочка. Гарантия производителя 3 года.",
        "photos": [],
        "sellerPhone": "+992901234567",
        "sellerId": "user2",
        "status": "pending",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
]

async def seed_database():
    print("🌱 Seeding database...")
    
    # Clear existing data
    print("Clearing existing data...")
    await db.users.delete_many({})
    await db.cars.delete_many({})
    
    # Insert test users
    print(f"Inserting {len(test_users)} test users...")
    await db.users.insert_many(test_users)
    
    # Insert test cars
    print(f"Inserting {len(test_cars)} test car listings...")
    await db.cars.insert_many(test_cars)
    
    # Verify data
    user_count = await db.users.count_documents({})
    car_count = await db.cars.count_documents({})
    
    print(f"✅ Database seeded successfully!")
    print(f"   - Users: {user_count}")
    print(f"   - Cars: {car_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
