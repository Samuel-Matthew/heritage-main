# Payment Proof Submission Implementation

## Overview
Implemented complete payment proof submission workflow allowing store owners to submit subscription upgrade requests with payment receipts for admin approval.

## Features Implemented

### 1. **Backend - Payment Proof Submission Endpoint**
**File**: `app/Http/Controllers/API/Admin/SubscriptionController.php`

#### New Methods:

##### `storeUpgrade(Request $request)` - Lines 226-269
Handles payment proof submission from store owners.

**Validation**:
- `plan_id`: Required, must exist in subscription_plans table
- `payment_receipt`: Required file, accepts JPEG/JPG/PNG/PDF, max 5MB

**Process**:
1. Validates request data
2. Gets authenticated user and their store
3. Stores payment receipt file to `storage/subscriptions/` public disk
4. Creates or updates Subscription record with:
   - `store_id`: From authenticated user's store
   - `subscription_plan_id`: From request
   - `payment_receipt_path`: Stored file path
   - `status`: Set to "pending"
5. Updates Store's subscription field with plan slug
6. Returns subscription details with success message (HTTP 201)

**Error Handling**:
- Returns 404 if store not found for user
- Returns 500 with error message for exceptions
- Validation errors handled by Laravel

##### `current(Request $request)` - Lines 70-95
Fetches the current subscription for the logged-in store owner.

**Returns**:
- Latest subscription record with plan details
- `null` if no subscription exists
- Includes: id, status, plan_id, plan_name, plan_slug, price, product_limit, dates

### 2. **API Routes**
**File**: `routes/api.php`

**New Routes** (Lines 45-47):
```php
Route::post('subscription/upgrade', [SubscriptionController::class, 'storeUpgrade']);
Route::get('subscription/current', [SubscriptionController::class, 'current']);
```

Both routes:
- Protected by `auth:sanctum` middleware (store owners only)
- Not behind admin-only middleware (allow any authenticated user)

### 3. **Frontend - Store Owner Subscription Component**
**File**: `src/pages/Subscriptions.tsx` (StoreOwnerSubscription component)

#### State Management:
- `currentSubscription`: Stores current subscription data from API
- `isLoadingSubscription`: Loading state for subscription fetch
- `paymentFile`: Selected file for upload
- `isSubmitting`: Submission state during API call

#### Methods:

##### `fetchCurrentSubscription()`
- Called on component mount and after successful payment submission
- GET request to `/api/subscription/current`
- Updates currentSubscription state

##### `handleSubmitPayment()` - Lines 722-747
Handles payment proof submission.

**Process**:
1. Validates file and plan selection
2. Creates FormData with:
   - `plan_id`: Selected plan ID
   - `payment_receipt`: File object
3. POSTs to `/api/subscription/upgrade` with multipart/form-data
4. On success:
   - Closes upload dialog
   - Clears file selection
   - Refreshes subscription plans and current subscription
   - Shows success toast
5. On error: Shows error toast with message

#### UI Updates:

##### Status Banner (Lines 804-820)
Displays subscription status above plan grid:
- Shows pending approval message for "pending" status
- Shows active subscription message for "approved" status
- Shows rejection message for "rejected" status
- Color-coded (yellow/green/red) based on status

##### Current Plan Card Status (Lines 841-855)
Updated to show real subscription status:
- Plan name from current subscription
- Status from API (not hardcoded)
- Badge variant matches status
- Shows appropriate description based on status

### 4. **Database Records Created**

When payment proof submitted:
1. **Subscriptions table** - New record:
   - `store_id`: User's store
   - `subscription_plan_id`: Selected plan
   - `payment_receipt_path`: Path to uploaded file
   - `status`: "pending"
   - `starts_at`: Current timestamp
   - `ends_at`: NULL (set on approval)
   - `activated_by`: NULL (set on approval)

2. **Stores table** - Updated:
   - `subscription` field: Plan slug

## Data Flow

