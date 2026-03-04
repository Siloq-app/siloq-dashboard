# Backend Server Management

This document provides instructions for managing the backend server for the Siloq dashboard.

## Quick Start

### Check Backend Status
```bash
npm run backend:check
```

### Start Backend Server
```bash
npm run backend:start
```

### Stop Backend Server
```bash
npm run backend:stop
```

## Available Scripts

- `npm run backend` - Show backend helper menu
- `npm run backend:check` - Check if backend is running on port 8000
- `npm run backend:start` - Start the backend server
- `npm run backend:stop` - Stop the backend server
- `npm run check-backend` - Alternative backend check script

## Manual Backend Setup

If the automated script doesn't work, you can start the backend manually:

1. Navigate to the backend directory:
   ```bash
   cd ../siloq-api
   ```

2. Create and activate virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the server:
   ```bash
   python manage.py runserver 8000
   ```

## Troubleshooting

### Backend Connection Errors

If you see errors like:
- `ECONNREFUSED`
- `Backend server unavailable`
- `Connection refused`

**Solution**: Start the backend server using `npm run backend:start`

### Port Already in Use

If port 8000 is already in use:
```bash
npm run backend:stop
```
Then try starting again.

### Backend Directory Not Found

If you get an error about the backend directory not being found:
1. Make sure the `siloq-api` repository is cloned next to this directory
2. The structure should be:
   ```
   /Users/jumar.juaton/Downloads/Developer/
   ├── siloq-dashboard/
   └── siloq-api/
   ```

## Error Handling

The application includes robust error handling for backend connection issues:

1. **Automatic Detection**: The frontend automatically detects when the backend is unavailable
2. **Graceful Degradation**: The app continues to function with mock data when possible
3. **Clear Error Messages**: Users see helpful error messages instead of cryptic errors
4. **Detailed Logging**: Developers get detailed error information in the console

## Development Workflow

1. Start the backend first:
   ```bash
   npm run backend:start
   ```

2. In a new terminal, start the frontend:
   ```bash
   npm run dev
   ```

3. Check both are running:
   ```bash
   npm run backend:check
   # Should show "Backend server is running on port 8000"
   ```

## Health Check Endpoint

The backend should have a health check endpoint at:
```
GET http://localhost:8000/api/v1/health/
```

This endpoint is used by the frontend to verify backend connectivity.
