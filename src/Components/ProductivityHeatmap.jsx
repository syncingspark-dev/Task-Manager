const getIntensityClass = (percentage) => {
  if (percentage === 0) return 'bg-[#202b29] text-[#71827c]';
  if (percentage < 30) return 'bg-[#315148] text-[#b8d4c7]';
  if (percentage < 70) return 'bg-[#4e8b6f] text-white';
  return 'bg-[#8fc9a3] text-[#102018]';
};

export const ProductivityHeatmap = ({ goals = [], selectedDate, onSelectDate }) => {
  const safeGoals = Array.isArray(goals) ? goals : [];

  const statsByDate = safeGoals.reduce((acc, goal) => {
    const date = goal?.scheduled_date;
    if (!date) return acc;
    if (!acc[date]) acc[date] = { total: 0, completed: 0 };
    acc[date].total += 1;
    if (goal.status === 'completed') acc[date].completed += 1;
    return acc;
  }, {});

  const today = new Date();
  const formatDate = (date) => {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60 * 1000).toISOString().split('T')[0];
  };
  const todayDate = formatDate(today);
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const leadingDays = Array.from({ length: firstDay.getDay() }, (_, index) => `empty-${index}`);
  const days = Array.from({ length: daysInMonth }, (_, index) => formatDate(new Date(today.getFullYear(), today.getMonth(), index + 1)));
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(today);

  return (
    <section className="panel mb-5 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="eyebrow">Consistency</p>
          <h3 className="text-lg font-semibold text-[#e9f3ed]">Productivity heatmap</h3>
        </div>
        <span className="text-xs text-[#7f9289]">{monthLabel}</span>
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
};