# Git Setup Instructions for NeuroScope Frontend

## ✅ Files Ready
- `.gitignore` - Configured to exclude node_modules, build, etc.
- `.gitattributes` - Configured for proper line endings (LF)
- `vercel.json` - Vercel deployment configuration
- `README.md` - Project documentation

## 🚀 Commands to Run

Open PowerShell in the `Neuro_scope1/neuro-scope-frontend` folder and run:

```powershell
# 1. Navigate to frontend folder (if not already there)
cd Neuro_scope1\neuro-scope-frontend

# 2. Configure Git line endings
git config core.autocrlf false
git config core.eol lf

# 3. Check status
git status

# 4. Add all files (node_modules and build will be ignored)
git add .

# 5. Commit
git commit -m "Prepare for Vercel deployment"

# 6. Push to GitHub
git push origin main
```

## 📋 What Will Be Committed

✅ Source code (`src/`)
✅ Public assets (`public/`)
✅ Configuration files (`package.json`, `vercel.json`, etc.)
✅ Documentation (`README.md`)

❌ `node_modules/` (ignored)
❌ `build/` (ignored)
❌ `.env` files (ignored)

## ⚠️ Line Ending Warnings

The warnings about CRLF being replaced by LF are **normal and expected**. This is Git normalizing line endings according to `.gitattributes`. This is good!

## 🔗 Vercel Deployment

After pushing to GitHub:
1. Go to https://vercel.com
2. Import your GitHub repository
3. Vercel will auto-detect the settings from `vercel.json`
4. Deploy!

