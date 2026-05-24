import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Trash2, Shield, X, Key } from 'lucide-react';
import {
  toggleMemberSelection,
  setSelectedMemberIds,
  setDeleteConfirmation,
  setShowMemberModal,
  createMemberRequest,
  deleteMembersRequest,
  toggleMemberStatusRequest,
  resetMemberPasswordRequest
} from '../../store/slices/team.slice.js';

export default function MemberManagement() {
  const members = useSelector(state => state.team.members);
  const teams = useSelector(state => state.team.teams);
  const selectedMemberIds = useSelector(state => state.team.selectedMemberIds);
  const showMemberModal = useSelector(state => state.team.showMemberModal);
  const deleteConfirmation = useSelector(state => state.team.deleteConfirmation);
  const tasks = useSelector(state => state.task.tasks);
  const user = useSelector(state => state.auth.user);
  const permissions = useSelector(state => state.context.permissions || []);
  const isOrgAdmin = permissions.includes('manage_organization') || user?.accountRole === 'superadmin';
  
  const dispatch = useDispatch();

  // Local state for credentials setup modal
  const [credModalMember, setCredModalMember] = useState(null);
  const [credUsername, setCredUsername] = useState('');
  const [credPassword, setCredPassword] = useState('');

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

  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name').trim();
    const email = formData.get('email').trim();
    const team = formData.get('team');
    const role = formData.get('role').trim();
    const roleKey = formData.get('roleKey');

    dispatch(createMemberRequest({
      data: { name, email, team, role, roleKey },
      onSuccess: () => dispatch(setShowMemberModal(false))
    }));
  };

  const handleRemoveMember = (member) => {
    dispatch(setDeleteConfirmation({
      show: true,
      memberIds: [member.id],
      names: [member.name]
    }));
  };

  const confirmRemoval = () => {
    dispatch(deleteMembersRequest({
      ids: deleteConfirmation.memberIds,
      onSuccess: () => {
        dispatch(setSelectedMemberIds([]));
        dispatch(setDeleteConfirmation({ show: false, memberIds: [], names: [] }));
      }
    }));
  };

  const handleCredSubmit = (e) => {
    e.preventDefault();
    if (!credModalMember) return;
    dispatch(resetMemberPasswordRequest({
      memberId: credModalMember.id,
      username: credUsername.trim(),
      password: credPassword.trim() || undefined,
      onSuccess: () => {
        setCredModalMember(null);
        setCredUsername('');
        setCredPassword('');
      }
    }));
  };

  return (
    <div className="members-list-card">
      <div className="members-header">
        <span className="members-title">Workspace Directory</span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {selectedMemberIds.length > 0 && (
            <button
              className="btn btn-primary btn-sm"
              style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                const selectedMembers = members.filter(m => selectedMemberIds.includes(m.id));
                dispatch(setDeleteConfirmation({
                  show: true,
                  memberIds: selectedMemberIds,
                  names: selectedMembers.map(m => m.name)
                }));
              }}
            >
              <Trash2 size={14} />
              Remove Selected ({selectedMemberIds.length})
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => dispatch(setShowMemberModal(true))}>
            <Plus size={16} style={{ marginRight: '4px' }} />
            Add Member
          </button>
        </div>
      </div>
      <table className="list-table">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>
              <input
                type="checkbox"
                style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--primary)' }}
                checked={members.length > 0 && selectedMemberIds.length === members.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    dispatch(setSelectedMemberIds(members.map(m => m.id)));
                  } else {
                    dispatch(setSelectedMemberIds([]));
                  }
                }}
              />
            </th>
            <th>Name</th>
            <th>Role</th>
            <th>Team</th>
            <th>Email</th>
            <th>Load (Tasks)</th>
            <th>Status</th>
            <th style={{ width: '180px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>
                No members in workspace. Add a member to get started.
              </td>
            </tr>
          ) : (
            members.map(member => {
              const activeLoad = tasks.filter(t => t.assigneeId === member.id && t.status !== 'done').length;

              return (
                <tr key={member.id} style={{ backgroundColor: selectedMemberIds.includes(member.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--primary)' }}
                      checked={selectedMemberIds.includes(member.id)}
                      onChange={() => dispatch(toggleMemberSelection(member.id))}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="assignee-avatar" style={{ backgroundColor: getAvatarColor(member.name), width: '28px', height: '28px', fontSize: '0.75rem' }}>
                        {getInitials(member.name)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{member.name}</span>
                        {member.username && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@{member.username}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{member.role}</td>
                  <td><span className="team-badge" style={{ fontSize: '0.75rem' }}>{member.team}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{member.email}</td>
                  <td style={{ fontWeight: 700 }}>{activeLoad} Active</td>
                  <td>
                    <span className={`status-badge status-${member.status || 'active'}`}>
                      <span className="status-dot" />
                      {member.status || 'active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => {
                          setCredModalMember(member);
                          setCredUsername(member.username || '');
                        }}
                        title="Set Login Credentials"
                      >
                        <Key size={12} />
                      </button>
                      <button
                        className={`toggle-switch ${member.status === 'active' || !member.status ? 'active' : ''}`}
                        onClick={() => dispatch(toggleMemberStatusRequest(member.id))}
                        title={member.status === 'active' || !member.status ? 'Deactivate Member' : 'Activate Member'}
                      />
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRemoveMember(member)}
                        style={{ padding: '4px 8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', fontSize: '0.75rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* MODAL: ADD TEAM MEMBER */}
      {showMemberModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add Workspace Member</h2>
              <button className="modal-close-btn" onClick={() => dispatch(setShowMemberModal(false))}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddMemberSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="e.g., Alex Carter"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="e.g., alex@pulse.io"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Team Assignment</label>
                    <select name="team" className="form-control" required>
                      <option value="" disabled>Select Team...</option>
                      {teams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Job Title</label>
                    <input
                      type="text"
                      name="role"
                      className="form-control"
                      placeholder="e.g., QA Specialist"
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">System Role (Permissions)</label>
                  <select name="roleKey" className="form-control" required defaultValue="developer">
                    {isOrgAdmin && (
                      <>
                        <option value="org_admin">Organization Admin (Full Access)</option>
                        <option value="project_manager">Product Manager</option>
                      </>
                    )}
                    <option value="team_lead">Team Lead</option>
                    <option value="developer">Developer</option>
                    <option value="qa_engineer">QA Engineer</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}>
                  <Shield size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>Credentials Auto-Generated</strong>
                    A login account will be automatically created. The default username is the first name (lowercase) and the password is <code style={{ color: 'var(--primary)' }}>user</code>.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => dispatch(setShowMemberModal(false))}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REMOVE MEMBER(S) CONFIRMATION */}
      {deleteConfirmation.show && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--danger)' }}>Confirm Member Removal</h2>
              <button className="modal-close-btn" onClick={() => dispatch(setDeleteConfirmation({ show: false, memberIds: [], names: [] }))}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                Are you sure you want to remove the following member(s) from the workspace?
              </p>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                margin: '0 0 12px 0',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {deleteConfirmation.names.map((name, idx) => (
                  <div key={idx} style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--danger)', flexShrink: 0 }}></span>
                    {name}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'var(--danger-glow)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 12px' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 700, flexShrink: 0 }}>⚠ Warning:</span>
                <span>This will unassign all of their active tasks. This action cannot be undone.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => dispatch(setDeleteConfirmation({ show: false, memberIds: [], names: [] }))}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                onClick={confirmRemoval}
              >
                <Trash2 size={14} /> Remove Member(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SET CREDENTIALS FOR MEMBER */}
      {credModalMember && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title"><Key size={20} style={{ marginRight: '8px' }} /> Set Member Credentials</h2>
              <button className="modal-close-btn" onClick={() => setCredModalMember(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCredSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Configure login access for member: <strong style={{ color: 'var(--text-primary)' }}>{credModalMember.name}</strong>
                </p>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={credUsername}
                    onChange={e => setCredUsername(e.target.value)}
                    placeholder="Choose username"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password (leave empty to keep unchanged)</label>
                  <input
                    type="password"
                    className="form-control"
                    value={credPassword}
                    onChange={e => setCredPassword(e.target.value)}
                    placeholder="Choose new password"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCredModalMember(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Credentials</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
