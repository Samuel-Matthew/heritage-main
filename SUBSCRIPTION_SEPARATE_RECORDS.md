# Separate Subscription Records System - IMPLEMENTED ✅

## Overview
Each subscription purchase/renewal now creates a **completely new database record** with its own unique subscription code. This provides:
- ✅ Clean slate for promotion slots with each subscription
- ✅ Complete audit trail of subscription history
- ✅ Better record keeping and accountability
- ✅ Easy tracking of subscription lifecycle

## How It Works

### Before (Problem)
```
updateOrCreate([
    'store_id' => $store->id
])
```
- Same subscription record would be updated
- Promotion slots stayed with the store
- No subscription history
- Difficult to track when plans changed

### After (Solution)
```
Subscription::create([
    'store_id' => $store->id,
    'subscription_plan_id' => $request->plan_id,
    'payment_receipt_path' => $filePath,
    'status' => 'pending',
])
```
- New subscription record created every time
- Each gets a unique subscription_code
- Promotion slots reset per subscription
- Full history maintained

## Subscription Lifecycle

### Step 1: Seller Purchases Subscription
```
POST /api/subscriptions/store-upgrade
```
Action:
1. **NEW** subscription record created with status='pending'
2. Auto-generates unique `subscription_code` (e.g., SUB-002-5-A1B2C3)
3. Any old pending/active subscriptions marked as 'expired'
4. Store's current plan updated in store table

Result:
```json
{
  "subscription": {
    "id": 5,
    "status": "pending",
    "subscription_code": "SUB-002-5-A1B2C3",
    "plan_name": "Gold",
    "created_at": "2025-12-27"
  }
}
```

### Step 2: Admin Approves Subscription
```
POST /api/admin/subscriptions/{id}/approve
```
Action:
1. Subscription status changed to 'active'
2. starts_at and ends_at dates set
3. subscription_code already exists

Result:
- Subscription is now active
- Seller can start using promotion slots
- All future promotions tied to this subscription_code

### Step 3: Subscription Expires or Seller Upgrades
- Old subscription stays in database with status='expired'
- Creates NEW subscription record if they upgrade
- New subscription has clean promotion slots

## Promotion Slot Reset

### How Slots Reset Automatically

When seller subscribes to new plan:

**Old Subscription (ID: 2)**
- subscription_code: `SUB-001-2-4649D6`
- Featured products: 3
- Hot deals: 1
- Status: expired

**New Subscription (ID: 5)**  
- subscription_code: `SUB-002-5-A1B2C3`
- Featured products: 0 (CLEAN SLATE)
- Hot deals: 0 (CLEAN SLATE)
- Status: pending → active

Slot enforcement query:
```php
$latestSubscription = $store->subscriptions()->latest()->first();
FeaturedProduct::where('subscription_code', $latestSubscription->subscription_code)->count();
```

Only counts promotions linked to the NEW subscription code!

## Database Records

### Subscriptions Table Example
```
ID | Store ID | Plan ID | Status  | Subscription Code    | Created_At
1  | 1        | 5       | expired | SUB-001-1-4649D6     | 2025-11-01
2  | 1        | 5       | active  | SUB-001-1-ABC123     | 2025-12-01
3  | 2        | 2       | active  | SUB-002-3-46567A     | 2025-12-10
4  | 2        | 5       | pending | SUB-002-4-XYZ789     | 2025-12-25
5  | 2        | 2       | active  | SUB-002-5-A1B2C3     | 2025-12-27
```

### Featured Products Table Example
```
ID | Product ID | Store ID | Subscription Code    | Plan Type | Is Active | Created_At
10 | 5          | 1        | SUB-001-1-4649D6    | gold      | 0         | 2025-11-15
11 | 6          | 1        | SUB-001-1-ABC123    | gold      | 1         | 2025-12-10
12 | 7          | 2        | SUB-002-3-46567A    | silver    | 1         | 2025-12-20
13 | 8          | 2        | SUB-002-5-A1B2C3    | silver    | 1         | 2025-12-27
```

**Key Insight:**
- Product 5 is old (SUB-001-1-4649D6), won't count toward new limits
- Products 7-8 are current (SUB-002-3/5), count toward limits

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Each Purchase** | Updates existing record | Creates NEW record |
| **Subscription Code** | Same across upgrades | NEW code each time |
| **Slot Count** | Accumulates forever | Resets per subscription |
| **History** | Lost/overwritten | Completely preserved |
| **Audit Trail** | Difficult to track | Clear record of each purchase |
| **Plan Changes** | Confused tracking | Clear before/after records |

## Implementation Details

### Changed File
`app/Http/Controllers/API/Admin/SubscriptionController.php`

**Method:** `storeUpgrade()`

**Key Changes:**
```php
// OLD (Wrong)
$subscription = Subscription::updateOrCreate(
    ['store_id' => $store->id],
    [...]
);

// NEW (Correct)
$store->subscriptions()
    ->whereIn('status', ['pending', 'active'])
    ->update(['status' => 'expired']);

$subscription = Subscription::create([
    'store_id' => $store->id,
    'subscription_plan_id' => $request->plan_id,
    'payment_receipt_path' => $filePath,
    'status' => 'pending',
]);
```

### What Happens:
1. **Expire old subscriptions** - Mark pending/active as 'expired'
2. **Create new record** - Fresh subscription with new code
3. **Return code** - Response includes subscription_code for reference

## Query Examples

### Get All Subscriptions for a Store
```php
$store->subscriptions()
    ->with('plan')
    ->orderBy('created_at', 'desc')
    ->get();
```

Result: Shows ALL subscriptions (active, expired, pending, rejected)

### Get Active Subscriptions for a Store
```php
$store->subscriptions()
    ->where('status', 'active')
    ->latest()
    ->get();
```

Result: Only active subscriptions, newest first

### Get Latest Subscription (for slot enforcement)
```php
$latestSubscription = $store->subscriptions()
    ->latest()
    ->first();
```

Result: Most recent subscription regardless of status (used for promotions)

## API Response Example

When seller upgrades subscription:

```json
{
  "message": "Payment proof submitted successfully! Awaiting admin confirmation.",
  "subscription": {
    "id": 5,
    "status": "pending",
    "plan_name": "Gold",
    "subscription_code": "SUB-002-5-A1B2C3",
    "payment_receipt_path": "subscriptions/xxx.jpg"
  }
}
```

Now includes `subscription_code` in response for tracking.

## Testing

Check subscription records:
```bash
php artisan tinker

# See all subscriptions for a store
$store = Store::find(2);
dd($store->subscriptions()->get());

# See latest subscription
dd($store->subscriptions()->latest()->first());

# Count featured products for latest subscription
$latest = $store->subscriptions()->latest()->first();
dd(FeaturedProduct::where('subscription_code', $latest->subscription_code)->count());
```

## Summary

✅ **Each subscription is a separate database record**  
✅ **Each gets a unique subscription_code**  
✅ **Promotion slots reset automatically with new subscription**  
✅ **Full audit trail of all subscriptions**  
✅ **Old promotions don't affect new subscription limits**  
✅ **No manual reset needed**  

The system now properly supports subscription history while enforcing clean slot counts per subscription period!
