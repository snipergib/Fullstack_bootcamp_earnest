
# Weather Dashboard

A modern, responsive weather dashboard built with React, TypeScript, and Tailwind CSS. Get real-time weather data and 5-day forecasts for any city worldwide.

## Features

- 🌤️ Real-time weather data for any city
- 📅 5-day weather forecast
- 🎨 Beautiful, responsive design with Tailwind CSS
- 🔍 Smart city search with autocomplete suggestions
- 🌡️ Detailed weather metrics (temperature, humidity, wind speed, visibility)
- 📱 Mobile-friendly interface
- ⚡ Fast loading with Vite

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Get OpenWeatherMap API Key
1. Visit [OpenWeatherMap API](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to your API keys section
4. Generate a new API key (free tier allows 1000 calls/day)

### 3. Configure Environment Variables
1. Edit the `.env` file in the project root
2. Replace `your_api_key_here` with your actual API key:
```env
VITE_OPENWEATHER_API_KEY=your_actual_api_key_here
```

### 4. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

- **Search**: Type any city name in the search bar and press Enter or click Search
- **Quick Access**: Click on popular city buttons for instant weather data
- **Details**: View comprehensive weather information including feels-like temperature, wind speed, humidity, and visibility
- **Forecast**: See the 5-day weather forecast with daily highs, lows, and conditions

## Supported Cities

The app supports weather data for thousands of cities worldwide. Some examples:
- Major cities: London, Paris, Tokyo, New York, Sydney
- Regional cities: Mumbai, Dubai, Berlin, Toronto, Singapore
- Any city recognized by OpenWeatherMap's database

## API Integration

This app uses the OpenWeatherMap API to fetch:
- Current weather conditions
- 5-day weather forecasts
- Weather icons and descriptions
- Detailed meteorological data

## Technologies Used

- **React 19** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Lucide React** - Beautiful weather icons
- **OpenWeatherMap API** - Real-time weather data

---

## 📁 Folder Structure


``` 
├── public/  
├── src/  
├── .gitignore  
├── README.md  
├── eslint.config.js  
├── index.html  
├── package-lock.json  
├── package.json  
├── postcss.config.cjs  
├── tailwind.config.js  
├── tsconfig.json  
├── tsconfig.app.json  
├── tsconfig.node.json  
└── vite.config.ts

```

---

## 🧰 Tech Stack

- ⚛️ React
- ⚡ Vite
- 🎨 Tailwind CSS v3
- 🟦 TypeScript


---

## 🚀 Getting Started

### 1. Clone the Repository & Checkout the Tailwind Branch

```bash
https://github.com/dharshan-kumarj/React_CSS_Frameworks_Starter/tree/Tailwind
cd React_CSS_Frameworks_Starter
git checkout Tailwind

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Start the Dev Server

```bash
npm run dev

```

----------

## 🧩 Tailwind CSS Configuration

###  `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

```
### `postcss.config.cjs`

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

```

###  `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

```

----------

## 🧪 Verifying Tailwind CSS

To check if Tailwind is working:

1.  Go to `src/App.tsx`
    
2.  Add a class like `bg-blue-600 text-white p-4 rounded`
    
3.  Run the app and see the changes
    

----------

## 🏗️ Build for Production

```bash
npm run build

```

Then preview using:

```bash
npm run preview

```
