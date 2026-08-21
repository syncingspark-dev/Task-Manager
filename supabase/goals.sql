-- Backend contract used by the Sprintly frontend.
-- users, goals, github_commits, and daily_summaries are created by the application schema.

alter table public.goals add column if not exists goal_type text not null default 'content_creation';
alter table public.goals add column if not exists description text;
alter table public.goals add column if not exists original_date date;
alter table public.goals add column if not exists is_auto_rollover boolean default true;
alter table public.goals add column if not exists rollover_count integer default 0;
alter table public.goals add column if not exists completed_at timestamptz;
alter table public.goals add column if not exists goal_scope text not null default 'private';
alter table public.goals add column if not exists scheduled_hour integer default 0;

update public.goals
set original_date = coalesce(original_date, scheduled_date),
    rollover_count = coalesce(rollover_count, 0),
    is_auto_rollover = coalesce(is_auto_rollover, true);

alter table public.goals drop constraint if exists goals_goal_type_check;
alter table public.goals add constraint goals_goal_type_check
  check (goal_type in ('content_creation', 'documentation', 'project_review'));
alter table public.goals drop constraint if exists goals_goal_scope_check;
alter table public.goals add constraint goals_goal_scope_check
  check (goal_scope in ('private', 'team'));
alter table public.goals drop constraint if exists goals_scheduled_hour_check;
alter table public.goals add constraint goals_scheduled_hour_check
  check (scheduled_hour between 0 and 23);

alter table public.goals enable row level security;

create policy "Users can read their own goals" on public.goals
  for select using (auth.uid() = user_id);
create policy "Users can read team goals" on public.goals
  for select using (goal_scope = 'team');
create policy "Users can add their own goals" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "Users can add team goals" on public.goals
  for insert with check (goal_scope = 'team');
create policy "Users can update their own goals" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own goals" on public.goals
  for delete using (auth.uid() = user_id);
create policy "Users can manage team goals" on public.goals
  for update using (goal_scope = 'team') with check (goal_scope = 'team');
create policy "Users can delete team goals" on public.goals
  for delete using (goal_scope = 'team');
