#!/bin/bash

echo "🚀 Vercel Deployment Verification"
echo "================================="

# Check if required files exist
echo "📁 Checking required files..."
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json missing"
    exit 1
fi

if [ -f "vercel.json" ]; then
    echo "✅ vercel.json exists"
else
    echo "❌ vercel.json missing"
    exit 1
fi

if [ -f "vite.config.ts" ]; then
    echo "✅ vite.config.ts exists"
else
    echo "❌ vite.config.ts missing"
    exit 1
fi

if [ -f ".vercelignore" ]; then
    echo "✅ .vercelignore exists"
else
    echo "⚠️  .vercelignore missing (optional but recommended)"
fi

# Check if backend files are removed
echo ""
echo "🧹 Checking backend cleanup..."
if [ ! -d "backend" ]; then
    echo "✅ backend/ directory removed"
else
    echo "❌ backend/ directory still exists"
fi

if [ ! -d "streamlit_app" ]; then
    echo "✅ streamlit_app/ directory removed"
else
    echo "❌ streamlit_app/ directory still exists"
fi

if [ ! -f "streamlit_app.py" ]; then
    echo "✅ streamlit_app.py removed"
else
    echo "❌ streamlit_app.py still exists"
fi

if [ ! -f "requirements.txt" ]; then
    echo "✅ requirements.txt removed"
else
    echo "❌ requirements.txt still exists"
fi

# Check build
echo ""
echo "🔨 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🎉 Ready for Vercel deployment!"
echo ""
echo "Next steps:"
echo "1. Add environment variables in Vercel dashboard:"
echo "   - VITE_GEMINI_API_KEY=your-api-key"
echo "   - VITE_RAG_URL=your-ngrok-url/rag"
echo "2. Deploy to Vercel"
echo "3. Update VITE_RAG_URL when your ngrok URL changes"
