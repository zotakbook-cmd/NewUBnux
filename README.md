# UBnux BusinessKey Wildcard Subdomain

## Target

10,000+ businesses without 10,000 Cloudflare DNS records.

Examples:

- https://mk.ubnux.com/
- https://siwan-fashion-house.ubnux.com/
- https://another-business.ubnux.com/

All use one wildcard DNS record + one Worker.

## Architecture

Browser
  |
  v
*.ubnux.com
  |
  v
Cloudflare Worker
  |
  +--> /assets/* -> existing UBnux Pages
  |
  +--> other paths -> /business.html from existing UBnux Pages
                                  |
                                  v
                         business-page.js
                                  |
                          BusinessKey from
                             hostname
                                  |
                                  v
                     /api?action=business-key
                                  |
                                  v
                         Google Apps Script
                                  |
                                  v
                         existing SEO data
                                  |
                                  v
                         existing template

## Cloudflare setup

### 1. DNS

Cloudflare -> ubnux.com -> DNS -> Records -> Add:

Type:
  A

Name:
  *

IPv4:
  192.0.2.0

Proxy:
  Proxied (orange cloud)

This is a placeholder origin. The Worker is the actual request handler.

### 2. Worker

Create Worker:
  ubnux-businesskey-router

Upload:
  src/index.js
  wrangler.json

Or deploy with Wrangler.

### 3. Route

The Worker route must be:

  *.ubnux.com/*

Do NOT create one route per business.

### 4. Existing apex site

Keep:
  https://ubnux.com/

as it is.

The wildcard route only catches subdomains.

If you have special subdomains such as www, keep an explicit higher-priority route/origin for them if required.

## Frontend changes

Apply:
  api-businesskey.patch.txt
  business-page-businesskey.patch.txt

to the existing GitHub repository.

The backend BusinessKey endpoint is already working.

## Test order

1. Deploy frontend changes.
2. Deploy Worker.
3. Add wildcard DNS.
4. Open:

   https://mk.ubnux.com/

5. Browser console should show the normal BusinessPage loading flow.
6. The API call should be:

   action=business-key
   key=mk

7. The business template should render.
8. Canonical should remain the permanent SEO URL, not the subdomain.

For the current demo record, the canonical URL is:

https://ubnux.com/in/bihar/siwan/clothing-and-fashion/siwan-fashion-house/

The subdomain is an alternate business entry point, not the canonical SEO URL.

## Important

Do not add DNS records like:

  mk -> ...
  abc -> ...
  xyz -> ...

The whole point of this architecture is that one wildcard handles all BusinessKeys.
