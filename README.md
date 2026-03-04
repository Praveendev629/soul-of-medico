# Soul of Medico

A modern educational platform built with Firebase and vanilla JavaScript.

## 🚀 Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Login to your Vercel account (or create one)
   - Accept default settings
   - Your site will be deployed!

### Option 2: Deploy via GitHub

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Go to [Vercel](https://vercel.com)**:
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the configuration
   - Click "Deploy"

3. **Your site will be live!** 🎉

## 🛠️ Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
soul-of-medico/
├── public/              # Source files
│   ├── index.html
│   ├── src/
│   │   ├── css/
│   │   └── js/
│   │       ├── app.js
│   │       ├── firebase-init.js
│   │       └── auth/
│   │           └── auth.js
│   └── manifest.json
├── functions/           # Firebase Cloud Functions
├── package.json
├── vite.config.js
├── vercel.json
└── README.md
```

## 🔥 Firebase Setup

Make sure you have configured your Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `soul-of-medico-001`
3. Enable Authentication > Google Sign-in
4. Add your Vercel domain to authorized domains
5. Update Firestore rules as needed
6. Deploy the updated Firestore rules from `firestore.rules`

## 🎥 YouTube Integration

The app automatically fetches videos from YouTube channel: **UC9_D5KyamXnm9PSqbIppx8Q**

### ✅ NO API KEY NEEDED!

The app now uses **YouTube RSS Feeds** - completely free, no setup required!

### Features:
- ✅ Automatic video sync on user login
- ✅ New video notifications on home page
- ✅ Beautiful video grid in Videos tab
- ✅ Click to watch on YouTube
- ✅ Videos cached in Firestore
- ✅ Admin-only video management
- ✅ No quota limits or API restrictions

📖 See [YOUTUBE_NO_API.md](YOUTUBE_NO_API.md) for details.

## 📝 Notes

- The app uses Firebase for authentication and database
- Google Sign-in is enabled
- PWA features are included with service worker
- Responsive design for mobile and desktop

## 🌐 After Deployment

Once deployed, add your Vercel domain to Firebase:

1. Go to Firebase Console > Authentication > Settings
2. Add your Vercel URL to "Authorized domains"
3. Update any CORS settings if needed

---

Built with ❤️ using Firebase and Vanilla JS
