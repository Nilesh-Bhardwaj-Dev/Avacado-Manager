import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectTask } from '../../store/slices/task.slice.js';

export default function TaskListView() {
  const tasks = useSelector(state => state.task.tasks);
  const searchQuery = useSelector(state => state.task.searchQuery).toLowerCase();
  const filterTeam = useSelector(state => state.task.filterTeam);
  const filterPriority = useSelector(state => state.task.filterPriority);
  const members = useSelector(state => state.team.members);

  const dispatch = useDispatch();

  const [sorting, setSorting] = useState({ column: 'date', direction: 'asc' });

  const getInitials = (name = "Unassigned") => {
    if (name === "Unassigned") return "?";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const getAvatarColor = (name = "") => {
    if (name === "Unassigned" || !name) return "#6b7280";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444"];
    return colors[Math.abs(hash) % colors.length];
  };

  const formatDateFull = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(dateStr);
    d.setHours(0,0,0,0);
    return d < today;
  };

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

  const getSortedTasks = () => {
    const list = getFilteredTasks();
    const col = sorting.column;
    const dir = sorting.direction === 'asc' ? 1 : -1;

    return [...list].sort((a, b) => {
      let valA = "";
      let valB = "";

      if (col === "title") {
        valA = (a.title || "").toLowerCase();
        valB = (b.title || "").toLowerCase();
      } else if (col === "team") {
        valA = (a.team || "").toLowerCase();
        valB = (b.team || "").toLowerCase();
      } else if (col === "assignee") {
        const ma = members.find(m => m.id === a.assigneeId) || { name: "" };
        const mb = members.find(m => m.id === b.assigneeId) || { name: "" };
        valA = ma.name.toLowerCase();
        valB = mb.name.toLowerCase();
      } else if (col === "priority") {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        valA = priorityWeight[a.priority] || 0;
        valB = priorityWeight[b.priority] || 0;
      } else if (col === "date") {
        valA = new Date(a.dueDate).getTime() || 0;
        valB = new Date(b.dueDate).getTime() || 0;
      } else if (col === "status") {
        const statusWeight = { todo: 1, progress: 2, review: 3, done: 4 };
        valA = statusWeight[a.status] || 0;
        valB = statusWeight[b.status] || 0;
      }

      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  };

  const handleSortClick = (colName) => {
    if (sorting.column === colName) {
      setSorting({ column: colName, direction: sorting.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSorting({ column: colName, direction: 'asc' });
    }
  };

  const sortedTasks = getSortedTasks();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="view-header" style={{ marginBottom: 0 }}>
        <h1 className="view-title">Task Spreadsheet</h1>
        <p className="view-subtitle">A tabular list of tasks featuring quick actions and sorting.</p>
      </div>

      <div className="list-view-card">
        <table className="list-table">
          <thead>
            <tr>
              <th onClick={() => handleSortClick('title')} style={{ width: '35%', cursor: 'pointer' }}>Task Title</th>
              <th onClick={() => handleSortClick('team')} style={{ width: '15%', cursor: 'pointer' }}>Team</th>
              <th onClick={() => handleSortClick('assignee')} style={{ width: '15%', cursor: 'pointer' }}>Assignee</th>
              <th onClick={() => handleSortClick('priority')} style={{ width: '12%', cursor: 'pointer' }}>Priority</th>
              <th onClick={() => handleSortClick('date')} style={{ width: '13%', cursor: 'pointer' }}>Due Date</th>
              <th onClick={() => handleSortClick('status')} style={{ width: '10%', cursor: 'pointer' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                  No tasks found matching your filter criteria.
                </td>
              </tr>
            ) : (
              sortedTasks.map(task => {
                const assignee = members.find(m => m.id === task.assigneeId) || { name: 'Unassigned' };
                const overdue = isOverdue(task.dueDate) && task.status !== 'done';

                return (
                  <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => dispatch(selectTask(task.id))}>
                    <td style={{ fontWeight: 600 }}>{task.title}</td>
                    <td><span className="team-badge" style={{ fontSize: '0.75rem' }}>{task.team}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="assignee-avatar" style={{ backgroundColor: getAvatarColor(assignee.name), width: '22px', height: '22px', fontSize: '0.6rem' }}>
                          {getInitials(assignee.name)}
                        </div>
                        <span>{assignee.name}</span>
                      </div>
                    </td>
                    <td><span className={`card-tag priority-${task.priority}`} style={{ textTransform: 'uppercase' }}>{task.priority}</span></td>
                    <td style={{ color: overdue ? 'var(--danger)' : 'var(--text-primary)' }}>{formatDateFull(task.dueDate)}</td>
                    <td><span className={`badge-status status-${task.status}`}>{task.status.toUpperCase()}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
