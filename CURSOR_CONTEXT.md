# Database Schema & Context

**Source of Truth:** `supabase/schema.sql`
**TypeScript Types:** `src/types/supabase.ts`

When writing code that interacts with the database (Supabase), ALWAYS refer to these files. 
Do not assume columns exist unless they are defined here.
Use strict typing via `createClient<Database>(...)` whenever possible.

