# Testing Commands for QBO Extension

## Clear Extension Storage (Force Re-authentication)
Open Chrome DevTools Console on any QBO page and run:

```javascript
// Clear all auth data
chrome.storage.local.clear(() => {
  console.log('Extension storage cleared - user will need to re-authenticate');
});
```

## Check Current Auth Status
```javascript
// Check what's stored
chrome.storage.local.get(null, (result) => {
  console.log('Current extension storage:', result);
});
```

## Force Cache Expiration
```javascript
// Set cache timestamp to 7 hours ago (expired)
chrome.storage.local.get(['qbo_auth_cache'], (result) => {
  if (result.qbo_auth_cache) {
    result.qbo_auth_cache.timestamp = Date.now() - (7 * 60 * 60 * 1000); // 7 hours ago
    chrome.storage.local.set(result, () => {
      console.log('Cache expired - next request will re-validate');
    });
  }
});
```

## Test API Endpoint Directly
```bash
curl -X POST 'https://eazmvistbyiiepozlpan.supabase.co/functions/v1/validate-subscription' \
  -H 'Content-Type: application/json' \
  -d '{"userEmail":"test@example.com"}'
```

## Chrome Extension Debugging

1. **Extension Console**: `chrome://extensions/` → Click "Inspect views" under your extension
2. **Content Script Console**: Right-click QBO page → Inspect → Console tab
3. **Network Tab**: Monitor API calls to Supabase function
4. **Application Tab**: Check Local Storage for cached auth data

## Expected Console Output

### First Login:
```
🔑 Checking authentication before opening modal...
🔑 Auth: No user email found
🔑 Auth: Fetching fresh validation
🔑 Auth: Validation result: VALID
🔑 Authentication successful, opening modal
```

### Subsequent Uses (Cached):
```
🔑 Checking authentication before opening modal...
🔑 Auth: Using cached validation
🔑 Authentication successful, opening modal
```

### Invalid Subscription:
```
🔑 Auth: Validation result: INVALID
🔑 Authentication failed or cancelled
```