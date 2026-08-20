-- Backend contract used by the Sprintly frontend.
-- users, goals, github_commits, and daily_summaries are created by the application schema.

alter table public.goals add column if not exists goal_type text not null default 'content_creation';
alter table public.goals add column if not exists description text;
alter table public.goals add column if not exists original_date date;
alter table public.goals add column if not exists is_auto_rollover boolean default true;
alter table public.goals add column if not exists rollover_count integer default 0;
alter table public.goals add column if not exists completed_at timestamptz;

update public.goals
set original_date = coalesce(original_date, scheduled_date),
    rollover_count = coalesce(rollover_count, 0),
    is_auto_rollover = coalesce(is_auto_rollover, true);

alter table public.goals drop constraint if exists goals_goal_type_check;
alter table public.goals add constraint goals_goal_type_check
  check (goal_type in ('content_creation', 'documentation', 'project_review'));

alter table public.goals enable row level security;

create policy "Users can read their own goals" on public.goals
  for select using (auth.uid() = user_id);
create policy "Users can add their own goals" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own goals" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
