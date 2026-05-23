import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Columns3, 
  User, 
  RefreshCw, 
  ListTodo, 
  Clock, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  Link2,
  Calendar as CalendarIcon,
  Bell,
  X,
  Camera,
  FileText,
  MessageSquare,
  AlertCircle,
  Search,
  CheckSquare
} from 'lucide-react';
import { 
  loadUDDataRequest, 
  setUdDragOverCol, 
  setUdSelectedTaskId, 
  setUdNewComment, 
  updateUDTaskStatusRequest, 
  addUDCommentRequest, 
  uploadUDProofRequest 
} from '../../store/slices/userDashboard.slice.js';
import { 
  updateProfileRequest, 
  updatePasswordRequest 
} from '../../store/slices/auth.slice.js';
import { 
  setShowNotifPanel, 
  markReadRequest, 
  markAllReadRequest 
} from '../../store/slices/notification.slice.js';
import RaiseQueryView from '../Query/RaiseQueryView.jsx';
import { isImageSrc, resolveAssetUrl } from '../../utils/image.util.js';

export default function UserDashboardView() {
  const user = useSelector(state => state.auth.user);
  const udTasks = useSelector(state => state.userDashboard.udTasks);
  const udStats = useSelector(state => state.userDashboard.udStats);
  const udView = useSelector(state => state.userDashboard.udView);
  const udDragOverCol = useSelector(state => state.userDashboard.udDragOverCol);
  const udSelectedTaskId = useSelector(state => state.userDashboard.udSelectedTaskId);
  const udNewComment = useSelector(state => state.userDashboard.udNewComment);
  const unreadCount = useSelector(state => state.notification.unreadCount);
  const notifications = useSelector(state => state.notification.notifications);
  const showNotifPanel = useSelector(state => state.notification.showNotifPanel);

  const dispatch = useDispatch();

  // Profile forms local states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    dispatch(loadUDDataRequest());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileBio(user.bio || '');
      setProfileAvatar(user.avatar || '');
    }
  }, [user]);

  if (!user) return null;

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

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getNotifIcon = (type) => {
    const map = {
      TASK_ASSIGNED: 'task-assigned',
      TASK_UPDATED: 'task-updated',
      TASK_COMPLETED: 'task-completed',
      COMMENT_ADDED: 'comment-added',
      DEPENDENCY_UNBLOCKED: 'dep-unblocked',
    };
    return map[type] || 'task-assigned';
  };

  const handleUDStatusUpdate = (taskId, status) => {
    dispatch(updateUDTaskStatusRequest({ id: taskId, status }));
  };

  const handleAddComment = (taskId) => {
    if (!udNewComment.trim()) return;
    dispatch(addUDCommentRequest({
      taskId,
      content: udNewComment.trim(),
      onSuccess: () => dispatch(setUdNewComment(''))
    }));
  };

  const handleUploadProof = (taskId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      dispatch(uploadUDProofRequest({
        taskId,
        fileData: {
          fileName: file.name,
          fileType: file.type,
          base64: reader.result
        }
      }));
    };
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    dispatch(updateProfileRequest({
      name: profileName,
      bio: profileBio,
      avatar: profileAvatar
    }));
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setPwError('');
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }

    dispatch(updatePasswordRequest({
      currentPassword,
      newPassword,
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image file size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const udSelectedTask = udTasks.find(t => t.id === udSelectedTaskId);

  const statusCols = [
    { key: 'todo', label: 'To Do', icon: <ListTodo size={16} /> },
    { key: 'progress', label: 'In Progress', icon: <Clock size={16} /> },
    { key: 'review', label: 'In Review', icon: <Search size={16} /> },
    { key: 'done', label: 'Done', icon: <CheckCircle size={16} /> },
  ];

  return (
    <div className="ud-container">
      {/* Sidebar is rendered inside Layout, but UserDashboardView handles main view router */}
      <div className="ud-main" style={{ padding: 0, border: 'none', background: 'transparent' }}>
        <div className="ud-topbar">
          <div className="ud-greeting">Welcome back, <span>{user.name.split(' ')[0]}</span> 👋</div>
          <div className="ud-topbar-actions">
            <div style={{ position: 'relative' }}>
              <button className="notification-bell" onClick={() => dispatch(setShowNotifPanel(!showNotifPanel))}>
                <Bell size={18} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {showNotifPanel && (
                <div className="notification-panel">
                  <div className="notif-panel-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && <button className="notif-mark-all" onClick={() => dispatch(markAllReadRequest())}>Mark all read</button>}
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="notif-empty"><Bell size={28} /><p>No notifications yet</p></div>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`} onClick={() => dispatch(markReadRequest(n.id))}>
                        <div className={`notif-icon ${getNotifIcon(n.type)}`}><Bell size={16} /></div>
                        <div className="notif-content">
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-message">{n.message}</div>
                          <div className="notif-time">{formatTimeAgo(n.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ud-content">
          {udView === 'board' && (
            <section className="view-section">
              {/* Stats */}
              <div className="ud-stats-grid">
                <div className="ud-stat-card"><div className="ud-stat-icon total"><ListTodo size={22} /></div><div className="ud-stat-info"><div className="ud-stat-value">{udStats.total}</div><div className="ud-stat-label">Total Tasks</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon todo"><Clock size={22} /></div><div className="ud-stat-info"><div className="ud-stat-value">{udStats.todo}</div><div className="ud-stat-label">To Do</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon progress"><Activity size={22} /></div><div className="ud-stat-info"><div className="ud-stat-value">{udStats.progress}</div><div className="ud-stat-label">In Progress</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon done"><CheckCircle size={22} /></div><div className="ud-stat-info"><div className="ud-stat-value">{udStats.done}</div><div className="ud-stat-label">Done</div></div></div>
                <div className="ud-stat-card"><div className="ud-stat-icon overdue"><AlertTriangle size={22} /></div><div className="ud-stat-info"><div className="ud-stat-value">{udStats.overdue}</div><div className="ud-stat-label">Overdue</div></div></div>
              </div>

              {/* Kanban Board */}
              <div className="ud-kanban-header">
                <div className="ud-kanban-title"><Columns3 size={20} /> My Task Board</div>
                <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '6px 14px' }} onClick={() => dispatch(loadUDDataRequest())}><RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh</button>
              </div>
              <div className="board-layout">
                {statusCols.map(col => {
                  const colTasks = udTasks.filter(t => t.status === col.key);
                  return (
                    <div
                      key={col.key}
                      className={`board-column ${udDragOverCol === col.key ? 'drag-over' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); dispatch(setUdDragOverCol(col.key)); }}
                      onDragLeave={() => dispatch(setUdDragOverCol(null))}
                      onDrop={(e) => {
                        e.preventDefault();
                        dispatch(setUdDragOverCol(null));
                        const taskId = e.dataTransfer.getData('text/plain');
                        if (taskId) handleUDStatusUpdate(taskId, col.key);
                      }}
                    >
                      <div className="column-header">
                        <div className="column-title">{col.icon} {col.label}</div>
                        <span className="column-count">{colTasks.length}</span>
                      </div>
                      <div className="column-body">
                        {colTasks.length === 0 ? (
                          <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No tasks assigned.</div>
                        ) : colTasks.map(task => {
                          const deps = task.dependencies || [];
                          const isBlocked = deps.length > 0 && task.status !== 'done';
                          return (
                            <div
                              key={task.id}
                              className="task-card"
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                              onClick={() => dispatch(setUdSelectedTaskId(task.id))}
                            >
                              <div className="card-tags">
                                <span className={`card-tag priority-${task.priority}`}>{task.priority}</span>
                                {deps.length > 0 && <span className="dep-indicator"><Link2 size={10} /> {deps.length}</span>}
                                {isBlocked && <span className="blocked-badge"><Lock size={10} /> Blocked</span>}
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
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {udView === 'queries' && <RaiseQueryView />}

          {udView === 'profile' && (
            <section className="view-section">
              <div className="profile-grid">
                <div className="profile-card" style={{ textAlign: 'center' }}>
                  <div className="profile-avatar-large" style={{ backgroundColor: '#06b6d4', overflow: 'hidden', margin: '0 auto 16px' }}>
                    {isImageSrc(profileAvatar) ? (
                      <img src={profileAvatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : getInitials(user.name)}
                  </div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{user.name}</h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{user.role} • {user.team}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.bio || 'No bio set.'}</p>
                  <label className="btn btn-secondary" style={{ marginTop: '16px', cursor: 'pointer', fontSize: '0.78rem' }}>
                    <Camera size={14} style={{ marginRight: '6px' }} /> Change Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="profile-card">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={18} /> Profile Details</h3>
                    <form onSubmit={handleUpdateProfile}>
                      <div className="form-group"><label className="form-label">Full Name</label><input type="text" className="form-control" value={profileName} onChange={e => setProfileName(e.target.value)} required /></div>
                      <div className="form-group"><label className="form-label">Bio</label><textarea className="form-control" rows="3" value={profileBio} onChange={e => setProfileBio(e.target.value)} placeholder="Tell us about yourself..." /></div>
                      <button type="submit" className="btn btn-primary">Update Profile</button>
                    </form>
                  </div>
                  <div className="profile-card">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={18} /> Change Password</h3>
                    {pwError && <div className="profile-alert alert-danger"><AlertCircle size={16} />{pwError}</div>}
                    <form onSubmit={handleUpdatePassword}>
                      <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-control" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /></div>
                      <div className="form-row">
                        <div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} required /></div>
                        <div className="form-group"><label className="form-label">Confirm Password</label><input type="password" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
                      </div>
                      <button type="submit" className="btn btn-primary">Change Password</button>
                    </form>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Task Detail Modal for User Dashboard */}
      {udSelectedTask && (
        <div className="modal-overlay" onClick={() => dispatch(setUdSelectedTaskId(null))}>
          <div className="modal-content detail-modal-width" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{udSelectedTask.title}</h2>
              <button className="modal-close-btn" onClick={() => dispatch(setUdSelectedTaskId(null))}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-layout">
                <div className="detail-left">
                  <div className="detail-section">
                    <h3 className="detail-section-title">Description</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{udSelectedTask.description || 'No description.'}</p>
                  </div>
                  {udSelectedTask.subtasks && udSelectedTask.subtasks.length > 0 && (
                    <div className="detail-section">
                      <h3 className="detail-section-title">Checklist ({udSelectedTask.subtasks.filter(s => s.done).length}/{udSelectedTask.subtasks.length})</h3>
                      {udSelectedTask.subtasks.map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                          <CheckSquare size={16} style={{ color: s.done ? 'var(--success)' : 'var(--text-muted)' }} />
                          <span style={{ fontSize: '0.82rem', textDecoration: s.done ? 'line-through' : 'none', color: s.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>{s.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Dependencies in user task detail */}
                  {udSelectedTask.dependencies && udSelectedTask.dependencies.length > 0 && (
                    <div className="dep-section">
                      <div className="dep-section-title"><Link2 size={16} /> Dependencies</div>
                      {udSelectedTask.dependencies.map(depId => {
                        const depTask = udTasks.find(t => t.id === depId);
                        return depTask ? (
                          <div key={depId} className="dep-item">
                            <div className={`dep-item-status ${depTask.status}`} />
                            <span className="dep-item-title">{depTask.title}</span>
                            <span className="dep-item-badge" style={{ background: depTask.status === 'done' ? 'var(--success-glow)' : 'var(--warning-glow)', color: depTask.status === 'done' ? 'var(--success)' : 'var(--warning)' }}>{depTask.status}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Deliverables / Proof Section */}
                  <div className="proofs-section">
                    <div className="proofs-header">
                      <span className="proofs-title">
                        <Camera size={16} /> Proof & Deliverables
                      </span>
                    </div>
                    
                    <div className="proofs-grid">
                      {udSelectedTask.proofs && udSelectedTask.proofs.length > 0 ? (
                        udSelectedTask.proofs.map(p => (
                          <div key={p.id} className="proof-card" onClick={() => window.open(resolveAssetUrl(p.url), '_blank')} title={`Uploaded by ${p.uploadedBy}`}>
                            <img src={resolveAssetUrl(p.url)} alt={p.fileName} onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }} />
                            <div className="proof-card-fallback" style={{ display: 'none' }}>
                              <FileText size={24} style={{ color: 'var(--text-secondary)' }} />
                              <span className="proof-card-filename">{p.fileName}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', gridColumn: '1 / -1' }}>No proofs uploaded yet.</span>
                      )}
                    </div>

                    <div className="proof-upload-btn-wrapper">
                      <label className="proof-upload-label">
                        <Camera size={14} /> Upload Proof Image
                        <input
                          type="file"
                          className="proof-upload-input"
                          accept="image/*"
                          onChange={(e) => handleUploadProof(udSelectedTask.id, e)}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Comments / Discussion Section */}
                  <div className="comments-section" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <h4 className="detail-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <MessageSquare size={16} /> Discussion & Comments
                    </h4>
                    <div className="comments-list" style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(!udSelectedTask.comments || udSelectedTask.comments.length === 0) ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No comments posted yet.</span>
                      ) : (
                        udSelectedTask.comments.map(c => (
                          <div className="comment-item" key={c.id}>
                            <div className="comment-author-avatar" style={{ backgroundColor: getAvatarColor(c.author) }}>
                              {getInitials(c.author)}
                            </div>
                            <div className="comment-content">
                              <div className="comment-header">
                                <span className="comment-author">{c.author}</span>
                                <span className="comment-time">{c.timestamp}</span>
                              </div>
                              <p className="comment-text">{c.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="add-comment-wrapper" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Write a comment..."
                        value={udNewComment}
                        onChange={e => dispatch(setUdNewComment(e.target.value))}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(udSelectedTask.id)}
                        style={{ fontSize: '0.8rem', padding: '8px 12px', flex: 1 }}
                      />
                      <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={() => handleAddComment(udSelectedTask.id)}>
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
                <div className="detail-right">
                  <div className="detail-meta">
                    <div className="detail-meta-item">
                      <span className="detail-meta-label">Status</span>
                      <select className="form-control" value={udSelectedTask.status} onChange={(e) => handleUDStatusUpdate(udSelectedTask.id, e.target.value)} style={{ fontSize: '0.82rem' }}>
                        <option value="todo">To Do</option>
                        <option value="progress">In Progress</option>
                        <option value="review">In Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                    <div className="detail-meta-item">
                      <span className="detail-meta-label">Priority</span>
                      <div className="detail-meta-val">
                        <span className={`card-tag priority-${udSelectedTask.priority}`} style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{udSelectedTask.priority}</span>
                      </div>
                    </div>
                    <div className="detail-meta-item">
                      <span className="detail-meta-label">Due Date</span>
                      <div className="detail-meta-val">
                        <CalendarIcon size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontWeight: 500 }}>{formatDateFull(udSelectedTask.dueDate)}</span>
                      </div>
                    </div>
                    <div className="detail-meta-item">
                      <span className="detail-meta-label">Assigned Date</span>
                      <div className="detail-meta-val">
                        <CalendarIcon size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontWeight: 500 }}>{udSelectedTask.createdAt ? formatDateFull(udSelectedTask.createdAt) : 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="detail-meta-item">
                      <span className="detail-meta-label">Team</span>
                      <div className="detail-meta-val"><span style={{ fontWeight: 500 }}>{udSelectedTask.team}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
