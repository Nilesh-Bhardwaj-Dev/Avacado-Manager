import { useSelector } from 'react-redux';
import { Calendar as CalendarIcon, Link2, Lock, CheckSquare, MessageSquare } from 'lucide-react';
import { isImageSrc } from '../../utils/image.util.js';

export default function KanbanCard({ task, onClick }) {
  const allTasks = useSelector(state => state.task.tasks);
  const members = useSelector(state => state.team.members);

  const assignee = members.find(m => m.id === task.assigneeId);
  const deps = task.dependencies || [];
  const comments = task.comments || [];
  const subtasks = task.subtasks || [];
  
  // Calculate if task is blocked (has dependencies that are not completed)
  const isBlocked = deps.length > 0 && task.status !== 'done' && deps.some(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    return depTask && depTask.status !== 'done';
  });

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

  const formatDateShort = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.done).length;

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
      onClick={onClick}
    >
      <div className="card-tags">
        <span className={`card-tag priority-${task.priority}`}>{task.priority}</span>
        {deps.length > 0 && (
          <span className="dep-indicator" title={`${deps.length} Dependencies`}>
            <Link2 size={10} /> {deps.length}
          </span>
        )}
        {isBlocked && (
          <span className="blocked-badge" title="Blocked by dependencies">
            <Lock size={10} /> Blocked
          </span>
        )}
      </div>

      <h4 className="card-title">{task.title}</h4>
      {task.description && <p className="card-desc">{task.description}</p>}

      <div className="card-footer">
        <div className="card-meta">
          {task.dueDate && (
            <span className={`card-due ${isOverdue(task.dueDate) && task.status !== 'done' ? 'overdue' : ''}`}>
              <CalendarIcon size={12} /> {formatDateShort(task.dueDate)}
            </span>
          )}
          {totalSubtasks > 0 && (
            <span className="card-subtasks" title="Subtasks completed">
              <CheckSquare size={12} /> {completedSubtasks}/{totalSubtasks}
            </span>
          )}
          {comments.length > 0 && (
            <span className="card-comments" title="Discussion comments">
              <MessageSquare size={12} /> {comments.length}
            </span>
          )}
        </div>

        <div 
          className="assignee-avatar" 
          style={{ 
            backgroundColor: getAvatarColor(assignee?.name || 'Unassigned'),
            fontSize: '0.68rem',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            overflow: 'hidden'
          }}
          title={assignee?.name || 'Unassigned'}
        >
          {isImageSrc(assignee?.avatar) ? (
            <img src={assignee.avatar} alt={assignee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            getInitials(assignee?.name || 'Unassigned')
          )}
        </div>
      </div>
    </div>
  );
}
