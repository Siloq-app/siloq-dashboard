# Backend Setup Guide

## Current Issue
The backend server is not running on port 8000, causing "Backend connection refused" errors.

## Quick Solution: Mock Data Mode
The application now includes mock data fallback, so you can continue development without the backend:

1. The frontend will automatically use mock data when the backend is unavailable
2. You'll see console messages like "[SitesService] Backend unavailable, using mock data"
3. The dashboard will load with sample data for development

## Backend Setup Options

### Option 1: Complete Backend Setup (Recommended)

1. **Clone the Backend Repository:**
   ```bash
   cd /Users/jumar.juaton/Downloads/Developer
   git clone <backend-repo-url> siloq-api
   ```

2. **Set Up Python Environment:**
   ```bash
   cd siloq-api
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Database Migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Start the Backend Server:**
   ```bash
   python manage.py runserver 8000
   ```

### Option 2: Simple Mock Server (Temporary)

If you need a quick mock server, create a simple Python server:

```bash
cd /Users/jumar.juaton/Downloads/Developer
mkdir mock-backend
cd mock-backend

# Create a simple server
cat > server.py << 'EOF'
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from datetime import datetime

class MockHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/v1/health/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'healthy'}).encode())
        elif self.path == '/api/v1/sites/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps([{
                'id': 999,
                'name': 'Demo Website',
                'url': 'https://example.com',
                'is_active': True,
                'page_count': 3,
                'api_key_count': 1,
                'last_synced_at': '2024-01-01T00:00:00Z',
                'created_at': '2024-01-01T00:00:00Z',
                'gsc_connected': False
            }]).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_HEAD(self):
        if self.path.startswith('/api/v1/'):
            self.send_response(200)
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8000), MockHandler)
    print("Mock backend server running on http://localhost:8000")
    print("Press Ctrl+C to stop")
    server.serve_forever()
EOF

# Start the mock server
python3 server.py
```

### Option 3: Use Docker (If Available)

If you have Docker, you can run a simple mock container:

```bash
docker run -d -p 8000:8000 --name mock-backend \
  python:3.9-alpine python -c "
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class MockHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/v1/'):
            self.send_response(200)
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_HEAD(self):
        if self.path.startswith('/api/v1/'):
            self.send_response(200)
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

HTTPServer(('0.0.0.0', 8000), MockHandler).serve_forever()
"
```

## Testing the Connection

Once the backend is running, test it:

```bash
# Check backend status
npm run backend:check

# Test health endpoint
curl http://localhost:8000/api/v1/health/

# Test sites endpoint
curl http://localhost:8000/api/v1/sites/
```

## Development Workflow

1. **Start Backend First:**
   ```bash
   # Terminal 1: Start backend
   cd ../siloq-api
   source venv/bin/activate
   python manage.py runserver 8000
   ```

2. **Start Frontend:**
   ```bash
   # Terminal 2: Start frontend
   cd siloq-dashboard
   npm run dev
   ```

3. **Verify Both Are Running:**
   ```bash
   npm run backend:check
   ```

## Current Status

- ✅ Frontend: Running on http://localhost:3000
- ❌ Backend: Not running on port 8000
- ✅ Mock Data: Available as fallback
- ✅ Error Handling: Robust backend connection detection

The application will continue to work with mock data until the backend is properly set up.
