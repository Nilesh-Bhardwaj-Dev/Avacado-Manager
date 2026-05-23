import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  showNotifPanel: false,
  toasts: [], // { id, title, message, type }
  loading: false,
  error: null
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    loadNotificationsRequest(state) {
      state.loading = true;
      state.error = null;
    },
    loadNotificationsSuccess(state, action) {
      state.loading = false;
      state.notifications = action.payload;
    },
    loadNotificationsFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    loadUnreadCountRequest() {
      // Handled in saga
    },
    loadUnreadCountSuccess(state, action) {
      state.unreadCount = action.payload;
    },
    loadUnreadCountFailure(state, action) {
      state.error = action.payload;
    },
    markReadRequest() {
      // Let saga handle
    },
    markReadSuccess(state, action) {
      const notifId = action.payload;
      state.notifications = state.notifications.map(n =>
        n.id === notifId ? { ...n, read: true } : n
      );
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    markReadFailure(state, action) {
      state.error = action.payload;
    },
    markAllReadRequest() {
      // Let saga handle
    },
    markAllReadSuccess(state) {
      state.notifications = state.notifications.map(n => ({ ...n, read: true }));
      state.unreadCount = 0;
    },
    markAllReadFailure(state, action) {
      state.error = action.payload;
    },
    addNotification(state, action) {
      state.notifications = [action.payload, ...state.notifications];
      state.unreadCount += 1;
    },
    setShowNotifPanel(state, action) {
      state.showNotifPanel = action.payload;
    },
    addToast(state, action) {
      state.toasts.push(action.payload);
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    }
  }
});

export const {
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
  markAllReadFailure,
  addNotification,
  setShowNotifPanel,
  addToast,
  removeToast
} = notificationSlice.actions;

export default notificationSlice.reducer;
