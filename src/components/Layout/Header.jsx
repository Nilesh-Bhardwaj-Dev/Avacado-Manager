import { useSelector, useDispatch } from 'react-redux';
import { Search, Plus, Bell } from 'lucide-react';
import { setSearchQuery, setFilterTeam, setFilterPriority, setEditingTask } from '../../store/slices/task.slice.js';
import { setShowNotifPanel } from '../../store/slices/notification.slice.js';
import NotificationDropdown from './NotificationDropdown.jsx';
import Can from '../Common/Can.jsx';

export default function Header() {
  const searchQuery = useSelector(state => state.task.searchQuery);
  const filterTeam = useSelector(state => state.task.filterTeam);
  const filterPriority = useSelector(state => state.task.filterPriority);
  const teams = useSelector(state => state.team.teams);
  const unreadCount = useSelector(state => state.notification.unreadCount);
  const showNotifPanel = useSelector(state => state.notification.showNotifPanel);

  const dispatch = useDispatch();

  return (
    <header className="top-bar">
      <div className="search-container">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="search-input"
          value={searchQuery}
          onChange={e => dispatch(setSearchQuery(e.target.value))}
          placeholder="Search tasks by title, desc..."
        />
      </div>
      
      <div className="action-controls">
        <select
          className="filter-select"
          value={filterTeam}
          onChange={e => dispatch(setFilterTeam(e.target.value))}
        >
          <option value="All">All Teams</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          className="filter-select"
          value={filterPriority}
          onChange={e => dispatch(setFilterPriority(e.target.value))}
        >
          <option value="All">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <Can permission="create_task">
          <button className="btn btn-primary" onClick={() => dispatch(setEditingTask(true))}>
            <Plus size={18} />
            Create Task
          </button>
        </Can>

        <div style={{ position: 'relative' }}>
          <button 
            className="notification-bell" 
            onClick={() => dispatch(setShowNotifPanel(!showNotifPanel))}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
}
