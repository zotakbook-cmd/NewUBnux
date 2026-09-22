# UBnux Business Manager v1.0

Built for the current UBnux setup:

- GitHub + Cloudflare frontend
- Google Apps Script backend
- Google Sheets database
- `01_Districts`
- `02_Categories`
- district business sheets such as `Siwan_Businesses`, `Patna_Businesses`, etc.

## Included

- Admin login
- Dashboard
- Business list/search/filter
- Add business
- Edit business
- Delete business
- Custom URL generator
- Global URL availability check
- Reserved slug protection
- Duplicate protection using `LockService`
- Public slug resolver endpoint

Example:

`Siwan Fashion House` -> `siwan-fashion-house` -> `https://ubnux.com/siwan-fashion-house/`

The business sheet `Slug` column is updated.

## 1. Frontend

Upload the whole `ubnux-business-manager-v1` folder to the frontend repo. A good final path is:

`/business-manager/`

Then edit:

`assets/js/config.js`

and set the current Apps Script `/exec` URL in `API_URL`.

## 2. Apps Script files

Add these NEW files to the current Apps Script project:

- `Auth.gs`
- `BusinessManager.gs`
- `CustomURL.gs`
- `Setup_BusinessManager.gs`

Do not replace your current `Code.gs`.

Use `Code_Patch.gs` only to add the listed dispatcher cases to your existing dispatcher.

## 3. Run setup once

Run:

`setupUBnuxBusinessManager()`

It creates:

### `00_Admins`

Columns:

`UserID, Name, Role, Email, Mobile, PasswordHash, Active, CreatedAt, UpdatedAt`

### `04_SlugRegistry`

Columns:

`Slug, BusinessID, DistrictID, SheetName, Status, CreatedAt, UpdatedAt, PreviousSlug`

## 4. Create first admin

In `Setup_BusinessManager.gs`, change:

`CHANGE_THIS_PASSWORD`

inside `createUBnuxManagerAdmin()`.

Then run:

`createUBnuxManagerAdmin()`

After that, remove the plain password from source if desired.

## 5. Dispatcher

Add these actions to the current Apps Script dispatcher:

- `manager-login`
- `manager-logout`
- `manager-bootstrap`
- `manager-businesses`
- `manager-business`
- `manager-save-business`
- `manager-delete-business`
- `manager-check-slug`
- `business-slug`

Exact snippets are in `backend/Code_Patch.gs`.

## 6. doPost support

Login/save/delete use POST JSON. Your current `doPost(e)` must parse `e.postData.contents` and pass the object to the same dispatcher used by GET.

A helper is included in `Code_Patch.gs`.

## 7. Required business columns

Every district business sheet must already have at least:

- `BusinessID`
- `DistrictID`
- `CategoryID`
- `BusinessName`
- `Slug`

The manager also fills your existing optional columns where present.

## 8. Why `04_SlugRegistry`

Availability checks should not scan every district sheet every time. The central registry makes custom URL ownership and lookup much simpler and also lets the public `/slug/` resolver identify the correct business sheet.

The backend checks availability again while a script lock is held before saving, which protects against two admins claiming the same slug at nearly the same time.

## 9. Public resolver endpoint

This action is included:

`?action=business-slug&slug=siwan-fashion-house`

It returns the business, district and category data for the public `ubnux.com/slug/` route.

## Next step

After this manager is connected to your current backend and saves correctly, the next step is to merge the public route `ubnux.com/<slug>/` into the current `router.js`, `seo-router.js`, `business-page.js` and Cloudflare routing without breaking the existing full SEO URL.
