# PROTECHT BIM Web Application

Frontend web application for PROTECHT BIM - A comprehensive construction project management platform with BIM integration.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Features](#features)
- [Development](#development)
- [Deployment](#deployment)

## Overview

The PROTECHT BIM web application provides a modern, responsive user interface for managing construction projects. Phase 1 includes:

- **Authentication**: Login, registration, and session management
- **Project Management**: Create, view, edit, and filter projects
- **Work Package Management**: Manage tasks, milestones, and other work items
- **Responsive Design**: Mobile, tablet, and desktop support
- **Real-time Updates**: Live data synchronization (Phase 2)

## Technology Stack

- **Framework**: React 18.x
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **Routing**: React Router 6.x
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form (planned)
- **UI Components**: Custom components with Tailwind
- **Icons**: Heroicons / Lucide React
- **Testing**: Vitest + React Testing Library

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Backend API** running on `http://localhost:3000` (see `apps/api/README.md`)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd protecht-bim
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install web app dependencies
cd apps/web
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp apps/web/.env.example apps/web/.env
```

Edit `.env` with your configuration (see [Configuration](#configuration) section).

## Configuration

### Environment Variables

Create a `.env` file in `apps/web/` with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=30000

# Application Configuration
VITE_APP_NAME=PROTECHT BIM
VITE_APP_VERSION=1.0.0

# Feature Flags (for future phases)
VITE_ENABLE_BIM_VIEWER=false
VITE_ENABLE_GANTT_CHART=false
VITE_ENABLE_REAL_TIME=false

# Development
VITE_DEV_MODE=true
```

### Environment-Specific Configurations

Create separate `.env` files for different environments:

- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

## Running the Application

### Development Mode

Start the development server with hot module replacement (HMR):

```bash
cd apps/web
npm run dev
```

The application will be available at `http://localfost:3001`

### With Backend API

Ensure the backend API is running first:

```bash
# Terminal 1: Start backend
cd apps/api
npm run dev

# Terminal 2: Start frontend
cd apps/web
npm run dev
```

### Using Docker Compose

Start both frontend and backend:

```bash
# From project root
docker-compose up
```

## Building for Production

### Create Production Build

```bash
cd apps/web
npm run build
```

Build output: `dist/`

### Preview Production Build

```bash
npm run preview
```

### Build Optimization

The production build includes:
- Code minification
- Tree shaking
- Asset optimization
- Source maps (optional)
- Gzip compression

## Testing

### Run Tests

```bash
cd apps/web
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### E2E Tests (Planned)

```bash
npm run test:e2e
```

## Project Structure

```
apps/web/
├── public/               # Static assets
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/       # Generic components (Button, Input, etc.)
│   │   ├── layout/       # Layout components (Header, Sidebar, etc.)
│   │   ├── ProjectCard.tsx
│   │   └── ...
│   ├── pages/            # Page components
│   │   ├── LoginPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── WorkPackagesPage.tsx
│   │   └── ...
│   ├── services/         # API service layer
│   │   ├── api.ts        # Axios instance
│   │   ├── authService.ts
│   │   ├── projectService.ts
│   │   └── ...
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   └── ...
│   ├── types/            # TypeScript type definitions
│   │   ├── project.ts
│   │   ├── workPackage.ts
│   │   └── ...
│   ├── utils/            # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── ...
│   ├── styles/           # Global styles
│   │   └── index.css
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Application entry point
│   └── vite-env.d.ts     # Vite type definitions
├── .env                  # Environment variables (not in git)
├── .env.example          # Example environment file
├── index.html            # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── README.md
```

## Features

### Phase 1 Features (Implemented)

#### Authentication
- ✅ User registration
- ✅ Login with email/password
- ✅ JWT token management
- ✅ Protected routes
- ✅ Logout functionality
- ✅ Session persistence

#### Project Management
- ✅ Project list view with cards
- ✅ Project filtering and search
- ✅ Project creation form
- ✅ Project detail view
- ✅ Project editing
- ✅ Lifecycle phase display

#### Work Package Management
- ✅ Work package list view
- ✅ Work package filtering
- ✅ Work package creation
- ✅ Work package detail drawer
- ✅ Status and priority indicators

#### Responsive Design
- ✅ Mobile-first approach
- ✅ Tablet optimization
- ✅ Desktop layout
- ✅ Touch-friendly controls
- ✅ Responsive navigation

### Phase 2 Features (Planned)

- 📅 Gantt chart visualization
- 📅 Kanban boards
- 📅 Sprint management
- 📅 Time tracking interface
- 📅 Real-time notifications
- 📅 File upload and management
- 📅 Wiki and documentation

### Phase 3 Features (Planned)

- 🔮 3D BIM model viewer
- 🔮 BCF issue management
- 🔮 Clash detection visualization
- 🔮 4D construction sequencing
- 🔮 5D cost estimation

## Development

### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Component Development

#### Creating a New Component

```tsx
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">{title}</h2>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Action
        </button>
      )}
    </div>
  );
};
```

#### Using Tailwind CSS

The project uses Tailwind CSS for styling. Common patterns:

```tsx
// Layout
<div className="container mx-auto px-4">

