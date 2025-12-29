#!/bin/bash
# File: pm2-setup.sh

set -e  # Exit on error

echo "🎵 Songbird Frontend PM2 Setup Script"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed${NC}"
    echo "Install it globally with: npm install -g pm2"
    exit 1
fi

echo -e "${GREEN}✓ PM2 is installed${NC}"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Warning: Node.js version should be 18 or higher${NC}"
    echo "Current version: $(node -v)"
    echo ""
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo "Copy .env.example to .env and configure it"
    read -p "Do you want to copy .env.example to .env now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file${NC}"
        echo -e "${YELLOW}⚠️  Don't forget to edit .env with your configuration${NC}"
    fi
    echo ""
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  Warning: .env.production file not found${NC}"
    read -p "Do you want to copy .env to .env.production? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env .env.production
        echo -e "${GREEN}✓ Created .env.production file${NC}"
        echo -e "${YELLOW}⚠️  Don't forget to edit .env.production with production values${NC}"
    fi
    echo ""
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
fi

# Build the application
echo "🔨 Building Next.js application..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Install PM2 log rotation module
echo "📝 Setting up PM2 log rotation..."
if pm2 describe pm2-logrotate &> /dev/null; then
    echo -e "${GREEN}✓ PM2 log rotation already installed${NC}"
else
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 100M
    pm2 set pm2-logrotate:retain 10
    pm2 set pm2-logrotate:compress true
    pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
    echo -e "${GREEN}✓ PM2 log rotation configured${NC}"
fi
echo ""

# Ask if user wants to setup auto-startup
read -p "Do you want to setup PM2 to auto-start on system reboot? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Setting up auto-startup..."
    pm2 startup | tail -n 1 | bash
    echo -e "${GREEN}✓ Auto-startup configured${NC}"
    echo ""
fi

# Ask which mode to start
echo "Which mode do you want to start?"
echo "1) Production (optimized fork mode with zero-downtime reload)"
echo "2) Development (single instance with watch)"
echo "3) Skip starting (manual start later)"
read -p "Choose [1-3]: " -n 1 -r
echo
echo ""

case $REPLY in
    1)
        echo "🚀 Starting in PRODUCTION mode (fork)..."
        pm2 start ecosystem.config.cjs --only songbird-frontend-prod --env production
        pm2 save
        echo -e "${GREEN}✓ Started in production mode (fork)${NC}"
        ;;
    2)
        echo "🚀 Starting in DEVELOPMENT mode..."
        pm2 start ecosystem.config.cjs --only songbird-frontend-dev --env development
        pm2 save
        echo -e "${GREEN}✓ Started in development mode${NC}"
        ;;
    3)
        echo "⏭️  Skipping start"
        echo "You can start manually with:"
        echo "  Production: npm run pm2:start"
        echo "  Development: npm run pm2:dev"
        ;;
    *)
        echo -e "${YELLOW}⚠️  Invalid choice, skipping start${NC}"
        ;;
esac

echo ""
echo "============================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "============================"
echo ""
echo "Useful commands:"
echo "  npm run pm2:status     - View process status"
echo "  npm run pm2:logs       - View logs"
echo "  npm run pm2:monit      - Monitor resources"
echo "  npm run deploy         - Deploy updates (zero-downtime)"
echo ""
echo "See PM2_GUIDE.md for detailed documentation"
echo ""
