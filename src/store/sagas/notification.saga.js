import { call, put, takeLatest } from 'redux-saga/effects';
import { fetchAPI } from '../../api/api.service.js';
import { API_ENDPOINTS } from '../../constants/api.constants.js';
import {
  loadNotificationsRequest,
  loadNotificationsSuccess,
  loadNotificationsFailure,
  loadUnreadCountRequest,
  loadUnreadCountSuccess,
  loadUnreadCountFailure,
  markReadRequest,
  markReadSuccess,
  markReadFailure,
  markAllReadRequest,
  markAllReadSuccess,
  markAllReadFailure
} from '../slices/notification.slice.js';

function* loadNotificationsSaga() {
  try {
    const notifications = yield call(fetchAPI, API_ENDPOINTS.NOTIFICATIONS.BASE);
    yield put(loadNotificationsSuccess(notifications));
  } catch (err) {
    yield put(loadNotificationsFailure(err.message));
  }
}

function* loadUnreadCountSaga() {
  try {
    const data = yield call(fetchAPI, API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    yield put(loadUnreadCountSuccess(data.count));
  } catch (err) {
    yield put(loadUnreadCountFailure(err.message));
  }
}

function* markReadSaga(action) {
  try {
    const notifId = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notifId), { method: 'PUT' });
    yield put(markReadSuccess(notifId));
  } catch (err) {
    yield put(markReadFailure(err.message));
  }
}

function* markAllReadSaga() {
  try {
    yield call(fetchAPI, API_ENDPOINTS.NOTIFICATIONS.READ_ALL, { method: 'PUT' });
    yield put(markAllReadSuccess());
  } catch (err) {
    yield put(markAllReadFailure(err.message));
  }
}

export default function* notificationWatcherSaga() {
  yield takeLatest(loadNotificationsRequest.type, loadNotificationsSaga);
  yield takeLatest(loadUnreadCountRequest.type, loadUnreadCountSaga);
  yield takeLatest(markReadRequest.type, markReadSaga);
  yield takeLatest(markAllReadRequest.type, markAllReadSaga);
}
