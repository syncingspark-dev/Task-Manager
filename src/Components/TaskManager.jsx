import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import logo from '../assets/SyncingSpark_logo.png';
import { ProductivityHeatmap } from './ProductivityHeatmap';
import { WeeklyCalendar } from './WeeklyCalendar';
import { ContributionGraph } from './ContributionGraph';

const getGoalCacheKey = (email, scope) => `sprintly_goals_${email}_${scope}`;

const readGoalCache = (email, scope) => {
  try {
    return JSON.parse(localStorage.getItem(getGoalCacheKey(email, scope)) || '[]');
  } catch {
    return [];
  }
};

const writeGoalCache = (email, scope, goals) => {
  localStorage.setItem(getGoalCacheKey(email, scope), JSON.stringify(goals));
};

export const TaskManager = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [dashboardTasks, setDashboardTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState('pending');
  const [selectedDay, setSelectedDay] = useState('today');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [calendarView, setCalendarView] = useState('monthly');
  const [userId, setUserId] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [userInitial, setUserInitial] = useState(' ');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editStatus, setEditStatus] = useState('pending');
  const [editType, setEditType] = useState('content_creation');
  const [showRolledOverOnly, setShowRolledOverOnly] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hourlyEvents, setHourlyEvents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sprintly_hourly_events') || '{}'); } catch { return {}; }
  });

  const formatDate = (date) => {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60 * 1000).toISOString().split('T')[0];
  };
  const todayStr = formatDate(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const isPastDate = (date) => date < todayStr;

  useEffect(() => {
    const loadGoals = async () => {
      const sessionEmail = sessionStorage.getItem('sprintly_user_email');
      if (!sessionEmail) {
        setNotice('Sign in to load your goals.');
        setLoading(false);
        return;
      }
      setUserInitial(sessionEmail.charAt(0).toUpperCase());
      console.log("USER: ",sessionEmail);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', sessionEmail)
        .single();

      const userDetails = data ? { ...data } : null;
      const currentUserId = userDetails?.id;
      if (error || !userDetails || !currentUserId) {
        setNotice(error?.message || 'Unable to load your user details.');
        setLoading(false);
        return;
      }

      setUserId(currentUserId);
      const cachedPrivateGoals = readGoalCache(sessionEmail, 'private');
      const cachedTeamGoals = readGoalCache(sessionEmail, 'team');
      const [privateGoalsResult, teamGoalsResult] = await Promise.all([
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', currentUserId)
          .order('scheduled_date', { ascending: true }),
        supabase
          .from('goals')
          .select('*')
          .eq('goal_scope', 'team')
          .order('scheduled_date', { ascending: true }),
      ]);
      const { data: goals, error: goalsError } = privateGoalsResult;
      const { data: allGoals, error: allGoalsError } = teamGoalsResult;
      if (!goalsError && goals && (goals.length > 0 || cachedPrivateGoals.length === 0)) {
        setTasks(goals);
        writeGoalCache(sessionEmail, 'private', goals);
      } else if (cachedPrivateGoals.length > 0) setTasks(cachedPrivateGoals);
      if (goalsError) setNotice(goalsError.message);

      if (!allGoalsError && allGoals && (allGoals.length > 0 || cachedTeamGoals.length === 0)) {
        setDashboardTasks(allGoals);
        writeGoalCache(sessionEmail, 'team', allGoals);
      } else if (cachedTeamGoals.length > 0) setDashboardTasks(cachedTeamGoals);
      if (allGoalsError && !goalsError) setNotice(allGoalsError.message);
      setLoading(false);
    };

    loadGoals();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    const sessionEmail = sessionStorage.getItem('sprintly_user_email');
    if (!newTaskTitle.trim() || !userId) {
      setNotice('Sign in before adding a goal.');
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('goals')
      .insert([{ user_id: userId, title: newTaskTitle.trim(), description: newTaskDescription.trim(), goal_type: taskType, status: taskStatus, scheduled_date: displayDate, original_date: displayDate, scheduled_hour: new Date().getHours(), is_auto_rollover: true, rollover_count: 0, goal_scope: activeView === 'dashboard' ? 'team' : 'private' }])
      .select();

    if (!error && data) {
      const scope = activeView === 'dashboard' ? 'team' : 'private';
      if (activeView === 'dashboard') setDashboardTasks((prev) => { const next = [...prev, ...data]; writeGoalCache(sessionEmail, scope, next); return next; });
      else setTasks((prev) => { const next = [...prev, ...data]; writeGoalCache(sessionEmail, scope, next); return next; });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setTaskStatus('pending');
      setShowTaskForm(false);
      setNotice('Task added');
    } else if (error) {
      const scope = activeView === 'dashboard' ? 'team' : 'private';
      const cachedGoals = readGoalCache(sessionEmail, scope);
      const localGoal = { id: `local-${scope}-${displayDate}-${cachedGoals.length}`, user_id: userId, title: newTaskTitle.trim(), description: newTaskDescription.trim(), goal_type: taskType, status: taskStatus, scheduled_date: displayDate, original_date: displayDate, scheduled_hour: new Date().getHours(), rollover_count: 0, goal_scope: scope };
      cachedGoals.push(localGoal);
      writeGoalCache(sessionEmail, scope, cachedGoals);
      if (activeView === 'dashboard') setDashboardTasks(cachedGoals);
      else setTasks(cachedGoals);
      setNotice(`Saved locally until the database reconnects: ${error.message}`);
    }
    setSaving(false);
  };

  const updateHourlyEvent = useCallback((date, hour, value) => {
    const key = `${date}-${hour}`;
    setHourlyEvents((previous) => {
      const next = { ...previous, [key]: value };
      if (!value.trim()) delete next[key];
      localStorage.setItem('sprintly_hourly_events', JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleTask = async (id, status) => {
    const nextStatus = status === 'completed' ? 'in_progress' : 'completed';
    const { error } = await supabase
      .from('goals')
      .update({ status: nextStatus, completed_at: nextStatus === 'completed' ? new Date().toISOString() : null })
      .eq('id', id);

    if (!error) {
      const completedAt = nextStatus === 'completed' ? new Date().toISOString() : null;
      const updateTask = (task) => (task.id === id ? { ...task, status: nextStatus, completed_at: completedAt } : task);
      setTasks((prev) => { const next = prev.map(updateTask); writeGoalCache(sessionStorage.getItem('sprintly_user_email'), 'private', next); return next; });
      setDashboardTasks((prev) => { const next = prev.map(updateTask); writeGoalCache(sessionStorage.getItem('sprintly_user_email'), 'team', next); return next; });
    } else setNotice(error.message);
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditStatus(task.status || 'pending');
    setEditType(task.goal_type || 'content_creation');
  };

  const saveTaskEdit = async (id) => {
    const completedAt = editStatus === 'completed' ? new Date().toISOString() : null;
    const { data, error } = await supabase
      .from('goals')
      .update({ status: editStatus, goal_type: editType, completed_at: completedAt })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      setNotice(error.message);
      return;
    }
    const replaceTask = (task) => task.id === id ? data : task;
    setTasks((prev) => { const next = prev.map(replaceTask); writeGoalCache(sessionStorage.getItem('sprintly_user_email'), 'private', next); return next; });
    setDashboardTasks((prev) => { const next = prev.map(replaceTask); writeGoalCache(sessionStorage.getItem('sprintly_user_email'), 'team', next); return next; });
    setEditingTaskId(null);
    setNotice('Task updated');
  };

  const deleteTask = async (id) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (!error) {
      setTasks((prev) => { const next = prev.filter((task) => task.id !== id); writeGoalCache(sessionStorage.getItem('sprintly_user_email'), 'private', next); return next; });
      setDashboardTasks((prev) => { const next = prev.filter((task) => task.id !== id); writeGoalCache(sessionStorage.getItem('sprintly_user_email'), 'team', next); return next; });
      setNotice('Task deleted');
    } else {
      setNotice(error.message);
    }
  };

  const rolloverTask = useCallback(async (task, automatic = false) => {
    const scope = task.goal_scope || (activeView === 'dashboard' ? 'team' : 'private');
    const rolloverKey = `sprintly_rollover_${scope}_${todayStr}_${userId}`;
    if (automatic && localStorage.getItem(`${rolloverKey}_${task.id}`)) return;
    if (task.status === 'completed' || task.scheduled_date !== todayStr) return;

    const { data, error } = await supabase
      .from('goals')
      .update({ scheduled_date: tomorrowStr, rollover_count: (task.rollover_count || 0) + 1, is_auto_rollover: true })
      .eq('id', task.id)
      .select()
      .single();

    if (error) {
      setNotice(error.message);
      return;
    }

    const updateTask = (currentTask) => currentTask.id === task.id ? data : currentTask;
    setTasks((prev) => { const next = prev.map(updateTask); writeGoalCache(sessionStorage.getItem('sprintly_user_email'), 'private', next); return next; });
    setDashboardTasks((prev) => { const next = prev.map(updateTask); writeGoalCache(sessionStorage.getItem('sprintly_user_email'), 'team', next); return next; });
    if (automatic) localStorage.setItem(`${rolloverKey}_${task.id}`, 'done');
    setNotice(`"${task.title}" moved to tomorrow`);
  }, [activeView, todayStr, tomorrowStr, userId]);

  useEffect(() => {
    const rolloverAtNight = () => {
      const now = new Date();
      if (!userId || (now.getHours() !== 23 || now.getMinutes() < 55)) return;
      tasks.filter((task) => task.scheduled_date === todayStr && task.status !== 'completed').forEach((task) => rolloverTask(task, true));
      dashboardTasks.filter((task) => task.scheduled_date === todayStr && task.status !== 'completed').forEach((task) => rolloverTask(task, true));
    };

    rolloverAtNight();
    const interval = window.setInterval(rolloverAtNight, 60000);
    return () => window.clearInterval(interval);
  }, [dashboardTasks, rolloverTask, tasks, userId, todayStr]);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem('sprintly_saved_login');
    navigate('/', { replace: true });
  };

  const taskTypes = { content_creation: 'Content Creation', documentation: 'Documentation', project_review: 'Project Review' };
  const taskStatuses = { pending: 'Not started', in_progress: 'In progress', completed: 'Done' };
  const selectedDate = { yesterday: yesterdayStr, today: todayStr, tomorrow: tomorrowStr }[selectedDay];
  const displayDate = selectedCalendarDate || selectedDate;
  const activeTasks = activeView === 'dashboard' ? dashboardTasks : tasks;
  /* React Compiler cannot preserve this intentional memo over a derived state array. */
  /* eslint-disable react-hooks/preserve-manual-memoization */
  const visibleTasks = useMemo(() => {
    return activeTasks.filter((task) =>
      task.scheduled_date === displayDate &&
      (!showRolledOverOnly || task.rollover_count > 0)
    );
  }, [activeTasks, displayDate, showRolledOverOnly]);
  /* eslint-enable react-hooks/preserve-manual-memoization */
  const hasRolledOverTasks = activeTasks.some((task) => task.scheduled_date === displayDate && task.rollover_count > 0);
  const canEditDate = !isPastDate(displayDate);
  const calendarTasks = activeTasks;
  const selectedDayLabel = { yesterday: 'Yesterday', today: 'Today', tomorrow: 'Tomorrow' }[selectedDay];
  const [taskType, setTaskType] = useState('content_creation');
  const currentHour = new Date().getHours();
  const currentHourEvents = useMemo(() => Object.entries(hourlyEvents).filter(([key, value]) => key === `${todayStr}-${currentHour}` && value.trim()), [currentHour, hourlyEvents, todayStr]);

  const hourCard = <section className="sidebar-widget hourly-widget hour-card" aria-label="Updates for this hour">
    <div className="sidebar-widget-heading"><span>This hour</span><span className="hour-label">{new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date())}</span></div>
    {currentHourEvents.length > 0 ? <ul className="hourly-task-list">{currentHourEvents.map(([key, value]) => <li key={key}><i className="ri-time-line" />{value}</li>)}</ul> : <p className="hourly-empty">No updates for this hour.</p>}
  </section>;

  const contributionCard = <ContributionGraph key={activeView} goals={activeTasks} scope={activeView === 'dashboard' ? 'team' : 'private'} />;

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-menu-heading"><div className="brand"><div className="brand-mark"> <img  
      src={logo} 
    alt="Sprintly Logo" 
    width="32" 
    height="32" 
    loading="eager" 
  /></div><span>Sprintly</span></div><button className="sidebar-close-button" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><i className="ri-close-line" /></button></div>
        <nav className="space-y-2">
          {['Dashboard', 'My goals'].map((item, index) => (
            <button key={item} onClick={() => { setActiveView(index === 0 ? 'dashboard' : 'goals'); setMenuOpen(false); }} className={`nav-item ${activeView === (index === 0 ? 'dashboard' : 'goals') ? 'nav-item-active' : ''}`}><i className={`ri-${['dashboard-line', 'focus-3-line'][index]}`} />{item}</button>
          ))}
        </nav>
        <div className="desktop-sidebar-widgets">{hourCard}{contributionCard}</div>
      </aside>

      <main className="min-w-0 p-4 sm:p-8">
        <nav className="responsive-topbar" aria-label="Primary navigation">
          <div className="brand"><div className="brand-mark"><img src={logo} alt="Sprintly Logo" width="32" height="32" /></div><span>Sprintly</span></div>
          <div className="responsive-topbar-actions"><span className="avatar">{userInitial}</span><button className="logout-icon-button" onClick={handleLogout} aria-label="Log out" title="Log out"><i className="ri-logout-box-r-line" /></button><button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={menuOpen}><i className={menuOpen ? 'ri-close-line' : 'ri-menu-line'} /></button></div>
        </nav>
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="header-title"><div><p className="eyebrow">{todayLabel}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#edf7f0]">Welcome aboard.</h1></div></div>
          <div className="header-actions flex items-center gap-3"><span className="avatar">{userInitial}</span><button className="logout-button" onClick={handleLogout} title="Log out"><i className="ri-logout-box-r-line" /><span>Log out</span></button></div>
        </header>

        <div className="responsive-cards">{hourCard}</div>

        <div className="dashboard-grid">
          <div className="min-w-0">
            <section className="panel mb-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div><p className="eyebrow">{calendarView === 'monthly' ? 'Monthly overview' : 'Weekly schedule'}</p><h2 className="mt-1 text-xl font-semibold">{calendarView === 'monthly' ? 'Monthly calendar' : 'This week'}</h2></div>
                <div className="calendar-toggle" role="group" aria-label="Calendar view">
                  <button className={calendarView === 'monthly' ? 'calendar-toggle-active' : ''} onClick={() => setCalendarView('monthly')}>Monthly</button>
                  <button className={calendarView === 'weekly' ? 'calendar-toggle-active' : ''} onClick={() => setCalendarView('weekly')}>Weekly</button>
                </div>
              </div>
            </section>
            {calendarView === 'monthly' ? <ProductivityHeatmap goals={calendarTasks} selectedDate={displayDate} onSelectDate={setSelectedCalendarDate}/> : <WeeklyCalendar events={hourlyEvents} selectedDate={displayDate} onSelectDate={setSelectedCalendarDate} onEventChange={updateHourlyEvent}/>} 
          </div>

          <div className="tasks-column">
          <section className="panel p-5 sm:p-6">
            <div className="task-panel-heading"><div><p className="eyebrow">{activeView === 'dashboard' ? 'Shared activity' : 'Task focus'}</p><h2 className="mt-1 text-xl font-semibold">{activeView === 'dashboard' ? 'Team overview' : selectedDayLabel}</h2><p className="selected-date-label">{displayDate}{isPastDate(displayDate) ? ' - History (read-only)' : ''}</p></div><button disabled={!canEditDate} onClick={() => setShowTaskForm((visible) => !visible)} className="primary-button"><i className={showTaskForm ? 'ri-close-line' : 'ri-add-line'} /> {showTaskForm ? 'Close' : 'Add task'}</button></div>
            <div className="day-switcher" role="tablist" aria-label="Task day"><button className={displayDate === yesterdayStr ? 'day-switch-active' : ''} onClick={() => { setSelectedDay('yesterday'); setSelectedCalendarDate(yesterdayStr); }}>Yesterday</button><button className={displayDate === todayStr ? 'day-switch-active' : ''} onClick={() => { setSelectedDay('today'); setSelectedCalendarDate(todayStr); }}>Today</button><button className={displayDate === tomorrowStr ? 'day-switch-active' : ''} onClick={() => { setSelectedDay('tomorrow'); setSelectedCalendarDate(tomorrowStr); }}>Tomorrow</button></div>
            {showRolledOverOnly && <button className="history-filter-button" onClick={() => setShowRolledOverOnly(false)}>Show all tasks for this day</button>}
            {!showRolledOverOnly && hasRolledOverTasks && <button className="history-filter-button" onClick={() => setShowRolledOverOnly(true)}>Show rolled-over tasks only</button>}
            {showTaskForm && canEditDate && <form onSubmit={addTask} className="task-form">
              <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Task name" className="task-input" autoFocus />
              <textarea value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Short description" className="task-input task-description" rows="2" />
              <div className="task-form-row"><select value={taskType} onChange={(e) => setTaskType(e.target.value)} className="task-input"><option value="content_creation">Content Creation</option><option value="documentation">Documentation</option><option value="project_review">Project Review</option></select><select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} className="task-input"><option value="pending">Not started</option><option value="in_progress">In progress</option><option value="completed">Done</option></select><button type="submit" disabled={saving} className="primary-button">{saving ? 'Adding' : 'Save task'}</button></div>
            </form>}
            {notice && <p className="mb-3 text-xs text-[#8fc9a3]">{notice}</p>}
            {loading ? <p className="py-6 text-center text-sm text-[#71827c]">Loading goals...</p> : <ul className="task-list">{visibleTasks.map((goal) => {
              const status = goal.status || 'pending';
              const locked = isPastDate(goal.scheduled_date);
              return (
                <li key={goal.id} className={`task-card task-card-${status}`}>
                  <button disabled={locked} className="task-check" onClick={() => toggleTask(goal.id, status)} aria-label={`Mark ${goal.title} ${status === 'completed' ? 'incomplete' : 'complete'}`}><i className={status === 'completed' ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} /></button>
                  <div className="task-card-content">
                    <div className="task-card-title-row"><p>{goal.title}</p><span className={`status-pill status-pill-${status}`}>{taskStatuses[status]}</span></div>
                    <p className="task-card-description">{goal.description || 'No description added.'}</p>
                    <span className="task-card-type">{taskTypes[goal.goal_type] || 'Content Creation'}</span>
                    {goal.rollover_count > 0 && <span className="rollover-label"><i className="ri-history-line" /> Rolled over {goal.rollover_count} day{goal.rollover_count === 1 ? '' : 's'}</span>}
                    {editingTaskId === goal.id && !locked && <div className="edit-task-form"><select value={editType} onChange={(e) => setEditType(e.target.value)} className="task-input"><option value="content_creation">Content Creation</option><option value="documentation">Documentation</option><option value="project_review">Project Review</option></select><select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="task-input"><option value="pending">Not started</option><option value="in_progress">In progress</option><option value="completed">Done</option></select><button className="primary-button" onClick={() => saveTaskEdit(goal.id)}>Save</button></div>}
                  </div>
                  {!locked && <button className="edit-task-button" onClick={() => startEditing(goal)} aria-label={`Edit ${goal.title}`} title="Edit task"><i className="ri-edit-line" /></button>}
                  {!locked && displayDate === todayStr && status !== 'completed' && <button className="rollover-task-button" onClick={() => rolloverTask(goal)} aria-label={`Roll over ${goal.title}`} title="Roll over task"><i className="ri-arrow-right-up-line" /></button>}
                  {!locked && <button className="delete-task-button" onClick={() => deleteTask(goal.id)} aria-label={`Delete ${goal.title}`} title="Delete task"><i className="ri-delete-bin-line" /></button>}
                </li>
              );
            })}{visibleTasks.length === 0 && <p className="py-6 text-center text-sm text-[#71827c]">No goals for {displayDate}.</p>}</ul>}
          </section>
          <div className="responsive-cards">{contributionCard}</div>
          </div>
        </div>
      </main>
    </div>
  );
};