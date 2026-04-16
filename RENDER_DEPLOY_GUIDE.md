# 🚀 ZUNO Deployment Guide - RENDER

Complete step-by-step guide to deploy your ZUNO website on Render.com

## Step 1: Prepare Your Code

✅ All files are ready in your folder:
- `server.js` - Backend
- `public/index.html` - Frontend
- `public/script.js` - Frontend Logic
- `package.json` - Dependencies
- `Procfile` - For Render

## Step 2: Create GitHub Repository

1. **Install Git** (if not already installed)
   - Download from: https://git-scm.com/download/win

2. **Initialize your repository**
   - Open Command Prompt in your project folder
   - Run: `git init`
   - Run: `git add .`
   - Run: `git commit -m "Initial commit"`

3. **Create GitHub Account**
   - Go to: https://github.com
   - Sign up (free)

4. **Create New Repository on GitHub**
   - Click "+" → "New repository"
   - Name: `zuno-chat` (or any name)
   - Leave public or private
   - Create repository

5. **Push Code to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/zuno-chat.git
   git branch -M main
   git push -u origin main
   ```
   - Replace YOUR_USERNAME with your GitHub username

## Step 3: Deploy to Render

### Create Render Account
1. Go to: https://render.com
2. Click "Get Started" → "Sign up with GitHub"
3. Authorize Render to access your GitHub
4. Accept and continue

### Deploy Your App
1. Go to Render Dashboard: https://dashboard.render.com
2. Click **"+ New"** → **"Web Service"**
3. Select your repository: `zuno-chat`
4. Click **"Connect"**

### Configure Your Service
Fill in these fields:

| Field | Value |
|-------|-------|
| **Name** | `zuno-chat` |
| **Environment** | `Node` |
| **Region** | Select closest to you (e.g., Frankfurt, Singapore) |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |

### Create Environment Variables (if needed)
- Click **"Advanced"**
- Under "Environment Variables" add:
  ```
  KEY: NODE_ENV
  VALUE: production
  ```
- Click **"Add Environment Variable"**

### Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. You'll see a URL like: `https://zuno-chat-xxx.onrender.com`

## Step 4: Your Website is LIVE! 🎉

Your website is now hosted at: `https://zuno-chat-xxx.onrender.com`

### Test It
1. Open: `https://zuno-chat-xxx.onrender.com`
2. Enter your name and age
3. Select gender
4. Click "ENTER"
5. Invite friends to connect!

## Step 5: Keep Your Code Updated

### When You Make Changes:
```bash
git add .
git commit -m "Your message"
git push origin main
```

Render will **automatically redeploy** when you push to GitHub!

## Important Notes

⚠️ **Free Tier on Render**
- Website goes to sleep after 15 minutes of inactivity
- When someone visits, it takes 30 seconds to wake up
- **Upgrade to paid** for always-on hosting (~$7/month)

✅ **What Works**
- Real-time messaging
- Stranger matching
- User authentication
- All chat features

## Troubleshooting

### Website shows error?
1. Go to Render Dashboard
2. Click your service
3. Check "Logs" tab for errors
4. Common fix: Reinstall dependencies
   ```bash
   rm -rf node_modules
   npm install
   git add .
   git commit -m "Reinstall dependencies"
   git push origin main
   ```

### Users can't connect?
- Make sure Socket.IO is configured correctly
- Check browser console for errors (F12)
- Verify PORT is set correctly

### Upgrade to Paid Plan
1. Go to https://render.com/pricing
2. Click "Upgrade" on your service
3. Choose plan ($7/month for production)

## Custom Domain (Optional)

1. Buy domain from: GoDaddy, Namecheap, etc.
2. In Render Dashboard → Your Service → Settings
3. Click "Add Custom Domain"
4. Follow DNS setup instructions
5. Your site will be at: `yourname.com`

## Summary

✅ Code is ready
✅ Procfile is configured
✅ package.json has dependencies
✅ Deploy to Render in 5 minutes
✅ Website is live globally

**That's it! You now have a real hosted website!** 🌍

Questions? Check: https://render.com/docs
