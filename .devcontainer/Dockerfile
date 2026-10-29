FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9.15.0 @anthropic-ai/claude-code@2.1.312
