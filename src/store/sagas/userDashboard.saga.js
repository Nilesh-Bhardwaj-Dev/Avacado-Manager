import { call, put, takeLatest, all } from 'redux-saga/effects';
import { fetchAPI } from '../../api/api.service.js';
import { API_ENDPOINTS } from '../../constants/api.constants.js';
import {
  loadUDDataRequest,
  loadUDDataSuccess,
  loadUDDataFailure,
  updateUDTaskStatusRequest,
  addUDCommentRequest,
  uploadUDProofRequest
} from '../slices/userDashboard.slice.js';
import { addToast } from '../slices/notification.slice.js';

function* loadUDDataSaga() {
  try {
    const [tasks, stats] = yield all([
      call(fetchAPI, API_ENDPOINTS.USER_DASHBOARD.TASKS),
      call(fetchAPI, API_ENDPOINTS.USER_DASHBOARD.STATS)
    ]);
    yield put(loadUDDataSuccess({ tasks, stats }));
  } catch (err) {
    yield put(loadUDDataFailure(err.message));
  }
}

function* updateUDTaskStatusSaga(action) {
  try {
    const { id, status } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.USER_DASHBOARD.STATUS(id), {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    yield put(loadUDDataRequest());
    yield put(addToast({
      id: Date.now(),
      title: 'Task Status Updated',
      message: `Task is now in ${status === 'done' ? 'Done' : status === 'progress' ? 'In Progress' : status === 'review' ? 'Review' : 'Todo'}`,
      type: 'TASK_COMPLETED'
    }));
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Action Blocked',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* addUDCommentSaga(action) {
  try {
    const { taskId, content, onSuccess } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TASKS.COMMENTS(taskId), {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    yield put(loadUDDataRequest());
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Comment Failed',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* uploadUDProofSaga(action) {
  try {
    const { taskId, fileData, onSuccess } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TASKS.PROOF(taskId), {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
    yield put(loadUDDataRequest());
    yield put(addToast({
      id: Date.now(),
      title: 'Proof Uploaded',
      message: 'Completion proof uploaded successfully.',
      type: 'TASK_COMPLETED'
    }));
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Upload Failed',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

export default function* userDashboardWatcherSaga() {
  yield takeLatest(loadUDDataRequest.type, loadUDDataSaga);
  yield takeLatest(updateUDTaskStatusRequest.type, updateUDTaskStatusSaga);
  yield takeLatest(addUDCommentRequest.type, addUDCommentSaga);
  yield takeLatest(uploadUDProofRequest.type, uploadUDProofSaga);
}
