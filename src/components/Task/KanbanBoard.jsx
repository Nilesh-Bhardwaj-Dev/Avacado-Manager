import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ListTodo, Clock, Search, CheckCircle } from 'lucide-react';
import KanbanCard from './KanbanCard.jsx';
import { updateTaskRequest, selectTask } from '../../store/slices/task.slice.js';

export default function KanbanBoard() {
  const tasks = useSelector(state => state.task.tasks);
  const searchQuery = useSelector(state => state.task.searchQuery).toLowerCase();
  const filterTeam = useSelector(state => state.task.filterTeam);
  const filterPriority = useSelector(state => state.task.filterPriority);
  const dispatch = useDispatch();

  const [dragOverCol, setDragOverCol] = useState(null);

  const statusCols = [
    { key: 'todo', label: 'To Do', icon: <ListTodo size={16} /> },
    { key: 'progress', label: 'In Progress', icon: <Clock size={16} /> },
    { key: 'review', label: 'In Review', icon: <Search size={16} /> },
    { key: 'done', label: 'Done', icon: <CheckCircle size={16} /> }
  ];

  // Filtering Logic
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

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    setDragOverCol(colKey);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== targetStatus) {
      dispatch(updateTaskRequest({
        id: taskId,
        data: {
          title: task.title,
          description: task.description,
          team: task.team,
          assigneeId: task.assigneeId,
          priority: task.priority,
          status: targetStatus,
          dueDate: task.dueDate,
          tags: task.tags
        }
      }));
    }
  };

  return (
    <div className="board-layout">
      {statusCols.map(col => {
        const colTasks = filteredTasks.filter(t => t.status === col.key);
        return (
          <div
            key={col.key}
            className={`board-column ${dragOverCol === col.key ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="column-header">
              <div className="column-title">
                {col.icon}
                {col.label}
              </div>
              <span className="column-count">{colTasks.length}</span>
            </div>
            <div className="column-body">
              {colTasks.length === 0 ? (
                <div 
                  style={{ 
                    padding: '24px 12px', 
                    textAlign: 'center', 
                    color: 'var(--text-muted)', 
                    fontSize: '0.8rem', 
                    border: '1px dashed rgba(255,255,255,0.04)',
                    borderRadius: '8px'
                  }}
                >
                  No tasks here
                </div>
              ) : (
                colTasks.map(task => (
                  <KanbanCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => dispatch(selectTask(task.id))} 
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
