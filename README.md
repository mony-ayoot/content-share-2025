# Content Share Platform

A content sharing platform with Django backend, React frontend, and PostgreSQL database.

## Deployment Instructions for Railway

### Prerequisites
- GitHub account
- Railway account (https://railway.app/)

### Backend Deployment

1. Login to Railway.app
2. Click on "New Project"
3. Select "Deploy from GitHub repo" and connect your repository
4. Choose the project and branch to deploy
5. Configure environment variables:
   - `SECRET_KEY` - Django secret key
   - `DEBUG` - Set to 'False' for production
   - `ALLOWED_HOSTS` - Comma-separated list of allowed hosts (include your Railway domain)
   - `CORS_ORIGIN_WHITELIST` - Comma-separated list of allowed origins (include your frontend URL)
   - `CSRF_TRUSTED_ORIGINS` - Comma-separated list of trusted origins (include your frontend URL)
   - Railway will automatically set `DATABASE_URL` when you add a PostgreSQL database

6. Add a PostgreSQL database:
   - Click on "New" and select "Database"
   - Choose "PostgreSQL"
   - Railway will provision a PostgreSQL database and set up the DATABASE_URL environment variable

7. Run migrations:
   - In the Railway deployment dashboard, click on your service
   - Go to the "Commands" tab
   - Run: `python manage.py migrate`
   - Run: `python manage.py collectstatic --noinput`

### Frontend Deployment

1. Create a new service in your Railway project
2. Deploy from the same GitHub repository
3. Set the root directory to "frontend"
4. Configure environment variables:
   - `VITE_API_URL` - URL of your deployed backend service (e.g., "https://your-backend-service.railway.app/api")

5. Set the build command:
   ```
   npm install && npm run build
   ```

6. Set the start command:
   ```
   npm run start
   ```

### Connect Frontend and Backend

1. Make sure your frontend is using the correct API URL by setting the `VITE_API_URL` environment variable
2. Add the frontend URL to the backend's CORS_ORIGIN_WHITELIST and CSRF_TRUSTED_ORIGINS settings

### Checking Logs

If you encounter any issues, check the logs in the Railway dashboard for each service.

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
``` 