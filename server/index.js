const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for frontend communication

let searchHistory = []; // Store search history: [{ city, timestamp, weather, userAgent }]

// Endpoint to search weather and save to history
app.post('/api/weather/search', async (req, res) => {
  const { city } = req.body;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  try {
    const weather = await getWeather(city);
    
    // Save to search history
    const searchEntry = {
      id: Date.now(),
      city: city,
      timestamp: new Date(),
      weather: {
        temperature: weather.main.temp,
        description: weather.weather[0].description,
        humidity: weather.main.humidity,
        windSpeed: weather.wind.speed
      },
      userAgent: userAgent
    };
    
    searchHistory.unshift(searchEntry); // Add to beginning of array
    
    // Keep only last 100 searches to prevent memory issues
    if (searchHistory.length > 100) {
      searchHistory = searchHistory.slice(0, 100);
    }
    
    res.json({
      success: true,
      weather: weather,
      searchId: searchEntry.id
    });
    
    console.log(`Weather search recorded: ${city} at ${new Date()}`);
    
  } catch (error) {
    console.error(`Error fetching weather for ${city}:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch weather data' 
    });
  }
});

// Endpoint to get search history
app.get('/api/weather/history', (req, res) => {
  const { limit = 10, city } = req.query;
  
  let filteredHistory = searchHistory;
  
  // Filter by city if specified
  if (city) {
    filteredHistory = searchHistory.filter(entry => 
      entry.city.toLowerCase().includes(city.toLowerCase())
    );
  }
  
  // Limit results
  const limitedHistory = filteredHistory.slice(0, parseInt(limit));
  
  res.json({
    success: true,
    total: filteredHistory.length,
    history: limitedHistory
  });
});

// Endpoint to get popular cities (most searched)
app.get('/api/weather/popular', (req, res) => {
  const cityCount = {};
  
  // Count searches per city
  searchHistory.forEach(entry => {
    const city = entry.city.toLowerCase();
    cityCount[city] = (cityCount[city] || 0) + 1;
  });
  
  // Sort by count and get top cities
  const popularCities = Object.entries(cityCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([city, count]) => ({ city, searchCount: count }));
  
  res.json({
    success: true,
    popularCities: popularCities
  });
});

// Endpoint to get search statistics
app.get('/api/weather/stats', (req, res) => {
  const totalSearches = searchHistory.length;
  const uniqueCities = new Set(searchHistory.map(entry => entry.city.toLowerCase())).size;
  
  // Get searches from last 24 hours
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentSearches = searchHistory.filter(entry => new Date(entry.timestamp) > last24Hours);
  
  res.json({
    success: true,
    stats: {
      totalSearches: totalSearches,
      uniqueCities: uniqueCities,
      searchesLast24Hours: recentSearches.length,
      averageSearchesPerDay: totalSearches > 0 ? (totalSearches / Math.max(1, getDaysSinceFirstSearch())) : 0
    }
  });
});

// Endpoint to clear search history (for testing/admin)
app.delete('/api/weather/history', (req, res) => {
  searchHistory = [];
  res.json({ success: true, message: 'Search history cleared' });
});

async function getWeather(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  const response = await axios.get(url);
  return response.data;
}

function getDaysSinceFirstSearch() {
  if (searchHistory.length === 0) return 1;
  const firstSearch = new Date(searchHistory[searchHistory.length - 1].timestamp);
  const now = new Date();
  const diffTime = Math.abs(now - firstSearch);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Weather Search History Server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /api/weather/search - Search weather and save to history');
  console.log('  GET  /api/weather/history - Get search history');
  console.log('  GET  /api/weather/popular - Get most searched cities');
  console.log('  GET  /api/weather/stats - Get search statistics');
});