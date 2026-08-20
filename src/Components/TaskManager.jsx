import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ProductivityHeatmap } from './ProductivityHeatmap';
import { WeeklyCalendar } from './WeeklyCalendar';

export const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
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
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());

  useEffect(() => {
    const loadGoals = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      if (!currentUserId) {
        setNotice('Sign in to load your goals.');
        setLoading(false);
        return;
      }

      setUserId(currentUserId);
      const { data, error } = await supabase.from('goals').select('*').eq('user_id', currentUserId).order('scheduled_date', { ascending: true });
      if (!error && data) setTasks(data);
      if (error) setNotice(error.message);
      setLoading(false);
    };

    loadGoals();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !userId) {
      setNotice('Sign in before adding a goal.');
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('goals')
      .insert([{ user_id: userId, title: newTaskTitle.trim(), description: newTaskDescription.trim(), goal_type: taskType, status: taskStatus, scheduled_date: selectedDate, original_date: selectedDate, is_auto_rollover: true, rollover_count: 0 }])
      .select();

    if (!error && data) {
      setTasks((prev) => [...prev, ...data]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setTaskStatus('pending');
      setShowTaskForm(false);
      setNotice('Task added');
    } else if (error) {
      setNotice(error.message);
    }
    setSaving(false);
  };

  const toggleTask = async (id, status) => {
    const nextStatus = status === 'completed' ? 'in_progress' : 'completed';
    const { error } = await supabase
      .from('goals')
      .update({ status: nextStatus, completed_at: nextStatus === 'completed' ? new Date().toISOString() : null })
      .eq('id', id);

    if (!error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus, completed_at: nextStatus === 'completed' ? new Date().toISOString() : null } : t))
      );
    }
  };

  const handleRollover = async () => {
    const uncompletedTasks = tasks.filter((t) => t.status !== 'completed' && t.scheduled_date === todayStr);

    if (uncompletedTasks.length === 0) return;

    const newRolloverEntries = uncompletedTasks.map((t) => ({
      user_id: userId,
      title: t.title,
      description: t.description || '',
      goal_type: t.goal_type || 'content_creation',
      status: t.status || 'pending',
      original_date: t.original_date || t.scheduled_date,
      is_auto_rollover: true,
      rollover_count: (t.rollover_count || 0) + 1,
      scheduled_date: tomorrowStr,
    }));

    const { data, error } = await supabase
      .from('goals')
      .insert(newRolloverEntries)
      .select();

    if (!error && data) {
      setTasks((prev) => [...prev, ...data]);
      setNotice(`${data.length} task${data.length === 1 ? '' : 's'} moved to tomorrow`);
    }
  };

  const taskTypes = { content_creation: 'Content Creation', documentation: 'Documentation', project_review: 'Project Review' };
  const taskStatuses = { pending: 'Not started', in_progress: 'In progress', completed: 'Done' };
  const selectedDate = { yesterday: yesterdayStr, today: todayStr, tomorrow: tomorrowStr }[selectedDay];
  const visibleTasks = tasks.filter((task) => task.scheduled_date === selectedDate);
  const selectedDayLabel = { yesterday: 'Yesterday', today: 'Today', tomorrow: 'Tomorrow' }[selectedDay];
  const [taskType, setTaskType] = useState('content_creation');

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">S</span><span>Sprintly</span></div>
        <nav className="space-y-2">
          {['Dashboard', 'My goals'].map((item, index) => (
            <button key={item} className={`nav-item ${index === 0 ? 'nav-item-active' : ''}`}><i className={`ri-${['dashboard-line', 'focus-3-line', 'group-line', 'inbox-archive-line'][index]}`} />{item}</button>
          ))}
        </nav>
        <div className="sidebar-footer"><i className="ri-settings-3-line" /> Settings</div>
      </aside>

      <main className="min-w-0 p-4 sm:p-8">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="eyebrow">{todayLabel}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#edf7f0]">Good morning.</h1></div>
          <div className="flex items-center gap-3"><span className="avatar">JD</span><button className="icon-button" title="Notifications"><i className="ri-notification-3-line" /></button></div>
        </header>

        <div className="dashboard-grid">
          <div className="min-w-0">
            <section className="panel mb-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div><p className="eyebrow">{calendarView === 'monthly' ? 'Monthly overview' : 'Weekly schedule'}</p><h2 className="mt-1 text-xl font-semibold">{calendarView === 'monthly' ? monthLabel : 'This week'}</h2></div>
                <div className="calendar-toggle" role="group" aria-label="Calendar view">
                  <button className={calendarView === 'monthly' ? 'calendar-toggle-active' : ''} onClick={() => setCalendarView('monthly')}>Monthly</button>
                  <button className={calendarView === 'weekly' ? 'calendar-toggle-active' : ''} onClick={() => setCalendarView('weekly')}>Weekly</button>
                </div>
              </div>
            </section>
            {calendarView === 'monthly' ? <ProductivityHeatmap goals={tasks}/> : <WeeklyCalendar/>} 
          </div>

          <section className="panel p-5 sm:p-6">
            <div className="task-panel-heading"><div><p className="eyebrow">Task focus</p><h2 className="mt-1 text-xl font-semibold">{selectedDayLabel}</h2></div><button onClick={() => setShowTaskForm((visible) => !visible)} className="primary-button"><i className={showTaskForm ? 'ri-close-line' : 'ri-add-line'} /> {showTaskForm ? 'Close' : 'Add task'}</button></div>
            <div className="day-switcher" role="tablist" aria-label="Task day"><button className={selectedDay === 'yesterday' ? 'day-switch-active' : ''} onClick={() => setSelectedDay('yesterday')}>Yesterday</button><button className={selectedDay === 'today' ? 'day-switch-active' : ''} onClick={() => setSelectedDay('today')}>Today</button><button className={selectedDay === 'tomorrow' ? 'day-switch-active' : ''} onClick={() => setSelectedDay('tomorrow')}>Tomorrow</button></div>
            {showTaskForm && <form onSubmit={addTask} className="task-form">
              <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Task name" className="task-input" autoFocus />
              <textarea value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Short description" className="task-input task-description" rows="2" />
              <div className="task-form-row"><select value={taskType} onChange={(e) => setTaskType(e.target.value)} className="task-input"><option value="content_creation">Content Creation</option><option value="documentation">Documentation</option><option value="project_review">Project Review</option></select><select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} className="task-input"><option value="pending">Not started</option><option value="in_progress">In progress</option><option value="completed">Done</option></select><button type="submit" disabled={saving} className="primary-button">{saving ? 'Adding' : 'Save task'}</button></div>
            </form>}
            {notice && <p className="mb-3 text-xs text-[#8fc9a3]">{notice}</p>}
            {loading ? <p className="py-6 text-center text-sm text-[#71827c]">Loading goals...</p> : <ul className="task-list">{visibleTasks.map((goal) => { const status = goal.status || 'pending'; return <li key={goal.id} className={`task-card task-card-${status}`}><button className="task-check" onClick={() => toggleTask(goal.id, status)} aria-label={`Mark ${goal.title} ${status === 'completed' ? 'incomplete' : 'complete'}`}><i className={status === 'completed' ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} /></button><div className="task-card-content"><div className="task-card-title-row"><p>{goal.title}</p><span className={`status-pill status-pill-${status}`}>{taskStatuses[status]}</span></div><p className="task-card-description">{goal.description || 'No description added.'}</p><span className="task-card-type">{taskTypes[goal.goal_type] || 'Content Creation'}</span>{goal.rollover_count > 0 && <span className="rollover-label"><i className="ri-history-line" /> Rolled over {goal.rollover_count} day{goal.rollover_count === 1 ? '' : 's'}</span>}</div></li>; })}{visibleTasks.length === 0 && <p className="py-6 text-center text-sm text-[#71827c]">No goals for {selectedDayLabel.toLowerCase()}.</p>}</ul>}
            {selectedDay === 'today' && <button onClick={handleRollover} className="rollover-button"><i className="ri-arrow-right-up-line" /> Move incomplete tasks to tomorrow</button>}
          </section>
        </div>
      </main>
    </div>
  );
};