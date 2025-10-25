# Vercel Deployment Guide

## Pre-deployment Checklist ✅

### Cleaned Up Files
- ✅ Removed `backend/` directory
- ✅ Removed `streamlit_app/` directory  
- ✅ Removed Python files (`streamlit_app.py`, `requirements.txt`, `environment.yml`, `generate_metadata.py`)
- ✅ Removed shell scripts (`setup-env.sh`, `test-*.sh`, `run-dev.sh`)
- ✅ Added `.vercelignore` file

### Frontend Configuration
- ✅ Updated `package.json` with `vercel-build` script
- ✅ Configured `vercel.json` for static build
- ✅ Environment variables properly configured with `VITE_` prefix

## Deployment Steps

### 1. Environment Variables in Vercel
Add these environment variables in your Vercel project settings:

```bash
VITE_GEMINI_API_KEY=AIzaSyBSSz2T8mW3kIkrJoA4Lwdnrzuz94aS_dY
VITE_RAG_URL=https://your-ngrok-url.ngrok.io/rag
```

**Important:** Replace `https://your-ngrok-url.ngrok.io/rag` with your actual ngrok URL from your backend server.

### 2. Deploy to Vercel

#### Option A: Connect GitHub Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub repository
4. Select this project
5. Add the environment variables above
6. Deploy

#### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 3. Update Backend URL
After deployment, if your ngrok URL changes, update the `VITE_RAG_URL` environment variable in your Vercel project settings.

## Project Structure (After Cleanup)

```
├── App.tsx                 # Main React app
├── package.json           # Dependencies & scripts
├── vercel.json           # Vercel configuration
├── vite.config.ts        # Vite configuration
├── .vercelignore         # Files to ignore during deployment
├── .env.example          # Environment template
├── components/           # React components
├── contexts/            # React contexts
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and services
├── llm/                 # LLM related code
├── stt/                 # Speech-to-text components
├── tts/                 # Text-to-speech components
├── public/              # Static assets
├── Knowledge_base/      # Knowledge base files
└── data/               # Data files
```

## Notes
- The app is configured as a Vite React application
- Backend is hosted separately via ngrok
- All API calls to the backend use the `VITE_RAG_URL` environment variable
- The Knowledge_base files are included but can be removed if not needed for the frontend

## Troubleshooting
- If build fails, check that all environment variables are properly set
- Ensure the ngrok URL is active and accessible
- Check browser console for any CORS or network issues
- Verify the Gemini API key is valid
