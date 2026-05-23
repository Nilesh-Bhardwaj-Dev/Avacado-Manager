import { useSelector, useDispatch } from 'react-redux';
import { Plus, Users, Trash2, X } from 'lucide-react';
import {
  setShowTeamModal,
  setDeleteTeamConfirmation,
  setTeamDeleteError,
  createTeamRequest,
  deleteTeamRequest
} from '../../store/slices/team.slice.js';

export default function TeamManagement() {
  const teams = useSelector(state => state.team.teams);
  const members = useSelector(state => state.team.members);
  const tasks = useSelector(state => state.task.tasks);
  const showTeamModal = useSelector(state => state.team.showTeamModal);
  const deleteTeamConfirmation = useSelector(state => state.team.deleteTeamConfirmation);
  const teamDeleteError = useSelector(state => state.team.teamDeleteError);

  const dispatch = useDispatch();

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

  const handleCreateTeamSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name').trim();
    if (!name) return;

    dispatch(createTeamRequest({
      name,
      onSuccess: () => dispatch(setShowTeamModal(false))
    }));
  };

  const handleDeleteTeam = (teamName) => {
    dispatch(setTeamDeleteError(''));
    dispatch(setDeleteTeamConfirmation({ show: true, teamName }));
  };

  const confirmDeleteTeam = () => {
    dispatch(deleteTeamRequest({
      teamName: deleteTeamConfirmation.teamName,
      onSuccess: () => {
        dispatch(setDeleteTeamConfirmation({ show: false, teamName: '' }));
        dispatch(setTeamDeleteError(''));
      }
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <div>
          <h1 className="view-title">Team Management</h1>
          <p className="view-subtitle">Manage organization structures, workloads, and staff directories.</p>
        </div>
        <button className="btn btn-primary" onClick={() => dispatch(setShowTeamModal(true))}>
          <Plus size={18} style={{ marginRight: '6px' }} />
          Create Team
        </button>
      </div>

      {/* Teams Cards Grid */}
      <div className="teams-grid">
        {teams.map((teamName, idx) => {
          const teamTasks = tasks.filter(t => t.team === teamName);
          const teamDone = teamTasks.filter(t => t.status === 'done').length;
          const teamActive = teamTasks.filter(t => t.status !== 'done').length;
          const teamMembers = members.filter(m => m.team === teamName);
          const completionPct = teamTasks.length > 0 ? Math.round((teamDone / teamTasks.length) * 100) : 0;
          const teamColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#14b8a6'];
          const accentColor = teamColors[idx % teamColors.length];

          return (
            <div className="team-card" key={teamName} style={{ borderTop: `3px solid ${accentColor}` }}>
              <div className="team-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '9px',
                    backgroundColor: `${accentColor}22`,
                    border: `1px solid ${accentColor}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Users size={18} style={{ color: accentColor }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, wordBreak: 'break-word', lineHeight: 1.3, color: 'var(--text-primary)' }}>{teamName}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>
                <button
                  className="team-delete-btn"
                  onClick={() => handleDeleteTeam(teamName)}
                  title={`Delete ${teamName}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completion</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: accentColor }}>{completionPct}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${completionPct}%`,
                    backgroundColor: accentColor,
                    borderRadius: '3px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>

              <div className="team-stat-grid">
                <div className="team-stat-item">
                  <span className="team-stat-label">Active Tasks</span>
                  <div className="team-stat-val" style={{ color: accentColor }}>{teamActive}</div>
                </div>
                <div className="team-stat-item">
                  <span className="team-stat-label">Completed</span>
                  <div className="team-stat-val" style={{ color: 'var(--success)' }}>{teamDone}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Staff</span>
                <div className="team-members-avatars">
                  {teamMembers.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No members yet</span>
                  ) : (
                    teamMembers.slice(0, 5).map(m => (
                      <div
                        className="assignee-avatar"
                        style={{ backgroundColor: getAvatarColor(m.name), border: `2px solid var(--bg-secondary)` }}
                        title={`${m.name} — ${m.role}`}
                        key={m.id}
                      >
                        {getInitials(m.name)}
                      </div>
                    ))
                  )}
                  {teamMembers.length > 5 && (
                    <div className="assignee-avatar" style={{ backgroundColor: 'var(--surface-accent)', border: '2px solid var(--bg-secondary)', fontSize: '0.6rem' }}>
                      +{teamMembers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: CREATE NEW TEAM */}
      {showTeamModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create New Team</h2>
              <button className="modal-close-btn" onClick={() => dispatch(setShowTeamModal(false))}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTeamSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Team Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="e.g., DevOps Engineering"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => dispatch(setShowTeamModal(false))}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE TEAM CONFIRMATION */}
      {deleteTeamConfirmation.show && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={18} /> Delete Team
              </h2>
              <button className="modal-close-btn" onClick={() => { dispatch(setDeleteTeamConfirmation({ show: false, teamName: '' })); dispatch(setTeamDeleteError('')); }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '14px' }}>
                You are about to permanently delete the team:
              </p>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Users size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{deleteTeamConfirmation.teamName}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--danger-glow)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 700, flexShrink: 0 }}>⚠ Note:</span>
                <span>Teams with assigned members cannot be deleted. Remove or reassign all members first. Tasks belonging to this team will be unassigned.</span>
              </div>
              {teamDeleteError && (
                <div style={{
                  marginTop: '12px',
                  background: 'var(--danger-glow)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  color: 'var(--danger)',
                  fontWeight: 600
                }}>
                  {teamDeleteError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { dispatch(setDeleteTeamConfirmation({ show: false, teamName: '' })); dispatch(setTeamDeleteError('')); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                onClick={confirmDeleteTeam}
              >
                <Trash2 size={14} /> Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
