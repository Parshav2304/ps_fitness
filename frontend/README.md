# 💪 Fitness AI - Frontend

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed
- Backend running on http://localhost:8000

### Installation & Start

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm start
```

The app will open at: **http://localhost:3000**

## 📁 Project Structure

```
frontend/
├── public/
│   ├── index.html      # Main HTML template
│   ├── manifest.json   # PWA manifest
│   └── robots.txt      # SEO robots file
├── src/
│   ├── index.js        # React entry point
│   ├── index.css       # Global styles
│   ├── App.js          # Main app component
│   ├── App.css         # App styles
│   ├── Login.js        # Login/Register component
│   └── Login.css       # Login styles
└── package.json        # Dependencies
```

## 🎨 Features

- ✅ Modern React 18
- ✅ Responsive design
- ✅ Authentication flow
- ✅ Tab-based navigation
- ✅ Real-time updates
- ✅ Error handling
- ✅ Loading states

## 🔧 Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests

### Environment

The app connects to backend at `http://localhost:8000` by default.

To change API URL, update `API_URL` in:
- `src/App.js`
- `src/Login.js`

## 📝 Notes

- Backend must be running before starting frontend
- All API calls require authentication (except register/login)
- Token is stored in localStorage
- App automatically redirects to login if not authenticated

## 🐛 Troubleshooting

### "Cannot connect to API"
- Make sure backend is running on port 8000
- Check `API_URL` in App.js and Login.js

### "Module not found"
- Run `npm install` to install dependencies

### Port 3000 already in use
- Change port: `set PORT=3001 && npm start` (Windows)
- Or: `PORT=3001 npm start` (Mac/Linux)
