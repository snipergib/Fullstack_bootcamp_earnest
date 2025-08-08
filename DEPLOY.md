# Render Deployment Instructions

## Deploy to Render

### Option 1: One-Click Deploy (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository: `snipergib/Fullstack_bootcamp_earnest`
4. Render will automatically detect the `render.yaml` file and deploy both services

### Option 2: Manual Setup
1. **Deploy Backend (FastAPI)**:
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `server`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment Variables:
     - `OPENWEATHER_API_KEY`: `56ff0a53c52a1e4508073baeb0a0e50a`

2. **Deploy Frontend (React)**:
   - New → Static Site
   - Connect GitHub repo
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Environment Variables:
     - `VITE_OPENWEATHER_API_KEY`: `56ff0a53c52a1e4508073baeb0a0e50a`
     - `VITE_BACKEND_URL`: `https://[your-backend-url].onrender.com/api`

## Features
- ✅ FastAPI Backend with search history
- ✅ React Frontend with improved spacing
- ✅ Popular cities tracking
- ✅ Real-time weather data
- ✅ CORS configured for Render domains

## Local Development
1. Start Backend: `cd server && python -m uvicorn main:app --reload --port 8001`
2. Start Frontend: `npm run dev`
3. Open: `http://localhost:5173`
