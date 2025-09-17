# Re-Zero Client

Frontend React application for the Re-Zero AI Framework - a multi-modal, multi-agent AI system.

## Features

- **Modern React 18**: Latest React with hooks and functional components
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing
- **React Query**: Data fetching and caching
- **Responsive Design**: Mobile-first responsive UI
- **Authentication**: JWT-based auth with context
- **Real-time Updates**: Live task status updates

## Quick Start

### Prerequisites

- Node.js 18+
- Running Re-Zero Server (see server README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm start
# or
npm run dev
```

The application will start on `http://localhost:3000`

### Environment Variables

Required environment variables in `.env`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_APP_NAME=Re-Zero AI Framework
```

## Available Scripts

- `npm start` - Start development server
- `npm run dev` - Start development server (alias)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts (Auth, etc.)
├── hooks/           # Custom React hooks
├── pages/           # Page components
├── services/        # API services
└── utils/           # Utility functions
```

## Key Components

### Pages
- **LoginPage**: User authentication
- **RegisterPage**: User registration
- **DashboardPage**: Main dashboard with overview
- **IngestPage**: File upload and data ingestion
- **TasksPage**: Task management and listing
- **TaskDetailPage**: Individual task details
- **ProfilePage**: User profile management

### Components
- **Layout**: Main application layout
- **Header**: Navigation header
- **Sidebar**: Navigation sidebar
- **LoadingSpinner**: Loading states
- **MobileSidebar**: Mobile navigation

## Authentication

The app uses JWT-based authentication with React Context:

```jsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  
  return <DashboardPage />;
}
```

## API Integration

API calls are handled through the `api.js` service:

```jsx
import { api } from './services/api';

// Get tasks
const tasks = await api.get('/tasks');

// Create task
const newTask = await api.post('/tasks', taskData);
```

## Styling

The app uses Tailwind CSS for styling. Key design principles:

- **Mobile-first**: Responsive design starting from mobile
- **Utility classes**: Use Tailwind utilities for consistent styling
- **Component variants**: Use `clsx` and `tailwind-merge` for conditional classes
- **Dark mode ready**: CSS variables for theme switching

## Testing

Run the test suite:

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Building for Production

1. Build the application:
```bash
npm run build
```

2. Preview the build:
```bash
npm run preview
```

3. Deploy the `dist/` folder to your hosting service

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
