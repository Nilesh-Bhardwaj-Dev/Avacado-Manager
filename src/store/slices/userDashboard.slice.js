import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  udView: 'board', // 'board' or 'stats'
  udTasks: [],
  udStats: { total: 0, todo: 0, progress: 0, review: 0, done: 0, overdue: 0 },
  udDragOverCol: null,
  udSelectedTaskId: null,
  udNewComment: '',
  loading: false,
  error: null
};

const userDashboardSlice = createSlice({
  name: 'userDashboard',
  initialState,
  reducers: {
    loadUDDataRequest(state) {
      state.loading = true;
      state.error = null;
    },
    loadUDDataSuccess(state, action) {
      state.loading = false;
      state.udTasks = action.payload.tasks;
      state.udStats = action.payload.stats;
    },
    loadUDDataFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    setUdView(state, action) {
      state.udView = action.payload;
    },
    setUdDragOverCol(state, action) {
      state.udDragOverCol = action.payload;
    },
    setUdSelectedTaskId(state, action) {
      state.udSelectedTaskId = action.payload;
    },
    setUdNewComment(state, action) {
      state.udNewComment = action.payload;
    },
    // Saga actions (handled in saga)
    updateUDTaskStatusRequest() {},
    addUDCommentRequest() {},
    uploadUDProofRequest() {}
  }
});

export const {
  loadUDDataRequest,
  loadUDDataSuccess,
  loadUDDataFailure,
  setUdView,
  setUdDragOverCol,
  setUdSelectedTaskId,
  setUdNewComment,
  updateUDTaskStatusRequest,
  addUDCommentRequest,
  uploadUDProofRequest
} = userDashboardSlice.actions;

export default userDashboardSlice.reducer;
