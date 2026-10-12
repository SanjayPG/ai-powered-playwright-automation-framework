#!/bin/bash
# Runs for Read|Edit|Write. Blocks real .env files, allows templates.
path=$(jq -r '.tool_input.file_path // empty')
path=${path//\\//}   # Windows backslashes to slashes
name=$(printf '%s' "${path##*/}" | tr '[:upper:]' '[:lower:]')

case "$name" in
  .env.example|.env.sample) exit 0 ;;   # templates hold no secrets
  .env|.env.*)
    echo "Blocked: $name may contain secrets. Use .env.example instead." >&2
    exit 2
    ;;
esac
exit 0
