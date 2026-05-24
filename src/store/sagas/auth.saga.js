import { call, put, takeLatest, all } from 'redux-saga/effects';
import { fetchAPI, syncCsrfFromCookie } from '../../api/api.service.js';
import { API_ENDPOINTS } from '../../constants/api.constants.js';
import {
  loginRequest,
  loginRequires2FA,
  loginSuccess,
  loginFailure,
  logoutRequest,
  logoutSuccess,
  sessionRequest,
  sessionSuccess,
  sessionFailure,
  updateProfileRequest,
  updateProfileSuccess,
  updateProfileFailure,
  updatePasswordRequest,
  saLoadRequest,
  saLoadSuccess,
  saLoadFailure,
  saCreateAccountRequest,
  saToggleStatusRequest,
  saResetPasswordRequest,
  saActionSuccess,
  forgotPasswordRequest,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
} from '../slices/auth.slice.js';
import { addToast } from '../slices/notification.slice.js';
import { clearContext } from '../slices/context.slice.js';

function* loginSaga(action) {
  try {
    const { email, password, totpCode, tempToken } = action.payload;

    let data;
    if (tempToken && totpCode) {
      data = yield call(fetchAPI, API_ENDPOINTS.AUTH.TWO_FA_VERIFY_LOGIN, {
        method: 'POST',
        body: JSON.stringify({ tempToken, totpCode }),
      });
    } else {
      data = yield call(fetchAPI, API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ identifier: email, email, password, totpCode }),
      });
    }

    if (data.requires2FA) {
      yield put(loginRequires2FA({ tempToken: data.tempToken }));
      return;
    }

    syncCsrfFromCookie();
    yield put(loginSuccess({ user: data.user }));
    yield put(addToast({
      id: Date.now(),
      title: 'Login Successful',
      message: `Welcome back, ${data.user.name}!`,
      type: 'TASK_COMPLETED',
    }));
  } catch (err) {
    yield put(loginFailure(err.message));
    yield put(addToast({
      id: Date.now(),
      title: 'Login Failed',
      message: err.message,
      type: 'TASK_UPDATED',
    }));
  }
}

function* logoutSaga() {
  try {
    yield call(fetchAPI, API_ENDPOINTS.AUTH.LOGOUT, { method: 'POST' });
  } catch {
    // Session may already be cleared
  } finally {
    yield put(clearContext());
    yield put(logoutSuccess());
  }
}

function* sessionSaga() {
  try {
    const data = yield call(fetchAPI, API_ENDPOINTS.AUTH.SESSION);
    if (data.user) syncCsrfFromCookie();
    yield put(sessionSuccess(data.user));
  } catch {
    yield put(sessionFailure());
  }
}

function* updateProfileSaga(action) {
  try {
    const data = yield call(fetchAPI, API_ENDPOINTS.PROFILE.BASE, {
      method: 'PUT',
      body: JSON.stringify(action.payload),
    });
    yield put(updateProfileSuccess(data));
    yield put(addToast({
      id: Date.now(),
      title: 'Profile Updated',
      message: 'Your profile settings have been saved.',
      type: 'TASK_COMPLETED',
    }));
  } catch (err) {
    yield put(updateProfileFailure(err.message));
    yield put(addToast({
      id: Date.now(),
      title: 'Profile Update Failed',
      message: err.message,
      type: 'TASK_UPDATED',
    }));
  }
}

