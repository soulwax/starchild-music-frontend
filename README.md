# 🌟 darkfloor.art

![darkfloor.art Banner](.github/assets/emily-the-strange_vivid.png)

*An attempt at amodern full-stack music search & streaming interface.*

---

## ✨ Project Status

**Development Stage**: This is an early-stage music streaming interface built as a proof-of-concept. The project should display a modern full-stack architecture with Next.js, TypeScript, and TailwindCSS, suitable as foundation for music discovery and playback.

## 📋 Core Features

### Current Implementation

- **Music Search Interface**: Type-safe search functionality integrated with backend API endpoints
- **Type-Safe Environment Validation**: Strict environment variable management using `@t3-oss/env-nextjs`
- **Responsive UI**: Flat design with neon indigo accents, built with TailwindCSS v4
- **HTML5 Audio Playback**: Lightweight audio player components using native browser APIs (no external player libraries)
- **NextAuth Integration Ready**: OAuth 2.0 infrastructure configured for Discord authentication
- **Database Schema Support**: Drizzle ORM configuration for PostgreSQL integration

### Capabilities

The application provides:

- Pre-configured search UI components for music discovery
- Player component scaffolding for audio preview playback
- Type-safe React components with full TypeScript coverage
- Environment management for multiple deployment stages
- Responsive design system with CSS animations

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | Server-side rendering & routing |
| **Language** | TypeScript | Type-safe development |
| **Styling** | TailwindCSS v4 | Utility-first CSS framework |
| **Environment** | @t3-oss/env-nextjs | Type-safe environment configuration |
| **Authentication** | NextAuth.js | OAuth 2.0 / Session management |
| **Database** | Drizzle ORM | PostgreSQL schema & queries |
| **Audio** | HTML5 Audio API | Native playback control |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (for production use)

### Installation

1. **Clone & Install**

    ```bash
    git clone https://github.com/soulwax/starchild-music-frontend.git
    cd darkfloor-art
    npm install
    ```

2. **Environment Configuration**

    Create a `.env.local` file with required variables:

    ```yaml
    # NextAuth Configuration
    AUTH_SECRET=generate-with->npx auth secret
    AUTH_DISCORD_ID="your-discord-app-id"
    AUTH_DISCORD_SECRET="your-discord-app-secret"

    # Database
    DATABASE_URL="postgres://user:password@host:port/dbname?sslmode=require"

    # API Configuration
    API_URL="https://your-music-api.com/"
    STREAMING_KEY="your-secure-stream-key"
    ```

    **Generate NextAuth Secret:**

    ```bash
    npx auth secret
    ```

3. **Database Setup (Optional)**

    For database operations, create `drizzle.env.ts`:

    ```typescript
    // File: drizzle.env.ts
    import "dotenv/config";

    const required = (key: string) => {
      const val = process.env[key];
      if (!val) throw new Error(`Missing required env var: ${key}`);
      return val;
    };

    const config = {
      DB_HOST: required("DB_HOST"),
      DB_PORT: required("DB_PORT"),
      DB_ADMIN_USER: required("DB_ADMIN_USER"),
      DB_ADMIN_PASSWORD: required("DB_ADMIN_PASSWORD"),
      DB_NAME: required("DB_NAME"),
    };

    export default config;
    ```

    **Database Migrations:**

    ```bash
    # Development (fast, no migration history)
    npm run db:dev
    
    # Production (tracked migrations)
    npm run db:generate    # Generate migration files
    npm run db:migrate     # Apply migrations
    
    # Force sync schema (development only)
    npm run db:push
    
    # Open database GUI
    npm run db:studio
    ```

    **⚠️ Important:** Never run `db:migrate` AND `db:push` together - use `db:dev` for development, `db:migrate` for production.

    See [DATABASE_QUICK_START.md](./DATABASE_QUICK_START.md) for detailed workflow.

