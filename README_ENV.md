# Client .env File Setup ✅

I've created the `.env` file in the `client` directory for frontend configuration.

## Configuration

The `.env` file contains:

```env
VITE_API_URL=http://localhost:5000/api
```

This tells the frontend where to find the backend API.

## Important Notes

1. **Vite Environment Variables:** All environment variables in Vite must be prefixed with `VITE_` to be accessible in the code.

2. **Default Value:** If `.env` is not found, the code defaults to `http://localhost:5000/api`

3. **Restart Required:** After changing `.env`, you need to restart the Vite dev server:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

## When to Change

- **Different Backend Port:** If your backend runs on port 5001, change to:
  ```env
  VITE_API_URL=http://localhost:5001/api
  ```

- **Production:** For production, set to your production API URL:
  ```env
  VITE_API_URL=https://api.yourdomain.com/api
  ```

## Current Setup

✅ `.env` file created with default backend URL
✅ `.env.example` created as a template
✅ Frontend will use `http://localhost:5000/api` by default

The frontend is now properly configured! 🎉

