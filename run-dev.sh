#!/bin/bash

# Script to activate the conda environment and run the development server
# Usage: ./run-dev.sh

echo "🔄 Activating conda environment: sampath-bank-env"
source ~/anaconda3/etc/profile.d/conda.sh
conda activate sampath-bank-env

echo "✅ Environment activated"
echo "📦 Node.js version: $(node --version)"
echo "📦 npm version: $(npm --version)"
echo "🐍 Python version: $(python --version)"

echo "🚀 Starting development server..."
npm run dev
