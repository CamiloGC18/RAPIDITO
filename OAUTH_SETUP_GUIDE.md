# Google OAuth Authentication Setup Guide

This guide explains how to set up Google OAuth authentication for the Rapidito application.

## Overview

The application now uses **Google OAuth 2.0** as the exclusive authentication method for both users and captains. Email/password authentication has been deprecated.

## Prerequisites

1. A Google Cloud Platform account
2. Access to Google Cloud Console
3. Backend deployed on Render (or local setup)
4. Frontend deployed on Vercel (or local setup)

---

## Part 1: Google Cloud Console Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: **"Rapidito OAuth"**
4. Click **"Create"**
5. Note down your **Project ID**

### Step 2: Enable Required APIs

1. In your project dashboard, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** user type (unless you have Google Workspace)
3. Click **"Create"**
4. Fill in the required information:
   - **App name:** Rapidito
   - **User support email:** Your email address
   - **App logo:** Upload your app logo (optional)
   - **Application home page:** Your frontend URL (e.g., `https://rapidito.vercel.app`)
   - **Authorized domains:** 
     - `vercel.app`
     - `onrender.com`
   - **Developer contact information:** Your email
5. Click **"Save and Continue"**
6. **Scopes:** Click **"Add or Remove Scopes"**
   - Select `email` and `profile`
   - Click **"Update"** → **"Save and Continue"**
7. **Test users:** (Optional during development)
   - Add your Google account email for testing
   - Click **"Save and Continue"**
8. Click **"Back to Dashboard"**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Application type: **"Web application"**
4. Name: **"Rapidito Web Client"**
5. **Authorized JavaScript origins:**
   ```
   https://your-frontend.vercel.app
   http://localhost:5173
   ```
6. **Authorized redirect URIs:**
   ```
   https://your-backend.onrender.com/auth/google/user/callback
   https://your-backend.onrender.com/auth/google/captain/callback
   http://localhost:3000/auth/google/user/callback
   http://localhost:3000/auth/google/captain/callback
   ```
