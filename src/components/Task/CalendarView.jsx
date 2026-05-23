import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { selectTask, setEditingTask } from '../../store/slices/task.slice.js';

export default function CalendarView() {
  const tasks = useSelector(state => state.task.tasks);
  const searchQuery = useSelector(state => state.task.searchQuery).toLowerCase();
  const filterTeam = useSelector(state => state.task.filterTeam);
  const filterPriority = useSelector(state => state.task.filterPriority);

  const dispatch = useDispatch();

  const [calendarDate, setCalendarDate] = useState(new Date());

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery) ||
        (task.description && task.description.toLowerCase().includes(searchQuery)) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchQuery)));

      const matchesTeam = filterTeam === "All" || task.team === filterTeam;
      const matchesPriority = filterPriority === "All" || task.priority === filterPriority;

      return matchesSearch && matchesTeam && matchesPriority;
    });
  };

  const filteredTasks = getFilteredTasks();

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const cells = [];
    // Previous Month padding days
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ key: `padding-${i}`, type: 'empty' });
    }

    const today = new Date();
    const isCurrentMonthYear = today.getFullYear() === year && today.getMonth() === month;

    // Current Month days
    for (let day = 1; day <= lastDay; day++) {
      const padDay = String(day).padStart(2, '0');
      const padMonth = String(month + 1).padStart(2, '0');
      const cellDateStr = `${year}-${padMonth}-${padDay}`;
      
      cells.push({
        key: `day-${day}`,
        type: 'day',
        dayNumber: day,
        dateStr: cellDateStr,
        isToday: isCurrentMonthYear && today.getDate() === day
      });
    }

    return cells;
  };

  const calendarDays = getCalendarDays();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="view-header" style={{ marginBottom: 0 }}>
        <h1 className="view-title">Schedule Planner</h1>
        <p className="view-subtitle">Monitor due dates and align team delivery timelines.</p>
      </div>

      <div className="calendar-card">
        <div className="calendar-header">
          <div className="calendar-title-nav">
            <button
              className="calendar-nav-btn"
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="calendar-month-year">
              {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              className="calendar-nav-btn"
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div>
            <button className="btn btn-secondary" onClick={() => setCalendarDate(new Date())}>Today</button>
          </div>
        </div>

        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div className="calendar-weekday" key={d}>{d}</div>
          ))}
        </div>

        <div className="calendar-grid" style={{ marginTop: '8px' }}>
          {calendarDays.map((cell, idx) => {
            if (cell.type === 'empty') {
              return <div className="calendar-day empty" key={`empty-${idx}`} />;
            }

            const dayTasks = filteredTasks.filter(t => t.dueDate === cell.dateStr);

            return (
              <div
                className={`calendar-day ${cell.isToday ? 'today' : ''}`}
                key={cell.key}
                onClick={() => dispatch(setEditingTask({ dueDate: cell.dateStr }))}
              >
                <span className="day-number">{cell.dayNumber}</span>
                {dayTasks.length > 0 && (
                  <div className="calendar-events">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className={`calendar-event priority-${task.priority}`}
                        title={task.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(selectTask(task.id));
                        }}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
