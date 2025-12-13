#!/bin/bash
# Bash script to start server with debug mode (Linux/macOS)
export DEBUG="express:*,mongo*"
echo "🔍 Debug mode enabled: $DEBUG"
echo "Starting server with Express and MongoDB debug logs..."
node server.js

