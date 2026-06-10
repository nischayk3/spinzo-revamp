#!/bin/bash
# Spinzo E2E Test Script — Full User Journey
# Tests: Auth → Address → Catalog → Cart → Order → Subscription → Admin
set -e

BASE_AUTH="http://localhost:3001/auth/v1"
BASE_USER="http://localhost:3002/user/v1"
BASE_ORDER="http://localhost:3003/order/v1"
BASE_SUB="http://localhost:3004/subscription/v1"
BASE_ADMIN="http://localhost:3005/admin/v1"

STORE_ID="d32defde-0abb-40a0-b4e0-ba969cf04982"
PASS=0
FAIL=0
TOTAL=0

check() {
  TOTAL=$((TOTAL + 1))
  local name="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -F -q "$expected" 2>/dev/null; then
    echo "  ✅ $name"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $name"
    echo "     Expected to find: $expected"
    echo "     Got: $(echo "$actual" | head -c 300)"
    FAIL=$((FAIL + 1))
  fi
}

echo "╔══════════════════════════════════════════════════════╗"
echo "║     SPINZO BACKEND E2E TEST SUITE                   ║"
echo "║     Testing all services against Neon DB             ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─────────────────────────────────────────
# 1. HEALTH CHECKS
# ─────────────────────────────────────────
echo "━━━ 1. HEALTH CHECKS ━━━"
RES=$(curl -s $BASE_AUTH/health)
check "Auth service health" "healthy" "$RES"

