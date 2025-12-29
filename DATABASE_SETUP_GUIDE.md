# Database Setup - Seller Registration Fix

## Issue Identified
Data truncation error when submitting seller registration form. The issue was that database columns were too small to store comma-separated values for states and business lines.

## Solution Applied

### Migration: `2025_12_18_000002_change_store_columns_to_text.php`
Updated the following columns from `string` to `text` type:
- `state` - Changed from VARCHAR(255) to TEXT (stores up to 65,535 chars)
- `address` - Changed from VARCHAR(255) to TEXT
- `business_lines` - Changed from VARCHAR(255) to TEXT

This allows storing comma-separated values without truncation:
- Example state value: "Lagos,Ogun,Osun,Abuja,Kaduna,Rivers" (can be very long)
- Example business_lines: "chemicals,equipment,services"

## Database Setup Instructions

### Step 1: Run Migrations
```bash
cd c:\Users\HP 840 g3\Desktop\LARAVEL\heritage main\heritage-oil-gas-main-backend
php artisan migrate
```

This will run all pending migrations in order:
1. `2025_12_18_000000_add_fields_to_stores_table.php` - Adds rc_number, business_lines, contact_person
2. `2025_12_18_000001_add_is_mandatory_to_store_documents_table.php` - Adds is_mandatory field
3. `2025_12_18_000002_change_store_columns_to_text.php` - Changes column types to TEXT

### Step 2: Link Storage
```bash
php artisan storage:link
```

This creates a symlink from `public/storage` to `storage/app/public` for file access.

### Step 3: Seed Database (Optional)
```bash
php artisan db:seed
```

This will create test data including admin user.

## Current Database Schema

### Users Table
```
id (bigint)
name (varchar 255)
email (varchar 255, unique)
phone (varchar 255)
password (varchar 255)
role (enum: super_admin, store_owner, buyer)
email_verified_at (timestamp, nullable)
remember_token (varchar 100, nullable)
created_at (timestamp)
updated_at (timestamp)
```

### Stores Table
```
id (bigint)
user_id (bigint, foreign key to users)
name (varchar 255)
rc_number (varchar 50, unique, nullable)
description (text, nullable)
business_lines (text, nullable)  ← NOW TEXT
state (text)                      ← NOW TEXT
address (text, nullable)          ← NOW TEXT
phone (varchar 255)
email (varchar 255)
contact_person (varchar 255, nullable)
status (enum: pending, approved, rejected, suspended)
approved_at (timestamp, nullable)
rejection_reason (text, nullable)
created_at (timestamp)
updated_at (timestamp)
```

### Store Documents Table
```
id (bigint)
store_id (bigint, foreign key to stores)
type (varchar 255)
file_path (varchar 255)
mime_type (varchar 255)
file_size (integer)
status (varchar 255)
is_mandatory (boolean)  ← NEW FIELD
created_at (timestamp)
updated_at (timestamp)
```

## Data Storage Paths

### Files
Uploaded documents are stored at:
```
storage/app/public/store-documents/{store_id}/{timestamp}_{store_id}_{document_type}.{ext}
```

Accessible via:
```
/storage/store-documents/{store_id}/{filename}
```

Example:
```
storage/app/public/store-documents/1/1703002533_1_cac_certificate.pdf
/storage/store-documents/1/1703002533_1_cac_certificate.pdf
```

### Data Fields Storage
- `state` - Stored as comma-separated: "Lagos,Ogun,Osun"
- `business_lines` - Stored as comma-separated: "chemicals,equipment"
- `product_line` → `description` - Full text description

## Validation Rules (Backend)

### Required Fields
- company_name (string, max 255)
- rc_number (string, max 50, unique)
- phone (string, max 20)
- email (email format)
- address (string)
- contact_person (string, max 255)
- business_lines (array, min 1 item)
- product_line (string, min 3 chars)
- states (array, min 1 item)

### Required Documents
- cac_certificate (file: pdf/jpg/jpeg/png, max 5MB)
- company_logo (file: jpg/jpeg/png, max 5MB)
- live_photos (file: pdf/jpg/jpeg/png, max 5MB)

### Optional Documents
- tin_certificate
- tax_clearance
- dpr_nuprc
- import_license
- ncdmb
- oem_partner
- hse_cert

All optional files: same format as required (pdf/jpg/jpeg/png, max 5MB)

## Testing the Full Flow

### Step 1: Start Services
```bash
# Terminal 1 - Backend
cd heritage-oil-gas-main-backend
php artisan serve

# Terminal 2 - Frontend Main App
cd heritage-oil-gas-main
npm run dev

# Terminal 3 - Frontend Dashboard
cd heritage-dashboards
npm run dev
```

### Step 2: Navigate to Seller Registration
- Go to: `http://localhost:8080/seller/register`

### Step 3: Fill Form
**Step 1 - Company Info:**
- Company Name: Test Company
- RC Number: RC12345 (must be unique)
- Phone: +2348012345678
- Email: test@testcompany.com
- Address: 123 Business Street, Lagos
- Contact Person: John Doe

**Step 2 - Business Details:**
- Select at least one business line (Chemicals, Equipment, or Services)
- Enter product line description
- Select multiple states

**Step 3 - Documents:**
- Upload 3 mandatory documents
- (Optional) Upload any optional documents

**Step 4 - Review:**
- Check terms agreement
- Submit

### Step 4: Verify Success
- Should see success page
- Check database: `SELECT * FROM stores;`
- Check storage: `storage/app/public/store-documents/`

## Troubleshooting

### Error: "Data truncated"
**Solution:** Run the migration for column type changes
```bash
php artisan migrate
```

### Error: "File not found"
**Solution:** Run storage link command
```bash
php artisan storage:link
```

### Error: "Unique constraint failed on rc_number"
**Solution:** RC numbers must be unique per store. Use different RC number in test.

### Error: CSRF token mismatch
**Solution:** CSRF token interceptor is already configured in both components. If still failing:
1. Clear browser cookies
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)

### Error: Documents not uploading
**Solution:** Check file size (max 5MB) and format (jpg, jpeg, png, pdf only)

## File Locations

**Backend Controller:**
```
app/Http/Controllers/API/SellerRegistrationController.php
```

**Frontend Component:**
```
src/pages/seller/SellerRegister.tsx
src/pages/seller/RegistrationSuccess.tsx
```

**Migrations:**
```
database/migrations/2025_12_18_000000_add_fields_to_stores_table.php
database/migrations/2025_12_18_000001_add_is_mandatory_to_store_documents_table.php
database/migrations/2025_12_18_000002_change_store_columns_to_text.php
```

**Routes:**
```
routes/api.php (POST /api/seller/register)
```

## Next Steps After Successful Submission

1. Admin reviews store documents in dashboard
2. Admin approves/rejects from admin panel
3. User receives email notification
4. Approved user can access seller dashboard
5. Can purchase subscription plan
6. Start listing products

## Security Notes

✅ CSRF protection enabled
✅ File validation (type, size, mime)
✅ Unique RC/CAC enforcement
✅ Transaction support (rollback on error)
✅ Proper authorization checks
⚠️ Consider adding rate limiting
⚠️ Consider adding spam detection
⚠️ Consider email verification