### Store Owner Submission Flow:
```
1. Store Owner selects plan and uploads payment receipt
2. Frontend validates file and plan
3. Frontend POSTs to /api/subscription/upgrade with FormData
4. Backend validates request
5. Backend stores file to storage/subscriptions/
6. Backend creates Subscription record with status="pending"
7. Backend updates Store.subscription with plan slug
8. Backend returns subscription data
9. Frontend receives response
10. Frontend refreshes plans and subscription data
11. Frontend shows success toast
12. UI updates with pending status
13. Status banner shows awaiting confirmation message
```

### Admin Approval Flow:
```
1. Admin views Subscriptions list (fetched from /api/admin/subscriptions)
2. Admin sees pending subscriptions with payment receipts
3. Admin clicks "Approve" button
4. Frontend POSTs to /api/admin/subscriptions/{id}/approve
5. Backend updates subscription.status = "approved"
6. Backend sets subscription.activated_by = current admin
7. Frontend refetches subscriptions list
8. Store owner's subscription now shows "approved" status
9. Store owner sees active subscription in their dashboard
```

## API Response Examples

### Payment Proof Submission Response (201):
```json
{
  "message": "Payment proof submitted successfully! Awaiting admin confirmation.",
  "subscription": {
    "id": 1,
    "status": "pending",
    "plan_name": "Silver Store",
    "payment_receipt_path": "subscriptions/abc123.pdf"
  }
}
```

### Current Subscription Response (200):
```json
{
  "data": {
    "id": 1,
    "status": "pending",
    "plan_id": 2,
    "plan_name": "Silver Store",
    "plan_slug": "silver",
    "price": 5000,
    "product_limit": 5,
    "starts_at": "2024-01-15",
    "ends_at": null,
    "created_at": "2024-01-15 10:30:45"
  }
}
```

### No Subscription Response (200):
```json
{
  "data": null
}
```

## File Upload Details

**Storage Location**: `storage/app/public/subscriptions/`
- Files stored with Laravel's `store()` method
- Accessible via public disk
- Supports: JPEG, JPG, PNG, PDF
- Maximum file size: 5MB

**Access**: Files can be downloaded via:
```
GET /api/admin/subscriptions/{id}/payment-receipt
```

## Validation Rules

### storeUpgrade Endpoint:
- `plan_id`: required|exists:subscription_plans,id
- `payment_receipt`: required|file|mimes:jpeg,jpg,png,pdf|max:5120

## Error Scenarios

| Scenario | Status Code | Response |
|----------|-------------|----------|
| Missing payment_receipt | 422 | Laravel validation error |
| Invalid plan_id | 422 | Laravel validation error |
| No store for user | 404 | "Store not found for this user" |
| File upload fails | 500 | "Failed to submit payment proof" |
| Unauthorized | 401 | Sanctum unauthorized |

## Admin Workflow Integration

The payment proof submission integrates with existing admin features:

1. **Subscriptions List**: Shows pending submissions with store details
2. **Payment Receipt Viewing**: Admins can view uploaded payment receipts
3. **Approval/Rejection**: Status updates trigger subscription notifications
4. **Store Dashboard**: Updated subscription field affects store display

## Testing Checklist

- [ ] Store owner can select a plan
- [ ] File upload accepts JPEG, PNG, PDF formats
- [ ] File size validation works (reject files > 5MB)
- [ ] Payment submission creates subscription record
- [ ] Subscription status set to "pending"
- [ ] Store.subscription field updated with plan slug
- [ ] Current subscription endpoint returns correct data
- [ ] Status banner shows awaiting confirmation
- [ ] Admin sees pending subscriptions in list
- [ ] Admin can approve subscription
- [ ] Status changes to "approved" after approval
- [ ] Store owner sees approved status in dashboard
- [ ] File stored in public storage disk
- [ ] Payment receipt accessible to admin

## Notes

- Uses `updateOrCreate()` to handle existing subscriptions for same store
- Store can only have one active subscription at a time (last one is latest)
- File naming handled by Laravel (stores as hash)
- Email notifications should be added for approval/rejection (future enhancement)
- Subscription expiration logic handled separately in admin approval

