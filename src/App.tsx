import { useState, useEffect } from 'react';
import { Search, MapPin, Wind, Droplets, Eye, Thermometer, Clock, TrendingUp } from 'lucide-react';
import './App.css';

// OpenWeatherMap API Configuration
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '6f1b8c8e9a1b7b8c8e9a1b7b8c8e9a1b';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001/api';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  feelsLike: number;
  country: string;
}

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
}

interface CitySuggestion {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

interface SearchHistoryItem {
  id: number;
  city: string;
  timestamp: string;
  weather: {
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
  };
}

interface PopularCity {
  city: string;
  searchCount: number;
}

function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [popularCities, setPopularCities] = useState<PopularCity[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch city suggestions from OpenWeatherMap Geocoding API
  const fetchCitySuggestions = async (query: string): Promise<CitySuggestion[]> => {
    if (query.length < 2) return [];
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.map((item: any) => ({
        name: item.name,
        country: item.country,
        state: item.state,
        lat: item.lat,
        lon: item.lon
      }));
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      return [];
    }
  };

  // Handle input change with debounced search
  const handleInputChange = (value: string) => {
    setLocation(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Set new timeout for debounced search
    const timeout = window.setTimeout(async () => {
      const citySuggestions = await fetchCitySuggestions(value);
      setSuggestions(citySuggestions);
      setShowSuggestions(citySuggestions.length > 0);
    }, 300); // 300ms debounce
    
    setSearchTimeout(timeout);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: CitySuggestion) => {
    const cityName = suggestion.state 
      ? `${suggestion.name}, ${suggestion.state}, ${suggestion.country}`
      : `${suggestion.name}, ${suggestion.country}`;
    
    setLocation(cityName);
    setShowSuggestions(false);
    setSuggestions([]);
    searchWeather(suggestion.name);
  };

  // Weather icon mapping function
  const getWeatherIcon = (iconCode: string): string => {
    const iconMap: Record<string, string> = {
      '01d': '☀️', '01n': '�',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌤️';
  };

  // Fetch weather data from OpenWeatherMap API
  const fetchWeatherData = async (city: string): Promise<{ current: WeatherData; forecast: ForecastDay[] } | null> => {
    try {
      // Fetch current weather
      const weatherUrl = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
      const currentResponse = await fetch(weatherUrl);
      
      if (!currentResponse.ok) {
        const errorData = await currentResponse.json();
        
        if (currentResponse.status === 401) {
          throw new Error('🔑 API Key Issue: Your OpenWeatherMap API key is not working yet. New keys can take up to 1 hour to activate. Please wait and try again, or check your OpenWeatherMap dashboard to ensure the key is active.');
        } else if (currentResponse.status === 404) {
          throw new Error(`🏙️ City "${city}" not found. Please check the spelling and try again. Try: London, Paris, Tokyo, New York, etc.`);
        } else {
          throw new Error(`🌐 API Error (${currentResponse.status}): ${errorData.message || 'Unable to fetch weather data'}`);
        }
      }
      
      const currentData = await currentResponse.json();
      
      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
      );
      
      const forecastData = await forecastResponse.json();
      
      // Process current weather data
      const current: WeatherData = {
        location: `${currentData.name}, ${currentData.sys.country}`,
        temperature: Math.round(currentData.main.temp),
        condition: currentData.weather[0].description.charAt(0).toUpperCase() + currentData.weather[0].description.slice(1),
        icon: getWeatherIcon(currentData.weather[0].icon),
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
        visibility: Math.round(currentData.visibility / 1000), // Convert m to km
        feelsLike: Math.round(currentData.main.feels_like),
        country: currentData.sys.country
      };
      
      // Process forecast data (get one forecast per day)
      const forecastDays: ForecastDay[] = [];
      const today = new Date().getDate();
      
      for (let i = 0; i < forecastData.list.length && forecastDays.length < 5; i++) {
        const item = forecastData.list[i];
        const forecastDate = new Date(item.dt * 1000);
        const forecastDay = forecastDate.getDate();
        
        // Skip today's forecasts, we want future days
        if (forecastDay !== today && !forecastDays.some(day => day.day === getDayName(forecastDate))) {
          forecastDays.push({
            day: forecastDays.length === 0 ? 'Tomorrow' : getDayName(forecastDate),
            high: Math.round(item.main.temp_max),
            low: Math.round(item.main.temp_min),
            condition: item.weather[0].description.charAt(0).toUpperCase() + item.weather[0].description.slice(1),
            icon: getWeatherIcon(item.weather[0].icon)
          });
        }
      }
      
      return { current, forecast: forecastDays };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  };

  // Helper function to get day name
  const getDayName = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  // Backend API functions
  const searchWeatherWithHistory = async (city: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/weather/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.weather;
      }
    } catch (error) {
      console.error('Backend search failed, falling back to direct API:', error);
    }
    return null;
  };

