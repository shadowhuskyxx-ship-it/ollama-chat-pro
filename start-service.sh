#!/bin/bash
# Ollama Chat Pro - Production Service

cd /home/user8397/clawd/ollama-chat-pro

# Kill any existing instances
pkill -f "next start.*3456" 2>/dev/null || true
pkill -f "cloudflared.*ollama-chat" 2>/dev/null || true

# Start Next.js production server
export NODE_ENV=production
export PORT=3456
nohup npm run start -- -p 3456 > /home/user8397/clawd/ollama-chat-pro/app.log 2>&1 &
echo "Next.js started on port 3456 (PID: $!)"

sleep 3

# Start Cloudflare tunnel
nohup /home/user8397/clawd/cloudflared tunnel --url http://localhost:3456 > /home/user8397/clawd/ollama-chat-pro/tunnel.log 2>&1 &
echo "Cloudflare tunnel started (PID: $!)"

sleep 5

# Extract and display the URL
grep -o 'https://[^[:space:]]*\.trycloudflare\.com' /home/user8397/clawd/ollama-chat-pro/tunnel.log | head -1
