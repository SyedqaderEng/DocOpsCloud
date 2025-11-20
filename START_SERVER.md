# 🚀 Start DocOpsCloud Server

Quick guide to start the development server and see the UI.

## ✅ Prerequisites Setup

You mentioned you have:
- PostgreSQL at `localhost:5432/docops`
- User: `postgres`
- Password: `postgres`

## Step 1: Check Database Connection

```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d docops -c "SELECT version();"
# Enter password: postgres
```

If this works, continue. If not, make sure PostgreSQL is running.

## Step 2: Try to Setup Database

The Prisma binaries might have download issues. Let's try a workaround:

```bash
# Try to generate Prisma client with checksum ignore
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate

# If that fails, try installing a specific version
npm install @prisma/client@5.19.0 prisma@5.19.0

# Then generate again
npx prisma generate
```

## Step 3: Push Database Schema

```bash
# Push the schema to create tables
npx prisma db push

# Or if you prefer migrations
npx prisma migrate dev --name init
```

**Expected tables to be created:**
- users
- accounts
- sessions
- verification_tokens
- files
- processing_jobs
- subscriptions
- usage_logs
- api_keys

## Step 4: Start Development Server

```bash
npm run dev
```

The server should start at: **http://localhost:3000**

## Step 5: View the Landing Page

Open your browser to:
```
http://localhost:3000
```

You should see:
- ✅ DocOpsCloud landing page
- ✅ "Sign In" and "Get Started" buttons
- ✅ Features section (PDF, Word, Excel, Image tools)
- ✅ Development status showing Phase 3 complete
- ✅ Hero section with CTA buttons

## Step 6: Test Sign Up

1. Click "Get Started" or "Sign Up"
2. Go to: `http://localhost:3000/auth/signup`
3. Fill in the form:
   - Full Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
   - Check the terms checkbox
4. Click "Create Account"

## Step 7: Test Sign In

1. After signup, you'll be redirected to signin
2. Or go directly to: `http://localhost:3000/auth/signin`
3. Enter:
   - Email: test@example.com
   - Password: password123
4. Click "Sign In"

---

## 🐛 Troubleshooting

### Issue: Prisma binaries won't download

**Solution 1:** Use local build
```bash
# Set environment variable
export PRISMA_SKIP_POSTINSTALL_GENERATE=1

# Try with different registry
npm config set registry https://registry.npmmirror.com
npm install @prisma/client
npm config set registry https://registry.npmjs.org/
```

**Solution 2:** Manual SQL setup (if Prisma fails)
```sql
-- Connect to your database
psql -h localhost -U postgres -d docops

-- Run the SQL from prisma/schema.prisma manually
-- (Create tables one by one)
```

### Issue: Port 3000 already in use

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Issue: Database connection refused

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
# or
pg_isready

# Check it's listening on 5432
netstat -an | grep 5432
```

### Issue: Redis connection errors

For now, you can disable Redis-dependent features. The landing page and auth will work without Redis.

---

## ✅ What Should Work

Without Redis/S3 setup:
- ✅ Landing page
- ✅ Sign up page
- ✅ Sign in page
- ✅ User registration
- ✅ User authentication
- ✅ Database operations

What needs Redis:
- ⏳ File uploads (needs S3)
- ⏳ Job processing (needs Redis + Worker)
- ⏳ PDF operations (needs Redis + Worker + S3)

---

## 🎯 Quick Test Checklist

- [ ] PostgreSQL is running
- [ ] Database `docops` exists
- [ ] Tables are created (9 tables)
- [ ] Dev server starts without errors
- [ ] Landing page loads at http://localhost:3000
- [ ] Can navigate to /auth/signup
- [ ] Can navigate to /auth/signin
- [ ] Can create a new account
- [ ] Can sign in with created account

---

## 📝 Environment File Created

I created `.env` with your database connection:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docops"
NEXTAUTH_SECRET="docopscloud-secret-key-for-development-only"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🚀 Expected Server Output

When you run `npm run dev`, you should see:

```
  ▲ Next.js 14.2.0
  - Local:        http://localhost:3000
  - Environments: .env

 ✓ Ready in 2.5s
 ○ Compiling / ...
 ✓ Compiled / in 1.2s
```

---

## 🎨 What You'll See in the Browser

### Landing Page (/)
- Clean, modern design with blue accents
- Navigation bar with DocOpsCloud logo
- Hero section: "Process Documents with AI-Powered Automation"
- 4 feature cards (PDF, Word, Excel, Image tools)
- Development status showing Phase 3 complete
- CTA section to get started
- Footer with copyright

### Sign Up Page (/auth/signup)
- Name, email, password fields
- Confirm password field
- Terms checkbox
- "Create Account" button
- Link to sign in
- Features preview (what you'll get)

### Sign In Page (/auth/signin)
- Email and password fields
- Remember me checkbox
- Forgot password link
- Sign in button
- OAuth buttons (Google, GitHub)
- Link to sign up

---

## 💡 Next Steps After Server Starts

1. **Test Authentication**
   - Create an account
   - Sign in
   - Check the session works

2. **Setup Redis** (for full functionality)
   ```bash
   docker run -d --name docops-redis -p 6379:6379 redis:7-alpine
   ```

3. **Setup S3/R2** (for file uploads)
   - Get AWS credentials or Cloudflare R2
   - Update .env with keys
   - Create a bucket

4. **Start Worker** (for job processing)
   ```bash
   npm run worker
   ```

---

**Ready to start?**

```bash
npm run dev
```

Then open: **http://localhost:3000** 🎉
