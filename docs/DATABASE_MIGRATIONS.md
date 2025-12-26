# Database Migration Best Practices

This guide helps you avoid common migration issues and maintain a healthy database schema.

## Quick Reference

```bash
# Development (recommended)
npm run db:dev           # Generate + push schema (bypasses migration history)

# Production
npm run db:prod          # Apply tracked migrations

# Individual commands
npm run db:generate      # Generate migration files only
npm run db:push          # Push schema without tracking
npm run db:migrate       # Run migrations with tracking
npm run db:studio        # Open Drizzle Studio
```

## When to Use What

### During Development: Use `db:dev` (or `db:push`)

**Why?**
- Fast iteration on schema changes
- No migration history conflicts
- Automatically handles schema drift
- Perfect for local development

**Workflow:**
```bash
1. Edit src/server/db/schema.ts
2. npm run db:dev
3. Test your changes
```

### For Production: Use `db:prod` (or `db:migrate`)

**Why?**
- Maintains migration history
- Allows rollbacks
- Auditable changes
- Safe for production databases

**Workflow:**
```bash
1. Edit src/server/db/schema.ts
2. npm run db:generate              # Creates migration file
3. Review generated SQL in drizzle/ directory
4. Commit the migration file
5. Deploy and run: npm run db:prod
```

## Common Issues & Solutions

### Issue 1: "relation already exists" Error

**Cause:** Database objects exist but migration tries to create them again

**Solution:**
```bash
# Quick fix (development)
npm run db:push  # Force sync, ignores migration history

# Proper fix (production)
# Make migrations idempotent (already done for you)
```

### Issue 2: Duplicate Migration Files

**Cause:** Manual migration files conflict with auto-generated ones

**Prevention:**
- ❌ Don't manually create migration files in drizzle/
- ✅ Always use `npm run db:generate`
- ✅ For custom SQL, modify schema.ts and regenerate

### Issue 3: SSL Certificate Errors

**Cause:** Database uses self-signed certificates

**Solution:** Already configured in `drizzle.config.ts`:
```typescript
ssl: {
  rejectUnauthorized: false,  // Accepts self-signed certs
}
```

### Issue 4: Migration State Out of Sync

**Symptoms:**
- Migrations fail with "already exists" errors
- Database has objects not in migration history

**Solutions:**

**For Development:**
```bash
npm run db:push  # Bypass migration tracking and force sync
```

**For Production:**
- Migrations are already idempotent (use IF NOT EXISTS)
- Safe to run multiple times
- Or manually mark migrations as applied in the database

## Environment-Specific Configurations

### Development
```bash
# .env.local or .env.development
DATABASE_URL=postgresql://user:pass@localhost:5432/dev_db

# Fast iteration workflow
npm run db:dev
```

### Staging
```bash
# .env.staging
DATABASE_URL=postgresql://user:pass@staging-host:5432/staging_db

# Use migrations for consistency
npm run db:generate
npm run db:migrate
```

### Production
```bash
# .env.production
DATABASE_URL=postgresql://user:pass@prod-host:5432/prod_db

# Always use migrations
npm run db:generate  # (on dev machine)
npm run db:prod      # (on production)
```

## Migration File Structure

All migrations are idempotent (safe to run multiple times):

```sql
-- ✅ Good: Idempotent
CREATE TABLE IF NOT EXISTS "users" (...);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "email" varchar(255);
  END IF;
END $$;

-- ❌ Bad: Not idempotent
CREATE TABLE "users" (...);  -- Fails if table exists
ALTER TABLE "users" ADD COLUMN "email" varchar(255);  -- Fails if column exists
```

## Troubleshooting Commands

```bash
# Check current migration state
psql $DATABASE_URL -c "SELECT * FROM drizzle.__drizzle_migrations;"

# See pending migrations
npm run db:generate  # Check drizzle/meta/_journal.json

# Reset development database (DESTRUCTIVE!)
dropdb your_db_name && createdb your_db_name
npm run db:push

# Open visual database browser
npm run db:studio
```

## Best Practices Checklist

- ✅ Use `db:dev` for development, `db:prod` for production
- ✅ Always review generated SQL before applying
- ✅ Never manually edit migration files after generation
- ✅ Commit migration files to version control
- ✅ Test migrations on staging before production
- ✅ Keep migrations small and focused
- ✅ Use descriptive schema changes (Drizzle auto-names them)
- ❌ Don't mix manual DB changes with migrations
- ❌ Don't delete old migration files (breaks history)
- ❌ Don't edit applied migrations (create new ones instead)

## Emergency Procedures

### Database Completely Out of Sync (Development Only)

```bash
# Nuclear option - recreate everything
npm run db:push  # Forces sync to match schema.ts exactly
```

### Production Migration Failed Halfway

```bash
# 1. Check what was applied
psql $DATABASE_URL -c "SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5;"

# 2. Manually fix the issue or roll back
# 3. Mark migration as applied (if you fixed it manually):
psql $DATABASE_URL -c "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('migration_hash', NOW());"

# 4. Or re-run (migrations are idempotent now)
npm run db:prod
```

## Additional Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit Migration Docs](https://orm.drizzle.team/kit-docs/overview)
- Project config: `drizzle.config.ts`
- Schema definition: `src/server/db/schema.ts`
- Helper script: `scripts/db-helper.js`

---

**Remember:** When in doubt during development, use `npm run db:push` to force sync your schema! 🚀

