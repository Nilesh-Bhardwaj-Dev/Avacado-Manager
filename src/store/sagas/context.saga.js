import { call, put, select, takeLatest } from 'redux-saga/effects';
import { fetchAPI } from '../../api/api.service.js';
import {
  loadOrganizationsRequest,
  loadOrganizationsSuccess,
  loadOrganizationsFailure,
  loadProjectsRequest,
  loadProjectsSuccess,
  loadProjectsFailure,
  loadPermissionsRequest,
  loadPermissionsSuccess,
  setCurrentOrganization,
  setCurrentProject,
} from '../slices/context.slice.js';

function* loadOrganizations() {
  try {
    const user = yield select((s) => s.auth.user);
    const data = yield call(fetchAPI, '/organizations');
    yield put(loadOrganizationsSuccess({ organizations: data.organizations, user }));
    
    const orgId = yield select((s) => s.context.currentOrganizationId);
    if (orgId) {
      yield put(loadProjectsRequest());
      yield call(loadProjects);
      yield put(loadPermissionsRequest());
      yield call(loadPermissions);
    }
  } catch (err) {
    yield put(loadOrganizationsFailure(err.message));
  }
}

function* loadProjects() {
  try {
    const orgId = yield select((s) => s.context.currentOrganizationId);
    if (!orgId) return;
    const data = yield call(fetchAPI, `/organizations/${orgId}/projects`);
    yield put(loadProjectsSuccess({ projects: data.projects }));
  } catch (err) {
    yield put(loadProjectsFailure(err.message));
  }
}

function* loadPermissions() {
  try {
    const orgId = yield select((s) => s.context.currentOrganizationId);
    if (!orgId) return;
    const data = yield call(fetchAPI, `/organizations/${orgId}/me/permissions`);
    yield put(loadPermissionsSuccess({ permissions: data.permissions }));
  } catch {
    yield put(loadPermissionsSuccess({ permissions: [] }));
  }
}

function* onOrgChange() {
  yield put(loadProjectsRequest());
  yield call(loadProjects);
  yield put(loadPermissionsRequest());
  yield call(loadPermissions);
}

function* onProjectChange() {
  yield put(loadPermissionsRequest());
  yield call(loadPermissions);
}

export default function* contextSaga() {
  yield takeLatest(loadOrganizationsRequest.type, loadOrganizations);
  yield takeLatest(loadProjectsRequest.type, loadProjects);
  yield takeLatest(setCurrentOrganization.type, onOrgChange);
  yield takeLatest(setCurrentProject.type, onProjectChange);
}
