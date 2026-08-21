import { memo, useMemo, useState } from 'react';

const monthNames = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2020, month, 1)));
const formatDate = (date) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().split('T')[0];
};

const getIntensityClass = (percentage) => {
  if (percentage === 0) return 'bg-[#202b29] text-[#71827c]';
  if (percentage < 30) return 'bg-[#315148] text-[#b8d4c7]';
  if (percentage < 70) return 'bg-[#4e8b6f] text-white';
  return 'bg-[#8fc9a3] text-[#102018]';
};

export const ProductivityHeatmap = memo(({ goals = [], selectedDate, onSelectDate }) => {
  const statsByDate = useMemo(() => {
    // Performance optimization: Use a Map for faster lookups 
    // and process in a single pass
    const stats = {};
    if (!Array.isArray(goals)) return stats;
    
    for (let i = 0; i < goals.length; i++) {
      const date = goals[i]?.scheduled_date;
      if (!date) continue;
      
      if (!stats[date]) stats[date] = { total: 0, completed: 0 };
      stats[date].total++;
      if (goals[i].status === 'completed') stats[date].completed++;
    }
    return stats;
  }, [goals]); // This only runs when the actual data changes

  const today = new Date();
  const todayDate = formatDate(today);
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth());
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const { leadingDays, days } = useMemo(() => {
    const firstDay = new Date(visibleYear, visibleMonth, 1);
    const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();
    return {
      leadingDays: Array.from({ length: firstDay.getDay() }, (_, index) => `empty-${index}`),
      days: Array.from({ length: daysInMonth }, (_, index) => formatDate(new Date(visibleYear, visibleMonth, index + 1))),
    };
  }, [visibleMonth, visibleYear]);
  const changeMonth = (amount) => {
    const next = new Date(visibleYear, visibleMonth + amount, 1);
    setVisibleMonth(next.getMonth());
    setVisibleYear(next.getFullYear());
  };

  return (
    <section className="panel mb-5 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="eyebrow">Consistency</p>
          <h3 className="text-lg font-semibold text-[#e9f3ed]">Productivity heatmap</h3>
        </div>
        <div className="heatmap-controls"><button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month"><i className="ri-arrow-left-s-line" /></button><select value={visibleMonth} onChange={(event) => setVisibleMonth(Number(event.target.value))} aria-label="Heatmap month">{monthNames.map((month, index) => <option key={month} value={index}>{month}</option>)}</select><input type="number" value={visibleYear} onChange={(event) => setVisibleYear(Number(event.target.value) || visibleYear)} aria-label="Heatmap year" /><button type="button" onClick={() => changeMonth(1)} aria-label="Next month"><i className="ri-arrow-right-s-line" /></button></div>
      </div>
      <div className="calendar-weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="month-calendar-grid">
        {leadingDays.map((key) => <span key={key} className="calendar-empty" />)}
        {days.map((date) => {
          const dayData = statsByDate[date] || { total: 0, completed: 0 };
          const percentage = dayData.total > 0 
            ? Math.round((dayData.completed / dayData.total) * 100) 
            : 0;

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate?.(date)}
              title={`${date}: ${percentage}% completed (${dayData.completed}/${dayData.total})`}
              className={`calendar-day ${date === todayDate ? 'calendar-day-today' : ''} ${date === selectedDate ? 'calendar-day-selected' : ''} ${getIntensityClass(percentage)}`}
            >
              <span>{Number(date.slice(8))}</span>
              <span className="text-[10px] opacity-80">{percentage}%</span>
            </button>
          );
        })}
      </div>
    </section>
  );
});