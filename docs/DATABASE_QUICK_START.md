# Database Quick Start 🚀

## TL;DR - What You Need to Know

### For Development (Daily Work)
```bash
# 1. Change your schema in src/server/db/schema.ts
# 2. Run this ONE command:
npm run db:dev
```
That's it! ✨

### For Production Deployment
```bash
# After changing schema:
npm run db:generate    # Review the generated SQL file
git add drizzle/       # Commit it
git commit -m "Add new feature migration"

# On production server:
npm run db:prod
```

## Common Commands

| Command | When to Use | What It Does |
|---------|------------|--------------|
| `npm run db:dev` | 🔥 **Development** | Syncs schema fast, skips migration history |
| `npm run db:prod` | 🚀 **Production** | Runs tracked migrations safely |
| `npm run db:generate` | Creating migrations | Generates migration files from schema |
| `npm run db:push` | Force sync | Bypasses migrations, syncs directly |
| `npm run db:studio` | Visual browsing | Opens database GUI |

## Avoiding Errors Like You Just Had

### ✅ DO
- Use `npm run db:dev` for local development
- Use `npm run db:prod` for production
- Let Drizzle generate migrations (don't create manually)
- Review generated SQL before applying to production
- Commit migration files to git

### ❌ DON'T
- Don't manually create migration files
- Don't edit migration files after they're generated
- Don't run `db:migrate` in development (use `db:push` instead)
- Don't delete old migration files
- Don't make manual database changes (always change schema.ts)

## If Things Break

**"relation already exists" error?**
```bash
npm run db:push  # Forces sync (development only!)
```

**Migration state out of sync?**
```bash
npm run db:push  # Resets to match your schema.ts
```

**SSL certificate error?**
- Already fixed! ✅ Config accepts self-signed certs now

## Full Documentation

See [docs/DATABASE_MIGRATIONS.md](./docs/DATABASE_MIGRATIONS.md) for complete guide.

---

**Golden Rule:** In development, always use `npm run db:dev` 🎯

