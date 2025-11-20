# Knowledge Management Frontend

A modern React frontend for the Knowledge Management System with comprehensive search capabilities.

## Features

- 🔍 **Full-text search** across notes and tags
- 🏷️ **Tag filtering** - filter by multiple tags
- 📅 **Date range filtering** - filter by creation/update dates
- 📌 **Status filtering** - filter by pinned/archived status
- 🔐 **JWT Authentication** - secure login with token refresh
- 📱 **Responsive design** - works on all devices
- ⚡ **Fast performance** - built with Vite and React Query

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **TanStack Query** - Data fetching
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Backend API running (see knowledge-management-backend)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd knowledge-management-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your backend API URL:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

5. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Docker Deployment

### Build the image:
```bash
docker build -t knowledge-management-frontend .
```

### Run the container:
```bash
docker run -p 80:80 knowledge-management-frontend
```

## Railway Deployment

1. Push code to GitHub
2. In Railway, create a new project
3. Add service from GitHub repository
4. Railway will detect the Dockerfile automatically
5. Set environment variable:
   - `VITE_API_BASE_URL` - Your backend API URL (e.g., `https://your-backend.up.railway.app/api/v1`)

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (required)

## Project Structure

```
src/
├── components/       # React components
│   ├── LoginPage.tsx
│   ├── SearchPage.tsx
│   └── ProtectedRoute.tsx
├── contexts/        # React contexts
│   └── AuthContext.tsx
├── lib/            # Utilities and API client
│   └── api.ts
├── App.tsx         # Main app component
└── main.tsx         # Entry point
```

## Search Features

### Full-Text Search
- Search across note titles and content
- Case-insensitive matching
- Partial word matching

### Filtering Options
- **Tags**: Filter by one or more tags (by ID or name)
- **Status**: Filter by pinned or archived status
- **Dates**: Filter by creation or update date ranges
- **Pagination**: Navigate through search results

## API Integration

The frontend integrates with the backend API endpoints:

- `/auth/login/json` - User authentication
- `/auth/me` - Get current user
- `/search/notes` - Search notes with filters
- `/search/tags` - Search tags
- `/tags` - List all tags

## License

MIT
