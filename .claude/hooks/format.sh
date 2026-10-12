#!/bin/bash
# PostToolUse for Edit|Write: format the file Claude just edited.
# Runs after the edit succeeded, so there is nothing to allow or deny.
path=$(jq -r '.tool_input.file_path // empty')

# TypeScript only, so Prettier never touches .md, .sh or .json files.
case "$path" in
  *.ts)
    cp "$path" "$path.before"   # DEMO ONLY: keep the messy version, remove after recording
    npx prettier --write "$path"
    ;;
esac
