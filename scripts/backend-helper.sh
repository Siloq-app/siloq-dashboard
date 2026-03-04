#!/bin/bash

# Backend Server Helper Script
# This script helps manage the backend server for the Siloq dashboard

set -e

BACKEND_DIR="../siloq-api"
BACKEND_PORT=8000
FRONTEND_DIR=$(pwd)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}🔍 Backend Server Status${NC}"
    echo "=========================="
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_backend() {
    print_status
    
    if curl -s "http://localhost:$BACKEND_PORT/api/v1/health/" > /dev/null 2>&1; then
        print_success "Backend server is running on port $BACKEND_PORT"
        return 0
    else
        print_error "Backend server is not running on port $BACKEND_PORT"
        return 1
    fi
}

start_backend() {
    print_status
    
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        echo "Please make sure the siloq-api repository is cloned next to this directory."
        exit 1
    fi
    
    echo "Changing to backend directory: $BACKEND_DIR"
    cd "$BACKEND_DIR"
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    echo "Activating virtual environment..."
    source venv/bin/activate
    
    # Install dependencies if needed
    if [ ! -f "requirements.txt" ] || [ requirements.txt -nt venv/pyvenv.cfg ]; then
        echo "Installing dependencies..."
        pip install -r requirements.txt
    fi
    
    # Start the backend server
    print_success "Starting backend server on port $BACKEND_PORT..."
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Run the server
    python manage.py runserver $BACKEND_PORT
}

stop_backend() {
    print_status
    
    # Find and kill any process using port 8000
    if lsof -ti:$BACKEND_PORT > /dev/null 2>&1; then
        echo "Stopping backend server on port $BACKEND_PORT..."
        kill $(lsof -ti:$BACKEND_PORT)
        print_success "Backend server stopped"
    else
        print_warning "No backend server found running on port $BACKEND_PORT"
    fi
}

show_help() {
    echo "Backend Server Helper Script"
    echo "============================"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  check     Check if backend server is running"
    echo "  start     Start the backend server"
    echo "  stop      Stop the backend server"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 check     # Check backend status"
    echo "  $0 start     # Start backend server"
    echo "  $0 stop      # Stop backend server"
}

# Main script logic
case "${1:-help}" in
    check)
        check_backend
        ;;
    start)
        if check_backend; then
            print_warning "Backend server is already running"
            echo "Use '$0 stop' to stop it first, or check if it's working properly."
        else
            start_backend
        fi
        ;;
    stop)
        stop_backend
        ;;
    help|*)
        show_help
        ;;
esac
