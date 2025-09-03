#!/bin/bash

echo "💰 Finance Manager UI"
echo "====================="
echo ""
echo "Opening finance application in your default browser..."
echo "Make sure the API server is running on port 3000: npm run api"
echo ""

# Check if API server is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ API server is running on port 3000"
else
    echo "❌ API server is not running on port 3000"
    echo "Please start it with: npm run api"
    echo ""
    exit 1
fi

echo ""
echo "🚀 Opening UI in browser..."
echo "If the browser doesn't open automatically, visit: file://$(pwd)/public/index.html"
echo ""

# Try to open the HTML file in the default browser
if command -v xdg-open > /dev/null; then
    xdg-open "file://$(pwd)/public/index.html"
elif command -v open > /dev/null; then
    open "file://$(pwd)/public/index.html"
else
    echo "Could not automatically open browser. Please manually open:"
    echo "file://$(pwd)/public/index.html"
fi

echo ""
echo "🎉 Finance Manager UI should now be open in your browser!"
echo "The application will connect to the API server running on localhost:3000"
