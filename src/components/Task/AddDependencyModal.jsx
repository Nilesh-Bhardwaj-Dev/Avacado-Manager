import { useSelector, useDispatch } from 'react-redux';
import { X, Search, Link2, Plus } from 'lucide-react';
import { setShowDepSearch, setDepSearchQuery, addDepRequest } from '../../store/slices/task.slice.js';

export default function AddDependencyModal() {
  const showDepSearch = useSelector(state => state.task.showDepSearch);
  const depSearchQuery = useSelector(state => state.task.depSearchQuery);
  const selectedTaskId = useSelector(state => state.task.selectedTaskId);
  const taskDeps = useSelector(state => state.task.taskDeps);
  const tasks = useSelector(state => state.task.tasks);
  
  const dispatch = useDispatch();

  if (!showDepSearch) return null;

  const handleAddDependency = (dependsOnId) => {
    dispatch(addDepRequest({
      taskId: selectedTaskId,
      dependsOnId
    }));
  };

  const filteredResults = tasks.filter(t => 
    t.id !== selectedTaskId && 
    (!taskDeps || !taskDeps.blockingTasks.some(b => b.id === t.id)) &&
    t.title.toLowerCase().includes(depSearchQuery.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={() => dispatch(setShowDepSearch(false))}>
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={18} /> Add Dependency
          </h2>
          <button className="modal-close-btn" onClick={() => dispatch(setShowDepSearch(false))}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ padding: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="dep-search-input"
              placeholder="Search tasks in workspace..."
              value={depSearchQuery}
              onChange={e => dispatch(setDepSearchQuery(e.target.value))}
              style={{ paddingLeft: '36px', marginBottom: 0 }}
              autoFocus
            />
          </div>
          <div className="dep-search-results">
            {filteredResults.map(t => (
              <div
                key={t.id}
                className="dep-search-item"
                onClick={() => handleAddDependency(t.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="dep-search-item-title">
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{t.title}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                    <span className={`badge-status status-${t.status}`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>{t.status.toUpperCase()}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.team}</span>
                  </div>
                </div>
                <Plus size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              </div>
            ))}
            {filteredResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No matching tasks found to add as dependency.
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => dispatch(setShowDepSearch(false))}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
