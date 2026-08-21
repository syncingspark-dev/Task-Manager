const formatDate = (date) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().split('T')[0];
};

const getWeekStart = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const hours = Array.from({ length: 24 }, (_, index) => index);

const formatHour = (hour) => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
};

export const WeeklyCalendar = ({ goals = [], selectedDate, onSelectDate, onAddHourlyTask }) => {
  const weekStart = getWeekStart(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  return (
    <section className="weekly-calendar panel mb-5" aria-label="Weekly calendar">
      <div className="weekly-calendar-header">
        <span className="timezone-label">GMT+05:30</span>
        {days.map((date) => {
          const isToday = formatDate(date) === formatDate(new Date());
          return (
            <button type="button" onClick={() => onSelectDate?.(formatDate(date))} key={formatDate(date)} className={`week-day-heading ${isToday ? 'week-day-today' : ''} ${formatDate(date) === selectedDate ? 'week-day-selected' : ''}`}>
              <span>{date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span>
              <strong>{date.getDate()}</strong>
            </button>
          );
        })}
      </div>

      <div className="weekly-calendar-body">
        <div className="time-column" aria-hidden="true">
          {hours.map((hour) => <span key={hour}>{formatHour(hour)}</span>)}
        </div>
        <div className="week-columns">
          {days.map((date) => {
            const isToday = formatDate(date) === formatDate(new Date());
            const currentHour = new Date().getHours();
            const dateKey = formatDate(date);
            const dayGoals = goals.filter((goal) => goal.scheduled_date === dateKey);
            return (
              <div className={`week-column ${dateKey === selectedDate ? 'week-column-selected' : ''}`} key={dateKey}>
                {hours.map((hour) => {
                  const hourGoals = dayGoals.filter((goal) => Number(goal.scheduled_hour || 0) === hour);
                  return <div className={`hour-cell ${isToday && hour === currentHour ? 'current-hour-cell' : ''}`} key={hour} onClick={() => onSelectDate?.(dateKey)}>
                    {hourGoals.length > 0 && <div className="weekly-goals">{hourGoals.map((goal) => <span className={`weekly-goal weekly-goal-${goal.status || 'pending'}`} key={goal.id}>{goal.title}</span>)}</div>}
                    <input type="text" className="hour-task-input" placeholder="+ task" disabled={dateKey < formatDate(new Date())} onKeyDown={(event) => { if (event.key === 'Enter' && event.currentTarget.value.trim()) { onAddHourlyTask?.(event.currentTarget.value.trim(), dateKey, hour); event.currentTarget.value = ''; } }} onClick={(event) => event.stopPropagation()} aria-label={`Add task for ${dateKey} at ${formatHour(hour)}`} />
                  </div>;
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
