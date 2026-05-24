import { useSelector, useDispatch } from 'react-redux';
import { isImageSrc } from '../../utils/image.util.js';
import {
  LayoutDashboard,
  Columns3,
  ListTodo,
  Calendar as CalendarIcon,
  Users,
  User,
  LogOut,
  Shield,
  UserCog,
  Activity,
  KeyRound,
  MessageCircleQuestion,
  ScrollText
} from 'lucide-react';
import { setView, logoutRequest } from '../../store/slices/auth.slice.js';
import { setUdView } from '../../store/slices/userDashboard.slice.js';
import { usePermission } from '../../hooks/usePermission.js';

export default function Sidebar() {
  const user = useSelector(state => state.auth.user);
  const activeView = useSelector(state => state.auth.activeView);
  const udView = useSelector(state => state.userDashboard.udView);
  const dispatch = useDispatch();

  const showAuditLogs = usePermission('view_audit_logs');
  const showTeams = usePermission(['invite_user', 'manage_organization'], { any: true });

  if (!user) return null;

  const getInitials = (name = "Unassigned") => {
    if (name === "Unassigned") return "?";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const handleLogout = () => {
    dispatch(logoutRequest());
  };

  // Render SuperAdmin Sidebar
  if (user.accountRole === 'superadmin') {
    return (
      <aside className="sa-sidebar">
        <div className="sidebar-header">
          <div className="logo-icon"><Shield size={18} /></div>
          <div className="logo-text">Super Admin</div>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeView === 'admins' ? 'active' : ''}`} 
            onClick={() => dispatch(setView('admins'))}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
          >
            <UserCog size={20} /> Admins
          </button>
          <button 
            className={`nav-item ${activeView === 'organizations' ? 'active' : ''}`} 
            onClick={() => dispatch(setView('organizations'))}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
          >
            <Shield size={20} /> Organizations
          </button>
          <button 
            className={`nav-item ${activeView === 'users' ? 'active' : ''}`} 
            onClick={() => dispatch(setView('users'))}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
          >
            <Users size={20} /> All Users
          </button>
          <button 
            className={`nav-item ${activeView === 'otp-logs' ? 'active' : ''}`} 
            onClick={() => dispatch(setView('otp-logs'))}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
          >
            <KeyRound size={20} /> OTP Logs
          </button>
          <button 
            className={`nav-item ${activeView === 'queries' ? 'active' : ''}`} 
            onClick={() => dispatch(setView('queries'))}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
          >
            <MessageCircleQuestion size={20} /> Queries
          </button>
          <button 
            className={`nav-item ${activeView === 'audit-logs' ? 'active' : ''}`} 
            onClick={() => dispatch(setView('audit-logs'))}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
          >
            <ScrollText size={20} /> Audit Logs
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar" style={{ backgroundColor: '#dc2626' }}>
              {getInitials(user.name)}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    );
  }

  // Render Team Member User Dashboard Sidebar
  if (user.accountRole === 'user') {
    return (
      <aside className="ud-sidebar">
        <div className="sidebar-header">
          <div className="logo-icon"><Activity size={18} /></div>
          <div className="logo-text">My Workspace</div>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${udView === 'board' ? 'active' : ''}`} 
            onClick={() => dispatch(setUdView('board'))}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
          >
            <Columns3 size={20} /> My Tasks
          </button>
          <button 
            className={`nav-item ${udView === 'profile' ? 'active' : ''}`} 
            onClick={() => dispatch(setUdView('profile'))}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
          >
            <User size={20} /> My Profile
          </button>
          <button 
            className={`nav-item ${udView === 'queries' ? 'active' : ''}`} 
            onClick={() => dispatch(setUdView('queries'))}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
          >
            <MessageCircleQuestion size={20} /> Raise Query
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile" onClick={() => dispatch(setUdView('profile'))} style={{ cursor: 'pointer' }}>
            <div className="user-avatar" style={{ backgroundColor: '#06b6d4', overflow: 'hidden' }}>
              {isImageSrc(user.avatar) ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : getInitials(user.name)}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign Out"><LogOut size={18} /></button>
        </div>
      </aside>
    );
  }

  // Render Admin / PM Workspace Sidebar
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">PM</div>
        <div className="logo-text">Product Manager</div>
      </div>
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => dispatch(setView('dashboard'))}
          style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </button>
        <button
          className={`nav-item ${activeView === 'board' ? 'active' : ''}`}
          onClick={() => dispatch(setView('board'))}
          style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
        >
          <Columns3 size={20} />
          Kanban Board
        </button>
        <button
          className={`nav-item ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => dispatch(setView('list'))}
          style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
        >
          <ListTodo size={20} />
          Task List
        </button>
        <button
          className={`nav-item ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => dispatch(setView('calendar'))}
          style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
        >
          <CalendarIcon size={20} />
          Calendar
        </button>
        {showTeams && (
          <button
            className={`nav-item ${activeView === 'teams' ? 'active' : ''}`}
            onClick={() => dispatch(setView('teams'))}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
          >
            <Users size={20} />
            Teams & Members
          </button>
        )}
        <button
          className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => dispatch(setView('profile'))}
          style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
        >
          <User size={20} />
          My Profile
        </button>
        <button
          className={`nav-item ${activeView === 'queries' ? 'active' : ''}`}
          onClick={() => dispatch(setView('queries'))}
          style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
        >
          <MessageCircleQuestion size={20} />
          Raise Query
        </button>
        {showAuditLogs && (
          <button
            className={`nav-item ${activeView === 'audit-logs' ? 'active' : ''}`}
            onClick={() => dispatch(setView('audit-logs'))}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
          >
            <ScrollText size={20} />
            Audit Logs
          </button>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="user-profile" onClick={() => dispatch(setView('profile'))} style={{ cursor: 'pointer' }} title="View Profile">
          <div className="user-avatar" style={{ backgroundColor: '#8b5cf6', overflow: 'hidden' }}>
            {isImageSrc(user.avatar) ? (
              <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div className="user-info">
            <span className="user-name" title={user.name}>{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Sign Out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
