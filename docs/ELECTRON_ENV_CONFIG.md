# Electron Environment Configuration Guide

## Overview

The Electron build process for **Starchild** (darkfloor.art) has been configured to **EXCLUSIVELY** use `.env.local` for all environment variables. This ensures consistency and prevents conflicts between multiple environment files.

## Critical Information

### ⚠️ IMPORTANT: Single Source of Truth

- **ONLY** `.env.local` is used for Electron builds
- Do **NOT** create or use:
  - `.env`
  - `.env.development`
  - `.env.production`
  - Any other `.env.*` variants

## How It Works

### Development Mode

When running Electron in development mode:
```bash
npm run electron:dev
```

1. `scripts/load-env-build.js` loads `.env.local` from project root
2. Environment variables are passed to the build process
3. `electron/main.cjs` loads `.env.local` from project root

### Production/Packaged Builds

When building Electron packages:
```bash
npm run electron:build:win  # or :mac, :linux
```

1. `scripts/load-env-build.js` loads `.env.local` for the build process
2. Next.js builds with these environment variables
3. `electron/prepare-package.js` **copies** `.env.local` to `.next/standalone/.env.local`
4. Packaged app loads `.env.local` from standalone directory

## Required Environment Variables

Create a `.env.local` file in the project root with these variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/darkfloor"

# Authentication (Discord OAuth)
AUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
AUTH_DISCORD_ID="your-discord-client-id"
AUTH_DISCORD_SECRET="your-discord-client-secret"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3222"

# Server Configuration
PORT="3222"
HOSTNAME="localhost"
NODE_ENV="development"

# Optional: Enable dev tools in packaged builds
# ELECTRON_DEV_TOOLS="true"
```

## Security

- `.env.local` is already in `.gitignore` via the pattern `.env*.local`
- **NEVER** commit `.env.local` to version control
- Each developer/deployment should have their own `.env.local` with appropriate values

## File Changes (v0.6.7)

### `scripts/load-env-build.js`

**Before:**
```javascript
// Loaded .env, .env.development/.env.production, then .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (nodeEnv === "development") {
  dotenv.config({ path: path.resolve(__dirname, "../.env.development") });
} else if (nodeEnv === "production") {
  dotenv.config({ path: path.resolve(__dirname, "../.env.production") });
}
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
```

**After:**
```javascript
// ONLY loads .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
```

### `electron/main.cjs`

**Before:**
```javascript
// Loaded .env.local, .env, and .next/standalone/.env
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
if (fs.existsSync(standaloneEnvPath)) {
  dotenv.config({ path: standaloneEnvPath });
}
```

**After:**
```javascript
// ONLY loads .env.local
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log("[Electron] Loaded .env.local from project root");
} else if (fs.existsSync(standaloneEnvLocalPath)) {
  dotenv.config({ path: standaloneEnvLocalPath });
  console.log("[Electron] Loaded .env.local from standalone directory");
}
```

### `electron/prepare-package.js`

**Before:**
```javascript
// Only created .env with dev tools flag
if (process.env.ELECTRON_DEV_TOOLS === "true") {
  const envPath = path.join(standaloneDir, ".env");
  fs.writeFileSync(envPath, "ELECTRON_DEV_TOOLS=true\n");
}
```

**After:**
```javascript
// Copies .env.local and appends dev tools flag if needed
const envLocalSource = path.join(rootDir, ".env.local");
const envLocalDest = path.join(standaloneDir, ".env.local");

if (fs.existsSync(envLocalSource)) {
  fs.copyFileSync(envLocalSource, envLocalDest);
  console.log("[Prepare] ✓ Environment configuration copied");
}

if (process.env.ELECTRON_DEV_TOOLS === "true") {
  if (fs.existsSync(envLocalDest)) {
    fs.appendFileSync(envLocalDest, "\nELECTRON_DEV_TOOLS=true\n");
  } else {
    fs.writeFileSync(envLocalDest, "ELECTRON_DEV_TOOLS=true\n");
  }
}
```

## Troubleshooting

### Problem: "Environment variables not loaded"

**Solution:**
1. Ensure `.env.local` exists in project root
2. Check that `.env.local` has all required variables
3. Verify `.env.local` syntax (no spaces around `=`)

### Problem: "Different behavior in dev vs packaged"

**Solution:**
1. Check that `.env.local` is being copied to standalone directory
2. Run `npm run electron:prepare` manually to verify
3. Check console logs for "[Electron] Loaded .env.local from..."

### Problem: "Variables from old .env files still being used"

**Solution:**
1. Delete `.env`, `.env.development`, `.env.production` if they exist
2. Ensure all variables are in `.env.local`
3. Restart the development server or rebuild

## Benefits of This Approach

1. **Single Source of Truth**: All configuration in one place
2. **No Conflicts**: Can't have environment-specific files overriding each other
3. **Predictable**: Same file used for dev and production
4. **Secure**: `.env.local` is gitignored, never committed
5. **Simple**: Developers only need to maintain one file
6. **Portable**: Packaged apps include their own `.env.local`

## Migration Guide

If you have existing `.env`, `.env.development`, or `.env.production` files:

1. **Merge all variables** into `.env.local`:
   ```bash
   cat .env .env.development .env.local > .env.local.new
   mv .env.local.new .env.local
   ```

2. **Review** `.env.local` to remove duplicates and conflicts

3. **Delete** old files:
   ```bash
   rm .env .env.development .env.production
   ```

4. **Test** Electron builds:
   ```bash
   npm run electron:dev
   npm run electron:build:win  # or your platform
   ```

## System Environment Variables

For production deployments where you don't want to use `.env.local`, you can set environment variables at the system level:

**Linux/Mac:**
```bash
export DATABASE_URL="postgresql://..."
export AUTH_SECRET="..."
# etc.
```

**Windows:**
```powershell
$env:DATABASE_URL="postgresql://..."
$env:AUTH_SECRET="..."
# etc.
```

The Electron app will use system environment variables if `.env.local` is not found.

---

**Last Updated:** v0.6.7 - 2025-12-24  
**Related Files:** `scripts/load-env-build.js`, `electron/main.cjs`, `electron/prepare-package.js`

