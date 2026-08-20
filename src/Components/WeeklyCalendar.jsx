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

export const WeeklyCalendar = () => {
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
            <div key={formatDate(date)} className={`week-day-heading ${isToday ? 'week-day-today' : ''}`}>
              <span>{date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span>
              <strong>{date.getDate()}</strong>
            </div>
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
            return (
              <div className="week-column" key={formatDate(date)}>
                {hours.map((hour) => <div className={`hour-cell ${isToday && hour === currentHour ? 'current-hour-cell' : ''}`} key={hour} />)}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
