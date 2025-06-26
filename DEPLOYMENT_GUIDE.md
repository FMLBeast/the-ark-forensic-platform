# 🚀 The Ark - Production Deployment Guide

## Quick Deployment Options

### 🌟 **Recommended: One-Click Deployments**

#### 1. **Vercel (Easiest)**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Connect your GitHub repository
2. Vercel auto-detects Vite configuration
3. Set environment variables in dashboard
4. Deploy automatically on git push

#### 2. **Netlify (Static Hosting)**
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. Drag & drop `dist` folder OR connect GitHub
2. Build settings auto-configured via `netlify.toml`
3. Set environment variables in dashboard
4. Automatic deployments on push

#### 3. **Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 🛠️ **Advanced Deployment Options**

### **Docker Deployment**
```bash
# Build the image
docker build -t the-ark-frontend .

# Run locally
docker run -p 80:80 the-ark-frontend

# Deploy to production
docker tag the-ark-frontend your-registry/the-ark-frontend
docker push your-registry/the-ark-frontend
```

### **VPS/Server Deployment**
```bash
# Build the application
npm run build

# Upload dist/ folder to your server
rsync -avz dist/ user@your-server:/var/www/ark/

# Configure Nginx (use provided nginx.conf)
sudo systemctl reload nginx
```

### **AWS S3 + CloudFront**
```bash
# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## ⚙️ **Environment Configuration**

### **Production Environment Variables**
Update `.env.production` with your backend URLs:

```env
VITE_API_URL="https://your-backend-domain.com/api"
VITE_WS_URL="wss://your-backend-domain.com/api/chat/ws"
```

### **Backend Integration**
If deploying with your Flask backend:
1. Update API URLs in `.env.production`
2. Configure CORS on backend for your domain
3. Set up WebSocket support for live chat
4. Configure SSL certificates

---

## 🔧 **Production Checklist**

### **Pre-deployment**
- [ ] Update API URLs in `.env.production`
- [ ] Test build: `npm run build`
- [ ] Verify all routes work with `npm run preview`
- [ ] Check console for errors
- [ ] Test authentication flow
- [ ] Verify challenge system loads

### **Post-deployment**
- [ ] Test login functionality
- [ ] Verify all navigation works
- [ ] Check responsive design on mobile
- [ ] Test challenge management system
- [ ] Verify file tree visualization
- [ ] Check agent dashboard
- [ ] Test live chat (if backend connected)
- [ ] Monitor performance

### **Security**
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CSP policy in place
- [ ] No credentials exposed in frontend
- [ ] Error reporting set up (optional)

---

## 🚀 **Automated Deployment Script**

Use the provided deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

Select from 7 deployment options:
1. 🌐 Netlify
2. ⚡ Vercel  
3. 🔥 Firebase
4. 📁 AWS S3
5. 🐳 Docker
6. 🖥️ VPS/Server
7. 📤 Manual ZIP

---

## 🌐 **Domain & DNS Setup**

### **Custom Domain**
1. Purchase domain from registrar
2. Point DNS to hosting provider:
   - **Netlify**: Add CNAME to `branch-name--app-name.netlify.app`
   - **Vercel**: Add CNAME to `cname.vercel-dns.com`
   - **Firebase**: Follow Firebase domain setup
   - **Custom**: Point to your server IP

### **SSL Certificate**
- **Netlify/Vercel/Firebase**: Automatic SSL
- **Custom server**: Use Let's Encrypt or Cloudflare

---

## 📊 **Performance Optimization**

### **Current Build Stats**
- **Bundle size**: ~549KB (156KB gzipped)
- **CSS**: 36KB (6.3KB gzipped)
- **Build time**: ~6 seconds

### **Optimizations Applied**
- ✅ Code splitting ready
- ✅ Asset compression (gzip)
- ✅ Cache headers configured
- ✅ Tree shaking enabled
- ✅ Modern JS output

### **Further Optimizations**
```bash
# Analyze bundle size
npm run build -- --analyze

# Enable code splitting (future enhancement)
# Dynamic imports for lazy loading
```

---

## 🔍 **Monitoring & Analytics**

### **Error Tracking** (Optional)
Add Sentry for error monitoring:
```env
VITE_SENTRY_DSN="https://your-sentry-dsn"
```

### **Analytics** (Optional)
Add Google Analytics:
```env
VITE_ANALYTICS_ID="GA-XXXXXXXXX"
```

---

## 🆘 **Troubleshooting**

### **Common Issues**
1. **404 on page refresh**: Ensure SPA redirects configured
2. **API connection fails**: Check CORS and API URLs
3. **White screen**: Check console for JS errors
4. **Assets not loading**: Verify build output and paths

### **Debug Mode**
```bash
# Local production build test
npm run build
npm run preview
```

### **Logs**
- **Netlify**: Check deploy logs in dashboard
- **Vercel**: View function logs in dashboard  
- **Docker**: `docker logs container-name`
- **Server**: Check Nginx/Apache error logs

---

## 🎯 **Production Features**

Your deployed application includes:

### **✅ Fully Functional**
- 🔐 Authentication system (demo mode)
- 📊 Challenge management system (12 pre-filled challenges)
- 🌳 File tree visualization
- 🤖 Agent dashboard and orchestration
- 💬 Live chat system (frontend-ready)
- 📝 File annotation system
- 🎯 Matrix-themed UI with animations
- 📱 Responsive design

### **🔌 Backend Integration Ready**
- API service layer configured
- WebSocket support for real-time features
- Authentication provider ready
- Agent service integration points

### **🎮 Demo Data Included**
- 12 detailed challenges from technical briefing
- 6-phase ARG progression system
- Mock file extraction tree
- Sample findings and annotations
- Agent capability descriptions

---

## 🚀 **Go Live!**

Choose your deployment method and launch **The Ark** to production. The challenge management system for your sophisticated multi-vector steganographic ARG is ready for collaborative puzzle-solving!

**Happy deploying! 🎉**