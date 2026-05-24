import { createSlice } from '@reduxjs/toolkit';

const storedOrg = localStorage.getItem('currentOrganizationId');
const storedProject = localStorage.getItem('currentProjectId');

const initialState = {
  organizations: [],
  projects: [],
  currentOrganizationId: storedOrg || null,
  currentProjectId: storedProject || null,
  permissions: [],
  loading: false,
  error: null,
};

const contextSlice = createSlice({
  name: 'context',
  initialState,
  reducers: {
    loadOrganizationsRequest(state) {
      state.loading = true;
      state.error = null;
    },
    loadOrganizationsSuccess(state, action) {
      state.loading = false;
      state.organizations = action.payload.organizations || [];
      if (!state.currentOrganizationId && state.organizations.length > 0) {
        state.currentOrganizationId =
          action.payload.user?.defaultOrganizationId || state.organizations[0].id;
        localStorage.setItem('currentOrganizationId', state.currentOrganizationId);
      }
    },
    loadOrganizationsFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    loadProjectsRequest(state) {
      state.loading = true;
    },
    loadProjectsSuccess(state, action) {
      state.loading = false;
      state.projects = action.payload.projects || [];
      if (!state.currentProjectId && state.projects.length > 0) {
        const def = state.projects.find((p) => p.isDefault) || state.projects[0];
        state.currentProjectId = def.id;
        localStorage.setItem('currentProjectId', state.currentProjectId);
      }
    },
    loadProjectsFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentOrganization(state, action) {
      state.currentOrganizationId = action.payload;
      state.currentProjectId = null;
      state.projects = [];
      state.permissions = [];
      localStorage.setItem('currentOrganizationId', action.payload || '');
      localStorage.removeItem('currentProjectId');
    },
    setCurrentProject(state, action) {
      state.currentProjectId = action.payload;
      localStorage.setItem('currentProjectId', action.payload || '');
    },
    loadPermissionsRequest() {},
    loadPermissionsSuccess(state, action) {
      state.permissions = action.payload.permissions || [];
    },
    clearContext(state) {
      state.organizations = [];
      state.projects = [];
      state.currentOrganizationId = null;
      state.currentProjectId = null;
      state.permissions = [];
      localStorage.removeItem('currentOrganizationId');
      localStorage.removeItem('currentProjectId');
    },
  },
});

export const {
  loadOrganizationsRequest,
  loadOrganizationsSuccess,
  loadOrganizationsFailure,
  loadProjectsRequest,
  loadProjectsSuccess,
  loadProjectsFailure,
  setCurrentOrganization,
  setCurrentProject,
  loadPermissionsRequest,
  loadPermissionsSuccess,
  clearContext,
} = contextSlice.actions;

export default contextSlice.reducer;