4. **Run Development Server**

  ```bash
  npm run dev
  ```

  Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```shell
src/
├── app/
│   ├── layout.tsx          # Root layout with App Router setup
│   └── page.tsx            # Main application page
├── components/
│   ├── Player.tsx          # Audio playback component
│   └── TrackCard.tsx       # Individual track display
├── styles/
│   └── globals.css         # TailwindCSS v4 theme & animations
├── utils/
│   └── api.ts              # Type-safe API client functions
├── types/
│   └── index.ts            # Shared TypeScript interfaces
└── env.js                  # Typed environment validation
```

## 🎨 Design System

| Element | Description |
|---------|-------------|
| **Cards & Buttons** | Rounded corners, flat surfaces with neon indigo borders/text |
| **Background** | Matte deep gray gradient with subtle animated accents |
| **Typography** | System sans-serif stack for crisp, accessible typography |
| **Animations** | CSS-based `slide-up`, `fade-in`, and gradient flows |
| **Color Palette** | Indigo accents on dark backgrounds for modern, minimal aesthetic |

### Design Tokens

Available in `src/styles/globals.css`:

```css
:root {
  --primary: #6366f1;      /* Indigo accent */
  --background: #0f172a;   /* Deep gray */
  --surface: #1e293b;      /* Card surface */
  --text: #f1f5f9;         /* Primary text */
  --text-muted: #94a3b8;   /* Secondary text */
}
```

## 🔌 API Integration

### Required Backend API

To function, this frontend requires a backend music API that provides:

1. **Search Endpoint**

   ```plaintext
   GET /music/search?q={query}
   ```

   Returns: Array of track objects

2. **Streaming Endpoint** (Optional)

   ```plaintext
   GET /music/stream?key={KEY}&q={query}
   ```

   Returns: Audio stream or preview URL

### Supported API Formats

The application expects JSON responses compatible with **Deezer API format**:

```json
{
  "data": [
    {
      "id": "123456",
      "title": "Track Name",
      "artist": {
        "name": "Artist Name"
      },
      "album": {
        "title": "Album Name",
        "cover": "https://..."
      },
      "preview": "https://..."
    }
  ]
}
```

### Type-Safe API Functions

Example usage in `src/utils/api.ts`:

```typescript
import { env } from "@/env";
import type { SearchResponse, Track } from "@/types";

export async function searchTracks(query: string): Promise<Track[]> {
  const url = new URL("music/search", env.API_URL);
  url.searchParams.set("q", query);
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Search failed");
  
  const json: SearchResponse = await res.json();
  return json.data;
}
```

## ⚖️ Legal & Licensing

### Important Notice

This project does **not** include or distribute copyrighted music. It is a frontend interface designed to work with legitimate, licensed music APIs.

**To deploy publicly, you must connect it to a legally compliant music service**, such as:

- **Deezer API** - Official music catalog with licensing
- **Spotify Web API** - Requires OAuth and subscription agreement
- **Apple Music API** - Licensed music streaming service
- **Your own licensed content** - Self-hosted audio with proper rights

**Do not use this with unauthorized music sources.**

### License

This project is licensed under the **GPL-3.0 License**. See the LICENSE file for details.

## 🛠️ Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting (if configured)
npm run lint
```

### Database Workflow

#### Development (Daily Work)
```bash
# After changing schema in src/server/db/schema.ts:
npm run db:dev
```
This command generates migration files and syncs your schema directly (no migration tracking).

#### Production Deployment
```bash
# 1. Generate migration files
npm run db:generate

# 2. Review generated SQL in drizzle/ directory

