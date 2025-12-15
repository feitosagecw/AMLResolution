#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
#  AML Case Resolution - Script de Inicialização
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "                    🛡️  AML Case Resolution - Iniciando..."
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Função para matar processo em uma porta
kill_port() {
    local port=$1
    local pid=$(lsof -t -i:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}⚠️  Matando processo na porta $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Função para verificar se npm está instalado
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm não encontrado. Por favor, instale o Node.js${NC}"
        exit 1
    fi
}

# Função para instalar dependências se necessário
install_deps() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir/node_modules" ]; then
        echo -e "${YELLOW}📦 Instalando dependências do $name...${NC}"
        cd "$dir"
        npm install
        cd "$PROJECT_DIR"
    fi
}

# Verificar npm
check_npm

# Matar processos existentes
echo -e "${BLUE}🔄 Verificando processos existentes...${NC}"
kill_port 3000
kill_port 3001

# Instalar dependências se necessário
echo -e "${BLUE}📦 Verificando dependências...${NC}"
install_deps "$PROJECT_DIR" "Frontend"
install_deps "$PROJECT_DIR/server" "Backend"

# Criar diretório de logs
LOGS_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOGS_DIR"

# Limpar logs antigos
> "$LOGS_DIR/frontend.log"
> "$LOGS_DIR/backend.log"

# Iniciar Backend
echo -e "${GREEN}🚀 Iniciando Backend (Express) na porta 3001...${NC}"
cd "$PROJECT_DIR/server"
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev > "$LOGS_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${CYAN}   PID do Backend: $BACKEND_PID${NC}"

# Aguardar backend iniciar
sleep 2

# Verificar se backend iniciou
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Falha ao iniciar o Backend. Verifique os logs em $LOGS_DIR/backend.log${NC}"
    cat "$LOGS_DIR/backend.log"
    exit 1
fi

# Iniciar Frontend
echo -e "${GREEN}🚀 Iniciando Frontend (Vite) na porta 3000...${NC}"
cd "$PROJECT_DIR"
npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${CYAN}   PID do Frontend: $FRONTEND_PID${NC}"

# Aguardar frontend iniciar
sleep 3

# Verificar se frontend iniciou
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Falha ao iniciar o Frontend. Verifique os logs em $LOGS_DIR/frontend.log${NC}"
    cat "$LOGS_DIR/frontend.log"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Salvar PIDs para o script de parada
echo "$FRONTEND_PID" > "$PROJECT_DIR/.frontend.pid"
echo "$BACKEND_PID" > "$PROJECT_DIR/.backend.pid"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Projeto iniciado com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📱 Frontend:${NC}  http://localhost:3000"
echo -e "${CYAN}🔧 Backend:${NC}   http://localhost:3001"
echo -e "${CYAN}📋 Logs:${NC}      $LOGS_DIR/"
echo ""
echo -e "${YELLOW}💡 Dicas:${NC}"
echo -e "   • Para parar: ${BLUE}./stop.sh${NC} ou ${BLUE}Ctrl+C${NC}"
echo -e "   • Ver logs frontend: ${BLUE}tail -f $LOGS_DIR/frontend.log${NC}"
echo -e "   • Ver logs backend:  ${BLUE}tail -f $LOGS_DIR/backend.log${NC}"
echo ""

# Função para cleanup ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Parando servidores...${NC}"
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    rm -f "$PROJECT_DIR/.frontend.pid" "$PROJECT_DIR/.backend.pid"
    echo -e "${GREEN}✅ Servidores parados${NC}"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# Mostrar logs em tempo real
echo -e "${BLUE}📜 Mostrando logs (Ctrl+C para parar)...${NC}"
echo ""
tail -f "$LOGS_DIR/backend.log" "$LOGS_DIR/frontend.log"



