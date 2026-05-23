import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  UserCog, 
  Users, 
  ToggleRight, 
  ToggleLeft, 
  UserPlus, 
  Edit3, 
  Key, 
  Trash2, 
  Lock,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Hash
} from 'lucide-react';
import { 
  saLoadRequest, 
  saSelectAccount, 
  saCreateAccountRequest, 
  saToggleStatusRequest, 
  saResetPasswordRequest 
} from '../../store/slices/auth.slice.js';
import { fetchAPI } from '../../api/api.service.js';
import { setView } from '../../store/slices/auth.slice.js';
import OtpLogsPanel from './OtpLogsPanel.jsx';
import QueriesPanel from './QueriesPanel.jsx';
import AuditLogsPanel from './AuditLogsPanel.jsx';

export default function SuperAdminDashboard() {
  const saAdmins = useSelector(state => state.auth.saAdmins);
  const saUsers = useSelector(state => state.auth.saUsers);
  const saStats = useSelector(state => state.auth.saStats);
  const saSelectedAccount = useSelector(state => state.auth.saSelectedAccount);
  const saTab = useSelector(state => state.auth.activeView);

  const dispatch = useDispatch();
  const [saShowModal, setSaShowModal] = useState(null); // 'create-admin' | 'edit-admin' | 'reset-password' | 'credentials' | null
  const [saShowPw, setSaShowPw] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    dispatch(saLoadRequest());
  }, [dispatch]);

  const getAvatarColor = (name = "") => {
    if (!name) return "#6b7280";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444"];
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name = "Unassigned") => {
    if (name === "Unassigned") return "?";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const handleCreateAdmin = (e) => {
    e.preventDefault();
    setModalError('');
    const fd = new FormData(e.target);
    dispatch(saCreateAccountRequest({
      type: 'admin',
      data: {
        name: fd.get('name').trim(),
        email: fd.get('email').trim(),
        username: fd.get('username').trim(),
        password: fd.get('password'),
        role: fd.get('role') || 'Product Manager',
        team: fd.get('team') || null,
        maxUsers: parseInt(fd.get('maxUsers')) || 25,
      },
      onSuccess: () => setSaShowModal(null),
      onFailure: (err) => setModalError(err)
    }));
  };

  const handleEditAdmin = (e) => {
    e.preventDefault();
    setModalError('');
    const fd = new FormData(e.target);
    
    fetchAPI(`/superadmin/admins/${saSelectedAccount.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: fd.get('name').trim(),
        email: fd.get('email').trim(),
        username: fd.get('username').trim(),
        role: fd.get('role'),
        team: fd.get('team') || null,
        maxUsers: parseInt(fd.get('maxUsers')) || 25,
      })
    })
    .then(() => {
      setSaShowModal(null);
      dispatch(saSelectAccount(null));
      dispatch(saLoadRequest());
    })
    .catch(err => setModalError(err.message));
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setModalError('');
    const fd = new FormData(e.target);
    dispatch(saResetPasswordRequest({
      id: saSelectedAccount.id,
      newPassword: fd.get('newPassword'),
      accountRole: saSelectedAccount.accountRole || 'admin',
      isSuperAdminView: true,
      onSuccess: () => {
        setSaShowModal(null);
        dispatch(saSelectAccount(null));
      },
      onFailure: (err) => setModalError(err)
    }));
  };

  const handleSetCredentials = (e) => {
    e.preventDefault();
    setModalError('');
    const fd = new FormData(e.target);
    dispatch(saResetPasswordRequest({
      id: saSelectedAccount.id,
      newPassword: fd.get('password'), // password is newPassword in non-superadmin view
      accountRole: saSelectedAccount.accountRole || 'user',
      isSuperAdminView: false,
      onSuccess: () => {
        setSaShowModal(null);
        dispatch(saSelectAccount(null));
        dispatch(saLoadRequest());
      },
      onFailure: (err) => setModalError(err)
    }));
  };

  const handleToggleStatus = (account) => {
    dispatch(saToggleStatusRequest({
      id: account.id,
      isSuperAdminView: true,
      accountRole: account.accountRole
    }));
  };

  const handleDeleteAdmin = (admin) => {
    if (!window.confirm(`Are you sure you want to delete admin "${admin.name}"? This cannot be undone.`)) return;
    fetchAPI(`/superadmin/admins/${admin.id}`, { method: 'DELETE' })
    .then(() => {
      dispatch(saLoadRequest());
    })
    .catch(err => alert(err.message));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="sa-page-header">
        <h1 className="sa-page-title">Admin Control Panel</h1>
        <p className="sa-page-subtitle">Manage administrators, users, and access control</p>
      </div>

      {/* Stats Grid */}
      <div className="sa-stats-grid">
        <div className="sa-stat-card admins">
          <div className="sa-stat-icon admins"><UserCog size={22} /></div>
          <div className="sa-stat-value">{saStats.totalAdmins}</div>
          <div className="sa-stat-label">Total Admins</div>
        </div>
        <div className="sa-stat-card users">
          <div className="sa-stat-icon users"><Users size={22} /></div>
          <div className="sa-stat-value">{saStats.totalUsers}</div>
          <div className="sa-stat-label">Total Users</div>
        </div>
        <div className="sa-stat-card active">
          <div className="sa-stat-icon active"><ToggleRight size={22} /></div>
          <div className="sa-stat-value">{saStats.activeAccounts}</div>
          <div className="sa-stat-label">Active Accounts</div>
        </div>
        <div className="sa-stat-card inactive">
          <div className="sa-stat-icon inactive"><ToggleLeft size={22} /></div>
          <div className="sa-stat-value">{saStats.inactiveAccounts}</div>
          <div className="sa-stat-label">Inactive Accounts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sa-tabs">
        <button className={`sa-tab ${saTab === 'admins' ? 'active' : ''}`} onClick={() => dispatch(setView('admins'))}>Admins</button>
        <button className={`sa-tab ${saTab === 'users' ? 'active' : ''}`} onClick={() => dispatch(setView('users'))}>Users</button>
        <button className={`sa-tab ${saTab === 'otp-logs' ? 'active' : ''}`} onClick={() => dispatch(setView('otp-logs'))}>OTP Logs</button>
        <button className={`sa-tab ${saTab === 'queries' ? 'active' : ''}`} onClick={() => dispatch(setView('queries'))}>Queries</button>
        <button className={`sa-tab ${saTab === 'audit-logs' ? 'active' : ''}`} onClick={() => dispatch(setView('audit-logs'))}>Audit Logs</button>
      </div>

      {saTab === 'otp-logs' && <OtpLogsPanel />}
      {saTab === 'queries' && <QueriesPanel />}
      {saTab === 'audit-logs' && <AuditLogsPanel />}

      {/* Admins Tab */}
      {saTab === 'admins' && (
        <div className="sa-table-card">
          <div className="sa-table-header">
            <span className="sa-table-title">Admin Accounts ({saAdmins.length})</span>
            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '8px 16px' }} onClick={() => { setSaShowModal('create-admin'); setModalError(''); setSaShowPw(false); }}>
              <UserPlus size={15} style={{ marginRight: '6px' }} /> Add Admin
            </button>
          </div>
          {saAdmins.length === 0 ? (
            <div className="sa-empty">
              <div className="sa-empty-icon"><UserCog size={26} /></div>
              <p>No admin accounts yet. Create one to get started.</p>
            </div>
          ) : (
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Team</th>
                  <th>Users</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {saAdmins.map(admin => {
                  const pct = admin.maxUsers ? (admin.managedUserCount / admin.maxUsers) * 100 : 0;
                  const limitClass = pct >= 80 ? 'high' : pct >= 50 ? 'medium' : 'low';
                  return (
                    <tr key={admin.id}>
                      <td>
                        <div className="sa-user-cell">
                          <div className="sa-user-avatar" style={{ backgroundColor: getAvatarColor(admin.name) }}>{getInitials(admin.name)}</div>
                          <div className="sa-user-info">
                            <span className="sa-user-name">{admin.name}</span>
                            <span className="sa-user-email">{admin.email}</span>
                          </div>
                        </div>
                      </td>
                      <td><code style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{admin.username}</code></td>
                      <td>{admin.role}</td>
                      <td>{admin.team || '—'}</td>
                      <td>
                        <div className="sa-max-users">
                          <span className="used">{admin.managedUserCount}</span>/{admin.maxUsers || '∞'}
                        </div>
                        <div className="sa-limit-bar">
                          <div className={`sa-limit-fill ${limitClass}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${admin.status}`}>
                          <span className="status-dot" />
                          {admin.status}
                        </span>
                      </td>
                      <td>
                        <div className="sa-actions">
                          <button className="sa-action-btn" title="Edit" onClick={() => { dispatch(saSelectAccount(admin)); setSaShowModal('edit-admin'); setModalError(''); }}>
                            <Edit3 size={14} />
                          </button>
                          <button className="sa-action-btn" title="Reset Password" onClick={() => { dispatch(saSelectAccount(admin)); setSaShowModal('reset-password'); setModalError(''); setSaShowPw(false); }}>
                            <Key size={14} />
                          </button>
                          <button className={`toggle-switch ${admin.status === 'active' ? 'active' : ''}`} title={admin.status === 'active' ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(admin)} />
                          <button className="sa-action-btn danger" title="Delete" onClick={() => handleDeleteAdmin(admin)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Users Tab */}
      {saTab === 'users' && (
        <div className="sa-table-card">
          <div className="sa-table-header">
            <span className="sa-table-title">All User Accounts ({saUsers.length})</span>
          </div>
          {saUsers.length === 0 ? (
            <div className="sa-empty">
              <div className="sa-empty-icon"><Users size={26} /></div>
              <p>No user accounts found.</p>
            </div>
          ) : (
            <table className="sa-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Team</th>
                  <th>Managed By</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {saUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="sa-user-cell">
                        <div className="sa-user-avatar" style={{ backgroundColor: getAvatarColor(u.name) }}>{getInitials(u.name)}</div>
                        <div className="sa-user-info">
                          <span className="sa-user-name">{u.name}</span>
                          <span className="sa-user-email">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td><code style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{u.username || '—'}</code></td>
                    <td>{u.role}</td>
                    <td>{u.team || '—'}</td>
                    <td style={{ fontSize: '0.78rem' }}>{u.managedByName || '—'}</td>
                    <td>
                      <span className={`status-badge status-${u.status}`}>
                        <span className="status-dot" />
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div className="sa-actions">
                        <button className="sa-action-btn" title="Set Credentials" onClick={() => { dispatch(saSelectAccount(u)); setSaShowModal('credentials'); setModalError(''); setSaShowPw(false); }}>
                          <Key size={14} />
                        </button>
                        <button className="sa-action-btn" title="Reset Password" onClick={() => { dispatch(saSelectAccount(u)); setSaShowModal('reset-password'); setModalError(''); setSaShowPw(false); }}>
                          <Lock size={14} />
                        </button>
                        <button className={`toggle-switch ${u.status === 'active' ? 'active' : ''}`} title={u.status === 'active' ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(u)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL: Create Admin */}
      {saShowModal === 'create-admin' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title"><UserPlus size={20} style={{ marginRight: '8px' }} /> Create Admin Account</h2>
              <button className="modal-close-btn" onClick={() => setSaShowModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateAdmin}>
              <div className="sa-modal-body">
                {modalError && <div className="profile-alert alert-danger"><AlertCircle size={16} />{modalError}</div>}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" name="name" className="form-control" required placeholder="John Doe" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" name="email" className="form-control" required placeholder="john@company.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input type="text" name="username" className="form-control" required placeholder="johndoe" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={saShowPw ? 'text' : 'password'} name="password" className="form-control" required placeholder="Strong password" style={{ paddingRight: '40px' }} />
                    <button type="button" onClick={() => setSaShowPw(!saShowPw)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      {saShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input type="text" name="role" className="form-control" defaultValue="Product Manager" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Users</label>
                    <input type="number" name="maxUsers" className="form-control" defaultValue="25" min="1" max="100" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Team (optional)</label>
                  <input type="text" name="team" className="form-control" placeholder="e.g. Product Management" />
                </div>
              </div>
              <div className="sa-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSaShowModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Admin */}
      {saShowModal === 'edit-admin' && saSelectedAccount && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title"><Edit3 size={20} style={{ marginRight: '8px' }} /> Edit Admin</h2>
              <button className="modal-close-btn" onClick={() => { setSaShowModal(null); dispatch(saSelectAccount(null)); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditAdmin}>
              <div className="sa-modal-body">
                {modalError && <div className="profile-alert alert-danger"><AlertCircle size={16} />{modalError}</div>}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" name="name" className="form-control" defaultValue={saSelectedAccount.name} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" name="email" className="form-control" defaultValue={saSelectedAccount.email} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input type="text" name="username" className="form-control" defaultValue={saSelectedAccount.username} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input type="text" name="role" className="form-control" defaultValue={saSelectedAccount.role} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Users</label>
                    <input type="number" name="maxUsers" className="form-control" defaultValue={saSelectedAccount.maxUsers || 25} min="1" max="100" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Team</label>
                  <input type="text" name="team" className="form-control" defaultValue={saSelectedAccount.team || ''} />
                </div>
              </div>
              <div className="sa-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setSaShowModal(null); dispatch(saSelectAccount(null)); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Password */}
      {saShowModal === 'reset-password' && saSelectedAccount && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title"><Key size={20} style={{ marginRight: '8px' }} /> Reset Password</h2>
              <button className="modal-close-btn" onClick={() => { setSaShowModal(null); dispatch(saSelectAccount(null)); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="sa-modal-body">
                {modalError && <div className="profile-alert alert-danger"><AlertCircle size={16} />{modalError}</div>}
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Set a new password for <strong style={{ color: 'var(--text-primary)' }}>{saSelectedAccount.name}</strong>
                </p>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={saShowPw ? 'text' : 'password'} name="newPassword" className="form-control" required placeholder="Enter new password" style={{ paddingRight: '40px' }} />
                    <button type="button" onClick={() => setSaShowPw(!saShowPw)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      {saShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="sa-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setSaShowModal(null); dispatch(saSelectAccount(null)); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Set Credentials */}
      {saShowModal === 'credentials' && saSelectedAccount && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title"><Hash size={20} style={{ marginRight: '8px' }} /> Set Credentials</h2>
              <button className="modal-close-btn" onClick={() => { setSaShowModal(null); dispatch(saSelectAccount(null)); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSetCredentials}>
              <div className="sa-modal-body">
                {modalError && <div className="profile-alert alert-danger"><AlertCircle size={16} />{modalError}</div>}
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Set login credentials for <strong style={{ color: 'var(--text-primary)' }}>{saSelectedAccount.name}</strong>
                </p>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input type="text" name="username" className="form-control" defaultValue={saSelectedAccount.username || ''} placeholder="Choose a username" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={saShowPw ? 'text' : 'password'} name="password" className="form-control" placeholder="New password" style={{ paddingRight: '40px' }} required />
                    <button type="button" onClick={() => setSaShowPw(!saShowPw)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      {saShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="sa-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setSaShowModal(null); dispatch(saSelectAccount(null)); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Credentials</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
