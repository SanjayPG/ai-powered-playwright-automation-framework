#!/bin/bash
# PreToolUse for Bash|PowerShell: block deleting protected folders.

cmd=$(jq -r '.tool_input.command // empty' | tr '[:upper:]' '[:lower:]')

# The JSON reason is what Claude reads, so it can explain the block to the user.
deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' "$1"
  exit 0
}

# Command position only (line start or after ; & |), so "format" doesn't match "rm".
delete_pattern='(^|[;&|] *)(rm|del|rmdir|rd|remove-item)( |$)'

# Folders that must never be deleted. Matched as whole path segments, so "my-tests-old" is fine.
protected_pattern='(^|[ /\\])(tests|pages|fixtures|test-data|\.git)([ /\\]|$)'

if printf '%s' "$cmd" | grep -qE "$delete_pattern" && printf '%s' "$cmd" | grep -qE "$protected_pattern"; then
  deny "Blocked: tests, pages, fixtures, test-data and .git are protected from deletion."
fi
