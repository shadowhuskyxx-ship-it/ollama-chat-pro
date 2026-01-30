#!/bin/bash
cd /home/user8397/clawd/ollama-chat-pro

# Kill existing
pkill -f "next start.*3456" 2>/dev/null
pkill -f cloudflared 2>/dev/null
sleep 2

# Start Next.js
PORT=3456 node_modules/.bin/next start -p 3456 &
NEXT_PID=$!
echo "Next.js PID: $NEXT_PID"

sleep 3

# Start tunnel and keep it alive
while true; do
    /home/user8397/clawd/cloudflared tunnel --url http://localhost:3456 2>&1 | tee tunnel.log &
    TUNNEL_PID=$!
    
    # Wait for URL
    sleep 5
    URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' tunnel.log | tail -1)
    echo "=========================================="
    echo "PUBLIC URL: $URL"
    echo "=========================================="
    
    # Wait for tunnel to die, then restart
    wait $TUNNEL_PID
    echo "Tunnel died, restarting in 3s..."
    sleep 3
done
