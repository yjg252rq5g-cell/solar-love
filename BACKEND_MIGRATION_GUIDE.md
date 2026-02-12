# Backend Migration Guide: Google Sheets → Vercel + Supabase

## Overview
This document outlines the complete migration strategy from Google Apps Script + Google Sheets to a modern, scalable backend using Vercel Functions and Supabase PostgreSQL.

## Why This Matters

### Current Architecture Issues (Google Sheets Backend)
❌ **Severe Limitations**:
- Max 5 million cells total (easily exceeded with growing data)
- - Slow with >1000 rows
  - - No concurrent user handling (0.3 concurrent writes)
    - - Frequent API quota errors (100 requests per 100 seconds per user)
      - - No real authentication (password is "1234" hardcoded)
        - - All data exposed client-side
          - - No automation or real-time capabilities
            - - Won't scale beyond 50 concurrent jobs
             
              - ### New Architecture Benefits (Vercel + Supabase)
              - ✅ **Modern, Enterprise-Grade**:
              - - Unlimited scalability
                - - Real-time updates with WebSockets
                  - - Proper JWT authentication
                    - - Database encryption at rest
                      - - SQL-based queries with proper indexing
                        - - Auto-scaling serverless functions
                          - - Free tier supports production workloads
                            - - Multi-user support
                              - - API rate limiting and security headers
                                - - Automated backups
                                 
                                  - ## Phase 1: Setup (This Week)
                                 
                                  - ### Step 1: Create Supabase Account
                                  - 1. Go to https://supabase.com
                                    2. 2. Sign up and create new project
                                       3. 3. Choose PostgreSQL database
                                          4. 4. Save connection string (DATABASE_URL)
                                             5. 5. Create JWT secret key
                                               
                                                6. ### Step 2: Set Up Database Schema
                                               
                                                7. ```sql
                                                   -- Users Table
                                                   CREATE TABLE users (
                                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                     email VARCHAR(255) UNIQUE NOT NULL,
                                                     password_hash VARCHAR(255) NOT NULL,
                                                     name VARCHAR(255),
                                                     role VARCHAR(50) DEFAULT 'user',
                                                     created_at TIMESTAMP DEFAULT now(),
                                                     updated_at TIMESTAMP DEFAULT now()
                                                   );

                                                   -- Jobs Table
                                                   CREATE TABLE jobs (
                                                     id VARCHAR(255) PRIMARY KEY,
                                                     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                                                     title VARCHAR(255),
                                                     status VARCHAR(50),
                                                     location_lat FLOAT,
                                                     location_lng FLOAT,
                                                     cost DECIMAL(10, 2),
                                                     profit DECIMAL(10, 2),
                                                     created_at TIMESTAMP DEFAULT now(),
                                                     updated_at TIMESTAMP DEFAULT now()
                                                   );

                                                   -- Routes Table
                                                   CREATE TABLE routes (
                                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                     job_id VARCHAR(255) REFERENCES jobs(id) ON DELETE CASCADE,
                                                     waypoints JSONB,
                                                     distance_km FLOAT,
                                                     created_at TIMESTAMP DEFAULT now()
                                                   );

                                                   -- Warranty Claims Table
                                                   CREATE TABLE warranty_claims (
                                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                     job_id VARCHAR(255) REFERENCES jobs(id) ON DELETE CASCADE,
                                                     status VARCHAR(50),
                                                     claim_amount DECIMAL(10, 2),
                                                     created_at TIMESTAMP DEFAULT now(),
                                                     updated_at TIMESTAMP DEFAULT now()
                                                   );

                                                   -- Technicians Table
                                                   CREATE TABLE technicians (
                                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                                                     name VARCHAR(255),
                                                     email VARCHAR(255),
                                                     phone VARCHAR(20),
                                                     availability JSONB,
                                                     created_at TIMESTAMP DEFAULT now()
                                                   );

                                                   -- Settings Table
                                                   CREATE TABLE settings (
                                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                                                     warranty_months INT DEFAULT 12,
                                                     labor_cost_per_hour DECIMAL(10, 2),
                                                     equipment_cost_multiplier FLOAT,
                                                     created_at TIMESTAMP DEFAULT now(),
                                                     updated_at TIMESTAMP DEFAULT now()
                                                   );

                                                   -- Create indexes for performance
                                                   CREATE INDEX idx_jobs_user_id ON jobs(user_id);
                                                   CREATE INDEX idx_routes_job_id ON routes(job_id);
                                                   CREATE INDEX idx_warranty_job_id ON warranty_claims(job_id);
                                                   CREATE INDEX idx_technicians_user_id ON technicians(user_id);
                                                   CREATE INDEX idx_settings_user_id ON settings(user_id);
                                                   ```

                                                   ### Step 3: Create Vercel Project
                                                   1. Go to https://vercel.com
                                                   2. 2. Import the solar-love GitHub repository
                                                      3. 3. Link to the `feature/backend-migration` branch
                                                         4. 4. Add Environment Variables:
                                                            5.    ```
                                                                     DATABASE_URL=postgresql://...from Supabase
                                                                     JWT_SECRET=your-secret-key-here
                                                                     NODE_ENV=production
                                                                     ```
                                                                  5. Set build command: `npm run build`
                                                              
                                                                  6. ## Phase 2: Implement API Functions
                                                              
                                                                  7. Create the following Vercel Functions in `/api` directory:
                                                              
                                                                  8. ### Authentication Endpoints
                                                              
                                                                  9. **`/api/auth/register.ts`**
                                                                  10. ```typescript
                                                                      import { createClient } from '@supabase/supabase-js'
                                                                      import * as jwt from 'jsonwebtoken'
                                                                      import * as bcrypt from 'bcrypt'

                                                                      const supabase = createClient(
                                                                        process.env.SUPABASE_URL!,
                                                                        process.env.SUPABASE_ANON_KEY!
                                                                      )

                                                                      export default async function handler(req, res) {
                                                                        if (req.method !== 'POST') return res.status(405).end()

                                                                        const { email, password, name } = req.body

                                                                        try {
                                                                          // Hash password
                                                                          const hashedPassword = await bcrypt.hash(password, 10)

                                                                          // Create user
                                                                          const { data, error } = await supabase
                                                                            .from('users')
                                                                            .insert([{ email, password_hash: hashedPassword, name }])
                                                                            .select()

                                                                          if (error) throw error

                                                                          // Create JWT token
                                                                          const token = jwt.sign(
                                                                            { id: data[0].id, email: data[0].email },
                                                                            process.env.JWT_SECRET!,
                                                                            { expiresIn: '7d' }
                                                                          )

                                                                          res.json({ token, user: data[0] })
                                                                        } catch (error) {
                                                                          res.status(400).json({ error: error.message })
                                                                        }
                                                                      }
                                                                      ```

                                                                      **`/api/auth/login.ts`**
                                                                      ```typescript
                                                                      // Similar to register but validate existing user and password
                                                                      // Return JWT token if credentials match
                                                                      ```

                                                                      ### Data Endpoints

                                                                      **`/api/jobs.ts`** (GET jobs for user)
                                                                      ```typescript
                                                                      // Get jobs from database filtered by user_id
                                                                      // Include pagination and filtering
                                                                      ```

                                                                      **`/api/jobs/[id].ts`** (GET/PUT/DELETE specific job)
                                                                      ```typescript
                                                                      // CRUD operations on jobs
                                                                      // Verify user owns the job
                                                                      ```

                                                                      ### Protected Routes Middleware
                                                                      ```typescript
                                                                      export async function withAuth(handler) {
                                                                        return (req, res) => {
                                                                          const token = req.headers.authorization?.split(' ')[1]
                                                                          if (!token) return res.status(401).json({ error: 'Unauthorized' })

                                                                          try {
                                                                            const decoded = jwt.verify(token, process.env.JWT_SECRET!)
                                                                            req.user = decoded
                                                                            return handler(req, res)
                                                                          } catch (error) {
                                                                            return res.status(401).json({ error: 'Invalid token' })
                                                                          }
                                                                        }
                                                                      }
                                                                      ```

                                                                      ## Phase 3: Update Frontend

                                                                      ### Update `app/src/lib/api.ts`

                                                                      Replace Google Apps Script calls with Vercel endpoints:

                                                                      ```typescript
                                                                      const API_BASE = process.env.VITE_API_URL || 'http://localhost:3000/api'

                                                                      export async function login(email: string, password: string) {
                                                                        const response = await fetch(`${API_BASE}/auth/login`, {
                                                                          method: 'POST',
                                                                          headers: { 'Content-Type': 'application/json' },
                                                                          body: JSON.stringify({ email, password })
                                                                        })

                                                                        const { token, user } = await response.json()
                                                                        localStorage.setItem('token', token)
                                                                        return { token, user }
                                                                      }

                                                                      export async function getJobs() {
                                                                        const token = localStorage.getItem('token')
                                                                        const response = await fetch(`${API_BASE}/jobs`, {
                                                                          headers: { 'Authorization': `Bearer ${token}` }
                                                                        })
                                                                        return response.json()
                                                                      }

                                                                      // Similar functions for all other endpoints
                                                                      ```

                                                                      ### Update `app/src/pages/LoginPage.tsx`
                                                                      - Remove hardcoded "1234" check
                                                                      - - Call new `login()` API function
                                                                        - - Validate response and store JWT token
                                                                         
                                                                          - ## Phase 4: Testing & Deployment
                                                                         
                                                                          - ### Test Checklist
                                                                          - - [ ] User registration works
                                                                            - [ ] - [ ] Login with valid/invalid credentials
                                                                            - [ ] - [ ] JWT token is issued and stored
                                                                            - [ ] - [ ] Can fetch user's jobs
                                                                            - [ ] - [ ] Can create new job
                                                                            - [ ] - [ ] Can update existing job
                                                                            - [ ] - [ ] Can delete job
                                                                            - [ ] - [ ] Pagination works
                                                                            - [ ] - [ ] Filtering works
                                                                            - [ ] - [ ] Settings are user-specific
                                                                           
                                                                            - [ ] ### Deploy
                                                                            - [ ] 1. Merge `feature/backend-migration` to `main`
                                                                            - [ ] 2. Vercel automatically deploys
                                                                            - [ ] 3. Monitor logs for errors
                                                                            - [ ] 4. Test on staging environment first
                                                                           
                                                                            - [ ] ## Security Checklist
                                                                           
                                                                            - [ ] - [ ] Passwords hashed with bcrypt (10+ salt rounds)
                                                                            - [ ] - [ ] JWT secret is strong (32+ characters)
                                                                            - [ ] - [ ] JWT secret is not in code (use env vars)
                                                                            - [ ] - [ ] All API endpoints verify JWT token
                                                                            - [ ] - [ ] Database queries use parameterized statements
                                                                            - [ ] - [ ] CORS headers properly configured
                                                                            - [ ] - [ ] Rate limiting on auth endpoints
                                                                            - [ ] - [ ] Password reset functionality
                                                                            - [ ] - [ ] Session expiration (7 days)
                                                                            - [ ] - [ ] HTTPS enforced
                                                                           
                                                                            - [ ] ## Performance Optimization
                                                                           
                                                                            - [ ] ### Database Queries
                                                                            - [ ] - Use indexes on frequently filtered columns (user_id, job_id)
                                                                            - [ ] - Paginate large result sets (default 50 items/page)
                                                                            - [ ] - Use SELECT * only when necessary
                                                                           
                                                                            - [ ] ### API Responses
                                                                            - [ ] - Compress with gzip
                                                                            - [ ] - Cache static endpoints (60 seconds)
                                                                            - [ ] - Lazy load relationships (don't always include related data)
                                                                            - [ ] - Implement pagination
                                                                           
                                                                            - [ ] ### Frontend
                                                                            - [ ] - Request only needed fields
                                                                            - [ ] - Implement local caching
                                                                            - [ ] - Debounce search/filter requests
                                                                            - [ ] - Use loading states
                                                                           
                                                                            - [ ] ## Estimated Timeline
                                                                           
                                                                            - [ ] - **Setup (Supabase + Vercel)**: 30 minutes
                                                                            - [ ] - **Database Schema**: 1 hour
                                                                            - [ ] - **Auth API functions**: 2 hours
                                                                            - [ ] - **Job API functions**: 3 hours
                                                                            - [ ] - **Frontend updates**: 4 hours
                                                                            - [ ] - **Testing**: 2 hours
                                                                            - [ ] - **Deployment**: 30 minutes
                                                                           
                                                                            - [ ] **Total**: ~13 hours of work
                                                                           
                                                                            - [ ] ## Rollback Plan
                                                                           
                                                                            - [ ] If issues occur:
                                                                            - [ ] 1. Keep Google Apps Script running in parallel initially
                                                                            - [ ] 2. Gradually redirect users to new backend
                                                                            - [ ] 3. If problems found, switch traffic back to Google Sheets
                                                                            - [ ] 4. Fix issues and retry
                                                                           
                                                                            - [ ] ## FAQ
                                                                           
                                                                            - [ ] **Q: Will existing data be lost?**
                                                                            - [ ] A: No. We can run a migration script to export data from Google Sheets and import to PostgreSQL.
                                                                           
                                                                            - [ ] **Q: How much will this cost?**
                                                                            - [ ] A:
                                                                            - [ ] - Supabase: Free tier up to 500 MB, ~$25/month after
                                                                            - [ ] - Vercel: Free for hobby projects
                                                                            - [ ] - Total: $0-30/month depending on usage
                                                                           
                                                                            - [ ] **Q: What if I need more users/data?**
                                                                            - [ ] A: Just upgrade the Supabase plan. Can scale to millions of records with no code changes.
                                                                           
                                                                            - [ ] **Q: How do I handle offline users?**
                                                                            - [ ] A: Implement local storage sync that queues changes and syncs when reconnected. More details in Phase 5 documentation.
                                                                            - [ ] 
