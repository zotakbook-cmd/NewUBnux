# UBnux BusinessKey Subdomain Router v2

This version is designed for the existing UBnux architecture:

- GitHub repository: `zotakbook-cmd/NewUBnux`
- Cloudflare Pages serves `https://ubnux.com`
- Existing Google Apps Script API remains behind `https://ubnux.com/api`
- BusinessKey API is already available as `action=business-key`

## What this does

One Cloudflare Worker handles all BusinessKey subdomains:

- `https://mk.ubnux.com/`
- `https://siwan-fashion-house.ubnux.com/`
- `https://abc-business.ubnux.com/`

No DNS record is created per business.

The Worker fetches the existing `business.html` from `https://ubnux.com`, injects a tiny bridge before the existing `business-page.js`, and lets the existing Business Template/SEO pipeline render the business returned by the `business-key` API.

## Why no frontend replacement is needed

The current `business.html` already loads:

1. config.js
2. api.js
3. seo-router.js
4. seo-meta.js
5. schema.js
6. business-page.js

The Worker injects the BusinessKey bridge between step 5 and step 6. Therefore the existing business page controller remains untouched.

## Cloudflare setup

### 1. Put this folder in the GitHub repository

Copy:

```text
worker/index.js
worker/wrangler.json
```

into the root of `NewUBnux`.

### 2. Create a Worker from the GitHub repository

In Cloudflare:

`Workers & Pages` → `Create` → `Worker` → connect the GitHub repository.

For the Worker build configuration, use:

- Root directory: `/worker`
- Build command: none
- Deploy command: `npx wrangler deploy`

If Cloudflare asks for the config file, use `worker/wrangler.json`.

### 3. Add wildcard DNS

In Cloudflare DNS for `ubnux.com`, create ONE record:

```text
Type: CNAME
Name: *
Target: ubnux.com
Proxy status: Proxied
```

Do NOT create records for `mk`, `abc`, `siwan-fashion-house`, etc.

### 4. Add the Worker route

Create this route for the zone:

```text
*.ubnux.com/*
```

Attach it to:

```text
ubnux-businesskey-router
```

The apex `ubnux.com` is not matched by this wildcard route, so the existing website remains unchanged.

### 5. Keep existing reserved hosts

The Worker intentionally does not treat these as BusinessKeys:

`www`, `api`, `admin`, `mail`, `smtp`, `imap`, `pop`, `ftp`, `cdn`, `static`, `assets`, `status`, `app`, `login`, `verify`.

Those hosts continue through the existing deployment.

## Test

Use a BusinessKey that already exists in Google Sheets/API, for example:

```text
https://mk.ubnux.com/
```

The browser should stay on `mk.ubnux.com` while the page loads the exact business through:

```text
action=business-key&key=mk
```

The SEO canonical should remain the permanent `/in/bihar/.../<slug>/` URL returned by the backend, not the BusinessKey subdomain.

## Important

Do not change `_redirects` for the wildcard subdomain setup.

Do not create 10,000 DNS records.

Do not move the Google Apps Script API.

Do not replace the existing `business-page.js` unless a later test proves it is necessary.
