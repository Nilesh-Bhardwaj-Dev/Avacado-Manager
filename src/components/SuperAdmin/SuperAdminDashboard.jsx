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
  Hash,
  Shield,
  Building2,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';
import {
  saLoadRequest,
  saSelectAccount,
  saCreateAccountRequest,
  saToggleStatusRequest,
  saResetPasswordRequest,
} from '../../store/slices/auth.slice.js';
import { fetchAPI } from '../../api/api.service.js';
import { setView } from '../../store/slices/auth.slice.js';
import OtpLogsPanel from './OtpLogsPanel.jsx';
import QueriesPanel from './QueriesPanel.jsx';
import AuditLogsPanel from './AuditLogsPanel.jsx';

// All available permissions with labels and categories
const PERMISSION_GROUPS = [
  {
    group: 'Projects',
    items: [
      { key: 'create_project', name: 'Create Project' },
      { key: 'edit_project', name: 'Edit Project' },
      { key: 'delete_project', name: 'Delete Project' },
    ],
  },
  {
    group: 'Tasks',
    items: [
      { key: 'create_task', name: 'Create Task' },
      { key: 'edit_task', name: 'Edit Task' },
      { key: 'delete_task', name: 'Delete Task' },
      { key: 'assign_task', name: 'Assign Task' },
    ],
  },
  {
    group: 'Members & Roles',
    items: [
      { key: 'invite_user', name: 'Add / Invite Users' },
      { key: 'manage_roles', name: 'Manage Roles' },
      { key: 'manage_organization', name: 'Manage Organization' },
    ],
  },
  {
    group: 'Reports & Audit',
    items: [
      { key: 'view_reports', name: 'View Reports' },
      { key: 'export_reports', name: 'Export Reports' },
      { key: 'view_audit_logs', name: 'View Audit Logs' },
    ],
  },
  {
    group: 'Billing',
    items: [
      { key: 'manage_billing', name: 'Manage Billing' },
    ],
  },
];

const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.key));

const PRESET_ROLES = {
  'Full Access (Org Admin)': ALL_PERMISSION_KEYS,
  'Product Manager': [
    'create_project', 'edit_project', 'delete_project',
    'create_task', 'edit_task', 'delete_task', 'assign_task',
    'invite_user', 'view_reports', 'export_reports', 'manage_roles',
  ],
  'Team Lead': [
    'create_task', 'edit_task', 'delete_task', 'assign_task',
    'invite_user', 'view_reports',
  ],
  'Viewer Only': ['view_reports'],
  'Custom': null,
};

