# Issue Tracker

A modern, full-stack issue tracking application built with React, Fastify, and SQLite — plus **MCP** so AI agents can manage issues.

**Monorepo:** [https://github.com/Ganes769/mcp-monorepo](https://github.com/Ganes769/mcp-monorepo)

| | URL |
|---|---|
| Live app | [https://mcp-monorepo.vercel.app](https://mcp-monorepo.vercel.app) |
| API | [https://mcp-monorepo-yccf.vercel.app/api](https://mcp-monorepo-yccf.vercel.app/api) |
| Remote MCP | [https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp](https://issue-tracker-mcp.ganesh-mcp.workers.dev/mcp) |

## AI skill highlight

Built with **Cursor** and exposed via **Model Context Protocol (MCP)** so Claude / Cursor agents can `create_issue`, assign users, set priority, and triage against the live API — not just chat about issues.

Remote MCP docs: [`../issue-tracker-mcp/README.md`](../issue-tracker-mcp/README.md)

## Features

- 🔐 **Authentication** - Secure user authentication with BetterAuth
- 📝 **Issue Management** - Create, read, update, and delete issues
- 🏷️ **Tag System** - Organize issues with customizable tags
- 🔍 **Advanced Filtering** - Filter by status, priority, assignee, tags, and search
- 👥 **User Management** - Assign issues to team members
- 🤖 **MCP / AI agents** - Remote + local MCP tools for Claude and Cursor
- 📱 **Responsive Design** - Works great on desktop and mobile
- ⚡ **Fast & Modern** - Built with modern web technologies

## Tech Stack

### Backend

- **Fastify** - High-performance Node.js web framework
- **SQLite** - Lightweight, embedded database
- **BetterAuth** - Modern authentication library
- **TypeScript** - Type-safe JavaScript

### Frontend

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible components
- **TypeScript** - Type-safe JavaScript

## Project Structure

```
├── backend/          # Fastify API server
│   ├── src/
│   │   └── index.ts  # Main server file
│   ├── package.json
│   └── tsconfig.json
├── frontend/         # React application
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── lib/
│   │       └── utils.ts
│   ├── package.json
│   └── tsconfig.json
└── package.json      # Root workspace configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd issues
   ```

2. **Set up the backend**

   ```bash
   cd backend
   npm install

   # Copy environment template and configure
   cp .env.template .env
   # Edit .env with your settings

   # Run database migrations
   npm run migrate

   # Seed with sample data (optional)
   npm run seed
   ```

3. **Set up the frontend**

   ```bash
   cd ../frontend
   npm install

   # Copy environment template and configure
   cp .env.template .env
   # Edit .env with your settings
   ```

4. **Start the development servers**

   From the project root:

   ```bash
   npm run dev
   ```

   Or start individually:

   ```bash
   # Backend (in backend/ directory)
   npm run dev

   # Frontend (in frontend/ directory)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health check: http://localhost:3000/health

## Environment Configuration

### Backend (.env)

```env
DATABASE_PATH=database.sqlite
BETTER_AUTH_SECRET=your-super-secret-auth-key-change-this-in-production
BETTER_AUTH_BASE_URL=http://localhost:3000
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
VITE_NODE_ENV=development
```

## Available Scripts

### Root Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run test` - Run all tests (frontend + backend)

### Backend Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint

## API Documentation

### Authentication Endpoints

- `POST /api/auth/sign-up/email` - User registration
- `POST /api/auth/sign-in/email` - User login
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/get-session` - Get current user session

### Issues API

- `GET /api/issues` - List issues with filtering and pagination
- `POST /api/issues` - Create new issue
- `GET /api/issues/:id` - Get issue by ID
- `PUT /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue

### Tags API

- `GET /api/tags` - List all tags
- `POST /api/tags` - Create new tag
- `DELETE /api/tags/:id` - Delete tag

### Users API

- `GET /api/users` - List users (for assignment)

### Health Check

- `GET /health` - Application health status
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

## Testing

Run the comprehensive test suite:

```bash
# All tests
npm run test

# Backend tests only
cd backend && npm test

# Frontend tests only
cd frontend && npm test

# Watch mode
npm run test:watch
```

### Test Coverage

- **Backend**: 85 tests covering CRUD operations, authentication, filtering, error scenarios
- **Frontend**: 15 tests covering responsive design and component behavior

**Sample Users:**

- `john@example.com` / `password123`
- `jane@example.com` / `password123`
- `admin@example.com` / `admin123`
- `dev@example.com` / `dev123`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/your-username/issues/issues) on GitHub.
