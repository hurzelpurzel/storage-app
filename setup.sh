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

# Check for PostgreSQL development packages (optional)
print_status "Checking system dependencies..."
pg_config_available=false
if command -v pg_config &> /dev/null; then
    print_status "PostgreSQL development tools found."
    pg_config_available=true
elif command -v apt-get &> /dev/null && dpkg -l | grep -q libpq-dev; then
    print_status "PostgreSQL development packages found."
    pg_config_available=true
elif command -v yum &> /dev/null && rpm -qa | grep -q postgresql-devel; then
    print_status "PostgreSQL development packages found."
    pg_config_available=true
elif command -v dnf &> /dev/null && rpm -qa | grep -q postgresql-devel; then
    print_status "PostgreSQL development packages found."
    pg_config_available=true
elif command -v brew &> /dev/null && brew list | grep -q postgresql; then
    print_status "PostgreSQL found via Homebrew."
    pg_config_available=true
else
    print_warning "PostgreSQL development headers not found."
    print_warning "PostgreSQL support will be disabled. SQLite will be used instead."
    print_warning "To enable PostgreSQL, install development headers:"
    print_warning "  Ubuntu/Debian: sudo apt-get install libpq-dev"
    print_warning "  Red Hat/CentOS: sudo yum install postgresql-devel"
    print_warning "  Fedora: sudo dnf install postgresql-devel"
    print_warning "  macOS: brew install postgresql"
fi

# Choose installation approach based on PostgreSQL availability
if [ "$pg_config_available" = true ]; then
    print_status "Installing Python dependencies (with PostgreSQL support)..."
    if pip install -r requirements.txt; then
        print_status "All dependencies installed successfully (including PostgreSQL support)."
    else
        print_warning "Failed to install with PostgreSQL. Falling back to SQLite..."
        pg_config_available=false
    fi
fi

if [ "$pg_config_available" = false ]; then
    print_status "Installing SQLite-only dependencies..."
    
    # Create temporary requirements file without PostgreSQL dependencies and with compatible versions
    cat > requirements_sqlite.txt << EOF
fastapi>=0.100.0
uvicorn[standard]>=0.20.0
sqlalchemy>=2.0.0
alembic>=1.12.0
pydantic>=2.10.0
pydantic-settings>=2.4.0
python-multipart>=0.0.6
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
msal>=1.25.0
httpx>=0.25.0
pytest>=7.4.0
pytest-asyncio>=0.21.0
EOF
    
    if pip install -r requirements_sqlite.txt; then
        print_status "SQLite-compatible dependencies installed successfully."
        print_warning "PostgreSQL support disabled. Using SQLite database."
        print_warning "Your .env file is already configured for SQLite by default."
        rm requirements_sqlite.txt
    else
        rm requirements_sqlite.txt
        print_error "Failed to install dependencies. Please check your Python environment."
        exit 1
    fi
fi

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