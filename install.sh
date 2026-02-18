#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Instalasi Mailing List CLI ===${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="$SCRIPT_DIR/mailing_list.py"
TARGET_LINK="/usr/local/bin/mailinglist"

if [ ! -f "$SOURCE_FILE" ]; then
    echo -e "${RED}Error: mailing_list.py tidak ditemukan${NC}"
    exit 1
fi

if ! python3 -m pip --version &> /dev/null; then
    echo -e "${BLUE}Menginstal python3-pip...${NC}"
    sudo apt update && sudo apt install -y python3-pip
fi

echo -e "${BLUE}Menginstal dependencies...${NC}"
python3 -m pip install reportlab pandas openpyxl pillow --break-system-packages 2>/dev/null || \
python3 -m pip install reportlab pandas openpyxl pillow

chmod +x "$SOURCE_FILE"

echo -e "${BLUE}Membuat symlink global...${NC}"
if [ -L "$TARGET_LINK" ] || [ -e "$TARGET_LINK" ]; then
    sudo rm "$TARGET_LINK"
fi

if sudo ln -s "$SOURCE_FILE" "$TARGET_LINK"; then
    echo -e "${GREEN}Instalasi berhasil!${NC}"
    echo -e "Jalankan dengan: ${BLUE}mailinglist${NC}"
else
    echo -e "${RED}Gagal membuat symlink${NC}"
    exit 1
fi
