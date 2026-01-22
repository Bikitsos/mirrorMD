#!/bin/bash

# MirrorMD Stop Script
# This script stops the MirrorMD application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  MirrorMD - Stopping Application"
echo "========================================"
echo ""

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}Error: Podman is not installed.${NC}"
    exit 1
fi

# Determine compose command (podman-compose or podman compose with provider)
COMPOSE_CMD=""

# First check for podman-compose (most reliable)
if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
# Then check if podman compose works with a provider
elif podman compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="podman compose"
fi

if [ -z "$COMPOSE_CMD" ]; then
    echo -e "${RED}Error: No compose provider found.${NC}"
    echo ""
    echo "Please install podman-compose:"
    echo ""
    echo "  Fedora/RHEL/CentOS:"
    echo "    sudo dnf install podman-compose"
    echo ""
    echo "  Ubuntu/Debian:"
    echo "    sudo apt install podman-compose"
    echo ""
    echo "  pip (any system):"
    echo "    pip install podman-compose"
    echo ""
    exit 1
fi

echo "Using: $COMPOSE_CMD"
echo ""

# Stop the containers
echo "Stopping MirrorMD containers..."
$COMPOSE_CMD down

echo ""
echo -e "${GREEN}MirrorMD stopped successfully!${NC}"
echo ""