# 3. Apply migrations
npm run db:migrate
```

#### Other Database Commands
```bash
npm run db:push      # Force sync schema (bypasses migrations)
npm run db:studio    # Open Drizzle Studio GUI
npm run db:prod      # Helper script for production migrations
```

**⚠️ Critical Rule:** Never run `db:migrate` and `db:push` together - this causes "relation already exists" errors.

| Environment | Use | Command |
|-------------|-----|---------|
| **Development** | Fast iteration | `npm run db:dev` |
| **Production** | Tracked changes | `npm run db:migrate` |
| **Emergency Sync** | Fix state issues | `npm run db:push` |

**Detailed Guide:** See [DATABASE_QUICK_START.md](./DATABASE_QUICK_START.md) for complete workflow documentation.

#### Workflow Migration Summary

**Old (Problematic):**
```bash
npm run db:generate && npm run db:migrate && npm run db:push  # ❌ Causes errors
```

**New (Correct):**
```bash
# Development
npm run db:dev  # ✅ Generate + push (no tracking)

# Production
npm run db:generate  # ✅ Generate only
npm run db:migrate   # ✅ Apply with tracking
```

**Key Change:** Separate development (untracked, fast) from production (tracked, safe) workflows.

## 🚀 Production Deployment & Server Management

### PM2 Process Manager

This project uses **PM2** for production process management, providing automatic restarts, logging, and monitoring capabilities.

### Server Startup & Shutdown

#### Starting the Server

**Production Mode:**
```bash
# Build and start production server
npm run pm2:start

# Or manually:
npm run build
pm2 start ecosystem.config.cjs --env production
```

**Development Mode:**
```bash
# Start development server with PM2
npm run pm2:dev

# Or manually:
pm2 start ecosystem.config.cjs --only darkfloor-art-dev --env development
```

#### Stopping the Server

```bash
# Stop all processes
npm run pm2:stop

# Stop specific process
pm2 stop darkfloor-art-prod
pm2 stop darkfloor-art-dev

# Delete processes from PM2
npm run pm2:delete
```

#### Restarting the Server

```bash
# Reload with zero-downtime (graceful restart)
npm run pm2:reload

# Hard restart (kills and starts)
npm run pm2:restart

# Or manually:
pm2 reload ecosystem.config.cjs --env production --update-env
pm2 restart darkfloor-art-prod --update-env
```

### Server Startup Mechanism

The production server uses a **multi-layer startup process** to ensure reliability:

#### 1. **PM2 Pre-Start Hook**
Before starting the server, PM2 runs:
```bash
node scripts/ensure-build.js
```

This script:
- Checks if `.next/BUILD_ID` file exists
- Automatically runs `npm run build` if build is missing
- Prevents crash loops by ensuring build exists before startup
- Logs build process for debugging

#### 2. **Server Script Validation**
The `scripts/server.js` wrapper performs additional validation:
- Verifies `.next` directory exists
- Checks for `BUILD_ID` file (required by Next.js)
- Validates `.next/server` directory
- Exits immediately with clear error if build is invalid
- Prevents infinite restart loops

#### 3. **Next.js Production Server**
Once validation passes:
- Next.js starts in production mode (`next start`)
- Binds to configured port (uses PORT from .env, default: 3222)
- Health check endpoint becomes available at `/api/health`
- PM2 monitors the process and performs health checks

### Server Shutdown Mechanism

#### Graceful Shutdown
PM2 handles graceful shutdown through:
- **SIGTERM/SIGINT signals**: PM2 sends these to the process
- **Kill timeout**: 5 seconds grace period before force kill
- **Next.js cleanup**: Next.js handles cleanup automatically
- **Database pool closure**: Database connections are closed gracefully

#### Force Shutdown
If graceful shutdown fails:
```bash
pm2 delete darkfloor-art-prod  # Force remove
pm2 kill  # Kill PM2 daemon (use with caution)
```

### Monitoring & Logs

#### View Logs
```bash
# Production logs
npm run pm2:logs

# Development logs
npm run pm2:logs:dev

# Error logs only
npm run pm2:logs:error

# Real-time monitoring
npm run pm2:monit

# View last N lines
pm2 logs darkfloor-art-prod --lines 100
```

#### Check Status
```bash
# List all processes
npm run pm2:status

# Detailed process info
pm2 describe darkfloor-art-prod

