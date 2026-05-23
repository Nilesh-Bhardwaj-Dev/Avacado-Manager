import { call, put, takeLatest, all } from 'redux-saga/effects';
import { fetchAPI } from '../../api/api.service.js';
import { API_ENDPOINTS } from '../../constants/api.constants.js';
import {
  loadTeamDataRequest,
  loadTeamDataSuccess,
  loadTeamDataFailure,
  setTeamDeleteError,
  createMemberRequest,
  createTeamRequest,
  deleteMembersRequest,
  deleteTeamRequest,
  toggleMemberStatusRequest,
  resetMemberPasswordRequest
} from '../slices/team.slice.js';
import { addToast } from '../slices/notification.slice.js';

function* loadTeamDataSaga() {
  try {
    const [members, teams] = yield all([
      call(fetchAPI, API_ENDPOINTS.MEMBERS.BASE),
      call(fetchAPI, API_ENDPOINTS.TEAMS.BASE),
    ]);
    yield put(loadTeamDataSuccess({ members, teams }));
  } catch (err) {
    yield put(loadTeamDataFailure(err.message));
  }
}

function* createMemberSaga(action) {
  try {
    const { data, onSuccess } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.MEMBERS.BASE, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    yield put(loadTeamDataRequest());
    yield put(addToast({
      id: Date.now(),
      title: 'Member Added',
      message: `User ${data.name} added to workspace.`,
      type: 'TASK_COMPLETED'
    }));
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Add Member',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* createTeamSaga(action) {
  try {
    const { name, onSuccess } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TEAMS.BASE, {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    yield put(loadTeamDataRequest());
    yield put(addToast({
      id: Date.now(),
      title: 'Team Created',
      message: `Team "${name}" created successfully.`,
      type: 'TASK_COMPLETED'
    }));
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Create Team',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* deleteMembersSaga(action) {
  try {
    const { ids, onSuccess } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.MEMBERS.BULK_DELETE, {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
    yield put(loadTeamDataRequest());
    yield put(addToast({
      id: Date.now(),
      title: 'Members Deleted',
      message: 'Selected members were removed from the workspace.',
      type: 'TASK_COMPLETED'
    }));
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Deletion Failed',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* deleteTeamSaga(action) {
  const { teamName, onSuccess, onFailure } = action.payload;
  try {
    yield call(fetchAPI, `${API_ENDPOINTS.TEAMS.BASE}/${encodeURIComponent(teamName)}`, {
      method: 'DELETE'
    });
    yield put(loadTeamDataRequest());
    yield put(addToast({
      id: Date.now(),
      title: 'Team Deleted',
      message: `Team "${teamName}" was deleted.`,
      type: 'TASK_COMPLETED'
    }));
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(setTeamDeleteError(err.message));
    if (onFailure) onFailure(err.message);
  }
}

function* toggleMemberStatusSaga(action) {
  try {
    const memberId = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.MEMBERS.TOGGLE_STATUS(memberId), { method: 'PUT' });
    yield put(loadTeamDataRequest());
    yield put(addToast({
      id: Date.now(),
      title: 'Status Toggled',
      message: 'Member status updated successfully.',
      type: 'TASK_COMPLETED'
    }));
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Toggle Status',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* resetMemberPasswordSaga(action) {
  const { memberId, username, password, onSuccess, onFailure } = action.payload;
  try {
    yield call(fetchAPI, API_ENDPOINTS.MEMBERS.CREDENTIALS(memberId), {
      method: 'PUT',
      body: JSON.stringify({ username, password })
    });
    yield put(loadTeamDataRequest());
    yield put(addToast({
      id: Date.now(),
      title: 'Credentials Set',
      message: 'Member login credentials updated successfully.',
      type: 'TASK_COMPLETED'
    }));
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Set Credentials',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
    if (onFailure) onFailure(err.message);
  }
}

export default function* teamWatcherSaga() {
  yield takeLatest(loadTeamDataRequest.type, loadTeamDataSaga);
  yield takeLatest(createMemberRequest.type, createMemberSaga);
  yield takeLatest(createTeamRequest.type, createTeamSaga);
  yield takeLatest(deleteMembersRequest.type, deleteMembersSaga);
  yield takeLatest(deleteTeamRequest.type, deleteTeamSaga);
  yield takeLatest(toggleMemberStatusRequest.type, toggleMemberStatusSaga);
  yield takeLatest(resetMemberPasswordRequest.type, resetMemberPasswordSaga);
}
