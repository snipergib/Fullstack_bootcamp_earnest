from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
from datetime import datetime
import json

app = FastAPI(
    title="Weather Search History API",
    description="API for tracking weather search history and popular cities",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://localhost:3000",
        "https://fullstack-bootcamp-earnest.onrender.com",
        "https://weather-dashboard-frontend.onrender.com",
        "https://weather-dashboard.onrender.com",
        "https://*.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenWeatherMap API configuration
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "6f1b8c8e9a1b7b8c8e9a1b7b8c8e9a1b")
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

# In-memory storage (use database in production)
search_history = []

class SearchRequest(BaseModel):
    city: str

class WeatherResponse(BaseModel):
    temperature: float
    description: str
    humidity: int
    windSpeed: float

class SearchHistoryItem(BaseModel):
    id: int
    city: str
    timestamp: datetime
    weather: WeatherResponse

class PopularCity(BaseModel):
    city: str
    searchCount: int

# OpenWeatherMap API configuration
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "6f1b8c8e9a1b7b8c8e9a1b7b8c8e9a1b")
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Weather API is running!", "status": "healthy", "version": "2.0", "timestamp": "2025-08-08"}

@app.get("/health")
async def health_check():
    """Health check endpoint for Render"""
    return {"status": "healthy", "service": "weather-api", "version": "2.0"}

@app.get("/api")
async def api_info():
    """API information endpoint"""
    return {
        "message": "Weather Search History API",
        "version": "1.0.0",
        "endpoints": {
            "POST /api/weather/search": "Search weather and save to history",
            "GET /api/weather/history": "Get search history",
            "GET /api/weather/popular": "Get popular cities",
            "GET /api/weather/stats": "Get API statistics"
        }
    }

@app.post("/api/weather/search")
async def search_weather(request: SearchRequest):
    """Search for weather and save to history"""
    try:
        print(f"🔍 Searching weather for: {request.city}")
        
        # Check if API key is configured
        if OPENWEATHER_API_KEY == "6f1b8c8e9a1b7b8c8e9a1b7b8c8e9a1b":
            print("⚠️  Using default API key - weather search will be simulated")
            # Simulate weather data for demo purposes
            simulated_weather = {
                "main": {"temp": 22.5, "humidity": 65},
                "weather": [{"description": "partly cloudy"}],
                "wind": {"speed": 3.2}
            }
            
            weather_response = WeatherResponse(
                temperature=simulated_weather["main"]["temp"],
                description=simulated_weather["weather"][0]["description"],
                humidity=simulated_weather["main"]["humidity"],
                windSpeed=simulated_weather["wind"]["speed"]
            )
            
            # Save to search history
            search_entry = {
                "id": len(search_history) + 1,
                "city": request.city,
                "timestamp": datetime.now(),
                "weather": weather_response.dict()
            }
            
            search_history.insert(0, search_entry)  # Add to beginning
            print(f"✅ Simulated weather search recorded: {request.city} (Total searches: {len(search_history)})")
            
            return {
                "success": True,
                "weather": simulated_weather,
                "searchId": search_entry["id"],
                "note": "Using simulated data - configure OPENWEATHER_API_KEY for real data"
            }
        
        # Fetch weather data from OpenWeatherMap
        async with httpx.AsyncClient() as client:
            weather_url = f"{OPENWEATHER_BASE_URL}/weather"
            params = {
                "q": request.city,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric"
            }
            
            print(f"🌐 Making API request to: {weather_url}")
            response = await client.get(weather_url, params=params)
            
            if response.status_code != 200:
                print(f"❌ API Error {response.status_code}: {response.text}")
                raise HTTPException(status_code=404, detail=f"City '{request.city}' not found")
            
            weather_data = response.json()
            
            # Create weather response
            weather_response = WeatherResponse(
                temperature=weather_data["main"]["temp"],
                description=weather_data["weather"][0]["description"],
                humidity=weather_data["main"]["humidity"],
                windSpeed=weather_data["wind"]["speed"]
            )
            
            # Save to search history
            search_entry = {
                "id": len(search_history) + 1,
                "city": request.city,
                "timestamp": datetime.now(),
                "weather": weather_response.dict()
            }
            
            search_history.insert(0, search_entry)  # Add to beginning
            
            # Keep only last 100 searches
            if len(search_history) > 100:
                search_history[:] = search_history[:100]
            
            print(f"✅ Real weather search recorded: {request.city} (Total searches: {len(search_history)})")
            
            return {
                "success": True,
                "weather": weather_data,
                "searchId": search_entry["id"]
            }
            
    except httpx.RequestError as e:
        print(f"❌ HTTP Request Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching weather data: {str(e)}")
    except Exception as e:
        print(f"❌ General Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/weather/history")
async def get_search_history(limit: int = 10, city: Optional[str] = None):
    """Get search history"""
    try:
        filtered_history = search_history
        
        # Filter by city if specified
        if city:
            filtered_history = [
                entry for entry in search_history 
                if city.lower() in entry["city"].lower()
            ]
        
        # Limit results
        limited_history = filtered_history[:limit]
        
        print(f"📊 Returning {len(limited_history)} history items (total: {len(search_history)})")
        
        return {
            "success": True,
            "total": len(filtered_history),
            "history": limited_history
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@app.get("/api/weather/popular")
async def get_popular_cities():
    """Get most searched cities"""
    try:
        city_count = {}
        
        # Count searches per city
        for entry in search_history:
            city = entry["city"].lower()
            city_count[city] = city_count.get(city, 0) + 1
        
        # Sort by count and get top cities
        popular_cities = [
            {"city": city, "searchCount": count}
            for city, count in sorted(city_count.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        print(f"🔥 Returning {len(popular_cities)} popular cities")
        
        return {
            "success": True,
            "popularCities": popular_cities
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching popular cities: {str(e)}")

@app.get("/api/weather/stats")
async def get_search_stats():
    """Get search statistics"""
    try:
        total_searches = len(search_history)
        unique_cities = len(set(entry["city"].lower() for entry in search_history))
        
        # Get searches from last 24 hours
        now = datetime.now()
        last_24_hours = [
            entry for entry in search_history 
            if (now - entry["timestamp"]).total_seconds() < 24 * 60 * 60
        ]
        
        return {
            "success": True,
            "stats": {
                "totalSearches": total_searches,
                "uniqueCities": unique_cities,
                "searchesLast24Hours": len(last_24_hours)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

@app.delete("/api/weather/history")
async def clear_search_history():
    """Clear all search history"""
    global search_history
    search_history.clear()
    
    print("🗑️ Search history cleared")
    
    return {"success": True, "message": "Search history cleared"}

@app.get("/")
async def root():
    return {
        "message": "Weather Search History FastAPI Server",
        "endpoints": {
            "POST /api/weather/search": "Search weather and save to history",
            "GET /api/weather/history": "Get search history",
            "GET /api/weather/popular": "Get popular cities", 
            "GET /api/weather/stats": "Get search statistics",
            "DELETE /api/weather/history": "Clear search history"
        },
        "total_searches": len(search_history)
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Weather Search History FastAPI Server...")
    print("📍 Available endpoints:")
    print("   POST /api/weather/search - Search weather and save to history")
    print("   GET  /api/weather/history - Get search history")
    print("   GET  /api/weather/popular - Get popular cities")
    print("   GET  /api/weather/stats - Get search statistics")
    print("   DELETE /api/weather/history - Clear search history")
    print("🌐 Server will be available at: http://localhost:8001")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
