import { createSlice } from '@reduxjs/toolkit';

let initialUser = null;
try {
  const savedUser = localStorage.getItem('user');
  if (savedUser) initialUser = JSON.parse(savedUser);
} catch {
  localStorage.removeItem('user');
}

const initialState = {
  user: initialUser,
  loading: false,
  error: null,
  requires2FA: false,
  temp2faToken: null,
  activeView: initialUser ? (initialUser.accountRole === 'superadmin' ? 'admins' : 'dashboard') : 'login',
  saAdmins: [],
  saUsers: [],
  saSelectedAccount: null,
  saStats: { totalAdmins: 0, totalUsers: 0, activeAccounts: 0, inactiveAccounts: 0 },
  saLoading: false,
  saError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setView(state, action) {
      state.activeView = action.payload;
    },
    loginRequest(state) {
      state.loading = true;
      state.error = null;
    },
    loginRequires2FA(state, action) {
      state.loading = false;
      state.requires2FA = true;
      state.temp2faToken = action.payload.tempToken;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.user = action.payload.user;
      state.error = null;
      state.requires2FA = false;
      state.temp2faToken = null;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      state.activeView = action.payload.user.accountRole === 'superadmin' ? 'admins' : 'dashboard';
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.requires2FA = false;
      state.temp2faToken = null;
    },
    logoutRequest(state) {
      state.loading = true;
    },
    logoutSuccess(state) {
      state.loading = false;
      state.user = null;
      state.error = null;
      state.requires2FA = false;
      state.temp2faToken = null;
      state.activeView = 'login';
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    sessionRequest(state) {
      state.loading = true;
    },
    sessionSuccess(state, action) {
      state.loading = false;
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload));
      } else {
        state.user = null;
        state.activeView = 'login';
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    },
    sessionFailure(state) {
      state.loading = false;
      state.user = null;
      state.activeView = 'login';
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    updateProfileRequest(state) {
      state.loading = true;
      state.error = null;
    },
    updateProfileSuccess(state, action) {
      state.loading = false;
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    updateProfileFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    saLoadRequest(state) {
      state.saLoading = true;
      state.saError = null;
    },
    saLoadSuccess(state, action) {
      state.saLoading = false;
      state.saAdmins = action.payload.admins;
      state.saUsers = action.payload.users;
      state.saStats = action.payload.stats;
    },
    saLoadFailure(state, action) {
      state.saLoading = false;
      state.saError = action.payload;
    },
    saSelectAccount(state, action) {
      state.saSelectedAccount = action.payload;
    },
    saActionSuccess(state) {
      state.saLoading = false;
    },
    forgotPasswordRequest(state) {
      state.loading = true;
      state.error = null;
    },
    forgotPasswordSuccess(state) {
      state.loading = false;
      state.error = null;
    },
    forgotPasswordFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    resetPasswordRequest(state) {
      state.loading = true;
      state.error = null;
    },
    resetPasswordSuccess(state) {
      state.loading = false;
      state.error = null;
    },
    resetPasswordFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    updatePasswordRequest() {},
    saCreateAccountRequest() {},
    saToggleStatusRequest() {},
    saResetPasswordRequest() {},
  },
});

export const {
  setView,
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
  saLoadRequest,
  saLoadSuccess,
  saLoadFailure,
  saSelectAccount,
  saActionSuccess,
  updatePasswordRequest,
  forgotPasswordRequest,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
  saCreateAccountRequest,
  saToggleStatusRequest,
  saResetPasswordRequest,
} = authSlice.actions;

export default authSlice.reducer;
