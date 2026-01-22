#!/bin/bash

# MirrorMD Local Start Script
# This script starts the MirrorMD application locally with port 3000 exposed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "========================================"
echo "  MirrorMD - Local Development Mode"
echo "========================================"
echo ""

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}Error: Podman is not installed.${NC}"
    echo "Please install Podman first: https://podman.io/getting-started/installation"
    exit 1
fi

# Determine compose command
COMPOSE_CMD=""

if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
elif podman compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="podman compose"
fi

if [ -z "$COMPOSE_CMD" ]; then
    echo -e "${RED}Error: No compose provider found.${NC}"
    echo ""
    echo "Please install podman-compose:"
    echo "  pip install podman-compose"
    exit 1
fi

echo "Using: $COMPOSE_CMD"
echo ""

# Check if podman machine is running (for macOS/Windows)
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "cygwin"* ]]; then
    if ! podman machine inspect &> /dev/null; then
        echo -e "${YELLOW}Starting Podman machine...${NC}"
        podman machine start || true
    fi
fi

# Build and start the container
echo "Building and starting MirrorMD..."
$COMPOSE_CMD -f podman-compose.local.yml up -d --build

echo ""
echo -e "${GREEN}MirrorMD is running!${NC}"
echo ""
echo -e "Open in browser: ${CYAN}http://localhost:3000${NC}"
echo ""
echo "To stop: ./stop-local.sh"
