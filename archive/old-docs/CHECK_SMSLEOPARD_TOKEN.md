# SMS Leopard Token Issue

## Current Situation

From your screenshot, I can see:
- **Key Name**: `Bz3LDHWNx1tL6A2BL4ie` (This is what you first provided)
- **Access_token**: `REDACTED_APP_SECRET`

## Problem

We're getting **401 Unauthorized** which means:
- ✅ API endpoint is correct (`https://api.smsleopard.com/v1/sms/send`)
- ❌ Authentication token format is wrong

## Possible Solutions

### Option 1: The token might need the key name as prefix
Some APIs require: `{key_name}:{access_token}`

### Option 2: The base64 token might need to be decoded first
The token looks like a base64-encoded string. It might contain the actual API key inside.

### Option 3: SMS Leopard might use a different auth format
They might require:
- API key in header as `X-API-Key`
- Or username:password format in Basic auth

## What We Need

Can you check your SMS Leopard dashboard for:

1. **API Documentation** - Look for "API Docs" or "Developer" section
2. **Example Request** - They usually show how to authenticate
3. **API Key Format** - Is there a "secret key" or "API secret" separate from the access token?

## Quick Test

Let me try a few different authentication formats to see which one works.
