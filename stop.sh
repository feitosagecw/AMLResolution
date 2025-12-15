#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
#  AML Case Resolution - Script de Parada
# ═══════════════════════════════════════════════════════════════════════════════

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "                    🛑 AML Case Resolution - Parando..."
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Função para matar processo em uma porta
kill_port() {
    local port=$1
    local pid=$(lsof -t -i:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}⚠️  Parando processo na porta $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
    else
        echo -e "${GREEN}✓ Porta $port já está livre${NC}"
    fi
}

# Matar por PIDs salvos
if [ -f "$PROJECT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_DIR/.frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Parando Frontend (PID: $FRONTEND_PID)${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    rm -f "$PROJECT_DIR/.frontend.pid"
fi

if [ -f "$PROJECT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_DIR/.backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Parando Backend (PID: $BACKEND_PID)${NC}"
        kill $BACKEND_PID 2>/dev/null || true
    fi
    rm -f "$PROJECT_DIR/.backend.pid"
fi

# Matar por porta (fallback)
kill_port 3000
kill_port 3001

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Todos os serviços foram parados${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"



