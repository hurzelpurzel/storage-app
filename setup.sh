#!/bin/bash

# Storage Management Application Setup Script

echo "🚀 Setting up Storage Management Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "storage-api.yaml" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

print_status "Installing Python dependencies..."
pip install -r requirements.txt || {
    print_error "Failed to install Python dependencies"
    exit 1
}

print_status "Installing Node.js dependencies..."
cd frontend || {
    print_error "Frontend directory not found"
    exit 1
}

npm install || {
    print_error "Failed to install Node.js dependencies"
    exit 1
}

print_status "Building React frontend..."
npm run build || {
    print_error "Failed to build frontend"
    exit 1
}

cd ..

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating environment file..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before running the application"
fi

# Create database directory
mkdir -p data

print_status "Setup completed successfully! 🎉"
echo ""
echo "To start the application:"
echo "  python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"
echo ""
echo "Access points:"
echo "  - Application: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - Health Check: http://localhost:8000/api/health"
echo ""
echo "For development:"
echo "  - Frontend (hot reload): cd frontend && npm start"
echo "  - Backend (hot reload): python -m uvicorn backend.main:app --reload"