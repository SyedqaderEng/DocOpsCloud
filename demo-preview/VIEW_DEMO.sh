#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     DocOpsCloud - Complete UI/UX Demo                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Choose how to view the demo:"
echo ""
echo "1) Open demo-index.html (All pages overview)"
echo "2) Open index.html (Landing page - start journey)"
echo "3) Start local server (recommended for best experience)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
  1)
    echo "Opening demo index..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
      open demo-index.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      xdg-open demo-index.html
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
      start demo-index.html
    fi
    ;;
  2)
    echo "Opening landing page..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
      open index.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      xdg-open index.html
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
      start index.html
    fi
    ;;
  3)
    echo "Starting local server..."
    echo ""
    echo "Server running at: http://localhost:8000"
    echo "Opening browser..."
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""

    # Open browser after a short delay
    (sleep 2 && \
      if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:8000/demo-index.html
      elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:8000/demo-index.html
      elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        start http://localhost:8000/demo-index.html
      fi
    ) &

    # Start server
    python3 -m http.server 8000 2>/dev/null || python -m http.server 8000
    ;;
  *)
    echo "Invalid choice. Please run the script again."
    ;;
esac
