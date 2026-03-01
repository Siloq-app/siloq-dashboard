#!/bin/bash

echo "🧹 Cleaning up siloq-api and siloq-wordpress for production..."

# Function to safely remove files if they exist
safe_remove() {
    if [ -e "$1" ]; then
        echo "  Removing: $1"
        rm -rf "$1"
    else
        echo "  Skipping (not found): $1"
    fi
}

# Clean up siloq-api
echo ""
echo "📁 Cleaning siloq-api..."
cd /Users/jumar.juaton/Downloads/Developer/siloq-api

# Development and test files
safe_remove "__pycache__"
safe_remove "db.sqlite3"
safe_remove "pytest.ini"
safe_remove "test_settings.py"
safe_remove "venv"
safe_remove ".git"
safe_remove ".github"

# Development documentation (keep essential ones)
safe_remove "CLAUDE.md"
safe_remove "CONTENT_HUB_COMPLETE.md"
safe_remove "SUMMARY.md"
safe_remove "WORDPRESS_INTEGRATION.md"

# Development scripts
safe_remove "setup.bat"
safe_remove "setup.sh"
safe_remove "runserver_https.py"
safe_remove "runserver_ssl.py"

# Development environment files
safe_remove ".env.local"
safe_remove ".env.development"

# Logs and temporary files
safe_remove "*.log"
safe_remove "*.pyc"
safe_remove ".DS_Store"

# Clean up siloq-wordpress
echo ""
echo "📁 Cleaning siloq-wordpress..."
cd /Users/jumar.juaton/Downloads/Developer/siloq-wordpress

# Development files
safe_remove "__pycache__"
safe_remove ".git"
safe_remove ".github"
safe_remove ".DS_Store"
safe_remove "SECURITY_AUDIT.md"

# Logs and temporary files
safe_remove "*.log"
safe_remove "*.tmp"

echo ""
echo "✅ Production cleanup completed!"
echo ""
echo "📋 Summary of what was removed:"
echo "  siloq-api: Development files, test files, documentation, logs"
echo "  siloq-wordpress: Development files, security audit, logs"
echo ""
echo "🚀 Ready for production deployment!"
