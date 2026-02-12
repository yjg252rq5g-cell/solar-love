# Phase 2: Backend Implementation Guide
## All Code Files Needed for Vercel + Supabase Backend

### File Directory Structure
```
solar-love/
├── api/
│   ├── auth/
│   │   ├── register.ts
│   │   ├── login.ts
│   │   └── middleware.ts
│   ├── jobs/
│   │   ├── index.ts
│   │   └── [id].ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── [id].ts
│   ├── warranty/
│   │   ├── index.ts
│   │   └── [id].ts
│   ├── technicians/
│   │   ├── index.ts
│   │   └── [id].ts
│   └── settings/
│       ├── index.ts
│       └── [id].ts
├── .env.local (local development)
├── .env.production (production - don't commit)
├── package.json (add dependencies)
├── app/src/lib/api.ts (update)
├── app/src/pages/LoginPage.tsx (update)
└── PHASE_2_IMPLEMENTATION.md (this file)
```

---

## Step 1: Create package.json Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/node": "^20.4.0"
  }
}
```

**Install:** `npm install`

---

## Step 2: Environment Variables

Create `.env.local`:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://user:password@localhost:5432/solar-love

# JWT Configuration
JWT_SECRET=your-super-secret-key-minimum-32-characters-long!
JWT_EXPIRATION=7d

# Environment
NODE_ENV=development
```

