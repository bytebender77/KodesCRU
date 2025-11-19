# 🚀 Deployment Guide

This guide will help you deploy KodesCRUxxx to Render.com (Backend) and Vercel (Frontend).

---

## 📋 Prerequisites

- GitHub account
- Render.com account
- Vercel account
- OpenAI API key

---

## 🔧 Backend Deployment (Render.com)

### Step 1: Prepare Repository

1. Push your code to GitHub:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `kodescru-backend` (or your preferred name)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Choose Free or Starter plan

5. **Add Environment Variables:**
   - `OPENAI_API_KEY` = Your OpenAI API key
   - `MODEL_NAME` = `gpt-4o-mini` (optional)
   - `TEMPERATURE` = `0.7` (optional)
   - `MAX_TOKENS` = `1000` (optional)
   - `ALLOWED_ORIGINS` = Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
   - `DEBUG` = `False`
   - `LOG_LEVEL` = `INFO`

6. **Click "Create Web Service"**

7. **Wait for deployment** (usually 2-5 minutes)

8. **Copy your backend URL** (e.g., `https://kodescru-backend.onrender.com`)

### Step 3: Get Your Backend URL

After successful deployment, Render will provide you with a URL. From your deployment logs, you can see:

**Your Backend URL**: `https://kodescruxxx.onrender.com`

This is your backend API endpoint. You'll need this for the frontend configuration.

### Step 4: Update CORS Settings

After deploying the frontend (Step 5), update the `ALLOWED_ORIGINS` environment variable in Render to include your Vercel frontend URL:

1. Go to Render Dashboard → Your Service → Environment
2. Find `ALLOWED_ORIGINS` variable
3. Update it to: `https://your-frontend.vercel.app` (replace with your actual Vercel URL)
4. Save and the service will automatically redeploy

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Create `.env.production` file** (optional, you can also set in Vercel dashboard):
```env
VITE_API_URL=https://your-backend.onrender.com
VITE_WS_URL=wss://your-backend.onrender.com
```

### Step 2: Deploy on Vercel

#### Option A: Using Vercel CLI

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
cd frontend
vercel
```

4. **Follow the prompts:**
   - Set up and deploy? **Yes**
   - Which scope? **Your account**
   - Link to existing project? **No**
   - Project name: `kodescru-frontend` (or your preferred name)
   - Directory: `./frontend`
   - Override settings? **No**

5. **Set Environment Variables:**
```bash
vercel env add VITE_API_URL
# Enter: https://your-backend.onrender.com

vercel env add VITE_WS_URL
# Enter: wss://your-backend.onrender.com

vercel env add VITE_ASSET_BASE_URL
# Enter: https://your-backend.onrender.com
```

#### Option B: Using Vercel Dashboard

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New..."** → **"Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables:**
   - `VITE_API_URL` = `https://your-backend.onrender.com`
   - `VITE_WS_URL` = `wss://your-backend.onrender.com`
   - `VITE_ASSET_BASE_URL` = `https://your-backend.onrender.com`

6. **Click "Deploy"**

7. **Wait for deployment** (usually 1-2 minutes)

8. **Copy your frontend URL** - Vercel will show you the deployment URL:
   - Production URL: `https://your-project-name.vercel.app`
   - Or your custom domain if configured
   
   **Example**: `https://kodescru-frontend.vercel.app`

9. **Important**: After getting your frontend URL, go back to Render and update `ALLOWED_ORIGINS` to include your Vercel URL

---

## 🔄 Post-Deployment Steps

### 1. Update Backend CORS

After getting your Vercel URL, update the `ALLOWED_ORIGINS` in Render:

1. Go to Render Dashboard → Your Service → Environment
2. Update `ALLOWED_ORIGINS`:
   ```
   https://your-frontend.vercel.app
   ```
3. Save and redeploy

### 2. Update Frontend Environment Variables

If you need to change backend URL:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update:
   - `VITE_API_URL` = Your Render backend URL
   - `VITE_WS_URL` = Your Render backend URL (with `wss://` for WebSocket)

