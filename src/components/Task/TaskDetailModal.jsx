import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Edit3, Trash2, Calendar as CalendarIcon, Link2, Unlink, Camera, FileText } from 'lucide-react';
import { selectTask, setEditingTask, deleteTaskRequest, loadDepsRequest, toggleSubtaskRequest, deleteSubtaskRequest, addSubtaskRequest, addCommentRequest, uploadProofRequest, removeDepRequest, setShowDepSearch } from '../../store/slices/task.slice.js';
import { resolveAssetUrl } from '../../utils/image.util.js';

export default function TaskDetailModal() {
  const selectedTaskId = useSelector(state => state.task.selectedTaskId);
  const tasks = useSelector(state => state.task.tasks);
  const members = useSelector(state => state.team.members);
  const taskDeps = useSelector(state => state.task.taskDeps);
  
  const dispatch = useDispatch();

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  // Trigger load of dependencies when this task is selected
  useEffect(() => {
    if (selectedTaskId) {
      dispatch(loadDepsRequest(selectedTaskId));
    }
  }, [selectedTaskId, dispatch]);

  if (!selectedTask) return null;

  const assignee = members.find(m => m.id === selectedTask.assigneeId);
  const totalSubtasksCount = selectedTask.subtasks ? selectedTask.subtasks.length : 0;
  const completedSubtasksCount = selectedTask.subtasks ? selectedTask.subtasks.filter(s => s.done).length : 0;

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

  const handleDeleteTask = () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      dispatch(deleteTaskRequest(selectedTask.id));
      dispatch(selectTask(null));
    }
  };

  const handleToggleSubtask = (subtaskId, currentlyDone) => {
    dispatch(toggleSubtaskRequest({
      taskId: selectedTask.id,
      subtaskId,
      done: !currentlyDone
    }));
  };

  const handleDeleteSubtask = (subtaskId) => {
    dispatch(deleteSubtaskRequest({
      taskId: selectedTask.id,
      subtaskId
    }));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    dispatch(addSubtaskRequest({
      taskId: selectedTask.id,
      title: newSubtaskTitle.trim(),
      onSuccess: () => setNewSubtaskTitle('')
    }));
  };

  const handleAddComment = () => {
    if (!newCommentContent.trim()) return;
    dispatch(addCommentRequest({
      taskId: selectedTask.id,
      content: newCommentContent.trim(),
      onSuccess: () => setNewCommentContent('')
    }));
  };

  const handleUploadProof = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      dispatch(uploadProofRequest({
        taskId: selectedTask.id,
        fileData: {
          fileName: file.name,
          fileType: file.type,
          base64: reader.result
        }
      }));
    };
  };

  const handleRemoveDependency = (depId) => {
    dispatch(removeDepRequest({
      taskId: selectedTask.id,
      depId
    }));
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && dispatch(selectTask(null))}>
      <div className="modal-content detail-modal-width" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className={`badge-status status-${selectedTask.status}`}>{selectedTask.status.toUpperCase()}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="modal-close-btn"
              title="Edit Task"
              onClick={() => {
                dispatch(setEditingTask(selectedTask));
                dispatch(selectTask(null));
              }}
            >
              <Edit3 size={18} />
            </button>
            <button
              className="modal-close-btn"
              title="Delete Task"
              style={{ color: 'var(--danger)' }}
              onClick={handleDeleteTask}
            >
              <Trash2 size={18} />
            </button>
            <button className="modal-close-btn" onClick={() => dispatch(selectTask(null))}>
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="modal-body" style={{ padding: '28px' }}>
          <div className="detail-layout">
            {/* Left Pane */}
            <div className="detail-left-pane">
              <div>
                <h2 className="view-title" style={{ fontSize: '1.45rem', lineHeight: 1.3 }}>{selectedTask.title}</h2>
                <div className="card-tags" style={{ marginTop: '10px' }}>
                  {selectedTask.tags && selectedTask.tags.map(tg => (
                    <span className="card-tag" style={{ backgroundColor: 'var(--surface-accent)', color: 'var(--text-secondary)' }} key={tg}>
                      {tg}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="detail-section-title">Description</h4>
                <p className="detail-desc">{selectedTask.description || "No description provided."}</p>
              </div>

              {/* Checklist */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 className="detail-section-title" style={{ marginBottom: 0 }}>Subtasks Checklist</h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {completedSubtasksCount}/{totalSubtasksCount}
                  </span>
                </div>

                <div className="subtasks-list">
                  {totalSubtasksCount === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No checklists created yet.</span>
                  ) : (
                    selectedTask.subtasks.map(s => (
                      <div className={`subtask-item ${s.done ? 'checked' : ''}`} key={s.id}>
                        <input
                          type="checkbox"
                          className="subtask-checkbox"
                          checked={s.done}
                          onChange={() => handleToggleSubtask(s.id, s.done)}
                        />
                        <span className="subtask-title">{s.title}</span>
                        <button
                          className="modal-close-btn"
                          style={{ width: '20px', height: '20px', color: 'var(--text-muted)' }}
                          onClick={() => handleDeleteSubtask(s.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="add-subtask-wrapper">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Add a new checklist item..."
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                  />
                  <button className="btn btn-secondary btn-sm" style={{ padding: '8px 14px' }} onClick={handleAddSubtask}>
                    Add
                  </button>
                </div>
              </div>

              {/* Proof / Deliverables */}
              <div className="proofs-section">
                <div className="proofs-header">
                  <span className="proofs-title">
                    <Camera size={16} /> Proof & Deliverables
                  </span>
                </div>
                
                <div className="proofs-grid">
                  {selectedTask.proofs && selectedTask.proofs.length > 0 ? (
                    selectedTask.proofs.map(p => (
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
                    <Camera size={14} /> Upload Deliverable / File
                    <input
                      type="file"
                      className="proof-upload-input"
                      onChange={handleUploadProof}
                    />
                  </label>
                </div>
              </div>

              {/* Comments Feed */}
              <div className="comments-section">
                <h4 className="detail-section-title">Discussion & Comments</h4>
                <div className="comments-list">
                  {!selectedTask.comments || selectedTask.comments.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No comments posted.</span>
                  ) : (
                    selectedTask.comments.map(c => (
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

                <div className="add-comment-wrapper">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Write a comment..."
                    value={newCommentContent}
                    onChange={e => setNewCommentContent(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                  />
                  <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={handleAddComment}>
                    Comment
                  </button>
                </div>
              </div>
            </div>

            {/* Right Pane */}
            <div className="detail-right-pane">
              <div className="detail-meta-item">
                <span className="detail-meta-label">Team</span>
                <div className="detail-meta-val">
                  <span className="team-badge">{selectedTask.team}</span>
                </div>
              </div>

              <div className="detail-meta-item">
                <span className="detail-meta-label">Assignee</span>
                <div className="detail-meta-val">
                  <div
                    className="assignee-avatar"
                    style={{ width: '28px', height: '28px', fontSize: '0.75rem', backgroundColor: getAvatarColor(assignee ? assignee.name : 'Unassigned') }}
                  >
                    {getInitials(assignee ? assignee.name : 'Unassigned')}
                  </div>
                  <span style={{ fontWeight: 500 }}>{assignee ? assignee.name : 'Unassigned'}</span>
                </div>
              </div>

              <div className="detail-meta-item">
                <span className="detail-meta-label">Priority</span>
                <div className="detail-meta-val">
                  <span className={`card-tag priority-${selectedTask.priority}`} style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    {selectedTask.priority}
                  </span>
                </div>
              </div>

              <div className="detail-meta-item">
                <span className="detail-meta-label">Due Date</span>
                <div className="detail-meta-val">
                  <CalendarIcon size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontWeight: 500 }}>{formatDateFull(selectedTask.dueDate)}</span>
                </div>
              </div>

              <div className="detail-meta-item">
                <span className="detail-meta-label">Assigned Date</span>
                <div className="detail-meta-val">
                  <CalendarIcon size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontWeight: 500 }}>{selectedTask.createdAt ? formatDateFull(selectedTask.createdAt) : 'Unknown'}</span>
                </div>
              </div>

              {/* DEPENDENCIES SECTION */}
              <div className="dep-section">
                <div className="dep-section-header">
                  <span className="dep-section-title">
                    <Link2 size={16} /> Dependencies
                  </span>
                  {taskDeps && taskDeps.totalDeps > 0 && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {taskDeps.progressPercent}% Done
                    </span>
                  )}
                </div>

                {taskDeps && taskDeps.totalDeps > 0 && (
                  <div className="dep-progress-bar">
                    <div className="dep-progress-fill" style={{ width: `${taskDeps.progressPercent}%` }} />
                  </div>
                )}

                {/* Blocking tasks list */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.3px' }}>
                    Blocks This Task ({taskDeps?.totalDeps || 0})
                  </div>
                  {(!taskDeps || taskDeps.blockingTasks.length === 0) ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>No dependencies.</div>
                  ) : (
                    taskDeps.blockingTasks.map(b => (
                      <div key={b.id} className="dep-item">
                        <div className={`dep-item-status ${b.status}`} />
                        <div className="dep-item-title">{b.title}</div>
                        <span className="dep-item-badge" style={{
                          background: b.status === 'done' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: b.status === 'done' ? '#34d399' : '#fbbf24'
                        }}>
                          {b.status}
                        </span>
                        <button
                          type="button"
                          className="dep-item-remove"
                          onClick={() => handleRemoveDependency(b.id)}
                          title="Remove dependency"
                        >
                          <Unlink size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Dependent tasks list */}
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.3px' }}>
                    Blocked By This Task ({taskDeps?.dependentTasks.length || 0})
                  </div>
                  {(!taskDeps || taskDeps.dependentTasks.length === 0) ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>No dependent tasks.</div>
                  ) : (
                    taskDeps.dependentTasks.map(d => (
                      <div key={d.id} className="dep-item">
                        <div className={`dep-item-status ${d.status}`} />
                        <div className="dep-item-title">{d.title}</div>
                        <span className="dep-item-badge" style={{
                          background: d.status === 'done' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: d.status === 'done' ? '#34d399' : '#fbbf24'
                        }}>
                          {d.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  className="dep-add-btn"
                  onClick={() => dispatch(setShowDepSearch(true))}
                >
                  <Link2 size={13} /> Add Dependency
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
