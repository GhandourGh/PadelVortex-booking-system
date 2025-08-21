# PadelVortex Booking System

A modern Next.js web application for managing padel court bookings with real-time availability and booking management.

## Features

- 🏓 Real-time court booking system
- 📅 Interactive booking calendar
- 📱 Responsive design for mobile and desktop
- 🔐 Secure authentication with Supabase
- 📊 Admin dashboard for booking management
- 📞 Contact integration with club phone number

## Tech Stack

- **Framework**: Next.js 15.4.6
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Netlify

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd padelvortex-ui
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy the example environment file and configure your variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Club Information
NEXT_PUBLIC_CLUB_PHONE=+ 961 03 441 339
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Building for Production

### Local Production Build Test

```bash
npm run build
npm run start
```

This will build the application and start the production server locally to test that everything works correctly.

## Deployment to Netlify

### 1. Push to GitHub

First, initialize git and push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [Netlify](https://netlify.com) and sign up/login
2. Click "New site from Git"
3. Connect your GitHub account
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: 18

### 3. Environment Variables

In your Netlify dashboard:

1. Go to Site settings → Environment variables
2. Add all the environment variables from your `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_CLUB_PHONE`

### 4. Deploy

1. Netlify will automatically deploy when you push to the main branch
2. You can also trigger manual deploys from the Netlify dashboard
3. Your site will be available at `https://your-site-name.netlify.app`

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── admin/          # Admin dashboard pages
│   ├── api/            # API routes
│   ├── booking/        # Booking pages
│   └── layout.tsx      # Root layout
├── components/         # React components
├── lib/               # Utility functions and configurations
│   ├── env.ts         # Environment validation
│   └── supabase/      # Supabase client configuration
└── ...
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_CLUB_PHONE` | Club phone number | Yes |

## Troubleshooting

### Build Issues

- Ensure all environment variables are set correctly
- Check that Node.js version is 18+
- Verify all dependencies are installed

### Deployment Issues

- Check Netlify build logs for errors
- Verify environment variables are set in Netlify dashboard
- Ensure the `@netlify/plugin-nextjs` plugin is enabled

### Local Development Issues

- Clear `.next` folder and node_modules, then reinstall
- Check that all environment variables are in `.env.local`
- Verify Supabase project is properly configured

## Support

For issues and questions:
- Check the build logs in Netlify dashboard
- Verify your Supabase project configuration
- Ensure all environment variables are correctly set

## License

This project is private and proprietary.
