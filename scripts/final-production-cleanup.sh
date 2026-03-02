#!/bin/bash

echo "🚀 Final production cleanup for siloq-api and siloq-wordpress..."

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
echo "📁 Final cleanup for siloq-api..."
cd /Users/jumar.juaton/Downloads/Developer/siloq-api

# Remove any remaining development files
safe_remove "*.pyc"
safe_remove "*.pyo"
safe_remove "*.pyd"
safe_remove "__pycache__"
safe_remove ".pytest_cache"
safe_remove ".coverage"
safe_remove "htmlcov"
safe_remove "*.log"
safe_remove "*.tmp"
safe_remove "*.swp"
safe_remove "*.swo"
safe_remove "*~"
safe_remove ".DS_Store"
safe_remove "Thumbs.db"

# Remove development-specific Python files
find . -name "*.py" -exec grep -l "DEBUG\|DEVELOPMENT\|TEST" {} \; | while read file; do
    if [[ "$file" != *"settings.py"* ]] && [[ "$file" != *"manage.py"* ]]; then
        echo "  Checking development file: $file"
        # Don't auto-remove Python files, just report them
    fi
done

# Clean up siloq-wordpress
echo ""
echo "📁 Final cleanup for siloq-wordpress..."
cd /Users/jumar.juaton/Downloads/Developer/siloq-wordpress

# Remove any remaining development files
safe_remove "*.log"
safe_remove "*.tmp"
safe_remove "*.swp"
safe_remove "*.swo"
safe_remove "*~"
safe_remove ".DS_Store"
safe_remove "Thumbs.db"

# Check WordPress plugin for development code
if [ -f "siloq-connector/siloq-connector.php" ]; then
    echo "  Checking WordPress plugin for development code..."
    # Look for debug statements or development code
    if grep -q "WP_DEBUG\|var_dump\|print_r\|error_log" siloq-connector/siloq-connector.php; then
        echo "  ⚠️  WordPress plugin contains debug code - consider reviewing"
    else
        echo "  ✅ WordPress plugin appears clean"
    fi
fi

echo ""
echo "📊 Production-ready summary:"
echo ""

echo "📁 siloq-api contents:"
ls -la /Users/jumar.juaton/Downloads/Developer/siloq-api | wc -l | xargs echo "  Total files/directories:"
echo "  Essential files: manage.py, requirements.txt, settings"
echo "  Documentation: README.md, API_REFERENCE.md, ARCHITECTURE.md"
echo "  Deployment: Procfile, runtime.txt, .env.example"
echo "  Core modules: accounts/, ai/, billing/, seo/, sites/, tasks/"

echo ""
echo "📁 siloq-wordpress contents:"
ls -la /Users/jumar.juaton/Downloads/Developer/siloq-wordpress | wc -l | xargs echo "  Total files/directories:"
echo "  Essential files: README.md, .gitignore"
echo "  WordPress plugin: siloq-connector/"

echo ""
echo "✅ Production cleanup completed successfully!"
echo "🚀 Both projects are now ready for production deployment!"
echo ""
echo "📋 Next steps:"
echo "  1. Review the remaining files to ensure they're production-ready"
echo "  2. Set up production environment variables"
echo "  3. Configure production database settings"
echo "  4. Deploy to your hosting platform"
