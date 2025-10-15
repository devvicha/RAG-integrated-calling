#!/bin/bash

# Script to set up the conda environment and install dependencies
# Usage: ./setup-env.sh

echo "🔄 Setting up conda environment for Sampath Bank Customer Care..."

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "❌ Conda is not installed. Please install Anaconda or Miniconda first."
    exit 1
fi

# Activate conda base environment
source ~/anaconda3/etc/profile.d/conda.sh

# Check if environment already exists
if conda env list | grep -q "sampath-bank-env"; then
    echo "✅ Environment 'sampath-bank-env' already exists"
    conda activate sampath-bank-env
else
    echo "🔧 Creating new conda environment from environment.yml..."
    conda env create -f environment.yml
    conda activate sampath-bank-env
fi

echo "📦 Installing npm dependencies..."
npm install

echo "✅ Setup complete!"
echo "📋 Environment details:"
echo "  - Environment name: sampath-bank-env"
echo "  - Node.js version: $(node --version)"
echo "  - npm version: $(npm --version)"
echo "  - Python version: $(python --version)"
echo ""
echo "🚀 To start the development server, run:"
echo "  ./run-dev.sh"
echo ""
echo "🔧 To activate the environment manually:"
echo "  conda activate sampath-bank-env"