7. Click **"Create"**
8. **IMPORTANT:** Copy the **Client ID** and **Client Secret** immediately
9. Store them securely (you'll need them for environment variables)

---

## Part 2: Backend Configuration

### Environment Variables

Add the following to your backend `.env` file (or Render environment variables):

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# OAuth Callback URLs
GOOGLE_CALLBACK_URL_USER=https://your-backend.onrender.com/auth/google/user/callback
GOOGLE_CALLBACK_URL_CAPTAIN=https://your-backend.onrender.com/auth/google/captain/callback

# Frontend URL for redirects
CLIENT_URL=https://your-frontend.vercel.app

# Session Secret (generate a strong random string)
SESSION_SECRET=your-super-secret-session-key-2025

# Existing variables (keep these)
JWT_SECRET=your_existing_jwt_secret
MONGODB_PROD_URL=your_mongodb_connection_string
PORT=4000
ENVIRONMENT=production
```

### For Render Deployment:

1. Go to your Render dashboard
2. Select your backend service
3. Go to **"Environment"** tab
4. Add each environment variable listed above
5. Click **"Save Changes"**
6. Your service will automatically redeploy

### For Local Development:

Create a `.env` file in the `Backend` directory with the variables above, using `localhost` URLs:

```env
GOOGLE_CALLBACK_URL_USER=http://localhost:3000/auth/google/user/callback
GOOGLE_CALLBACK_URL_CAPTAIN=http://localhost:3000/auth/google/captain/callback
CLIENT_URL=http://localhost:5173
```

---

## Part 3: Frontend Configuration

### Environment Variables

Add the following to your frontend `.env` file (or Vercel environment variables):

```env
VITE_SERVER_URL=https://your-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_ENVIRONMENT=production
```

### For Vercel Deployment:

1. Go to your Vercel dashboard
2. Select your frontend project
3. Go to **"Settings"** → **"Environment Variables"**
4. Add each variable listed above
5. Click **"Save"**
6. Redeploy your application

### For Local Development:

Create a `.env` file in the `Frontend` directory:

```env
VITE_SERVER_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_ENVIRONMENT=development
```

---

## Part 4: Testing the OAuth Flow

### User Authentication Flow

1. Navigate to your frontend: `https://your-frontend.vercel.app/login`
2. Click **"Continuar con Google"**
3. You'll be redirected to Google's OAuth consent screen
4. Sign in with your Google account
5. Grant permissions to the app
6. You'll be redirected back to the app and logged in

### Captain Authentication Flow

1. Navigate to: `https://your-frontend.vercel.app/captain/signup`
2. Fill in vehicle information (color, plate, capacity, type, phone)
3. Click **"Continuar con Google"**
4. Complete Google OAuth flow
5. Your captain account will be created with vehicle data

### Testing Checklist

- [ ] User can sign in with Google
- [ ] Captain can sign up with vehicle data + Google OAuth
- [ ] Profile pictures display from Google account
- [ ] Token is stored and persists on page reload
- [ ] Protected routes work correctly
- [ ] Logout functionality works
- [ ] Subscription banner shows for captains (inactive status)

---

## Part 5: Troubleshooting

### Common Issues

#### 1. "Redirect URI mismatch" Error

**Problem:** The redirect URI in your request doesn't match any authorized URIs in Google Console.

**Solution:**
- Double-check that the URIs in Google Cloud Console **exactly match** your backend URLs
- Ensure there are no trailing slashes or typos
- Wait a few minutes after updating URIs in Google Console

#### 2. "Invalid token" Error

**Problem:** JWT token verification fails.

**Solution:**
- Verify `JWT_SECRET` is the same in both backend .env and deployed environment
- Check that the token hasn't expired (24h validity)
- Clear browser localStorage and try logging in again

#### 3. "Session undefined" Error

**Problem:** Session middleware not initialized properly.

**Solution:**
- Ensure `SESSION_SECRET` is set in environment variables
- Verify `express-session` middleware is initialized before Passport
- Check that `app.use(session(...))` comes before `app.use(passport.initialize())`

#### 4. CORS Errors

**Problem:** Frontend can't communicate with backend OAuth endpoints.

**Solution:**
- Ensure `CLIENT_URL` is correctly set in backend .env
- Verify CORS is enabled for your frontend domain
- Check browser console for specific CORS error messages

#### 5. "Vehicle data required" Error (Captains)

**Problem:** Captain signup fails because vehicle data isn't stored in session.

**Solution:**
- Verify the signup flow: First submit vehicle form, then OAuth
- Check that `SESSION_SECRET` is set
- Ensure cookies are enabled in the browser
- Try using the same browser tab for the entire signup flow

### Debugging Tips

1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for error messages in Console tab
   - Check Network tab for failed API requests

2. **Check Backend Logs:**
   - In Render: Go to service → Logs tab
   - Locally: Check terminal where server is running
   - Look for OAuth-related error messages

3. **Test with Incognito Mode:**
   - Clears cached OAuth credentials
   - Helps isolate session/cookie issues

4. **Verify Environment Variables:**
   - Backend: Check Render dashboard or local .env
   - Frontend: Check Vercel dashboard or local .env
   - Ensure no typos in variable names

---

## Part 6: Migration from Old System

### For Existing Users

Users with email/password accounts will need to:
1. Use the new Google OAuth flow
2. Sign in with the **same email address** used in their old account
3. Their old account data will be linked to their Google account

### Database Considerations

The old password-based accounts remain in the database but:
- `password` field is no longer required
- `emailVerified` field has been removed
- New fields added: `googleId`, `profilePicture`
- For captains: `subscriptionStatus`, `subscriptionExpiryDate`, `subscriptionStartDate`

### No Manual Migration Needed

The system will automatically:
1. Find existing accounts by email
2. Update them with Google ID and profile picture
3. Preserve all ride history and other data

---

## Part 7: Security Best Practices

### Production Checklist

- [ ] Use HTTPS for all production URLs
- [ ] Set `secure: true` for session cookies in production
- [ ] Use strong, random `SESSION_SECRET` and `JWT_SECRET`
- [ ] Never commit `.env` files to Git
- [ ] Rotate secrets regularly
- [ ] Monitor OAuth usage in Google Cloud Console
- [ ] Set up proper CORS restrictions
- [ ] Enable rate limiting on auth endpoints

### Environment Variable Security

**DO:**
- Store secrets in Render/Vercel environment variables
- Use different credentials for development and production
- Rotate secrets if compromised

**DON'T:**
- Commit `.env` files to Git
- Share secrets in plain text
- Use the same secrets across multiple projects
- Expose `GOOGLE_CLIENT_SECRET` in frontend code

---

## Part 8: API Endpoints Reference

### OAuth Endpoints

#### User OAuth Flow
- **Initiate:** `GET /auth/google/user`
- **Callback:** `GET /auth/google/user/callback`

#### Captain OAuth Flow
- **Initiate:** `GET /auth/google/captain`
- **Callback:** `GET /auth/google/captain/callback`
- **Vehicle Data:** `POST /auth/captain/vehicle-data`

#### Utility Endpoints
- **Verify Token:** `GET /auth/verify`
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ valid: true/false, userType, subscriptionStatus }`

- **Logout:** `POST /auth/logout`
  - Response: `{ success: true, message: "Logged out successfully" }`

### Deprecated Endpoints (Return 410 Gone)

- `POST /user/register`
- `POST /user/login`
- `POST /user/verify-email`
- `POST /user/reset-password`
- `POST /captain/register`
- `POST /captain/login`
- `POST /captain/verify-email`
- `POST /captain/reset-password`

---

## Part 9: Support and Maintenance

### Monitoring OAuth Usage

1. Go to Google Cloud Console
2. Navigate to **"APIs & Services"** → **"Credentials"**
3. Click on your OAuth client ID
4. View usage statistics and quotas

### Updating Redirect URIs

When deploying to new domains:
1. Update Google Cloud Console redirect URIs
2. Update backend environment variables
3. Redeploy both backend and frontend
4. Test the entire OAuth flow

### Requesting OAuth Review (Optional)

If you need to make the app public:
1. Complete the OAuth consent screen fully
2. Add privacy policy and terms of service URLs
3. Submit for verification in Google Cloud Console
4. Wait for Google review (can take several days)

---

## Questions or Issues?

If you encounter any issues:
1. Check this guide's troubleshooting section
2. Review browser console and backend logs
3. Verify all environment variables are set correctly
4. Test in incognito mode to rule out caching issues
5. Check Google Cloud Console for any service disruptions

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Phase:** 1 - OAuth Implementation Complete
