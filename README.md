# NeuroScope Frontend

React frontend for the NeuroScope Brain Tumor Analysis Platform.

## 🚀 Deployment on Vercel

This project is configured for automatic deployment on Vercel.

### Configuration
- **Framework**: Create React App
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `build`
- **API Backend**: https://rahul09122004-neuroscope.hf.space

## 📦 Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🔧 Environment Variables

Create a `.env.production` file for production:

```
REACT_APP_API_URL=https://rahul09122004-neuroscope.hf.space
```

## 📝 Git Setup

```bash
# Configure line endings (already done)
git config core.autocrlf false
git config core.eol lf

# Add files
git add .

# Commit
git commit -m "Initial commit: NeuroScope frontend"

# Push to GitHub
git push origin main
```

## 🛠️ Tech Stack

- React 17
- React Router
- Axios
- Create React App
