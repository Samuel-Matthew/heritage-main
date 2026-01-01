# Email Notifications Implementation

## Overview
Two email notifications have been implemented for the seller registration and verification workflow:

1. **Store Registration Confirmation Email** - Sent immediately after successful registration
2. **Store Verification Email** - Sent after admin approval or rejection

---

## 1. Store Registration Confirmation Email

### When It's Triggered
- Immediately after user successfully submits the seller registration form (all 4 steps completed)
- Triggered in `SellerRegistrationController@store()` after the store record is created

### Email Content
- **Subject:** "Store Registration Submitted - Heritage Oil & Gas"
- **Contents:**
  - Thank you message
  - Store name
  - Registration status: Pending Review
  - Timeline: 24-48 hours review period
  - What happens next (4-step process)
  - Link to seller dashboard
  - Support contact information

### Implementation Details
- **Notification Class:** `App\Notifications\StoreRegistrationNotification`
- **Location:** `app/Notifications/StoreRegistrationNotification.php`
- **Controller Update:** `app/Http/Controllers/API/SellerRegistrationController.php`
  - Added `use App\Notifications\StoreRegistrationNotification;`
  - Added notification send after store creation:
    ```php
    $user->notify(new StoreRegistrationNotification($store));
    ```

---

## 2. Store Verification Email

### When It's Triggered
- **Approval:** When admin approves the store via `/api/admin/stores/{store}/approve`
- **Rejection:** When admin rejects the store via `/api/admin/stores/{store}/reject`

### Email Content - Approval
- **Subject:** "Your Store Has Been Approved! 🎉 - Heritage Oil & Gas"
- **Contents:**
  - Congratulations message
  - Store name
  - What you can now do (4 points)
  - Instructions to choose subscription plan
  - Link to seller dashboard
  - Company signature

### Email Content - Rejection
- **Subject:** "Store Verification Update - Heritage Oil & Gas"
- **Contents:**
  - Thank you message
  - Store name
  - Rejection reason (from admin input)
  - Option to reapply after addressing issues
  - Support contact link
  - Company signature

### Implementation Details
- **Notification Class:** `App\Notifications\StoreVerificationNotification`
- **Location:** `app/Notifications/StoreVerificationNotification.php`
- **Constructor:** `new StoreVerificationNotification($store, bool $approved = true)`
  - `true` for approval email
  - `false` for rejection email

- **Controller Updates:** `app/Http/Controllers/API/Admin/StoreController.php`
  - Added `use App\Notifications\StoreVerificationNotification;`
  
  - **Approve Method:**
    ```php
    $store->owner->notify(new StoreVerificationNotification($store, true));
    ```
  
  - **Reject Method:**
    ```php
    $store->owner->notify(new StoreVerificationNotification($store, false));
    ```

---

## API Endpoints

### Registration (sends confirmation email)
- **Endpoint:** `POST /api/seller/register`
- **Authentication:** Required (user must be logged in)
- **Auto-sends:** Confirmation email to user's email address

### Admin Approval (sends approval email)
- **Endpoint:** `PATCH /api/admin/stores/{store}/approve`
- **Authentication:** Required (super_admin role only)
- **Auto-sends:** Approval email to store owner

### Admin Rejection (sends rejection email)
- **Endpoint:** `PATCH /api/admin/stores/{store}/reject`
- **Authentication:** Required (super_admin role only)
- **Request Body:** `{ "rejection_reason": "string" }`
- **Auto-sends:** Rejection email with reason to store owner

---

## Email Configuration

### Uses Frontend URL
Both notifications reference the frontend URL via:
```php
$frontendUrl = config('app.frontend_url', 'http://localhost:5173');
```

Update in `.env`:
```
FRONTEND_URL=http://localhost:5173
```

Or `config/app.php`:
```php
'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
```

### Mail Configuration
Emails are sent using your configured mailer in `.env`:
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailersend.net
MAIL_PORT=587
MAIL_USERNAME=your_mailersend_username
MAIL_PASSWORD=your_mailersend_password
MAIL_FROM_ADDRESS=noreply@yourcompany.com
MAIL_FROM_NAME="Heritage Oil & Gas"
```

---

## Logging

All actions are logged:
- Store registration: Logged in `SellerRegistrationController`
- Store approval: Logged with admin ID and timestamp
- Store rejection: Logged with admin ID, timestamp, and rejection reason

Check logs at: `storage/logs/laravel.log`

---

## Testing

### Manual Testing Workflow

1. **Register a Store:**
   - Navigate to `/seller/register`
   - Complete all 4 steps
   - Submit
   - Check email for confirmation

2. **Approve Store (Admin):**
   - Call: `PATCH /api/admin/stores/{store_id}/approve`
   - Check email for approval notification
   - Store owner can now access dashboard

3. **Reject Store (Admin):**
   - Call: `PATCH /api/admin/stores/{store_id}/reject`
   - Body: `{ "rejection_reason": "Document verification failed" }`
   - Check email for rejection notification with reason

### Testing with Log Viewer
```bash
# Watch logs in real-time
tail -f storage/logs/laravel.log
```

---

## Summary of Changes

### Files Created
1. `app/Notifications/StoreRegistrationNotification.php` - Registration confirmation email
2. `app/Notifications/StoreVerificationNotification.php` - Approval/rejection email

### Files Modified
1. `app/Http/Controllers/API/SellerRegistrationController.php`
   - Added import for StoreRegistrationNotification
   - Send notification after store creation

2. `app/Http/Controllers/API/Admin/StoreController.php`
   - Added import for StoreVerificationNotification
   - Send approval notification in approve() method
   - Send rejection notification in reject() method

---

## Next Steps

1. Test email delivery by registering a store and checking for emails
2. Have an admin approve/reject a store and verify emails are sent
3. Check application logs for any errors
4. Customize email templates in the notification classes if needed
5. Configure proper mail driver and credentials in `.env`
