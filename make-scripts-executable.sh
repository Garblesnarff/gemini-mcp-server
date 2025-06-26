#!/bin/bash

# Make all scripts executable
chmod +x scripts/*.js

echo "✅ Scripts are now executable"
echo ""
echo "You can now run:"
echo "  npm run inspect   - View current preferences"
echo "  npm run migrate   - Migrate external preferences"  
echo "  npm run clean     - Clean/reset preferences"
