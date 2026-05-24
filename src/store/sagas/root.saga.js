import { all } from 'redux-saga/effects';
import authWatcherSaga from './auth.saga.js';
import taskWatcherSaga from './task.saga.js';
import notificationWatcherSaga from './notification.saga.js';
import teamWatcherSaga from './team.saga.js';
import userDashboardWatcherSaga from './userDashboard.saga.js';
import contextWatcherSaga from './context.saga.js';

export default function* rootSaga() {
  yield all([
    authWatcherSaga(),
    taskWatcherSaga(),
    notificationWatcherSaga(),
    teamWatcherSaga(),
    userDashboardWatcherSaga(),
    contextWatcherSaga(),
  ]);
}
