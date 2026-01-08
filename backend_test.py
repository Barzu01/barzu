#!/usr/bin/env python3
"""
SafedAuto Backend API Testing Suite
Tests all endpoints for the SafedAuto car marketplace application
"""

import requests
import json
import base64
from datetime import datetime
import sys
import os
from urllib.parse import quote

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=')[1].strip()
    except:
        pass
    return "https://autotrader-tajik.preview.emergentagent.com"

BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"

# Test data for Tajikistan
TEST_PHONE = "+992900123456"
TEST_PHONE_2 = "+992935987654"
TEST_USER_NAME = "Алишер Рахимов"

# Sample base64 image (small 1x1 pixel PNG)
SAMPLE_IMAGE_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Test car data for Tajikistan market
TEST_CAR_DATA = {
    "brand": "Toyota",
    "model": "Camry",
    "year": 2020,
    "price": 45000.0,  # TJS
    "mileage": 35000,
    "engineType": "petrol",
    "transmission": "automatic",
    "driveType": "front",
    "condition": "used",
    "color": "белый",
    "region": "dushanbe",
    "description": "Отличное состояние, один владелец, полная комплектация",
    "photos": [SAMPLE_IMAGE_B64, SAMPLE_IMAGE_B64],
    "sellerPhone": TEST_PHONE,
    "sellerId": "user123"
}

class SafedAutoAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.created_car_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_health_check(self):
        """Test API health check"""
        try:
            response = self.session.get(f"{API_BASE}/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json()}"
            self.log_test("Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False
    
    def test_create_user(self):
        """Test user creation/retrieval"""
        try:
            # Test creating user
            response = self.session.post(f"{API_BASE}/users?phone={TEST_PHONE}")
            success = response.status_code == 200
            
            if success:
                user_data = response.json()
                phone_from_response = user_data.get("phone", "")
                success = phone_from_response == TEST_PHONE
                details = f"Created user: {phone_from_response}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Create User", success, details)
            return success
        except Exception as e:
            self.log_test("Create User", False, str(e))
            return False
    
    def test_get_user(self):
        """Test getting user by phone"""
        try:
            encoded_phone = quote(TEST_PHONE, safe='')
            response = self.session.get(f"{API_BASE}/users/{encoded_phone}")
            success = response.status_code == 200
            
            if success:
                user_data = response.json()
                success = user_data.get("phone") == TEST_PHONE
                details = f"Retrieved user: {user_data.get('phone')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Get User", success, details)
            return success
        except Exception as e:
            self.log_test("Get User", False, str(e))
            return False
    
    def test_update_user(self):
        """Test updating user profile"""
        try:
            encoded_phone = quote(TEST_PHONE, safe='')
            encoded_name = quote(TEST_USER_NAME, safe='')
            response = self.session.put(f"{API_BASE}/users/{encoded_phone}?name={encoded_name}")
            success = response.status_code == 200
            
            if success:
                user_data = response.json()
                success = user_data.get("name") == TEST_USER_NAME
                details = f"Updated user name: {user_data.get('name')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Update User", success, details)
            return success
        except Exception as e:
            self.log_test("Update User", False, str(e))
            return False
    
    def test_create_car_listing(self):
        """Test creating car listing"""
        try:
            response = self.session.post(
                f"{API_BASE}/cars",
                json=TEST_CAR_DATA,
                headers={"Content-Type": "application/json"}
            )
            success = response.status_code == 200
            
            if success:
                car_data = response.json()
                self.created_car_id = car_data.get("_id")
                success = car_data.get("brand") == TEST_CAR_DATA["brand"]
                details = f"Created car: {car_data.get('brand')} {car_data.get('model')}, ID: {self.created_car_id}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Create Car Listing", success, details)
            return success
        except Exception as e:
            self.log_test("Create Car Listing", False, str(e))
            return False
    
    def test_get_car_listings(self):
        """Test getting car listings"""
        try:
            # Test getting all cars (should include pending by default)
            response = self.session.get(f"{API_BASE}/cars?status=pending")
            success = response.status_code == 200
            
            if success:
                cars = response.json()
                success = isinstance(cars, list)
                details = f"Retrieved {len(cars)} car listings"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Get Car Listings", success, details)
            return success
        except Exception as e:
            self.log_test("Get Car Listings", False, str(e))
            return False
    
    def test_get_car_by_id(self):
        """Test getting specific car by ID"""
        if not self.created_car_id:
            self.log_test("Get Car by ID", False, "No car ID available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/cars/{self.created_car_id}")
            success = response.status_code == 200
            
            if success:
                car_data = response.json()
                success = car_data.get("_id") == self.created_car_id
                details = f"Retrieved car: {car_data.get('brand')} {car_data.get('model')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Get Car by ID", success, details)
            return success
        except Exception as e:
            self.log_test("Get Car by ID", False, str(e))
            return False
    
    def test_search_cars(self):
        """Test car search with filters"""
        try:
            search_filters = {
                "brand": "Toyota",
                "region": "dushanbe",
                "priceFrom": 30000,
                "priceTo": 60000,
                "sortBy": "newest"
            }
            
            response = self.session.post(
                f"{API_BASE}/cars/search",
                json=search_filters,
                headers={"Content-Type": "application/json"}
            )
            success = response.status_code == 200
            
            if success:
                cars = response.json()
                success = isinstance(cars, list)
                details = f"Search returned {len(cars)} cars"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Search Cars", success, details)
            return success
        except Exception as e:
            self.log_test("Search Cars", False, str(e))
            return False
    
    def test_add_to_favorites(self):
        """Test adding car to favorites"""
        if not self.created_car_id:
            self.log_test("Add to Favorites", False, "No car ID available")
            return False
            
        try:
            encoded_phone = quote(TEST_PHONE, safe='')
            response = self.session.post(f"{API_BASE}/favorites/{encoded_phone}/{self.created_car_id}")
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Added to favorites: {result.get('message')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Add to Favorites", success, details)
            return success
        except Exception as e:
            self.log_test("Add to Favorites", False, str(e))
            return False
    
    def test_get_favorites(self):
        """Test getting user's favorites"""
        try:
            encoded_phone = quote(TEST_PHONE, safe='')
            response = self.session.get(f"{API_BASE}/favorites/{encoded_phone}")
            success = response.status_code == 200
            
            if success:
                favorites = response.json()
                success = isinstance(favorites, list)
                details = f"Retrieved {len(favorites)} favorite cars"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Get Favorites", success, details)
            return success
        except Exception as e:
            self.log_test("Get Favorites", False, str(e))
            return False
    
    def test_remove_from_favorites(self):
        """Test removing car from favorites"""
        if not self.created_car_id:
            self.log_test("Remove from Favorites", False, "No car ID available")
            return False
            
        try:
            encoded_phone = quote(TEST_PHONE, safe='')
            response = self.session.delete(f"{API_BASE}/favorites/{encoded_phone}/{self.created_car_id}")
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Removed from favorites: {result.get('message')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Remove from Favorites", success, details)
            return success
        except Exception as e:
            self.log_test("Remove from Favorites", False, str(e))
            return False
    
    def test_get_my_listings(self):
        """Test getting user's car listings"""
        try:
            encoded_phone = quote(TEST_PHONE, safe='')
            response = self.session.get(f"{API_BASE}/my-listings/{encoded_phone}")
            success = response.status_code == 200
            
            if success:
                listings = response.json()
                success = isinstance(listings, list)
                details = f"Retrieved {len(listings)} user listings"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Get My Listings", success, details)
            return success
        except Exception as e:
            self.log_test("Get My Listings", False, str(e))
            return False
    
    def test_admin_get_pending_cars(self):
        """Test getting pending cars for admin"""
        try:
            response = self.session.get(f"{API_BASE}/admin/cars/pending")
            success = response.status_code == 200
            
            if success:
                pending_cars = response.json()
                success = isinstance(pending_cars, list)
                details = f"Retrieved {len(pending_cars)} pending cars"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Admin Get Pending Cars", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Get Pending Cars", False, str(e))
            return False
    
    def test_admin_approve_car(self):
        """Test approving car listing"""
        if not self.created_car_id:
            self.log_test("Admin Approve Car", False, "No car ID available")
            return False
            
        try:
            response = self.session.put(f"{API_BASE}/admin/cars/{self.created_car_id}/approve")
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Car approved: {result.get('message')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Admin Approve Car", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Approve Car", False, str(e))
            return False
    
    def test_admin_reject_car(self):
        """Test rejecting car listing"""
        if not self.created_car_id:
            self.log_test("Admin Reject Car", False, "No car ID available")
            return False
            
        try:
            response = self.session.put(f"{API_BASE}/admin/cars/{self.created_car_id}/reject")
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Car rejected: {result.get('message')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Admin Reject Car", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Reject Car", False, str(e))
            return False
    
    def test_admin_stats(self):
        """Test getting admin statistics"""
        try:
            response = self.session.get(f"{API_BASE}/admin/stats")
            success = response.status_code == 200
            
            if success:
                stats = response.json()
                required_fields = ["totalCars", "approvedCars", "pendingCars", "totalUsers"]
                success = all(field in stats for field in required_fields)
                details = f"Stats: {stats}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_test("Admin Stats", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Stats", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting SafedAuto API Tests")
        print(f"📍 Backend URL: {API_BASE}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_health_check,
            self.test_create_user,
            self.test_get_user,
            self.test_update_user,
            self.test_create_car_listing,
            self.test_get_car_listings,
            self.test_get_car_by_id,
            self.test_search_cars,
            self.test_add_to_favorites,
            self.test_get_favorites,
            self.test_remove_from_favorites,
            self.test_get_my_listings,
            self.test_admin_get_pending_cars,
            self.test_admin_approve_car,
            self.test_admin_reject_car,
            self.test_admin_stats
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            if test():
                passed += 1
            else:
                failed += 1
            print()
        
        print("=" * 60)
        print(f"📊 Test Results: {passed} passed, {failed} failed")
        
        if failed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['details']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = SafedAutoAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)