**For Production (.env.production):**
- Use the actual Supabase credentials from your dashboard
- - Use a strong, random JWT_SECRET (minimum 32 characters)
  - - Never commit .env.production to Git
   
    - ---

    ## Step 3: Create API Files

    ### File: `api/auth/middleware.ts`
    ```typescript
    import { VerifyErrors, verify } from 'jsonwebtoken'

    export function withAuth(handler: any) {
      return async (req: any, res: any) => {
        try {
          const authHeader = req.headers.authorization
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: Missing token' })
          }

          const token = authHeader.substring(7)
          const decoded = verify(token, process.env.JWT_SECRET!)
          req.user = decoded
          return handler(req, res)
        } catch (error) {
          console.error('Auth error:', error)
          return res.status(401).json({ error: 'Unauthorized: Invalid token' })
        }
      }
    }

    export function setCorsHeaders(res: any) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }

    export function handleCors(req: any, res: any) {
      setCorsHeaders(res)
      if (req.method === 'OPTIONS') {
        return res.status(200).end()
      }
    }
    ```

    ### File: `api/auth/register.ts`
    ```typescript
    import { createClient } from '@supabase/supabase-js'
    import * as bcrypt from 'bcrypt'
    import * as jwt from 'jsonwebtoken'
    import { handleCors } from './middleware'

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    export default async function handler(req: any, res: any) {
      handleCors(req, res)
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      try {
        const { email, password, name } = req.body

        // Validate input
        if (!email || !password || password.length < 8) {
          return res.status(400).json({
            error: 'Email required, password must be at least 8 characters'
          })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user in database
        const { data, error } = await supabase
          .from('users')
          .insert([{
            email,
            password_hash: hashedPassword,
            name: name || email.split('@')[0]
          }])
          .select()

        if (error) {
          if (error.message.includes('duplicate')) {
            return res.status(409).json({ error: 'Email already registered' })
          }
          throw error
        }

        // Create JWT token
        const token = jwt.sign(
          { id: data[0].id, email: data[0].email },
          process.env.JWT_SECRET!,
          { expiresIn: process.env.JWT_EXPIRATION || '7d' }
        )

        return res.status(201).json({
          token,
          user: {
            id: data[0].id,
            email: data[0].email,
            name: data[0].name
          }
        })
      } catch (error: any) {
        console.error('Register error:', error)
        res.status(500).json({ error: error.message || 'Registration failed' })
      }
    }
    ```

    ### File: `api/auth/login.ts`
    ```typescript
    import { createClient } from '@supabase/supabase-js'
    import * as bcrypt from 'bcrypt'
    import * as jwt from 'jsonwebtoken'
    import { handleCors } from './middleware'

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    export default async function handler(req: any, res: any) {
      handleCors(req, res)
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      try {
        const { email, password } = req.body

        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password required' })
        }

        // Get user from database
        const { data: users, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (fetchError || !users) {
          return res.status(401).json({ error: 'Invalid email or password' })
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, users.password_hash)
        if (!passwordValid) {
          return res.status(401).json({ error: 'Invalid email or password' })
        }

        // Create JWT token
        const token = jwt.sign(
          { id: users.id, email: users.email },
          process.env.JWT_SECRET!,
          { expiresIn: process.env.JWT_EXPIRATION || '7d' }
        )

        return res.status(200).json({
          token,
          user: {
            id: users.id,
            email: users.email,
            name: users.name
          }
        })
      } catch (error: any) {
        console.error('Login error:', error)
        res.status(500).json({ error: error.message || 'Login failed' })
      }
    }
    ```

    ### File: `api/jobs/index.ts` (GET - Fetch user jobs)
    ```typescript
    import { createClient } from '@supabase/supabase-js'
    import { withAuth, handleCors } from '../auth/middleware'

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    async function handler(req: any, res: any) {
      handleCors(req, res)

      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      try {
        const { page = 1, limit = 50 } = req.query
        const offset = (parseInt(page) - 1) * parseInt(limit)

        const { data, error, count } = await supabase
          .from('jobs')
          .select('*', { count: 'exact' })
          .eq('user_id', req.user.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + parseInt(limit) - 1)

        if (error) throw error

        return res.status(200).json({
          jobs: data,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil((count || 0) / parseInt(limit))
          }
        })
      } catch (error: any) {
        console.error('Get jobs error:', error)
        res.status(500).json({ error: error.message })
      }
    }

    export default withAuth(handler)
    ```

    ### File: `api/jobs/index.ts` (POST - Create job)
    ```typescript
    // Update the handler above to support POST:

    async function handler(req: any, res: any) {
      handleCors(req, res)

      if (req.method === 'GET') {
        // ... GET handler code ...
      } else if (req.method === 'POST') {
        try {
          const { title, status, location_lat, location_lng, cost, profit } = req.body

          const { data, error } = await supabase
            .from('jobs')
            .insert([{
              user_id: req.user.id,
              title,
              status: status || 'pending',
              location_lat,
              location_lng,
              cost,
              profit
            }])
            .select()

          if (error) throw error
          return res.status(201).json({ job: data[0] })
        } catch (error: any) {
          res.status(500).json({ error: error.message })
        }
      } else {
        res.status(405).json({ error: 'Method not allowed' })
      }
    }
    ```

    ### File: `api/jobs/[id].ts` (GET/PUT/DELETE specific job)
    ```typescript
    import { createClient } from '@supabase/supabase-js'
    import { withAuth, handleCors } from '../auth/middleware'

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    async function handler(req: any, res: any) {
      handleCors(req, res)
      const { id } = req.query

      try {
        if (req.method === 'GET') {
          const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single()

          if (error) return res.status(404).json({ error: 'Job not found' })
          return res.status(200).json({ job: data })
        }

        if (req.method === 'PUT') {
          const { title, status, cost, profit, location_lat, location_lng } = req.body

          const { data, error } = await supabase
            .from('jobs')
            .update({ title, status, cost, profit, location_lat, location_lng })
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()

          if (error) throw error
          return res.status(200).json({ job: data[0] })
        }

        if (req.method === 'DELETE') {
          const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id)

          if (error) throw error
          return res.status(204).end()
        }

        res.status(405).json({ error: 'Method not allowed' })
      } catch (error: any) {
        console.error('Job error:', error)
        res.status(500).json({ error: error.message })
      }
    }

    export default withAuth(handler)
    ```

    ---

    ## Step 4: Database Schema (SQL)

    Run these queries in Supabase SQL Editor:

    ```sql
    -- Create users table
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );

    -- Create jobs table
    CREATE TABLE jobs (
      id VARCHAR(255) PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      title VARCHAR(255),
      status VARCHAR(50),
      location_lat FLOAT,
      location_lng FLOAT,
      cost DECIMAL(10, 2),
      profit DECIMAL(10, 2),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );

    -- Create routes table
    CREATE TABLE routes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id VARCHAR(255) REFERENCES jobs(id) ON DELETE CASCADE,
      waypoints JSONB,
      distance_km FLOAT,
      created_at TIMESTAMP DEFAULT now()
    );

    -- Create warranty_claims table
    CREATE TABLE warranty_claims (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id VARCHAR(255) REFERENCES jobs(id) ON DELETE CASCADE,
      status VARCHAR(50),
      claim_amount DECIMAL(10, 2),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );

    -- Create technicians table
    CREATE TABLE technicians (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(20),
      availability JSONB,
      created_at TIMESTAMP DEFAULT now()
    );

    -- Create settings table
    CREATE TABLE settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      warranty_months INT DEFAULT 12,
      labor_cost_per_hour DECIMAL(10, 2),
      equipment_cost_multiplier FLOAT,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );

    -- Create indexes
    CREATE INDEX idx_jobs_user_id ON jobs(user_id);
    CREATE INDEX idx_routes_job_id ON routes(job_id);
    CREATE INDEX idx_warranty_job_id ON warranty_claims(job_id);
    CREATE INDEX idx_technicians_user_id ON technicians(user_id);
    CREATE INDEX idx_settings_user_id ON settings(user_id);

    -- Enable Row Level Security (optional but recommended)
    ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;
    ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
    ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
    ```

    ---

    ## Step 5: Update Frontend API File

    Replace `app/src/lib/api.ts`:

    ```typescript
    // Get API URL from environment
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

    // Authentication
    export async function register(email: string, password: string, name?: string) {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      localStorage.setItem('authToken', data.token)
      return data
    }

    export async function login(email: string, password: string) {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      localStorage.setItem('authToken', data.token)
      return data
    }

    export function logout() {
      localStorage.removeItem('authToken')
    }

    // Helper to get auth header
    function getAuthHeader() {
      const token = localStorage.getItem('authToken')
      return token ? { 'Authorization': `Bearer ${token}` } : {}
    }

    // Jobs
    export async function getJobs(page = 1, limit = 50) {
      const response = await fetch(
        `${API_BASE}/jobs?page=${page}&limit=${limit}`,
        { headers: getAuthHeader() }
      )
      if (!response.ok) throw new Error('Failed to fetch jobs')
      return response.json()
    }

    export async function createJob(jobData: any) {
      const response = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(jobData)
      })
      if (!response.ok) throw new Error('Failed to create job')
      return response.json()
    }

    export async function updateJob(id: string, jobData: any) {
      const response = await fetch(`${API_BASE}/jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(jobData)
      })
      if (!response.ok) throw new Error('Failed to update job')
      return response.json()
    }

    export async function deleteJob(id: string) {
      const response = await fetch(`${API_BASE}/jobs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error('Failed to delete job')
    }
    ```

    ---

    ## Step 6: Update LoginPage.tsx

    Replace the hardcoded password check with real authentication:

    ```typescript
    import React, { useState } from 'react'
    import { login, register } from '@/lib/api'

    export default function LoginPage() {
      const [email, setEmail] = useState('')
      const [password, setPassword] = useState('')
      const [isRegistering, setIsRegistering] = useState(false)
      const [error, setError] = useState('')
      const [loading, setLoading] = useState(false)

      async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
          const result = await login(email, password)
          // Redirect to dashboard
          window.location.href = '/dashboard'
        } catch (err: any) {
          setError(err.message || 'Login failed')
        } finally {
          setLoading(false)
        }
      }

      async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
          await register(email, password)
          window.location.href = '/dashboard'
        } catch (err: any) {
          setError(err.message || 'Registration failed')
        } finally {
          setLoading(false)
        }
      }

      return (
        <div className="login-container">
          <h1>Solar Love Command Center</h1>
          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Processing...' : isRegistering ? 'Register' : 'Login'}
            </button>
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={loading}
            >
              {isRegistering ? 'Already have account?' : 'Need account?'}
            </button>
          </form>
        </div>
      )
    }
    ```

    ---

    ## Step 7: Setup Checklist

    - [ ] Create Supabase account at https://supabase.com
    - [ ] - [ ] Create PostgreSQL project in Supabase
    - [ ] - [ ] Run database schema SQL in Supabase SQL editor
    - [ ] - [ ] Copy Supabase URL and keys to .env.local
    - [ ] - [ ] Create Vercel project at https://vercel.com
    - [ ] - [ ] Import solar-love GitHub repository to Vercel
    - [ ] - [ ] Add environment variables to Vercel Project Settings
    - [ ] - [ ] Create `/api` directory with function files above
    - [ ] - [ ] Install dependencies: `npm install`
    - [ ] - [ ] Update `app/src/lib/api.ts` with new backend calls
    - [ ] - [ ] Update `app/src/pages/LoginPage.tsx` with real auth
    - [ ] - [ ] Test login/register locally
    - [ ] - [ ] Deploy to Vercel
   
    - [ ] ---
   
    - [ ] ## Step 8: Testing
   
    - [ ] 1. **Local Testing**:
    - [ ]    ```bash
    - [ ]       npm run dev
    - [ ]      # Visit http://localhost:3000
    - [ ]     ```
   
    - [ ] 2. **Test Registration**:
    - [ ]    - Enter: test@example.com / password123
    - [ ]       - Should get JWT token
   
    - [ ]   3. **Test Login**:
    - [ ]      - Use registered credentials
    - [ ]     - Token should be stored in localStorage
   
    - [ ] 4. **Test API**:
    - [ ]    - Open DevTools
    - [ ]       - Check Network tab for API calls
    - [ ]      - Verify Authorization header is sent
   
    - [ ]  ---
   
    - [ ]  ## Phase 2 Complete! ✅
   
    - [ ]  Once all files are created and tests pass:
    - [ ]  1. Create PR from feature/backend-migration to main
    - [ ]  2. Review and merge
    - [ ]  3. Vercel auto-deploys
    - [ ]  4. Test production at https://your-deployment.vercel.app
   
    - [ ]  Next: Phase 3 (Full frontend integration) and Phase 4 (Testing & optimization)
    - [ ]  
