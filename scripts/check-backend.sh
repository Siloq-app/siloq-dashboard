#!/bin/bash

echo "🔍 Checking backend server status..."

# Check if backend is running on port 8000
if lsof -i :8000 > /dev/null 2>&1; then
    echo "✅ Backend server is running on port 8000"
    exit 0
else
    echo "❌ Backend server is NOT running on port 8000"
    echo ""
    echo "🚀 To fix 'Failed to fetch' errors, you need to start the backend server:"
    echo ""
    echo "   cd /path/to/backend/directory"
    echo "   python manage.py runserver 8000"
    echo ""
    echo "   Or if using Docker:"
    echo "   docker-compose up"
    echo ""
    echo "   Or if using a different port, update .env.local:"
    echo "   BACKEND_API_URL=http://localhost:YOUR_PORT"
    echo "   NEXT_PUBLIC_BACKEND_API_URL=http://localhost:YOUR_PORT"
    echo ""
    echo "📝 Current configuration:"
    echo "   BACKEND_API_URL=$BACKEND_API_URL"
    echo "   NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
    echo "   NEXT_PUBLIC_BACKEND_API_URL=$NEXT_PUBLIC_BACKEND_API_URL"
    exit 1
fi
