#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install dependencies if a package.json exists
if [ -f "package.json" ]; then
  npm install
fi

# Install Python dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
  pip install -r requirements.txt
fi

# Install Python dependencies if pyproject.toml exists
if [ -f "pyproject.toml" ]; then
  pip install -e .
fi
