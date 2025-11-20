#!/bin/bash

echo "🚀 Attempting Netlify API Deployment..."
echo ""

# Check for token
if [ -z "$NETLIFY_TOKEN" ]; then
    echo "⚠️  NETLIFY_TOKEN not found."
    echo ""
    echo "📋 To deploy, please provide your token:"
    echo "   1. Get token: https://app.netlify.com/user/applications"
    echo "   2. Export: export NETLIFY_TOKEN=your_token"
    echo "   3. Run: $0"
    echo ""
    echo "💡 OR use manual deployment:"
    echo "   → https://app.netlify.com/drop"
    echo "   → Drag the 'dist' folder"
    exit 1
fi

echo "✅ Token found! Deploying..."
echo ""

# Create zip
echo "📦 Creating deployment package..."
cd dist && zip -r ../deploy.zip . > /dev/null 2>&1 && cd ..

# Try to list sites and get the first one
echo "🔍 Finding site..."
SITES=$(curl -s -H "Authorization: Bearer $NETLIFY_TOKEN" \
    "https://api.netlify.com/api/v1/sites")

SITE_ID=$(echo "$SITES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$SITE_ID" ]; then
    echo "⚠️  No sites found. Creating new site..."
    
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $NETLIFY_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"dynamic-payment-links"}' \
        "https://api.netlify.com/api/v1/sites")
    
    SITE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$SITE_ID" ]; then
        echo "❌ Failed to create site"
        exit 1
    fi
    
    echo "✅ Site created!"
fi

echo "📍 Site ID: $SITE_ID"
echo ""

# Deploy
echo "🚀 Deploying to Netlify..."
DEPLOY_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $NETLIFY_TOKEN" \
    -H "Content-Type: application/zip" \
    --data-binary "@deploy.zip" \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys")

DEPLOY_URL=$(echo "$DEPLOY_RESPONSE" | grep -o '"deploy_url":"[^"]*"' | cut -d'"' -f4)
DEPLOY_STATE=$(echo "$DEPLOY_RESPONSE" | grep -o '"state":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$DEPLOY_URL" ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 Your site is LIVE:"
    echo "   $DEPLOY_URL"
    echo ""
    echo "📊 Status: $DEPLOY_STATE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
else
    echo "❌ Deployment failed"
    echo "Response: $DEPLOY_RESPONSE"
fi

# Cleanup
rm -f deploy.zip

