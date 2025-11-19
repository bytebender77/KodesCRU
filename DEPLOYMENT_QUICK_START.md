# 🚀 Quick Deployment Guide

## Your Two URLs

After deploying both services, you'll have:

### 1. Backend URL (Render.com)
**Your Backend**: `https://kodescruxxx.onrender.com`

This is already deployed! ✅

**What it's for:**
- API endpoints (e.g., `/explain`, `/debug`, `/execute_code`)
- WebSocket connections (`/ws/{room_id}`)
- Health check: `https://kodescruxxx.onrender.com/health`

### 2. Frontend URL (Vercel)
**Your Frontend**: `https://your-project-name.vercel.app`

This will be created when you deploy to Vercel.

**What it's for:**
- Your main application website
- User-facing interface
- Where users access the app

---

## 🔄 How to Get Both URLs

### Step 1: Backend (Already Done! ✅)
- **URL**: `https://kodescruxxx.onrender.com`
- **Status**: Deployed and running
- **Location**: Render Dashboard → Your Service → URL

### Step 2: Frontend (Deploy to Vercel)

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Click "Add New..." → "Project"**
3. **Import your GitHub repository**
4. **Configure:**
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add Environment Variables:**
   ```
   VITE_API_URL=https://kodescruxxx.onrender.com
   VITE_WS_URL=wss://kodescruxxx.onrender.com
   ```
6. **Click "Deploy"**
7. **Wait 1-2 minutes**
8. **Copy your frontend URL** (shown after deployment)

### Step 3: Connect Them Together

After getting your frontend URL (e.g., `https://my-app.vercel.app`):

1. **Go to Render Dashboard**
2. **Your Service → Environment**
3. **Update `ALLOWED_ORIGINS`:**
   ```
   https://my-app.vercel.app
   ```
4. **Save** (Render will auto-redeploy)

---

## ✅ Final Checklist

- [ ] Backend deployed on Render: `https://kodescruxxx.onrender.com`
- [ ] Frontend deployed on Vercel: `https://your-app.vercel.app`
- [ ] Environment variables set in Vercel:
  - [ ] `VITE_API_URL` = `https://kodescruxxx.onrender.com`
  - [ ] `VITE_WS_URL` = `wss://kodescruxxx.onrender.com`
- [ ] `ALLOWED_ORIGINS` updated in Render with your Vercel URL
- [ ] Test both URLs are accessible
- [ ] Test frontend can connect to backend

---

## 🧪 Testing Your Deployment

### Test Backend:
```bash
curl https://kodescruxxx.onrender.com/health
```
Should return: `{"status": "ok", ...}`

### Test Frontend:
1. Visit your Vercel URL
2. Check browser console (F12) for errors
3. Try using the app features

### Test Connection:
1. Open frontend in browser
2. Open DevTools → Network tab
3. Use any feature (e.g., Code Explanation)
4. Check that API calls go to `https://kodescruxxx.onrender.com`

---

## 📝 Summary

**Backend URL**: `https://kodescruxxx.onrender.com` ✅ (Already deployed)

**Frontend URL**: `https://your-project-name.vercel.app` (Deploy to get this)

Once you have both:
1. Set environment variables in Vercel
2. Update CORS in Render
3. Test the connection
4. You're live! 🎉

