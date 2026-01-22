#!/bin/bash

# MirrorMD Local Stop Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Stopping MirrorMD (local)..."

# Determine compose command
COMPOSE_CMD=""
if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
elif podman compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="podman compose"
fi

if [ -z "$COMPOSE_CMD" ]; then
    echo -e "${RED}Error: No compose provider found.${NC}"
    exit 1
fi

$COMPOSE_CMD -f podman-compose.local.yml down

echo -e "${GREEN}MirrorMD stopped.${NC}"
