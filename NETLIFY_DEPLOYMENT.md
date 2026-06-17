# Netlify Backend Deployment Guide

## CORS Configuration

The CORS configuration has been updated in the backend to work with Netlify. Here's what was changed:

### 1. Updated CORS Settings

- Modified `src/index.ts` to include specific origins
- Added support for localhost and Netlify domains
- Configured proper headers and methods

### 2. Created Serverless Function

- Created `netlify/functions/api.js` to handle serverless deployment
- Added proper CORS headers for Netlify environment
- Included MongoDB connection and route handling

### 3. Netlify Configuration

- Added `netlify.toml` with proper redirects and headers
- Configured function routing for `/jobs` and `/jobApplications` endpoints

## Deployment Steps

### 1. Install Dependencies

```bash
cd aidf-back-end
npm install
```

### 2. Set Environment Variables in Netlify

Go to your Netlify dashboard → Site settings → Environment variables and add:

- `MONGODB_URI`: Your MongoDB connection string
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `NODE_ENV`: `production`

### 3. Deploy to Netlify

1. Connect your backend repository to Netlify
2. Set build command: `npm install`
3. Set publish directory: `public` (or leave empty)
4. Deploy

### 4. Update Frontend Environment Variable

Once deployed, get your Netlify backend URL and update the frontend:

1. Go to your frontend Netlify project
2. Add environment variable: `VITE_API_BASE_URL=https://your-backend-url.netlify.app`
3. Redeploy the frontend

## Testing

### Test Backend Health

Visit: `https://your-backend-url.netlify.app/health`

### Test API Endpoints

- `https://your-backend-url.netlify.app/jobs`
- `https://your-backend-url.netlify.app/jobApplications`

## Troubleshooting

### CORS Issues

If you still get CORS errors:

1. Check that your frontend URL is in the CORS origins list
2. Verify the environment variables are set correctly
3. Ensure the backend is properly deployed

### 404 Errors

If you get 404 errors:

1. Check that the Netlify function is deployed correctly
2. Verify the redirects in `netlify.toml`
3. Test the health endpoint first

### Double Slash Issues

The frontend config now automatically removes trailing slashes to prevent double slash URLs.