function* updatePasswordSaga(action) {
  const { currentPassword, newPassword, onSuccess, onFailure } = action.payload;
  try {
    yield call(fetchAPI, `${API_ENDPOINTS.PROFILE.BASE}/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    yield put(addToast({
      id: Date.now(),
      title: 'Password Changed',
      message: 'Your password has been changed successfully.',
      type: 'TASK_COMPLETED',
    }));

    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Password Change Failed',
      message: err.message,
      type: 'TASK_UPDATED',
    }));
    if (onFailure) onFailure(err.message);
  }
}

function* saLoadSaga() {
  try {
    const [stats, admins, users] = yield all([
      call(fetchAPI, API_ENDPOINTS.SUPERADMIN.STATS),
      call(fetchAPI, API_ENDPOINTS.SUPERADMIN.ADMINS),
      call(fetchAPI, API_ENDPOINTS.SUPERADMIN.USERS),
    ]);
    yield put(saLoadSuccess({ stats, admins, users }));
  } catch (err) {
    yield put(saLoadFailure(err.message));
  }
}

function* saCreateAccountSaga(action) {
  const { type, data, onSuccess, onFailure } = action.payload;
  try {
    const endpoint = type === 'admin'
      ? API_ENDPOINTS.SUPERADMIN.ADMINS
      : API_ENDPOINTS.SUPERADMIN.USERS;

    yield call(fetchAPI, endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    yield put(saActionSuccess());
    yield put(saLoadRequest());
    yield put(addToast({
      id: Date.now(),
      title: `${type === 'admin' ? 'Admin' : 'User'} Created`,
      message: `Account for ${data.name} was successfully created.`,
      type: 'TASK_COMPLETED',
    }));
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Creation Failed',
      message: err.message,
      type: 'TASK_UPDATED',
    }));
    if (onFailure) onFailure(err.message);
  }
}

function* saToggleStatusSaga(action) {
  try {
    const { id, isSuperAdminView, accountRole } = action.payload;
    const endpoint = isSuperAdminView
      ? `/superadmin/${accountRole === 'admin' ? 'admins' : 'users'}/${id}/status`
      : API_ENDPOINTS.MEMBERS.TOGGLE_STATUS(id);

    yield call(fetchAPI, endpoint, { method: 'PUT' });
    yield put(saActionSuccess());

    if (isSuperAdminView) {
      yield put(saLoadRequest());
    }

    yield put(addToast({
      id: Date.now(),
      title: 'Status Toggled',
      message: 'Account status was updated successfully.',
      type: 'TASK_COMPLETED',
    }));
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Toggle Status Failed',
      message: err.message,
      type: 'TASK_UPDATED',
    }));
  }
}

function* saResetPasswordSaga(action) {
  const { id, newPassword, accountRole, isSuperAdminView, onSuccess, onFailure } = action.payload;
  try {
    let endpoint;
    let body = { newPassword };

    if (isSuperAdminView) {
      endpoint = accountRole === 'admin'
        ? API_ENDPOINTS.SUPERADMIN.RESET_PASSWORD(id)
        : API_ENDPOINTS.SUPERADMIN.RESET_USER_PASSWORD(id);
    } else {
      endpoint = API_ENDPOINTS.MEMBERS.CREDENTIALS(id);
      body = { password: newPassword };
    }

    yield call(fetchAPI, endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    yield put(saActionSuccess());
    yield put(addToast({
      id: Date.now(),
      title: 'Password Reset',
      message: 'Password has been updated successfully.',
      type: 'TASK_COMPLETED',
    }));
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Password Reset Failed',
      message: err.message,
      type: 'TASK_UPDATED',
    }));
    if (onFailure) onFailure(err.message);
  }
}

function* forgotPasswordSaga(action) {
  const { email, onSuccess } = action.payload;
  try {
    yield call(fetchAPI, API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    yield put(forgotPasswordSuccess());
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(forgotPasswordFailure(err.message));
  }
}

function* resetPasswordSaga(action) {
  const { token, email, otp, password, onSuccess } = action.payload;
  try {
    const body = { newPassword: password };
    if (email && otp) {
      body.email = email;
      body.otp = otp;
    } else {
      body.token = token;
    }
    yield call(fetchAPI, API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    yield put(resetPasswordSuccess());
    yield put(addToast({
      id: Date.now(),
      title: 'Password Reset',
      message: 'Your password has been updated. You can sign in now.',
      type: 'TASK_COMPLETED',
    }));
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(resetPasswordFailure(err.message));
  }
}

export default function* authWatcherSaga() {
  yield takeLatest(loginRequest.type, loginSaga);
  yield takeLatest(logoutRequest.type, logoutSaga);
  yield takeLatest(sessionRequest.type, sessionSaga);
  yield takeLatest(updateProfileRequest.type, updateProfileSaga);
  yield takeLatest(updatePasswordRequest.type, updatePasswordSaga);
  yield takeLatest(forgotPasswordRequest.type, forgotPasswordSaga);
  yield takeLatest(resetPasswordRequest.type, resetPasswordSaga);
  yield takeLatest(saLoadRequest.type, saLoadSaga);
  yield takeLatest(saCreateAccountRequest.type, saCreateAccountSaga);
  yield takeLatest(saToggleStatusRequest.type, saToggleStatusSaga);
  yield takeLatest(saResetPasswordRequest.type, saResetPasswordSaga);
}