# Process metrics
pm2 show darkfloor-art-prod
```

#### Log Files
Logs are stored in `logs/pm2/`:
- `error.log` - Error output only
- `out.log` - Standard output only
- `combined.log` - All logs combined
- `dev-*.log` - Development-specific logs

### Health Checks

The server includes a health check endpoint for monitoring:

```bash
# Check server health
curl http://localhost:3222/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-12-09T...",
  "uptime": 3600,
  "memory": {
    "heapUsed": 150,
    "heapTotal": 200,
    "rss": 300
  },
  "checks": {
    "database": "ok"
  },
  "responseTime": 5
}
```

PM2 is configured to:
- Check health endpoint every few seconds
- Restart process if health check fails
- Grace period of 5 seconds after startup before health checks begin

### Automatic Restart Behavior

PM2 automatically restarts the process when:
- Process crashes (exit code != 0)
- Memory exceeds 2GB (`max_memory_restart: "2G"`)
- Health check fails (if configured)
- Manual restart command issued

**Restart Limits:**
- Maximum 10 restarts within restart delay window
- Exponential backoff prevents crash loops
- Minimum uptime of 30 seconds before considered stable
- Restart delay of 5 seconds between attempts

### Build Management

#### Automatic Build Recovery
If the production build is missing:
1. PM2 pre-start hook detects missing BUILD_ID
2. Automatically runs `npm run build`
3. Server starts only if build succeeds
4. Process exits cleanly if build fails (no crash loop)

#### Manual Build
```bash
# Build for production
npm run build

# Verify build exists
test -f .next/BUILD_ID && echo "Build OK" || echo "Build missing"

# Build and deploy
npm run deploy
```

### Environment Configuration

The server loads environment variables in this order:
1. `.env` - Base configuration
2. `.env.production` or `.env.development` - Environment-specific
3. `.env.local` - Local overrides (never committed)

**Production Environment Variables:**
```bash
NODE_ENV=production
PORT=3222
HOSTNAME=localhost
```

**Development Environment Variables:**
```bash
NODE_ENV=development
PORT=3222  # Single port configuration - set in .env
HOSTNAME=0.0.0.0
```

### Troubleshooting Server Issues

#### Process Won't Start
1. Check if build exists: `test -f .next/BUILD_ID`
2. Build manually: `npm run build`
3. Check logs: `pm2 logs darkfloor-art-prod --err`
4. Verify port is available: `netstat -tlnp | grep 3222`

#### Process Keeps Restarting
1. Check error logs: `pm2 logs --err`
2. Verify build is complete: Check `.next/BUILD_ID` exists
3. Check memory usage: `pm2 monit`
4. Review restart count: `pm2 describe darkfloor-art-prod`

#### Health Check Failing
1. Test endpoint manually: `curl http://localhost:3222/api/health`
2. Check database connection in health endpoint
3. Verify server is actually running: `pm2 status`
4. Check for port conflicts

#### Build Issues
1. Clear build cache: `rm -rf .next`
2. Rebuild: `npm run build`
3. Check for TypeScript errors: `npm run typecheck`
4. Verify all dependencies: `npm install`

### TypeScript Configuration

The project enforces strict TypeScript settings:

- Full type checking enabled
- No implicit `any` types
- Required explicit null/undefined handling
- Strict property initialization

### Working with TailwindCSS v4

This project uses **TailwindCSS v4** with pure CSS Variables (no `@apply` directives):

```css
/* globals.css */
@import "tailwindcss";

:root {
  --primary: #6366f1;
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 rounded bg-[rgb(var(--primary))];
  }
}
```

## 🚨 Common Issues & Solutions

### Issue: "Missing required env var"

**Solution**: Ensure all required environment variables in `.env.local` are set and valid.

### Issue: NextAuth not working

**Solution**:

1. Generate secret: `npx auth secret`
2. Verify Discord OAuth app credentials
3. Check callback URL matches your domain

### Issue: Routing conflicts

**Solution**: Ensure `src/pages/` directory is removed if using App Router (`src/app/`).

