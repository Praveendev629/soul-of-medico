# YouTube Integration Setup Guide

## 🎥 How to Get YouTube API Key

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "NEW PROJECT"
3. Name it "Soul of Medico" or any name you prefer
4. Click "CREATE"

### Step 2: Enable YouTube Data API v3
1. In your new project, go to "APIs & Services" → "Library"
2. Search for "YouTube Data API v3"
3. Click on it and press "ENABLE"

### Step 3: Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "API key"
3. Copy your API key (it looks like: `AIzaSy...`)

### Step 4: Add API Key to Your App
1. Open `public/src/js/services/youtube.js`
2. Replace `YOUR_API_KEY` with your actual API key:
   ```javascript
   const YOUTUBE_API_URL = `https://www.googleapis.com/youtube/v3/search?key=YOUR_ACTUAL_API_KEY&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=10`;
   ```

### Step 5: Set API Key Restrictions (Recommended)
1. In Google Cloud Console, click on your API key
2. Under "Application restrictions", select "HTTP referrers"
3. Add your domains:
   - `http://localhost:8080/*`
   - `https://your-domain.com/*`
4. Under "API restrictions", select "Restrict key"
5. Select "YouTube Data API v3" only
6. Click "SAVE"

## 📊 Channel Information

- **Channel ID**: `UC9_D5KyamXnm9PSqbIppx8Q`
- This channel's videos will be automatically fetched and displayed

## 🔄 How It Works

1. **Automatic Sync**: When users log in, the app checks for new videos from the YouTube channel
2. **Notifications**: New videos trigger a notification on the home page
3. **Video Display**: All videos are shown in the Videos tab with thumbnails and details
4. **Real-time Updates**: Videos are stored in Firestore and displayed immediately

## 🎯 Features

✅ Automatic video fetching from YouTube channel  
✅ Real-time notifications for new videos  
✅ Beautiful video grid layout with thumbnails  
✅ Click to watch on YouTube  
✅ Admin-only video management  
✅ Cached in Firestore for fast loading  

## 🔧 Manual Video Sync

To manually sync videos, open browser console and run:
```javascript
import { syncYouTubeVideos } from './src/js/services/youtube.js';
syncYouTubeVideos();
```

## 📝 Notes

- Free YouTube API quota: 10,000 units/day
- Each search request costs 100 units
- The app syncs videos on login and can be set to periodic sync
- Videos are cached in Firestore to minimize API calls
