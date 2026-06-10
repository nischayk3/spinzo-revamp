#!/bin/bash
# Spinzo Start Services script
# Starts all services using built JS files (lightweight, no watch file table overflow)

export NODE_ENV=development
export DATABASE_URL="postgresql://neondb_owner:npg_ObcwJ30zHgxr@ep-blue-mountain-aofqk5ox.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
export FIREBASE_SERVICE_ACCOUNT_PATH="../../firebase-service-account.json"
export DEV_BYPASS_FIREBASE=true
export JWT_SECRET=supersecretjwtkey

echo "🚀 Starting all Spinzo microservices..."

# Start auth-service (3001)
PORT=3001 node apps/auth-service/dist/apps/auth-service/src/main.js > /tmp/auth-service.log 2>&1 &
AUTH_PID=$!

# Start user-service (3002)
PORT=3002 node apps/user-service/dist/main.js > /tmp/user-service.log 2>&1 &
USER_PID=$!

# Start order-service (3003)
PORT=3003 node apps/order-service/dist/main.js > /tmp/order-service.log 2>&1 &
ORDER_PID=$!

# Start subscription-service (3004)
PORT=3004 node apps/subscription-service/dist/main.js > /tmp/subscription-service.log 2>&1 &
SUB_PID=$!

# Start admin-service (3005)
PORT=3005 node apps/admin-service/dist/main.js > /tmp/admin-service.log 2>&1 &
ADMIN_PID=$!

# Start gateway (3000)
PORT=3000 node apps/gateway/dist/apps/gateway/src/main.js > /tmp/gateway.log 2>&1 &
GATEWAY_PID=$!

echo "📋 Services started in background with PIDs:"
echo "   Gateway (3000): $GATEWAY_PID"
echo "   Auth Service (3001): $AUTH_PID"
echo "   User Service (3002): $USER_PID"
echo "   Order Service (3003): $ORDER_PID"
echo "   Subscription Service (3004): $SUB_PID"
echo "   Admin Service (3005): $ADMIN_PID"

# Wait a few seconds for services to listen
sleep 5

# Check if processes are still running
for pid in $GATEWAY_PID $AUTH_PID $USER_PID $ORDER_PID $SUB_PID $ADMIN_PID; do
  if ! kill -0 $pid 2>/dev/null; then
    echo "⚠️ PID $pid failed to start. Check /tmp logs."
  fi
done

echo "✅ Ready!"
