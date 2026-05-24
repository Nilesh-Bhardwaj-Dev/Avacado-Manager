import { useDispatch, useSelector } from 'react-redux';
import {
  setCurrentOrganization,
  setCurrentProject,
  loadOrganizationsRequest,
  loadProjectsRequest,
} from '../../store/slices/context.slice.js';
import { useEffect } from 'react';

export default function OrgProjectSwitcher() {
  const dispatch = useDispatch();
  const { organizations, projects, currentOrganizationId, currentProjectId } = useSelector(
    (s) => s.context
  );
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    if (user && user.accountRole !== 'superadmin') {
      dispatch(loadOrganizationsRequest());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (currentOrganizationId) {
      dispatch(loadProjectsRequest());
    }
  }, [currentOrganizationId, dispatch]);

  if (!user || user.accountRole === 'superadmin') return null;
  if (organizations.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 24px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        fontSize: '0.85rem',
      }}
    >
      <label style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Organization</label>
      <select
        style={{
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--surface)',
          color: 'var(--text-primary)',
          padding: '6px 12px',
          outline: 'none',
          cursor: 'pointer',
        }}
        value={currentOrganizationId || ''}
        onChange={(e) => dispatch(setCurrentOrganization(e.target.value))}
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
            {org.name}
          </option>
        ))}
      </select>

      {projects.length > 0 && (
        <>
          <label style={{ color: 'var(--text-secondary)', fontWeight: 600, marginLeft: '12px' }}>Project</label>
          <select
            style={{
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              outline: 'none',
              cursor: 'pointer',
            }}
            value={currentProjectId || ''}
            onChange={(e) => dispatch(setCurrentProject(e.target.value))}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
