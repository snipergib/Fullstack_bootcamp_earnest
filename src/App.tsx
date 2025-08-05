import { useState, useEffect } from 'react';
import { Search, MapPin, Wind, Droplets, Eye, Thermometer } from 'lucide-react';
import './App.css';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  feelsLike: number;
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

  // Mock weather data for demonstration
  const mockWeatherData: Record<string, { current: WeatherData; forecast: ForecastDay[] }> = {
    london: {
      current: {
        location: 'London, UK',
        temperature: 22,
        condition: 'Partly Cloudy',
        icon: '⛅',
        humidity: 65,
        windSpeed: 12,
        visibility: 10,
        feelsLike: 24
      },
      forecast: [
        { day: 'Today', high: 24, low: 18, condition: 'Partly Cloudy', icon: '⛅' },
        { day: 'Tomorrow', high: 26, low: 20, condition: 'Sunny', icon: '☀️' },
        { day: 'Wed', high: 23, low: 17, condition: 'Rainy', icon: '🌧️' },
        { day: 'Thu', high: 25, low: 19, condition: 'Cloudy', icon: '☁️' },
        { day: 'Fri', high: 27, low: 21, condition: 'Sunny', icon: '☀️' }
      ]
    },
    paris: {
      current: {
        location: 'Paris, France',
        temperature: 19,
        condition: 'Rainy',
        icon: '🌧️',
        humidity: 78,
        windSpeed: 8,
        visibility: 7,
        feelsLike: 17
      },
      forecast: [
        { day: 'Today', high: 21, low: 15, condition: 'Rainy', icon: '🌧️' },
        { day: 'Tomorrow', high: 18, low: 12, condition: 'Cloudy', icon: '☁️' },
        { day: 'Wed', high: 22, low: 16, condition: 'Partly Cloudy', icon: '⛅' },
        { day: 'Thu', high: 24, low: 18, condition: 'Sunny', icon: '☀️' },
        { day: 'Fri', high: 20, low: 14, condition: 'Rainy', icon: '🌧️' }
      ]
    },
    tokyo: {
      current: {
        location: 'Tokyo, Japan',
        temperature: 28,
        condition: 'Sunny',
        icon: '☀️',
        humidity: 55,
        windSpeed: 15,
        visibility: 12,
        feelsLike: 31
      },
      forecast: [
        { day: 'Today', high: 30, low: 24, condition: 'Sunny', icon: '☀️' },
        { day: 'Tomorrow', high: 32, low: 26, condition: 'Sunny', icon: '☀️' },
        { day: 'Wed', high: 29, low: 23, condition: 'Partly Cloudy', icon: '⛅' },
        { day: 'Thu', high: 27, low: 21, condition: 'Cloudy', icon: '☁️' },
        { day: 'Fri', high: 25, low: 19, condition: 'Rainy', icon: '🌧️' }
      ]
    }
  };

  const searchWeather = async (searchLocation: string) => {
    if (!searchLocation.trim()) return;
    
    setLoading(true);
    setError('');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const locationKey = searchLocation.toLowerCase();
    const data = mockWeatherData[locationKey];
    
    if (data) {
      setWeather(data.current);
      setForecast(data.forecast);
    } else {
      setError('Location not found. Try "London", "Paris", or "Tokyo"');
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
    searchWeather('london');
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
          <p className="quick-search-text">Try searching for:</p>
          <div className="quick-search-buttons">
            {['London', 'Paris', 'Tokyo'].map((city) => (
              <button
                key={city}
                onClick={() => {
                  setLocation(city);
                  searchWeather(city);
                }}
                className="quick-search-button"
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