export default function SuperAdminDashboard() {
  const saAdmins = useSelector(state => state.auth.saAdmins);
  const saUsers = useSelector(state => state.auth.saUsers);
  const saStats = useSelector(state => state.auth.saStats);
  const saSelectedAccount = useSelector(state => state.auth.saSelectedAccount);
  const saTab = useSelector(state => state.auth.activeView);

  const dispatch = useDispatch();
  const [saShowModal, setSaShowModal] = useState(null);
  const [saShowPw, setSaShowPw] = useState(false);
  const [modalError, setModalError] = useState('');
  const [selectedPerms, setSelectedPerms] = useState(ALL_PERMISSION_KEYS);
  const [presetRole, setPresetRole] = useState('Full Access (Org Admin)');
  const [searchQuery, setSearchQuery] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgUsers, setOrgUsers] = useState([]);
  const [orgUsersLoading, setOrgUsersLoading] = useState(false);

  useEffect(() => {
    dispatch(saLoadRequest());
  }, [dispatch]);

  const loadOrganizations = () => {
    setOrgLoading(true);
    setOrgError('');
    fetchAPI('/superadmin/organizations')
      .then(data => { setOrganizations(data); setOrgLoading(false); })
      .catch(err => { setOrgError(err.message); setOrgLoading(false); });
  };

  useEffect(() => {
    if (saTab === 'organizations') loadOrganizations();
  }, [saTab]);

  const handleToggleOrgStatus = (org) => {
    fetchAPI(`/superadmin/organizations/${org.id}/status`, { method: 'PUT' })
      .then(res => setOrganizations(prev => prev.map(o => o.id === org.id ? { ...o, status: res.status } : o)))
      .catch(err => alert(err.message));
  };

  const loadOrgUsers = (orgId) => {
    setOrgUsersLoading(true);
    fetchAPI(`/superadmin/organizations/${orgId}/users`)
      .then(data => { setOrgUsers(data); setOrgUsersLoading(false); })
      .catch(err => { alert(err.message); setOrgUsersLoading(false); });
  };

  const handleToggleOrgUserStatus = (u) => {
    fetchAPI(`/superadmin/users/${u.id}/status`, { method: 'PUT' })
      .then(res => {
        setOrgUsers(prev => prev.map(user => user.id === u.id ? { ...user, status: res.status } : user));
        dispatch(saLoadRequest());
      })
      .catch(err => alert(err.message));
  };

  // Permission helpers
  const applyPreset = (preset) => {
    setPresetRole(preset);
    if (preset !== 'Custom' && PRESET_ROLES[preset]) {
      setSelectedPerms(PRESET_ROLES[preset]);
    }
  };

  const togglePerm = (key) => {
    const next = selectedPerms.includes(key)
      ? selectedPerms.filter(k => k !== key)
      : [...selectedPerms, key];
    setSelectedPerms(next);
    // Check if matches a preset
    const matchPreset = Object.entries(PRESET_ROLES).find(([, perms]) =>
      perms && perms.length === next.length && perms.every(p => next.includes(p))
    );
    setPresetRole(matchPreset ? matchPreset[0] : 'Custom');
  };

  const toggleGroupPerms = (items) => {
    const groupKeys = items.map(i => i.key);
    const allChecked = groupKeys.every(k => selectedPerms.includes(k));
    const next = allChecked
      ? selectedPerms.filter(k => !groupKeys.includes(k))
      : [...new Set([...selectedPerms, ...groupKeys])];
    setSelectedPerms(next);
    setPresetRole('Custom');
  };

  const filteredAdmins = saAdmins.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (admin.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = saUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.organizationName && u.organizationName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (org.ownerName && org.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getAvatarColor = (name = '') => {
    if (!name) return '#6b7280';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name = 'Unassigned') => {
    if (name === 'Unassigned') return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const openCreateModal = () => {
    setSaShowModal('create-admin');
    setModalError('');
    setSaShowPw(false);
    setSelectedPerms(ALL_PERMISSION_KEYS);
    setPresetRole('Full Access (Org Admin)');
  };

  const openEditModal = (admin) => {
    dispatch(saSelectAccount(admin));
    setSaShowModal('edit-admin');
    setModalError('');
    setSelectedPerms(admin.permissions && admin.permissions.length ? admin.permissions : ALL_PERMISSION_KEYS);
    const matchPreset = Object.entries(PRESET_ROLES).find(([, perms]) =>
      perms && perms.length === (admin.permissions || []).length &&
      perms.every(p => (admin.permissions || []).includes(p))
    );
    setPresetRole(matchPreset ? matchPreset[0] : 'Custom');
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
        organizationName: fd.get('organizationName').trim(),
        maxUsers: parseInt(fd.get('maxUsers')) || 25,
        permissions: selectedPerms,
      },
      onSuccess: () => { setSaShowModal(null); loadOrganizations(); },
      onFailure: (err) => setModalError(err),
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
        maxUsers: parseInt(fd.get('maxUsers')) || 25,
        permissions: selectedPerms,
      }),
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
        if (selectedOrg) loadOrgUsers(selectedOrg.id);
      },
      onFailure: (err) => setModalError(err),
    }));
  };

  const handleSetCredentials = (e) => {
    e.preventDefault();
    setModalError('');
    const fd = new FormData(e.target);
    dispatch(saResetPasswordRequest({
      id: saSelectedAccount.id,
      newPassword: fd.get('password'),
      accountRole: saSelectedAccount.accountRole || 'user',
      isSuperAdminView: false,
      onSuccess: () => {
        setSaShowModal(null);
        dispatch(saSelectAccount(null));
        dispatch(saLoadRequest());
        if (selectedOrg) loadOrgUsers(selectedOrg.id);
      },
      onFailure: (err) => setModalError(err),
    }));
  };

  const handleToggleStatus = (account) => {
    dispatch(saToggleStatusRequest({
      id: account.id,
      isSuperAdminView: true,
      accountRole: account.accountRole,
    }));
  };

  const handleDeleteAdmin = (admin) => {
    if (!window.confirm(`Are you sure you want to delete admin "${admin.name}"? This cannot be undone.`)) return;
    fetchAPI(`/superadmin/admins/${admin.id}`, { method: 'DELETE' })
      .then(() => { dispatch(saLoadRequest()); loadOrganizations(); })
      .catch(err => alert(err.message));
  };

  // ── Permission Grid Component ──────────────────────────────────────────────
  const renderPermissionGrid = () => (
    <div>
      {/* Preset Role Selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {Object.keys(PRESET_ROLES).map(preset => (
          <button
            key={preset}
            type="button"
            onClick={() => applyPreset(preset)}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 600,
              border: `1px solid ${presetRole === preset ? 'var(--primary)' : 'var(--border-color)'}`,
              background: presetRole === preset ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: presetRole === preset ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Select All / Clear All */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <button type="button" onClick={() => { setSelectedPerms(ALL_PERMISSION_KEYS); setPresetRole('Full Access (Org Admin)'); }}
          style={{ fontSize: '0.72rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ✓ Select All
        </button>
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <button type="button" onClick={() => { setSelectedPerms([]); setPresetRole('Custom'); }}
          style={{ fontSize: '0.72rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ✗ Clear All
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {selectedPerms.length} / {ALL_PERMISSION_KEYS.length} selected
        </span>
      </div>

      {/* Permission Groups */}
      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        overflow: 'hidden',
        maxHeight: '260px',
        overflowY: 'auto',
      }}>
        {PERMISSION_GROUPS.map((group, gi) => {
          const groupKeys = group.items.map(i => i.key);
          const allChecked = groupKeys.every(k => selectedPerms.includes(k));
          const someChecked = groupKeys.some(k => selectedPerms.includes(k));
          return (
            <div key={gi} style={{ borderBottom: gi < PERMISSION_GROUPS.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              {/* Group header */}
              <label
                onClick={() => toggleGroupPerms(group.items)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  userSelect: 'none',
                }}
              >
                {allChecked ? (
                  <CheckSquare size={14} style={{ color: 'var(--primary)' }} />
                ) : someChecked ? (
                  <CheckSquare size={14} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                ) : (
                  <Square size={14} style={{ color: 'var(--text-muted)' }} />
                )}
                {group.group}
              </label>

              {/* Group items */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                {group.items.map(item => {
                  const checked = selectedPerms.includes(item.key);
                  return (
                    <label
                      key={item.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '7px 12px 7px 28px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                        background: checked ? 'rgba(99,102,241,0.05)' : 'transparent',
                        transition: 'background 0.15s',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePerm(item.key)}
                        style={{ accentColor: 'var(--primary)', width: '13px', height: '13px' }}
                      />
                      {item.name}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="sa-page-header">
        <h1 className="sa-page-title">Super Admin Control Panel</h1>
        <p className="sa-page-subtitle">Create organizations, manage admins, and control access permissions</p>
      </div>

      {/* Stats Grid */}
      <div className="sa-stats-grid">
        <div className="sa-stat-card admins">
          <div className="sa-stat-icon admins"><UserCog size={22} /></div>
          <div className="sa-stat-value">{saStats.totalAdmins}</div>
          <div className="sa-stat-label">Org Admins</div>
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
          <div className="sa-stat-label">Inactive</div>
        </div>
        {saStats.totalOrgs !== undefined && (
          <div className="sa-stat-card" style={{ borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.06)' }}>
            <div className="sa-stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}><Building2 size={22} /></div>
            <div className="sa-stat-value">{saStats.totalOrgs}</div>
            <div className="sa-stat-label">Organizations</div>
          </div>
        )}
      </div>

      {/* Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div className="sa-tabs" style={{ marginBottom: 0 }}>
          <button className={`sa-tab ${saTab === 'admins' ? 'active' : ''}`} onClick={() => dispatch(setView('admins'))}>Org Admins</button>
          <button className={`sa-tab ${saTab === 'organizations' ? 'active' : ''}`} onClick={() => dispatch(setView('organizations'))}>Organizations</button>
          <button className={`sa-tab ${saTab === 'users' ? 'active' : ''}`} onClick={() => dispatch(setView('users'))}>All Users</button>
          <button className={`sa-tab ${saTab === 'otp-logs' ? 'active' : ''}`} onClick={() => dispatch(setView('otp-logs'))}>OTP Logs</button>
          <button className={`sa-tab ${saTab === 'queries' ? 'active' : ''}`} onClick={() => dispatch(setView('queries'))}>Queries</button>
          <button className={`sa-tab ${saTab === 'audit-logs' ? 'active' : ''}`} onClick={() => dispatch(setView('audit-logs'))}>Audit Logs</button>
        </div>
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            className="form-control"
            placeholder={`Search ${saTab}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', borderRadius: '10px' }}
          />
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {saTab === 'otp-logs' && <OtpLogsPanel />}
      {saTab === 'queries' && <QueriesPanel />}
      {saTab === 'audit-logs' && <AuditLogsPanel />}

      {/* ── Admins Tab ───────────────────────────────────────────────── */}
      {saTab === 'admins' && (
        <div className="sa-table-card">
          <div className="sa-table-header">
            <span className="sa-table-title">Organization Admins ({filteredAdmins.length})</span>
            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '8px 16px' }} onClick={openCreateModal}>
              <UserPlus size={15} style={{ marginRight: '6px' }} /> Create Org Admin
            </button>
          </div>
          {filteredAdmins.length === 0 ? (
            <div className="sa-empty">
              <div className="sa-empty-icon"><UserCog size={26} /></div>
              <p>No org admin accounts found. Create one to get started.</p>
            </div>
          ) : (
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Username</th>
                  <th>Organization</th>
                  <th>Members</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map(admin => {
                  const pct = admin.maxUsers ? (admin.managedUserCount / admin.maxUsers) * 100 : 0;
                  const limitClass = pct >= 80 ? 'high' : pct >= 50 ? 'medium' : 'low';
                  const permCount = admin.permissions ? admin.permissions.length : 0;
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
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          {admin.organizationName ? (
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{admin.organizationName}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="sa-max-users">
                          <span className="used">{admin.managedUserCount}</span>/{admin.maxUsers || '∞'}
                        </div>
                        <div className="sa-limit-bar">
                          <div className={`sa-limit-fill ${limitClass}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
                            background: permCount === ALL_PERMISSION_KEYS.length ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.1)',
                            color: permCount === ALL_PERMISSION_KEYS.length ? '#10b981' : 'var(--primary)',
                            border: `1px solid ${permCount === ALL_PERMISSION_KEYS.length ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`,
                          }}>
                            <Shield size={10} />
                            {permCount}/{ALL_PERMISSION_KEYS.length}
                          </span>
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
                          <button className="sa-action-btn" title="Edit & Permissions" onClick={() => openEditModal(admin)}>
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

      {/* ── Organizations Tab ────────────────────────────────────────── */}
      {saTab === 'organizations' && (
        <div className="sa-table-card">
          <div className="sa-table-header">
            <span className="sa-table-title">Organizations ({filteredOrgs.length})</span>
            <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }} onClick={loadOrganizations}>
              <RefreshCw size={14} style={{ marginRight: '4px' }} /> Refresh
            </button>
          </div>
          {orgLoading ? (
            <div className="sa-empty"><p>Loading organizations...</p></div>
          ) : orgError ? (
            <div className="sa-empty"><p style={{ color: 'var(--danger)' }}>{orgError}</p></div>
          ) : filteredOrgs.length === 0 ? (
            <div className="sa-empty">
              <div className="sa-empty-icon"><Building2 size={26} /></div>
              <p>No organizations yet. Create an Org Admin to get started.</p>
            </div>
          ) : (
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Admin (Owner)</th>
                  <th>Members</th>
                  <th>Projects</th>
                  <th>Member Limit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map(org => (
                  <tr key={org.id}>
                    <td>
                      <div className="sa-user-cell">
                        <div className="sa-user-avatar" style={{ backgroundColor: getAvatarColor(org.name) }}>{getInitials(org.name)}</div>
                        <div className="sa-user-info">
                          <span className="sa-user-name">{org.name}</span>
                          <span className="sa-user-email" style={{ fontSize: '0.7rem' }}>{org.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 500 }}>{org.ownerName || '—'}</div>
                        {org.ownerEmail && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{org.ownerEmail}</div>}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{org.userCount}</td>
                    <td>{org.projectCount}</td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {org.maxUsers ? `Max ${org.maxUsers}` : 'Unlimited'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${org.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                        <span className="status-dot" />
                        {org.status}
                      </span>
                    </td>
                    <td>
                      <div className="sa-actions">
                        <button className="btn btn-secondary btn-sm" style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                          onClick={() => { setSelectedOrg(org); loadOrgUsers(org.id); }}>
                          View Members
                        </button>
                        <button className={`toggle-switch ${org.status === 'active' ? 'active' : ''}`}
                          title={org.status === 'active' ? 'Suspend' : 'Activate'}
                          onClick={() => handleToggleOrgStatus(org)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Users Tab ────────────────────────────────────────────────── */}
      {saTab === 'users' && (
        <div className="sa-table-card">
          <div className="sa-table-header">
            <span className="sa-table-title">All User Accounts ({filteredUsers.length})</span>
          </div>
          {filteredUsers.length === 0 ? (
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
                  <th>Organization</th>
                  <th>System Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
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
                    <td style={{ fontSize: '0.82rem' }}>{u.role}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{u.organizationName || '—'}</td>
                    <td>
                      {u.systemRole ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                          {u.systemRole}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
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

      {/* ── MODAL: Create Org Admin ───────────────────────────────────── */}
      {saShowModal === 'create-admin' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2 className="modal-title"><UserPlus size={20} style={{ marginRight: '8px' }} /> Create Organization Admin</h2>
              <button className="modal-close-btn" onClick={() => setSaShowModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateAdmin}>
              <div className="sa-modal-body">
                {modalError && <div className="profile-alert alert-danger"><AlertCircle size={16} />{modalError}</div>}

                {/* Account Info */}
                <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
                    Account Information
                  </p>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" name="name" className="form-control" required placeholder="e.g. John Smith" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" name="email" className="form-control" required placeholder="john@company.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <input type="text" name="username" className="form-control" required placeholder="johnsmith" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={saShowPw ? 'text' : 'password'} name="password" className="form-control" required placeholder="Any password (no restrictions)" style={{ paddingRight: '40px' }} />
                      <button type="button" onClick={() => setSaShowPw(!saShowPw)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        {saShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Organization Info */}
                <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
                    Organization
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Organization Name</label>
                      <input type="text" name="organizationName" className="form-control" placeholder="e.g. Acme Corp" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Members Allowed</label>
                      <input type="number" name="maxUsers" className="form-control" defaultValue="25" min="1" max="500" />
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
                    Access Permissions <span style={{ color: 'var(--primary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— what this admin can do</span>
                  </p>
                  {renderPermissionGrid()}
                </div>
              </div>
              <div className="sa-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSaShowModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <UserPlus size={15} style={{ marginRight: '6px' }} /> Create Org Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Admin ─────────────────────────────────────────── */}
      {saShowModal === 'edit-admin' && saSelectedAccount && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2 className="modal-title"><Edit3 size={20} style={{ marginRight: '8px' }} /> Edit Admin — {saSelectedAccount.name}</h2>
              <button className="modal-close-btn" onClick={() => { setSaShowModal(null); dispatch(saSelectAccount(null)); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditAdmin}>
              <div className="sa-modal-body">
                {modalError && <div className="profile-alert alert-danger"><AlertCircle size={16} />{modalError}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" name="name" className="form-control" defaultValue={saSelectedAccount.name} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Members</label>
                    <input type="number" name="maxUsers" className="form-control" defaultValue={saSelectedAccount.maxUsers || 25} min="1" max="500" />
                  </div>
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

                {saSelectedAccount.organizationName && (
                  <div style={{ padding: '8px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <Building2 size={13} style={{ marginRight: '6px', color: 'var(--primary)' }} />
                    Organization: <strong style={{ color: 'var(--text-primary)' }}>{saSelectedAccount.organizationName}</strong>
                  </div>
                )}

                <div>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
                    Access Permissions
                  </p>
                  {renderPermissionGrid()}
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

      {/* ── MODAL: Reset Password ─────────────────────────────────────── */}
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
                  Set a new password for <strong style={{ color: 'var(--text-primary)' }}>{saSelectedAccount.name}</strong>.
                  SuperAdmin can set any password without restrictions.
                </p>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={saShowPw ? 'text' : 'password'} name="newPassword" className="form-control" required placeholder="Any password" style={{ paddingRight: '40px' }} />
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

      {/* ── MODAL: Set Credentials ────────────────────────────────────── */}
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

      {/* ── MODAL: Org Users ─────────────────────────────────────────── */}
      {selectedOrg && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '860px', width: '95%' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Building2 size={20} style={{ marginRight: '8px' }} />
                {selectedOrg.name} — Members ({orgUsers.length})
              </h2>
              <button className="modal-close-btn" onClick={() => { setSelectedOrg(null); setOrgUsers([]); }}><X size={20} /></button>
            </div>
            <div className="sa-modal-body" style={{ padding: '20px 24px' }}>
              {/* Org stats bar */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Members', value: orgUsers.length },
                  { label: 'Member Limit', value: selectedOrg.maxUsers || 'Unlimited' },
                  { label: 'Projects', value: selectedOrg.projectCount },
                  { label: 'Status', value: selectedOrg.status },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '8px 16px', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px', border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                  }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{item.label}</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {orgUsersLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Loading members...</div>
              ) : orgUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>No members in this organization.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="sa-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Permissions</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgUsers.map(u => (
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
                          <td>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{u.role}</span>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{u.accountRole}</div>
                          </td>
                          <td>
                            {u.permissions && u.permissions.length > 0 ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                                {u.permissions.length} permissions
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>None</span>
                            )}
                          </td>
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
                              <button className={`toggle-switch ${u.status === 'active' ? 'active' : ''}`} title={u.status === 'active' ? 'Deactivate' : 'Activate'} onClick={() => handleToggleOrgUserStatus(u)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="sa-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setSelectedOrg(null); setOrgUsers([]); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
