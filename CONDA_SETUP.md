# Conda Environment Setup Instructions

This project now uses a dedicated conda environment to ensure consistent dependencies and isolation.

## Quick Setup

1. **Run the setup script** (recommended):
   ```bash
   ./setup-env.sh
   ```

2. **Start the development server**:
   ```bash
   ./run-dev.sh
   ```

## Manual Setup

If you prefer to set up manually:

1. **Create the conda environment**:
   ```bash
   conda env create -f environment.yml
   ```

2. **Activate the environment**:
   ```bash
   conda activate sampath-bank-env
   ```

3. **Install npm dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## Environment Management

- **Activate environment**: `conda activate sampath-bank-env`
- **Deactivate environment**: `conda deactivate`
- **Remove environment**: `conda env remove -n sampath-bank-env`
- **Export environment**: `conda env export > environment.yml`

## Environment Details

- **Environment name**: `sampath-bank-env`
- **Python version**: 3.11
- **Node.js version**: 24.4.1
- **npm version**: 11.4.2

## Project Configuration

Make sure your `GEMINI_API_KEY` is set in `.env.local` file before running the application.

## Benefits of Using Conda Environment

1. **Isolation**: Dependencies are isolated from your system packages
2. **Reproducibility**: Environment can be recreated exactly using `environment.yml`
3. **Cross-platform**: Works consistently across different operating systems
4. **Version management**: Both Python and Node.js versions are managed together
5. **Easy cleanup**: Environment can be completely removed without affecting system
