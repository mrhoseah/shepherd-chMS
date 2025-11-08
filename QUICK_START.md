# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Setup Database Schema

Since you don't have permission to create shadow databases, use `db push`:

```bash
npm run db:push
```

This will:
- Create all tables in your database
- Generate Prisma Client automatically
- **No shadow database needed!**

### Step 2: Create Admin Account

**Option A: Web Interface (Easiest)**
```bash
npm run dev
# Then visit: http://localhost:3000/admin/register
```

**Option B: Seed Script**
```bash
npm run db:seed
# Default credentials:
# Email: admin@church.com
# Password: admin123
```

### Step 3: Start the Application

```bash
npm run dev
```

Visit: http://localhost:3000/auth/signin

---

## 📝 Important Notes

- **For Development**: Use `npm run db:push` (no migrations needed)
- **For Production**: Set up migrations with shadow database (see SETUP.md)
- **Change default password** after first login!

## 🔧 Troubleshooting

**"Permission denied to create database"**
- ✅ Use `npm run db:push` instead of `migrate dev`
- This is the recommended approach for development

**"Database does not exist"**
- Create it first: `createdb -U dev egc_app`
- Or ask your DBA to create it

**"Connection refused"**
- Make sure PostgreSQL is running
- Check your DATABASE_URL in `.env`

