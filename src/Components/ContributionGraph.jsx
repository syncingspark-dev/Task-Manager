import { useState } from 'react';

const formatDate = (date) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().split('T')[0];
};

const getCompletionClass = (total, completed) => {
  if (total === 0) return 'contribution-empty';
  const ratio = completed / total;
  if (ratio === 1) return 'contribution-full';
  if (ratio >= 0.7) return 'contribution-high';
  if (ratio >= 0.4) return 'contribution-medium';
  return 'contribution-low';
};

export const ContributionGraph = ({ goals = [], scope = 'private' }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const years = [...new Set([currentYear, ...goals.map((goal) => Number(goal.scheduled_date?.slice(0, 4))).filter(Boolean)])].sort((a, b) => b - a);
  const savedSelection = localStorage.getItem(`sprintly_contributions_${scope}`);
  const parsedSelection = (() => {
    try { return savedSelection ? JSON.parse(savedSelection) : {}; } catch { return {}; }
  })();
  const [selectedYear, setSelectedYear] = useState(parsedSelection.year || currentYear);
  const [selectedMonth, setSelectedMonth] = useState(parsedSelection.month ?? today.getMonth());
  const firstDay = new Date(selectedYear, selectedMonth, 1);
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const leadingDays = Array.from({ length: firstDay.getDay() }, (_, index) => `empty-${index}`);
  const days = Array.from({ length: daysInMonth }, (_, index) => formatDate(new Date(selectedYear, selectedMonth, index + 1)));
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(firstDay);

  const saveSelection = (year, month) => {
    localStorage.setItem(`sprintly_contributions_${scope}`, JSON.stringify({ year, month }));
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const statsByDate = goals.reduce((stats, goal) => {
    if (!goal.scheduled_date) return stats;
    const statsForDate = stats[goal.scheduled_date] || { total: 0, completed: 0 };
    statsForDate.total += 1;
    if (goal.status === 'completed') statsForDate.completed += 1;
    stats[goal.scheduled_date] = statsForDate;
    return stats;
  }, {});

  return (
    <section className="sidebar-widget" aria-label="Contribution graph">
      <div className="sidebar-widget-heading"><span>Contributions</span><i className="ri-bar-chart-grouped-line" /></div>
      <div className="contribution-controls"><select value={selectedMonth} onChange={(event) => saveSelection(selectedYear, Number(event.target.value))} aria-label="Contribution month">{Array.from({ length: 12 }, (_, month) => <option key={month} value={month}>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2020, month, 1))}</option>)}</select><select value={selectedYear} onChange={(event) => saveSelection(Number(event.target.value), selectedMonth)} aria-label="Contribution year">{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></div>
      <p className="contribution-month-label">{monthLabel}</p>
      <div className="contribution-grid">
        {leadingDays.map((key) => <span key={key} className="contribution-cell contribution-empty" />)}
        {days.map((date) => {
          const stats = statsByDate[date] || { total: 0, completed: 0 };
          return <span key={date} className={`contribution-cell ${getCompletionClass(stats.total, stats.completed)}`} title={`${date}: ${stats.completed}/${stats.total} completed`} />;
        })}
      </div>
      <div className="contribution-legend"><span>Less</span><i className="contribution-cell contribution-empty" /><i className="contribution-cell contribution-low" /><i className="contribution-cell contribution-medium" /><i className="contribution-cell contribution-high" /><i className="contribution-cell contribution-full" /><span>More</span></div>
    </section>
  );
};