### 3. Test the Deployment

1. **Test Backend:**
   - Visit: `https://your-backend.onrender.com/health`
   - Should return: `{"status": "ok", "llm": "..."}`

2. **Test Frontend:**
   - Visit your Vercel URL
   - Check browser console for errors
   - Test collaborative rooms feature

---

## 🔐 Environment Variables Reference

### Backend (Render.com)

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |
| `MODEL_NAME` | GPT model to use | `gpt-4o-mini` |
| `TEMPERATURE` | Model temperature | `0.7` |
| `MAX_TOKENS` | Max response tokens | `1000` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://app.vercel.app` |
| `DEBUG` | Debug mode | `False` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `PORT` | Server port (auto-set by Render) | `10000` |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://backend.onrender.com` |
| `VITE_WS_URL` | WebSocket URL | `wss://backend.onrender.com` |
| `VITE_ASSET_BASE_URL` | Base URL for background images | `https://backend.onrender.com` |

---

## 🐛 Troubleshooting

### Backend Issues

**Service won't start:**
- Check build logs in Render dashboard
- Verify all dependencies in `requirements.txt`
- Ensure `PORT` environment variable is set (auto-set by Render)

**CORS errors:**
- Verify `ALLOWED_ORIGINS` includes your Vercel URL
- Check that URL doesn't have trailing slash
- Ensure `allow_credentials=True` in CORS middleware

**WebSocket connection fails:**
- Render free tier may have WebSocket limitations
- Consider upgrading to paid plan for production
- Check Render logs for WebSocket errors

### Frontend Issues

**API calls fail:**
- Verify `VITE_API_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend is running and accessible

**WebSocket won't connect:**
- Verify `VITE_WS_URL` uses `wss://` (secure WebSocket)
- Check that backend WebSocket endpoint is accessible
- Test WebSocket connection: `wss://your-backend.onrender.com/ws/test`

**Build fails:**
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

**SSL Certificate Error (ERR_CERT_AUTHORITY_INVALID):**
- This usually happens on Vercel preview deployments
- **Solution 1**: Use the production domain (e.g., `your-app.vercel.app`) instead of preview URLs
- **Solution 2**: If using a custom domain, ensure it's properly configured in Vercel:
  1. Go to Vercel Dashboard → Your Project → Settings → Domains
  2. Add your custom domain
  3. Follow DNS configuration instructions
  4. Wait for SSL certificate to be issued (usually 1-5 minutes)
- **Solution 3**: Clear browser cache and cookies
- **Solution 4**: Ensure all API calls use HTTPS (not HTTP)
- **Solution 5**: Check that `VITE_API_URL` and `VITE_WS_URL` use `https://` and `wss://` respectively

**Favicon not showing:**
- Ensure `favicon.svg` exists in `frontend/public/` directory
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for 404 errors on favicon
- Verify the favicon path in `index.html` matches the file location

---

## 📝 Notes

### Render.com Free Tier Limitations

- **Spins down after 15 minutes of inactivity**
- **First request after spin-down takes ~30 seconds**
- **WebSocket connections may timeout**
- **Consider upgrading for production use**

### Vercel Free Tier

- **Unlimited deployments**
- **Automatic HTTPS**
- **Global CDN**
- **Perfect for frontend hosting**

### Production Recommendations

1. **Use custom domains** for both services
2. **Set up monitoring** (Render has built-in monitoring)
3. **Enable auto-deploy** from GitHub
4. **Set up error tracking** (Sentry, etc.)
5. **Use environment-specific configs**

---

## 🔄 Continuous Deployment

Both Render and Vercel support automatic deployments:

- **Render**: Auto-deploys on push to main branch
- **Vercel**: Auto-deploys on push to main branch

To disable auto-deploy:
- **Render**: Settings → Auto-Deploy → Disable
- **Vercel**: Settings → Git → Production Branch → Disable

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

---

**Happy Deploying! 🚀**