// Flexbox
<div className="flex items-center justify-between">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Responsive
<div className="text-sm md:text-base lg:text-lg">

// States
<button className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800">
```

### API Integration

#### Using API Services

```tsx
import { projectService } from '../services/projectService';

const MyComponent = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getProjects();
        setProjects(data.projects);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    fetchProjects();
  }, []);

  return <div>{/* Render projects */}</div>;
};
```

#### Error Handling

```tsx
try {
  await projectService.createProject(data);
  // Success handling
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
  } else if (error.response?.status === 400) {
    // Validation error - show error message
  } else {
    // Generic error
  }
}
```

### State Management

The application uses React Context API for global state:

```tsx
// Using AuthContext
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, login, logout } = useAuth();

  return (
    <div>
      {user ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={() => login(email, password)}>Login</button>
      )}
    </div>
  );
};
```

### Routing

Protected routes require authentication:

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};
```

## Deployment

### Static Hosting (Recommended)

Deploy to static hosting services:

#### Vercel

```bash
npm install -g vercel
vercel --prod
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Docker Deployment

#### Build Docker Image

```bash
docker build -f apps/web/Dockerfile.prod -t protecht-bim-web:latest .
```

#### Run Container

```bash
docker run -d \
  --name protecht-web \
  -p 80:80 \
  protecht-bim-web:latest
```

### Environment Configuration

For production, update `.env.production`:

```env
VITE_API_URL=https://api.protecht-bim.com/api/v1
VITE_APP_NAME=PROTECHT BIM
VITE_DEV_MODE=false
```

### Performance Optimization

1. **Code Splitting**: Lazy load routes and components
2. **Image Optimization**: Use WebP format, lazy loading
3. **Caching**: Configure cache headers
4. **CDN**: Serve static assets from CDN
5. **Compression**: Enable gzip/brotli compression

## Troubleshooting

### Common Issues

#### API Connection Error

```
Error: Network Error
```

**Solution**: Ensure backend API is running and `VITE_API_URL` is correct.

```bash
# Check API is running
curl http://localhost:3000/health

# Update .env
VITE_API_URL=http://localhost:3000/api/v1
```

#### Build Errors

```
Error: Cannot find module '@/components/...'
```

**Solution**: Check TypeScript path aliases in `tsconfig.json` and `vite.config.ts`.

#### Styling Issues

```
Tailwind classes not working
```

**Solution**: Ensure Tailwind is properly configured in `tailwind.config.js` and imported in `src/styles/index.css`.

#### Authentication Issues

```
Token expired or invalid
```

**Solution**: Clear localStorage and login again.

```javascript
localStorage.clear();
window.location.href = '/login';
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android

## Accessibility

The application follows WCAG 2.1 Level AA guidelines:

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance

## Support

For issues, questions, or contributions:

- **Documentation**: See `docs/` folder
- **Issues**: GitHub Issues
- **Email**: support@protecht-bim.com

## License

Proprietary - All rights reserved

## Phase 2 Roadmap

Upcoming frontend features in Phase 2:
- Interactive Gantt chart component
- Drag-and-drop Kanban boards
- Real-time notifications with WebSocket
- File upload with progress tracking
- Rich text editor for descriptions
- Advanced filtering and search

See `tasks.md` for detailed implementation plan.
