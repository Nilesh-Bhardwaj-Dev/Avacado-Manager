import { useSelector, useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import { setEditingTask, createTaskRequest, updateTaskRequest } from '../../store/slices/task.slice.js';

export default function CreateTaskModal() {
  const editingTask = useSelector(state => state.task.editingTask);
  const teams = useSelector(state => state.team.teams);
  const members = useSelector(state => state.team.members);
  const dispatch = useDispatch();

  if (!editingTask) return null;

  const isEdit = !!(editingTask && editingTask.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title').trim();
    const description = formData.get('description').trim();
    const team = formData.get('team');
    const assigneeId = formData.get('assigneeId');
    const priority = formData.get('priority');
    const status = formData.get('status');
    const dueDate = formData.get('dueDate');
    const tagsRaw = formData.get('tags');
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(t => t !== "") : [];

    const payload = { title, description, team, assigneeId, priority, status, dueDate, tags };

    if (isEdit) {
      dispatch(updateTaskRequest({
        id: editingTask.id,
        data: payload,
        onSuccess: () => dispatch(setEditingTask(null))
      }));
    } else {
      dispatch(createTaskRequest({
        data: payload,
        onSuccess: () => dispatch(setEditingTask(null))
      }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Task Details' : 'Create New Task'}</h2>
          <button className="modal-close-btn" onClick={() => dispatch(setEditingTask(null))}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input
                type="text"
                name="title"
                className="form-control"
                defaultValue={isEdit ? editingTask.title : ''}
                placeholder="e.g., Conduct Security Audits"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-control"
                rows="3"
                defaultValue={isEdit ? editingTask.description : ''}
                placeholder="Describe task goals, files to modify..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Team Assignment</label>
                <select name="team" className="form-control" defaultValue={isEdit ? editingTask.team : ''} required>
                  <option value="" disabled>Select Team...</option>
                  {teams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select name="assigneeId" className="form-control" defaultValue={isEdit ? editingTask.assigneeId : ''} required>
                  <option value="" disabled>Select Assignee...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select name="priority" className="form-control" defaultValue={isEdit ? editingTask.priority : 'medium'} required>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-control" defaultValue={isEdit ? editingTask.status : 'todo'} required>
                  <option value="todo">To Do</option>
                  <option value="progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  className="form-control"
                  defaultValue={isEdit ? editingTask.dueDate : (editingTask.dueDate || '')}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  className="form-control"
                  defaultValue={isEdit && editingTask.tags ? editingTask.tags.join(', ') : ''}
                  placeholder="e.g., Security, Backend, QA"
                />
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => dispatch(setEditingTask(null))}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
