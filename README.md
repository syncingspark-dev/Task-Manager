# Sprintly

Sprintly uses Supabase `public.goals` for daily goal tracking. The frontend reads and writes `scheduled_date`, `status`, `description`, `goal_type`, `original_date`, `is_auto_rollover`, `rollover_count`, and `completed_at`.

Run [supabase/goals.sql](supabase/goals.sql) against the existing backend schema to add the goal type used by the UI and apply goal-specific RLS policies. Supabase Auth user IDs must match `goals.user_id`.

Create `.env.local` from `.env.example`, then run `npm install` and `npm run dev`.
