import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from './slices/auth.slice.js';
import taskReducer from './slices/task.slice.js';
import notificationReducer from './slices/notification.slice.js';
import teamReducer from './slices/team.slice.js';
import userDashboardReducer from './slices/userDashboard.slice.js';
import contextReducer from './slices/context.slice.js';
import rootSaga from './sagas/root.saga.js';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    task: taskReducer,
    notification: notificationReducer,
    team: teamReducer,
    userDashboard: userDashboardReducer,
    context: contextReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore specific actions that carry non-serializable values (like callback functions in payload)
        ignoredActions: [
          'auth/updatePasswordRequest',
          'auth/saCreateAccountRequest',
          'auth/saResetPasswordRequest',
          'task/createTaskRequest',
          'task/updateTaskRequest',
          'task/addDepRequest',
          'task/addSubtaskRequest',
          'task/addCommentRequest',
          'task/uploadProofRequest',
          'team/createMemberRequest',
          'team/createTeamRequest',
          'team/deleteMembersRequest',
          'team/deleteTeamRequest',
          'team/resetMemberPasswordRequest',
          'userDashboard/addUDCommentRequest',
          'userDashboard/uploadUDProofRequest'
        ]
      }
    }).concat(sagaMiddleware)
});

sagaMiddleware.run(rootSaga);