### Issue: Database connection fails

**Solution**:

1. Verify DATABASE_URL format includes `?sslmode=require`
2. Check PostgreSQL is running and accessible
3. Confirm database exists and credentials are correct

### Issue: "relation already exists" or "column already exists" migration errors

**Solution**:

```bash
# Quick fix (development)
npm run db:push

# Root cause: Running db:migrate AND db:push together
# Use ONLY ONE: db:dev for development, db:migrate for production
```

**Prevention**:
- ✅ Use `npm run db:dev` in development
- ✅ Use `npm run db:migrate` in production
- ❌ Never run both `db:migrate` and `db:push` in the same command

### Issue: SSL certificate errors with PostgreSQL

**Solution**: Already configured - `drizzle.config.ts` accepts self-signed certificates with `rejectUnauthorized: false`

### Issue: 502 Bad Gateway / Process crash loop

**Solution**:

1. **Check if build exists**: `test -f .next/BUILD_ID && echo "OK" || echo "Missing"`
2. **Build the application**: `npm run build`
3. **Check PM2 status**: `pm2 list` - look for processes with high restart count
4. **View error logs**: `pm2 logs darkfloor-art-prod --err`
5. **Restart with new config**: `pm2 reload ecosystem.config.cjs --env production --update-env`

**Root Cause**: Missing production build causes Next.js to crash immediately on startup, creating an infinite restart loop.

**Prevention**: The server now automatically builds if BUILD_ID is missing via PM2 pre-start hook.

### Issue: Process shows as "online" but not responding

**Solution**:

1. **Test health endpoint**: `curl http://localhost:3222/api/health`
2. **Check if port is listening**: `netstat -tlnp | grep 3222`
3. **Verify process is actually running**: `ps aux | grep "next start"`
4. **Check PM2 logs for startup errors**: `pm2 logs --lines 50`
5. **Restart the process**: `pm2 restart darkfloor-art-prod`

### Issue: Build fails during deployment

**Solution**:

1. **Check TypeScript errors**: `npm run typecheck`
2. **Clear build cache**: `rm -rf .next`
3. **Reinstall dependencies**: `rm -rf node_modules && npm install`
4. **Check disk space**: `df -h`
5. **Review build logs**: Check for specific error messages
6. **Build manually to see errors**: `npm run build`

## 📈 Future Roadmap

Potential enhancements for this project:

- **Playlist Management** - Create and save playlists
- **User Accounts** - Persist user preferences and favorites
- **Advanced Search** - Filters by genre, artist, release date
- **Audio Visualization** - Waveform display during playback
- **Queue System** - Manage upcoming tracks
- **Social Features** - Share playlists and recommendations
- **Responsive Audio Player** - Enhanced mobile UI
- **Dark/Light Theme Toggle** - User preference saving
- **Offline Mode** - Cache downloaded tracks

## 📝 Configuration Examples

### Minimal Setup (No Database)

For a basic search-only interface:

```yaml
AUTH_SECRET="your-secret"
API_URL="https://api.deezer.com/"
STREAMING_KEY="optional"
```

### Full Production Setup

```yaml
AUTH_SECRET="your-secret"
AUTH_DISCORD_ID="discord-app-id"
AUTH_DISCORD_SECRET="discord-app-secret"

DATABASE_URL="postgres://prod_user:prod_pass@prod-host:5432/starchild?sslmode=require"

API_URL="https://your-music-api.com/"
STREAMING_KEY="your-secure-key"
```

## 🤝 Contributing

Contributions are welcome! Please ensure:

1. All code is TypeScript with strict mode enabled
2. Components are properly typed with interfaces
3. Styling follows TailwindCSS v4 conventions
4. Environment variables are added to type validation

## 📜 Acknowledgments

Built with the **T3 Stack** - a modern, type-safe full-stack framework for Next.js applications.

---

## © 2025 soulwax @ GitHub

*All music data, streaming rights, and trademarks remain the property of their respective owners.*
