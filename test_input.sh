#!/usr/bin/env bash

# Colors
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${CYAN}🧪 Testing keyboard input handling...${NC}"
echo -e "Press ${RED}1${NC}, ${BLUE}2${NC}, ${MAGENTA}3${NC}, ${CYAN}4${NC}, or ${YELLOW}h${NC} to test. Press ${RED}q${NC} to quit."
echo -e "─────────────────────────────────────────────────────"

# Test function
test_open_url() {
    local name=$1
    echo -e "${GREEN}✅ Would open $name${NC}"
}

test_open_cursor() {
    local name=$1
    echo -e "${GREEN}✅ Would open $name in Cursor${NC}"
}

# Simple input handling test
while true; do
    read -n 1 -s key
    case $key in
        '1')
            echo -e "\n${YELLOW}[🎯 TEST]${NC} Backend API browser test"
            test_open_url "Backend API"
            ;;
        '2')
            echo -e "\n${YELLOW}[🎯 TEST]${NC} Frontend App browser test"
            test_open_url "Frontend App"
            ;;
        '3')
            echo -e "\n${YELLOW}[🎯 TEST]${NC} Backend Cursor IDE test"
            test_open_cursor "Backend Project"
            ;;
        '4')
            echo -e "\n${YELLOW}[🎯 TEST]${NC} Frontend Cursor IDE test"
            test_open_cursor "Frontend Project"
            ;;
        'h'|'H')
            echo -e "\n${CYAN}[📋 TEST HELP]${NC} This is the help test"
            ;;
        'q'|'Q')
            echo -e "\n${GREEN}✅ Input test completed successfully!${NC}"
            exit 0
            ;;
        *)
            echo -e "\n${RED}❌ Unknown key: '$key' (try 1,2,3,4,h,q)${NC}"
            ;;
    esac
done
