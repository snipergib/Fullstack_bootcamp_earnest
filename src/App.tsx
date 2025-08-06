import { useState, useEffect } from 'react';
import { Search, MapPin, Wind, Droplets, Eye, Thermometer } from 'lucide-react';
import './App.css';

// OpenWeatherMap API Configuration
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '6f1b8c8e9a1b7b8c8e9a1b7b8c8e9a1b';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

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

function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Weather icon mapping function
  const getWeatherIcon = (iconCode: string): string => {
    const iconMap: Record<string, string> = {
      '01d': '☀️', '01n': '🌙',
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
      const currentResponse = await fetch(
        `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
      );
      
      if (!currentResponse.ok) {
        throw new Error('City not found');
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

  const searchWeather = async (searchLocation: string) => {
    if (!searchLocation.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await fetchWeatherData(searchLocation);
      
      if (data) {
        setWeather(data.current);
        setForecast(data.forecast);
      } else {
        setError(`Weather data not found for "${searchLocation}". Please check the city name and try again.`);
        setWeather(null);
        setForecast([]);
      }
    } catch (error) {
      setError(`Failed to fetch weather data for "${searchLocation}". Please try again.`);
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
    if (!API_KEY || API_KEY === 'your_api_key_here') {
      setError('Please configure your OpenWeatherMap API key in the .env file. Visit https://openweathermap.org/api to get a free API key.');
      return;
    }
    searchWeather('London');
  }, []);

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
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              placeholder="Search for a city..."
              className="search-input"
            />
            <Search className="search-icon" />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="search-button"
            >
              {loading ? '...' : 'Search'}
            </button>
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
