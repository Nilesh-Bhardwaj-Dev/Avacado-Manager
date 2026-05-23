import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tasks: [],
  selectedTaskId: null,
  editingTask: null,
  creatingTaskInStatus: null,
  filterTeam: 'All',
  filterPriority: 'All',
  searchQuery: '',
  taskDeps: null, // { blockingTasks, dependentTasks, isBlocked, progressPercent }
  showDepSearch: false,
  depSearchQuery: '',
  loading: false,
  error: null
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    loadTasksRequest(state) {
      state.loading = true;
      state.error = null;
    },
    loadTasksSuccess(state, action) {
      state.loading = false;
      state.tasks = action.payload;
    },
    loadTasksFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    selectTask(state, action) {
      state.selectedTaskId = action.payload;
      if (!action.payload) {
        state.taskDeps = null;
      }
    },
    setEditingTask(state, action) {
      state.editingTask = action.payload;
    },
    setCreatingTaskInStatus(state, action) {
      state.creatingTaskInStatus = action.payload;
    },
    setFilterTeam(state, action) {
      state.filterTeam = action.payload;
    },
    setFilterPriority(state, action) {
      state.filterPriority = action.payload;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    loadDepsRequest() {
      // Don't set full loading so details modal stays interactive
    },
    loadDepsSuccess(state, action) {
      state.taskDeps = action.payload;
    },
    loadDepsFailure(state) {
      state.taskDeps = null;
    },
    setShowDepSearch(state, action) {
      state.showDepSearch = action.payload;
      if (!action.payload) {
        state.depSearchQuery = '';
      }
    },
    setDepSearchQuery(state, action) {
      state.depSearchQuery = action.payload;
    },
    // Saga action triggers (handled in saga, no reducer modification needed)
    createTaskRequest() {},
    updateTaskRequest() {},
    deleteTaskRequest() {},
    addDepRequest() {},
    removeDepRequest() {},
    addSubtaskRequest() {},
    toggleSubtaskRequest() {},
    deleteSubtaskRequest() {},
    addCommentRequest() {},
    uploadProofRequest() {}
  }
});

export const {
  loadTasksRequest,
  loadTasksSuccess,
  loadTasksFailure,
  selectTask,
  setEditingTask,
  setCreatingTaskInStatus,
  setFilterTeam,
  setFilterPriority,
  setSearchQuery,
  loadDepsRequest,
  loadDepsSuccess,
  loadDepsFailure,
  setShowDepSearch,
  setDepSearchQuery,
  createTaskRequest,
  updateTaskRequest,
  deleteTaskRequest,
  addDepRequest,
  removeDepRequest,
  addSubtaskRequest,
  toggleSubtaskRequest,
  deleteSubtaskRequest,
  addCommentRequest,
  uploadProofRequest
} = taskSlice.actions;

export default taskSlice.reducer;
