# Meta Graph API

This project integrates **React + Vite** (frontend) with a **Laravel 11/12 API** (backend).  
It provides Facebook authentication using **Socialite** and secure API communication with **Sanctum**.  

---

## Backend (Laravel)

The backend is built with **Laravel 12**, handling:

- Facebook OAuth login via Socialite  
- API authentication with Sanctum  
- Database migrations for user management  

### Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan migrate
php artisan db:seed
php artisan serve
```

#### Install Sanctum & Socialite

```bash
# Sanctum
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate

# Socialite
composer require laravel/socialite
```

Update your `.env` with:

```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:8000/api/auth/facebook/callback
```

---

## Frontend (React + Vite)

The frontend is built with **React + Vite**, providing:

- Login UI for Facebook  
- API requests to the Laravel backend  
- Token-based authentication flow  

### Setup

```bash
cd frontend
npm install
npm install react-router-dom
npm run dev
```

Add a `.env` file:

```env
VITE_API_URL=http://localhost:8000/api
```

---

## Facebook App Setup

- Create an app at [Meta for Developers](https://developers.facebook.com/apps/)  
- Enable **Facebook Login**  
- Add redirect URI:

```
http://localhost:8000/api/auth/facebook/callback
```

---

## Running the Project

Start both servers:

```bash
# Backend
cd backend
php artisan serve

# Frontend
cd frontend
npm run dev
```

- Backend runs at: [http://localhost:8000](http://localhost:8000)  
- Frontend runs at: [http://localhost:5173](http://localhost:5173)  

---

## Notes

- Configure `backend/config/cors.php` to allow requests from `http://localhost:5173`  
- Run `php artisan migrate:fresh --seed` to reset the database if needed  

---