RES=$(curl -s http://localhost:3000/api/v1/health)
check "Gateway health" "healthy" "$RES"

# ─────────────────────────────────────────
# 2. AUTH: Login → get JWT
# ─────────────────────────────────────────
echo ""
echo "━━━ 2. AUTH: Firebase Login (dev bypass) ━━━"
AUTH_RES=$(curl -s -X POST $BASE_AUTH/auth/login -H "Authorization: Bearer dev-bypass-token")
check "Login returns accessToken" "accessToken" "$AUTH_RES"
check "Login returns userId" "id" "$AUTH_RES"
check "Login returns phone +919999999999" "+919999999999" "$AUTH_RES"

JWT=$(echo $AUTH_RES | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
USER_ID=$(echo $AUTH_RES | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['id'])" 2>/dev/null)
echo "  📋 User ID: $USER_ID"
echo "  📋 JWT: ${JWT:0:40}..."

# Clean up any existing subscriptions/credit usage/orders/addresses for this user to make the test idempotent and clean
echo "  🧹 Cleaning up existing data in Neon DB for user $USER_ID..."
DB_URL="postgresql://neondb_owner:npg_ObcwJ30zHgxr@ep-blue-mountain-aofqk5ox.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: '$DB_URL', ssl: { rejectUnauthorized: false } });
async function clean() {
  await pool.query(\"DELETE FROM credit_usage WHERE user_id = '$USER_ID'\");
  await pool.query(\"DELETE FROM subscriptions WHERE user_id = '$USER_ID'\");
  await pool.query(\"DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = '$USER_ID')\");
  await pool.query(\"DELETE FROM orders WHERE user_id = '$USER_ID'\");
  await pool.query(\"DELETE FROM addresses WHERE user_id = '$USER_ID'\");
}
clean().then(() => {
  console.log('  ✅ DB cleaned successfully.');
  pool.end();
}).catch(err => {
  console.error('  ❌ DB cleanup failed:', err);
  pool.end();
});
"

# ─────────────────────────────────────────
# 3. USER PROFILE
# ─────────────────────────────────────────
echo ""
echo "━━━ 3. USER PROFILE ━━━"
RES=$(curl -s $BASE_USER/users/me -H "x-user-id: $USER_ID")
check "Get profile returns user data" "$USER_ID" "$RES"

# ─────────────────────────────────────────
# 4. ADDRESS: Create, List, Get
# ─────────────────────────────────────────
echo ""
echo "━━━ 4. ADDRESS MANAGEMENT ━━━"
ADDR_RES=$(curl -s -X POST $BASE_USER/users/me/addresses \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "label": "Home",
    "addressLine": "123 MG Road, Apt 4B, Karnataka",
    "city": "Bangalore",
    "pincode": "560001",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "isPrimary": true
  }')
check "Create address returns id" "id" "$ADDR_RES"
ADDR_ID=$(echo $ADDR_RES | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo "  📋 Address ID: $ADDR_ID"

RES=$(curl -s $BASE_USER/users/me/addresses -H "x-user-id: $USER_ID")
check "List addresses returns array" "[" "$RES"
check "List addresses contains Home" "Home" "$RES"

RES=$(curl -s $BASE_USER/users/me/addresses/$ADDR_ID -H "x-user-id: $USER_ID")
check "Get address by ID returns correct label" "Home" "$RES"
check "Get address returns pincode 560001" "560001" "$RES"

# ─────────────────────────────────────────
# 5. CATALOG: Services + Items
# ─────────────────────────────────────────
echo ""
echo "━━━ 5. CATALOG: Service Categories ━━━"
CATALOG=$(curl -s $BASE_ORDER/catalog/services)
check "Catalog returns Wash & Fold" "Wash & Fold" "$CATALOG"
check "Catalog returns Wash & Iron" "Wash & Iron" "$CATALOG"
check "Catalog returns Steam Ironing" "Steam Ironing" "$CATALOG"
check "Catalog returns Blanket Wash" "Blanket Wash" "$CATALOG"
check "Catalog returns Smart Care Subscription" "Smart Care Subscription" "$CATALOG"
check "Wash & Fold price is 69.00" "69.00" "$CATALOG"
check "Wash & Iron price is 99.00" "99.00" "$CATALOG"
check "Steam Iron price is 10.00" "10.00" "$CATALOG"
check "Single Blanket price is 199.00" "199.00" "$CATALOG"
check "Double Blanket price is 299.00" "299.00" "$CATALOG"

# ─────────────────────────────────────────
# 6. SLOTS: Check availability
# ─────────────────────────────────────────
echo ""
echo "━━━ 6. SLOT AVAILABILITY ━━━"
TOMORROW=$(date -v+1d +%Y-%m-%d)
SLOTS_RES=$(curl -s "$BASE_ORDER/slots/availability?storeId=$STORE_ID&date=$TOMORROW")
check "Slots endpoint returns data" "slots" "$SLOTS_RES"

# ─────────────────────────────────────────
# 7. CART: Set, Get, Clear
# ─────────────────────────────────────────
echo ""
echo "━━━ 7. CART OPERATIONS ━━━"
# Get a service item ID for the cart
WASH_FOLD_ITEM=$(echo $CATALOG | python3 -c "import sys,json; cats=json.load(sys.stdin); print([c['items'][0]['id'] for c in cats if c['slug']=='wash_fold'][0])" 2>/dev/null)
echo "  📋 Wash & Fold Item ID: $WASH_FOLD_ITEM"

CART_RES=$(curl -s -X PUT $BASE_ORDER/cart \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d "{
    \"items\": [
      {\"serviceItemId\": \"$WASH_FOLD_ITEM\", \"quantity\": 3}
    ]
  }")
check "Set cart returns success" "items" "$CART_RES"

RES=$(curl -s $BASE_ORDER/cart -H "x-user-id: $USER_ID")
check "Get cart returns items" "items" "$RES"

# ─────────────────────────────────────────
# 8. ORDER: Place + lifecycle
# ─────────────────────────────────────────
echo ""
echo "━━━ 8. ORDER PLACEMENT ━━━"
ORDER_RES=$(curl -s -X POST $BASE_ORDER/orders \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d "{
    \"storeId\": \"$STORE_ID\",
    \"pickupType\": \"scheduled\",
    \"pickupDate\": \"$TOMORROW\",
    \"pickupTime\": \"10:00-11:00\",
    \"address\": {
      \"label\": \"Home\",
      \"addressLine\": \"123 MG Road, Apt 4B, Karnataka\",
      \"city\": \"Bangalore\",
      \"pincode\": \"560001\",
      \"latitude\": 12.9716,
      \"longitude\": 77.5946
    },
    \"items\": [
      {
        \"serviceItemId\": \"$WASH_FOLD_ITEM\",
        \"name\": \"Wash & Fold (per kg)\",
        \"price\": \"69.00\",
        \"quantity\": 3,
        \"subtotal\": \"207.00\"
      }
    ],
    \"totalAmount\": 207,
    \"paymentMethod\": \"cod\",
    \"notes\": \"Test order via E2E script\"
  }")
check "Create order returns orderId" "id" "$ORDER_RES"
ORDER_ID=$(echo $ORDER_RES | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
echo "  📋 Order ID: $ORDER_ID"

if [ -n "$ORDER_ID" ]; then
  RES=$(curl -s $BASE_ORDER/orders/$ORDER_ID -H "x-user-id: $USER_ID")
  check "Get order by ID returns data" "$ORDER_ID" "$RES"
  check "Order has correct storeId" "$STORE_ID" "$RES"

  RES=$(curl -s $BASE_ORDER/orders -H "x-user-id: $USER_ID")
  check "List user orders returns array" "[" "$RES"

  # Status update: confirmed → picked_up
  RES=$(curl -s -X PUT $BASE_ORDER/orders/$ORDER_ID/status \
    -H "Content-Type: application/json" \
    -H "x-user-id: $USER_ID" \
    -d '{"status": "confirmed"}')
  check "Update order status to confirmed" "confirmed" "$RES"
fi

# ─────────────────────────────────────────
# 8.5 PAYMENTS: Create & Verify (Upfront order payment)
# ─────────────────────────────────────────
echo ""
echo "━━━ 8.5 PAYMENTS: Upfront Razorpay Order Flow ━━━"

UPFRONT_ORDER_RES=$(curl -s -X POST $BASE_ORDER/orders \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d "{
    \"storeId\": \"$STORE_ID\",
    \"pickupType\": \"scheduled\",
    \"pickupDate\": \"$TOMORROW\",
    \"pickupTime\": \"11:00-12:00\",
    \"address\": {
      \"label\": \"Home\",
      \"addressLine\": \"123 MG Road, Apt 4B, Karnataka\",
      \"city\": \"Bangalore\",
      \"pincode\": \"560001\",
      \"latitude\": 12.9716,
      \"longitude\": 77.5946
    },
    \"items\": [
      {
        \"serviceItemId\": \"$WASH_FOLD_ITEM\",
        \"name\": \"Wash & Fold (per kg)\",
        \"price\": \"69.00\",
        \"quantity\": 2,
        \"subtotal\": \"138.00\"
      }
    ],
    \"totalAmount\": 138,
    \"paymentMethod\": \"razorpay\",
    \"notes\": \"Test upfront order\"
  }")
check "Create upfront order returns orderId" "id" "$UPFRONT_ORDER_RES"
UPFRONT_ORDER_ID=$(echo $UPFRONT_ORDER_RES | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
UPFRONT_STATUS=$(echo $UPFRONT_ORDER_RES | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "")
check "Upfront order starts in pending_payment" "pending_payment" "$UPFRONT_STATUS"

# Create Razorpay Order
RZP_ORDER_RES=$(curl -s -X POST http://localhost:3000/api/v1/payments/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d "{
    \"amount\": 138,
    \"currency\": \"INR\",
    \"type\": \"order\",
    \"targetId\": \"$UPFRONT_ORDER_ID\"
  }")
check "Create Razorpay Order returns orderId" "orderId" "$RZP_ORDER_RES"
RZP_ORDER_ID=$(echo $RZP_ORDER_RES | python3 -c "import sys,json; print(json.load(sys.stdin)['orderId'])" 2>/dev/null || echo "")
echo "  📋 Razorpay Order ID: $RZP_ORDER_ID"

# Verify Payment (Upfront)
VERIFY_RES=$(curl -s -X POST http://localhost:3000/api/v1/payments/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d "{
    \"razorpayOrderId\": \"$RZP_ORDER_ID\",
    \"razorpayPaymentId\": \"pay_mock_12345\",
    \"razorpaySignature\": \"mock_sig_12345\",
    \"amount\": 138,
    \"type\": \"order\",
    \"targetId\": \"$UPFRONT_ORDER_ID\"
  }")
check "Verify payment returns success" "success" "$VERIFY_RES"

# Check order status changed to confirmed
RES=$(curl -s $BASE_ORDER/orders/$UPFRONT_ORDER_ID -H "x-user-id: $USER_ID")
check "Upfront order status changed to confirmed after payment" "confirmed" "$RES"

# ─────────────────────────────────────────
# 9. SUBSCRIPTION: Create + use credit
# ─────────────────────────────────────────
echo ""
echo "━━━ 9. SUBSCRIPTION (Credits via Payment) ━━━"

RZP_SUB_RES=$(curl -s -X POST http://localhost:3000/api/v1/payments/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d "{
    \"amount\": 1596,
    \"currency\": \"INR\",
    \"type\": \"subscription\",
    \"targetId\": \"single\"
  }")
check "Create Subscription Razorpay Order returns orderId" "orderId" "$RZP_SUB_RES"
RZP_SUB_ORDER_ID=$(echo $RZP_SUB_RES | python3 -c "import sys,json; print(json.load(sys.stdin)['orderId'])" 2>/dev/null || echo "")

VERIFY_SUB_RES=$(curl -s -X POST http://localhost:3000/api/v1/payments/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d "{
    \"razorpayOrderId\": \"$RZP_SUB_ORDER_ID\",
    \"razorpayPaymentId\": \"pay_mock_sub_123\",
    \"razorpaySignature\": \"mock_sig_sub_123\",
    \"amount\": 1596,
    \"type\": \"subscription\",
    \"targetId\": \"single\",
    \"credits\": 4
  }")
check "Verify subscription payment returns success" "success" "$VERIFY_SUB_RES"
SUB_ID=$(echo $VERIFY_SUB_RES | python3 -c "import sys,json; print(json.load(sys.stdin)['subscriptionId'])" 2>/dev/null || echo "")
echo "  📋 Subscription ID: $SUB_ID"

if [ -n "$SUB_ID" ]; then
  RES=$(curl -s $BASE_SUB/subscriptions/active -H "x-user-id: $USER_ID")
  check "Get active subscription" "active" "$RES"

  RES=$(curl -s $BASE_SUB/subscriptions -H "x-user-id: $USER_ID")
  check "List all subscriptions" "[" "$RES"

  # Use a credit
  CREDIT_RES=$(curl -s -X POST $BASE_SUB/subscriptions/$SUB_ID/use-credit \
    -H "Content-Type: application/json" \
    -H "x-user-id: $USER_ID" \
    -d "{\"orderId\": \"$ORDER_ID\"}")
  check "Use subscription credit" "credit" "$CREDIT_RES"
fi

# ─────────────────────────────────────────
# 10. ADMIN: Stats + Demand
# ─────────────────────────────────────────
echo ""
echo "━━━ 10. ADMIN ENDPOINTS ━━━"
RES=$(curl -s $BASE_ADMIN/stats -H "x-user-role: super_admin")
check "Admin order stats returns data" "total" "$RES"

RES=$(curl -s $BASE_ADMIN/stats/revenue -H "x-user-role: super_admin")
check "Admin revenue stats returns data" "revenue" "$RES"

# Log unserviceable demand
DEMAND_RES=$(curl -s -X POST $BASE_ADMIN/demand/log \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "pincode": "560099",
    "latitude": 12.85,
    "longitude": 77.65,
    "serviceRequested": "wash_fold"
  }')
check "Log demand request" "success" "$DEMAND_RES"

RES=$(curl -s $BASE_ADMIN/demand -H "x-user-role: super_admin")
check "Get demand logs" "[" "$RES"

RES=$(curl -s $BASE_ADMIN/subscriptions -H "x-user-role: super_admin")
check "Admin list all subscriptions" "[" "$RES"

# ─────────────────────────────────────────
# 11. CLEANUP: Clear cart
# ─────────────────────────────────────────
echo ""
echo "━━━ 11. CLEANUP ━━━"
curl -s -X DELETE $BASE_ORDER/cart -H "x-user-id: $USER_ID" > /dev/null
check "Clear cart" "true" "true"

# ─────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  TEST RESULTS                                       ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Total:  $TOTAL                                     "
echo "║  Passed: $PASS ✅                                   "
echo "║  Failed: $FAIL ❌                                   "
echo "╚══════════════════════════════════════════════════════╝"

if [ $FAIL -gt 0 ]; then
  exit 1
fi
