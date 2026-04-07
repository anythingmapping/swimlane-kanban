#!/bin/bash
VAULT="/mnt/c/Users/MOSL/Documents/Commonplace"
DEST="$VAULT/.obsidian/plugins/swimlane-kanban"

mkdir -p "$DEST"
cp main.js styles.css manifest.json "$DEST"
echo "Deployed to $DEST"
