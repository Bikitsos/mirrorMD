#!/bin/bash

# MirrorMD Start Script
# This script starts the MirrorMD application with Cloudflare Tunnel

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  MirrorMD - Markdown to PDF Converter"
echo "========================================"
echo ""

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}Error: Podman is not installed.${NC}"
    echo "Please install Podman first: https://podman.io/getting-started/installation"
    exit 1
fi

# Determine compose command (podman compose vs podman-compose)
if podman compose version &> /dev/null; then
    COMPOSE_CMD="podman compose"
elif command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
else
    echo -e "${RED}Error: Neither 'podman compose' nor 'podman-compose' is available.${NC}"
    echo "Install with: pip install podman-compose"
    echo "Or use Podman 4.1+ which includes 'podman compose'"
    exit 1
fi

echo "Using: $COMPOSE_CMD"
echo ""

# Check if podman machine is running (for macOS/Windows)
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "msys"* ]]; then
    if ! podman machine info &> /dev/null; then
        echo -e "${YELLOW}Starting Podman machine...${NC}"
        podman machine start || {
            echo -e "${RED}Failed to start Podman machine.${NC}"
            echo "Try: podman machine init && podman machine start"
            exit 1
        }
    fi
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found.${NC}"
    echo ""
    if [ -f ".env.example" ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${RED}Please edit .env and add your CLOUDFLARE_TUNNEL_TOKEN${NC}"
        echo ""
        echo "To get a tunnel token:"
        echo "1. Go to https://one.dash.cloudflare.com/"
        echo "2. Navigate to Zero Trust -> Networks -> Tunnels"
        echo "3. Create a new tunnel"
        echo "4. Copy the token and paste it in .env"
        echo ""
        exit 1
    else
        echo -e "${RED}Error: Neither .env nor .env.example found.${NC}"
        exit 1
    fi
fi

# Load environment variables
source .env

# Verify token is set
if [ -z "$CLOUDFLARE_TUNNEL_TOKEN" ] || [ "$CLOUDFLARE_TUNNEL_TOKEN" == "your_tunnel_token_here" ]; then
    echo -e "${RED}Error: CLOUDFLARE_TUNNEL_TOKEN is not set in .env${NC}"
    echo ""
    echo "Please edit .env and add your Cloudflare Tunnel token."
    exit 1
fi

# Create temp directory if it doesn't exist
mkdir -p temp

# Stop existing containers if running
echo "Stopping existing containers..."
$COMPOSE_CMD down 2>/dev/null || true

# Build and start containers
echo ""
echo "Building and starting containers..."
echo ""

$COMPOSE_CMD up --build -d

echo ""
echo -e "${GREEN}========================================"
echo "  MirrorMD is now running!"
echo "========================================${NC}"
echo ""
echo "Access your app through your Cloudflare Tunnel URL"
echo "configured in the Cloudflare Zero Trust dashboard."
echo ""
echo "Useful commands:"
echo "  View logs:     $COMPOSE_CMD logs -f"
echo "  Stop app:      $COMPOSE_CMD down"
echo "  Restart app:   $COMPOSE_CMD restart"
echo ""