  const fetchSearchHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/weather/history?limit=5`);
      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    }
  };

  const fetchPopularCities = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/weather/popular`);
      if (response.ok) {
        const data = await response.json();
        setPopularCities(data.popularCities || []);
      }
    } catch (error) {
      console.error('Failed to fetch popular cities:', error);
    }
  };

  const searchWeather = async (searchLocation: string) => {
    if (!searchLocation.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Try to search through backend first (for history tracking)
      await searchWeatherWithHistory(searchLocation);
      
      // Fallback to direct API call
      const data = await fetchWeatherData(searchLocation);
      
      if (data) {
        setWeather(data.current);
        setForecast(data.forecast);
        
        // Refresh search history and popular cities
        fetchSearchHistory();
        fetchPopularCities();
      } else {
        setError(`Weather data not found for "${searchLocation}". Please check the city name and try again.`);
        setWeather(null);
        setForecast([]);
      }
    } catch (error) {
      setError(`Failed to fetch weather data for "${searchLocation}". ${error instanceof Error ? error.message : 'Please try again.'}`);
      setWeather(null);
      setForecast([]);
    }
    
    setLoading(false);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    searchWeather(location);
  };

  // Load default weather on component mount
  useEffect(() => {
    if (!API_KEY || API_KEY === 'your_api_key_here' || API_KEY === '6f1b8c8e9a1b7b8c8e9a1b7b8c8e9a1b') {
      setError('🔑 Please configure your OpenWeatherMap API key in the .env file. Visit https://openweathermap.org/api to get a free API key.');
      return;
    }
    
    // Test the API key with London
    searchWeather('London');
    
    // Load search history and popular cities
    fetchSearchHistory();
    fetchPopularCities();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="weather-background">
      <div className="weather-container">
        {/* Header */}
        <div className="weather-header">
          <h1 className="weather-title">Weather Dashboard</h1>
          <p className="weather-subtitle">Get current weather and 5-day forecast</p>
        </div>

        {/* Search */}
        <div className="search-container">
          <div className="relative">
            <input
              type="text"
              value={location}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                  setShowSuggestions(false);
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                }
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow click events
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              placeholder="Search for a city..."
              className="search-input"
              autoComplete="off"
            />
            <Search className="search-icon" />
            <button
              onClick={() => {
                handleSearch();
                setShowSuggestions(false);
              }}
              disabled={loading}
              className="search-button"
            >
              {loading ? '...' : 'Search'}
            </button>
            
            {/* City Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="city-suggestions">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.name}-${suggestion.country}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="suggestion-item"
                  >
                    <div className="suggestion-name">{suggestion.name}</div>
                    <div className="suggestion-location">
                      {suggestion.state ? `${suggestion.state}, ` : ''}{suggestion.country}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center mb-8">
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Current Weather */}
        {weather && !loading && (
          <div className="weather-card">
            <div className="flex items-center justify-between mb-6">
              <div className="weather-location">
                <MapPin className="w-5 h-5" />
                <span className="weather-location-text">{weather.location}</span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Main Weather Info */}
              <div className="weather-main-info">
                <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
                  <span className="weather-icon-large">{weather.icon}</span>
                  <div>
                    <div className="weather-temperature">{weather.temperature}°C</div>
                    <div className="weather-condition">{weather.condition}</div>
                  </div>
                </div>
                <div className="weather-feels-like">
                  Feels like {weather.feelsLike}°C
                </div>
              </div>

              {/* Weather Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="weather-detail-card">
                  <Wind className="weather-detail-icon" />
                  <div className="weather-detail-value">{weather.windSpeed} km/h</div>
                  <div className="weather-detail-label">Wind Speed</div>
                </div>
                <div className="weather-detail-card">
                  <Droplets className="weather-detail-icon" />
                  <div className="weather-detail-value">{weather.humidity}%</div>
                  <div className="weather-detail-label">Humidity</div>
                </div>
                <div className="weather-detail-card">
                  <Eye className="weather-detail-icon" />
                  <div className="weather-detail-value">{weather.visibility} km</div>
                  <div className="weather-detail-label">Visibility</div>
                </div>
                <div className="weather-detail-card">
                  <Thermometer className="weather-detail-icon" />
                  <div className="weather-detail-value">{weather.feelsLike}°C</div>
                  <div className="weather-detail-label">Feels Like</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5-Day Forecast */}
        {forecast.length > 0 && !loading && (
          <div className="forecast-card">
            <h2 className="forecast-title">5-Day Forecast</h2>
            <div className="forecast-grid">
              {forecast.map((day, index) => (
                <div
                  key={index}
                  className="forecast-day-card"
                >
                  <div className="forecast-day-name">{day.day}</div>
                  <div className="forecast-icon">{day.icon}</div>
                  <div className="forecast-temp-high">{day.high}°</div>
                  <div className="forecast-temp-low">{day.low}°</div>
                  <div className="forecast-condition">{day.condition}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search History Section */}
        <div className="history-card animate-fade-in-up">
          <div className="history-header">
            <h2 className="history-title">
              <Clock className="w-5 h-5 mr-2" />
              Recent Searches
            </h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="history-toggle"
            >
              {showHistory ? 'Hide' : 'Show'} History
            </button>
          </div>
          
          {showHistory && (
            <div className="space-y-2">
              {searchHistory.length > 0 ? (
                searchHistory.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="history-item"
                    onClick={() => {
                      setLocation(item.city);
                      searchWeather(item.city);
                    }}
                  >
                    <div className="history-item-info">
                      <MapPin className="w-4 h-4 text-blue-300 flex-shrink-0" />
                      <div className="history-item-details">
                        <div className="history-city-name">{item.city}</div>
                        <div className="history-timestamp">
                          {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                    <div className="history-weather">
                      <div className="history-temperature">{Math.round(item.weather.temperature)}°C</div>
                      <div className="history-description">{item.weather.description}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="history-empty">
                  No search history yet. Search for a city to see it here!
                </div>
              )}
              {searchHistory.length > 3 && (
                <div className="text-center mt-2">
                  <button
                    onClick={() => {
                      // You can add a "Show More" functionality here if needed
                    }}
                    className="text-blue-300 hover:text-white text-xs transition-colors"
                  >
                    +{searchHistory.length - 3} more searches
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Popular Cities */}
        {popularCities.length > 0 && (
          <div className="popular-cities-card animate-fade-in-up">
            <h2 className="popular-cities-title">
              <TrendingUp className="w-5 h-5 mr-2" />
              Popular Cities
            </h2>
            <div className="popular-cities-grid">
              {popularCities.slice(0, 8).map((city) => (
                <button
                  key={city.city}
                  onClick={() => {
                    setLocation(city.city);
                    searchWeather(city.city);
                  }}
                  className="popular-city-item"
                  disabled={loading}
                >
                  <div className="popular-city-info">
                    <div className="popular-city-name">{city.city}</div>
                    <div className="popular-city-count">{city.searchCount} searches</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Search Suggestions */}
        <div className="quick-search-container">
          <p className="quick-search-text">Popular cities:</p>
          <div className="quick-search-buttons">
            {['London', 'Paris', 'Tokyo', 'New York', 'Sydney', 'Mumbai', 'Dubai', 'Berlin'].map((city) => (
              <button
                key={city}
                onClick={() => {
                  setLocation(city);
                  searchWeather(city);
                }}
                className="quick-search-button"
                disabled={loading}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
