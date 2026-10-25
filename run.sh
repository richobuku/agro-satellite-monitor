#!/bin/bash
# Start AgroPulse Satellite Field Monitor (Backend + Frontend)
export PATH="/usr/local/bin:$PATH"
cd "$(dirname "$0")"

# Kill any zombie process holding ports 5050 or 3030
lsof -ti :5050,3030 | xargs kill -9 2>/dev/null || true

echo "🌱 Starting AgroPulse Satellite Backend on http://localhost:5050..."
node backend/server.js &
BACKEND_PID=$!

echo "🛰️ Starting AgroPulse Satellite Frontend on http://localhost:3030..."
cd frontend && npm run dev -- --host 0.0.0.0 --port 3030 &
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "🛑 Stopping AgroPulse..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "✅ AgroPulse is running:"
echo "   👉 Frontend: http://localhost:3030"
echo "   👉 Backend API: http://localhost:5050"
echo "🌐 Opening http://localhost:3030 in your default browser..."

# Auto-open browser on macOS or Linux
sleep 1.2
if command -v open >/dev/null 2>&1; then
  open "http://localhost:3030"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:3030"
fi

echo "Press Ctrl+C to stop."

wait
