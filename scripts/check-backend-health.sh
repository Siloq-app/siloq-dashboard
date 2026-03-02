#!/bin/bash

# Backend Health Check Script
# This script checks if the backend is running and accessible

BACKEND_URL=${BACKEND_API_URL:-"http://localhost:8000"}

echo "🔍 Checking backend health..."
echo "Backend URL: $BACKEND_URL"
echo ""

# Check if backend is responding
echo "📡 Testing backend connection..."
if curl -s --connect-timeout 5 "$BACKEND_URL/api/v1/auth/login/" > /dev/null 2>&1; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend is not responding"
    echo ""
    echo "🔧 Possible solutions:"
    echo "1. Start the backend server:"
    echo "   cd /path/to/backend && python manage.py runserver"
    echo ""
    echo "2. Check if the backend is running on a different port:"
    echo "   netstat -an | grep :800"
    echo ""
    echo "3. Verify the BACKEND_API_URL environment variable:"
    echo "   echo \$BACKEND_API_URL"
    echo ""
    echo "4. Update the .env.local file with the correct backend URL"
    exit 1
fi

echo ""
echo "🎯 Testing specific endpoints..."

# Test login endpoint
echo "Testing login endpoint..."
response=$(curl -s -w "%{http_code}" "$BACKEND_URL/api/v1/auth/login/" -o /dev/null)
if [ "$response" = "405" ] || [ "$response" = "200" ]; then
    echo "✅ Login endpoint accessible (HTTP $response)"
else
    echo "❌ Login endpoint not accessible (HTTP $response)"
fi

# Test register endpoint
echo "Testing register endpoint..."
response=$(curl -s -w "%{http_code}" "$BACKEND_URL/api/v1/auth/register/" -o /dev/null)
if [ "$response" = "405" ] || [ "$response" = "200" ]; then
    echo "✅ Register endpoint accessible (HTTP $response)"
else
    echo "❌ Register endpoint not accessible (HTTP $response)"
fi

echo ""
echo "🏁 Health check complete"
