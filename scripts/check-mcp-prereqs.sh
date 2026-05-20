#!/usr/bin/env sh
# Verifies Docker is reachable (Docker Desktop running) for MCP servers that use `docker run`.
set -eu

if ! command -v docker >/dev/null 2>&1; then
  echo "check-mcp-prereqs: docker not found in PATH. Install Docker Desktop and ensure its CLI is on PATH." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "check-mcp-prereqs: cannot talk to the Docker daemon. Start Docker Desktop and wait until it is fully running, then retry." >&2
  exit 1
fi

echo "check-mcp-prereqs: Docker is OK."
exit 0
