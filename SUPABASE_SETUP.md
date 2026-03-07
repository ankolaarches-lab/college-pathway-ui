# College Pathway Explorer - Supabase Setup

This document explains how to set up and maintain the Supabase backend for the College Pathway Explorer.

## Quick Start

### 1. Create the Supabase Tables

Run the SQL schemas in your Supabase project's SQL Editor:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `yprxfmbwbxwdpmazgadp`
3. Go to **SQL Editor**
4. Copy and run the contents of `supabase_schema.sql` (basic schema)
5. Copy and run the contents of `supabase_schema_auth.sql` (auth, favorites, transfer pathways)

### 2. Get Your Supabase Keys

1. Go to **Project Settings** → **API**
2. Copy the **Project URL** (already configured)
3. Copy the **anon public** key → add to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy the **service_role** key → keep secure, use only for sync scripts

### 3. Seed the Database

```bash
# Install dependencies (if not already)
npm install

# Run the basic sync script
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/sync-to-supabase.js

# Run the enhanced sync script (requires College Scorecard API key)
COLLEGE_SCORECARD_API_KEY=your_api_key SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/sync-enhanced-data.js
```

### 4. Update Environment Variables

Add to your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://yprxfmbwbxwdpmazgadp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Features Overview

### 1. IPEDS Data Sync
- **Basic sync**: Fetches data from College Scorecard API
- **Enhanced sync**: Adds student-faculty ratio, loan stats, demographics
- Data fields include: net price, 6-year graduation rate, student-faculty ratio, % students with loans, median debt

### 2. Full Authentication
- User signup/signin via Supabase Auth
- Save favorite colleges
- Track search history
- Parent vs Student mode toggle

### 3. Transfer Pathway Tracking
- View transfer pathways from community colleges to 4-year universities
- Search "If I start at [CC], where can I transfer?"
- Articulation agreement data stored in `transfer_pathways` table

## Files Overview

| File | Description |
|------|-------------|
| `supabase_schema.sql` | SQL for the institutions table |
| `supabase_schema_auth.sql` | SQL for auth, favorites, search history, transfer pathways |
| `scripts/sync-to-supabase.js` | Basic Node script to sync data to Supabase |
| `scripts/sync-enhanced-data.js` | Enhanced script with additional IPEDS fields |
| `src/lib/supabase-client.ts` | Client library for Supabase operations |
| `src/lib/auth-context.tsx` | React context for authentication |

## Database Tables

### institutions
Main table with college data. Key fields:
- `id` - Institution ID
- `name`, `city`, `state` - Location
- `institution_type` - 2-year, 4-year, public, private
- `cost` - Tuition and net price (JSONB)
- `completion` - Graduation rates (JSONB)
- `loan_stats` - Federal loan rate, median debt (JSONB)
- `student_faculty_ratio` - Student/faculty ratio (JSONB)
- `demographics` - Student demographics (JSONB)

### user_profiles
User profile data:
- `id` - UUID (links to auth.users)
- `email` - User email
- `display_name` - User's display name
- `user_mode` - 'student' or 'parent'

### favorites
Saved colleges:
- `user_id` - Owner's UUID
- `institution_id` - College ID

### search_history
User search history:
- `user_id` - Owner's UUID
- `search_query` - Search term
- `filters` - Applied filters (JSONB)
- `results_count` - Number of results

### transfer_pathways
Articulation agreements:
- `source_institution_id` - Community college ID
- `target_institution_id` - 4-year university ID
- `agreement_type` - 'automatic', 'pathway', 'guaranteed'
- `requirements` - Transfer requirements
- `program` - Specific program/major

## Weekly Refresh

### Manual Refresh

```bash
# Basic sync
SUPABASE_SERVICE_ROLE_KEY=your_key ./scripts/refresh-data.sh

# Enhanced sync (requires API key)
COLLEGE_SCORECARD_API_KEY=your_key SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/sync-enhanced-data.js
```

### Get College Scorecard API Key

1. Visit https://collegescorecard.ed.gov/data/api/
2. Request a free API key
3. Set it as `COLLEGE_SCORECARD_API_KEY` environment variable

## How It Works

1. **API Request** → `GET /api/colleges`
2. **Supabase Query** → Attempts to fetch from Supabase first
3. **Fallback** → If Supabase is empty/unavailable, falls back to local JSON files
4. **Response** → Returns colleges with `source: "supabase"` or `source: "local"`

## Troubleshooting

### "No data in Supabase"
- Run the sync script: `node scripts/sync-to-supabase.js`

### "SUPABASE_SERVICE_ROLE_KEY is required"
- Make sure the environment variable is set when running the sync script

### "Table does not exist"
- Run `supabase_schema.sql` and `supabase_schema_auth.sql` in the Supabase SQL Editor

### Auth not working
- Make sure to run `supabase_schema_auth.sql` to create the trigger for auto-creating user profiles

## Performance Notes
- ~6,400 institutions stored in Supabase
- Queries are indexed on: state, city, name, institution_type
- Free tier easily handles this data volume
