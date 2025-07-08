# Vercel Deployment Guide

## Method 1: Web Interface (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import `jawahirenakash/figma-to-code`
4. Configure:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

## Method 2: Direct URL Import

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Click "Import Third-Party Git Repository"
4. Enter: `https://github.com/jawahirenakash/figma-to-code`
5. Follow setup process

## Method 3: GitHub Integration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Click "Configure GitHub App"
4. Grant repository access
5. Select `figma-to-code` repository

## Environment Variables

Add this environment variable in Vercel:
- Name: `VITE_BACKEND_URL`
- Value: `http://localhost:4000` (update after backend deployment)

## Troubleshooting

If repository doesn't appear:
1. Ensure repository is public (✅ Done)
2. Refresh Vercel dashboard
3. Clear browser cache
4. Try incognito mode
5. Reconnect GitHub integration

## Repository Status

- ✅ Repository: `jawahirenakash/figma-to-code`
- ✅ Visibility: Public
- ✅ Framework: Vite (React + TypeScript)
- ✅ Ready for deployment 