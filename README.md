# Storage Management Application

A full-stack storage management application built with FastAPI (Python backend) and React (frontend). This application provides CRUD operations for managing storage items with optional Entra ID authentication.

## Features

- **CRUD Operations**: Create, Read, Update, Delete storage items
- **React Frontend**: Modern single-page application with responsive design
- **FastAPI Backend**: High-performance async API with automatic OpenAPI documentation
- **Optional Authentication**: Configurable Entra ID integration
- **Database Support**: SQLite (default) or PostgreSQL
- **Containerized**: Docker support for easy deployment
- **Kubernetes Ready**: Helm chart for Kubernetes deployment

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (optional)

### Development Setup

1. **Clone the repository and navigate to the project directory**

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Install and build frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

4. **Setup environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

5. **Run the application**:
   ```bash
   python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Access the application**:
   - Frontend: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/api/health

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./storage_app.db` |
| `SECRET_KEY` | Secret key for JWT tokens | `your-secret-key-change-in-production` |
| `ENABLE_ENTRA_AUTH` | Enable Entra ID authentication | `false` |
| `AZURE_CLIENT_ID` | Azure client ID (if auth enabled) | - |
| `AZURE_CLIENT_SECRET` | Azure client secret (if auth enabled) | - |
| `AZURE_TENANT_ID` | Azure tenant ID (if auth enabled) | - |

### Entra ID Setup

To enable Entra ID authentication:

1. Register an application in Azure AD
2. Configure redirect URI: `http://localhost:8000/auth/callback`
3. Set the required environment variables
4. Set `ENABLE_ENTRA_AUTH=true`

## API Endpoints

The API follows the OpenAPI specification defined in `storage-api.yaml`:

- `GET /api/storage-items` - List storage items (with pagination and filtering)
- `POST /api/storage-items` - Create new storage item
- `GET /api/storage-items/{id}` - Get storage item by ID
- `PUT /api/storage-items/{id}` - Update storage item
- `DELETE /api/storage-items/{id}` - Delete storage item
- `GET /api/health` - Health check

## Docker Deployment

### Build and run with Docker:

```bash
# Build the image
docker build -t storage-app .

# Run the container
docker run -p 8000:8000 -e DATABASE_URL=sqlite:///./storage_app.db storage-app
```

### Using Docker Compose:

```yaml
version: '3.8'
services:
  storage-app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./storage_app.db
      - SECRET_KEY=your-secret-key
    volumes:
      - ./storage_data:/app/storage_data
```

## Kubernetes Deployment

Deploy using the provided Helm chart:

```bash
# Install the chart
helm install storage-app ./helm-chart/storage-app

# With custom values
helm install storage-app ./helm-chart/storage-app -f custom-values.yaml

# Upgrade
helm upgrade storage-app ./helm-chart/storage-app
```

## Development

### Frontend Development

For frontend development with hot reload:

```bash
cd frontend
npm start
```

The frontend will run on http://localhost:3000 and proxy API requests to the backend.

### Backend Development

Run the backend in development mode:

```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Database Migrations

For PostgreSQL deployments, you may want to use Alembic for migrations:

```bash
# Generate migration
alembic revision --autogenerate -m "Add initial tables"

# Apply migration
alembic upgrade head
```

## Project Structure

```
.
├── backend/
│   ├── __init__.py
│   ├── main.py          # FastAPI application
│   ├── config.py        # Configuration settings
│   ├── database.py      # Database models and connection
│   ├── models.py        # Pydantic models
│   ├── crud.py          # Database operations
│   └── auth.py          # Authentication logic
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── helm-chart/storage-app/  # Kubernetes Helm chart
├── Dockerfile
├── requirements.txt
├── storage-api.yaml     # OpenAPI specification
└── README.md
```

## Storage Item Schema

Each storage item contains:

- `id`: Unique identifier (UUID)
- `name`: Item name (required)
- `description`: Item description
- `category`: Item category (required)
- `quantity`: Current quantity (required)
- `unit_price`: Price per unit
- `location`: Storage location
- `tags`: Array of tags for categorization
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.