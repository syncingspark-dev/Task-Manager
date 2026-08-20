const getIntensityClass = (percentage) => {
  if (percentage === 0) return 'bg-[#202b29] text-[#71827c]';
  if (percentage < 30) return 'bg-[#315148] text-[#b8d4c7]';
  if (percentage < 70) return 'bg-[#4e8b6f] text-white';
  return 'bg-[#8fc9a3] text-[#102018]';
};

export const ProductivityHeatmap = ({ goals = [] }) => {
  const safeGoals = Array.isArray(goals) ? goals : [];

  const statsByDate = safeGoals.reduce((acc, goal) => {
    const date = goal?.scheduled_date;
    if (!date) return acc;
    if (!acc[date]) acc[date] = { total: 0, completed: 0 };
    acc[date].total += 1;
    if (goal.status === 'completed') acc[date].completed += 1;
    return acc;
  }, {});

  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <section className="panel mb-5 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="eyebrow">Consistency</p>
          <h3 className="text-lg font-semibold text-[#e9f3ed]">Productivity heatmap</h3>
        </div>
        <span className="text-xs text-[#7f9289]">Last 28 days</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((date) => {
          const dayData = statsByDate[date] || { total: 0, completed: 0 };
          const percentage = dayData.total > 0 
            ? Math.round((dayData.completed / dayData.total) * 100) 
            : 0;

          return (
            <div
              key={date}
              title={`${date}: ${percentage}% completed (${dayData.completed}/${dayData.total})`}
              className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs font-medium transition-transform hover:scale-105 cursor-pointer ${getIntensityClass(percentage)}`}
            >
              <span>{date.slice(8)}</span>
              <span className="text-[10px] opacity-80">{percentage}%</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};