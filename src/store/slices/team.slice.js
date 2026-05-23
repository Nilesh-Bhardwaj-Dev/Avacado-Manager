import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  members: [],
  teams: [],
  selectedMemberIds: [],
  showMemberModal: false,
  showTeamModal: false,
  deleteConfirmation: { show: false, memberIds: [], names: [] },
  deleteTeamConfirmation: { show: false, teamName: '' },
  teamDeleteError: '',
  loading: false,
  error: null
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    loadTeamDataRequest(state) {
      state.loading = true;
      state.error = null;
    },
    loadTeamDataSuccess(state, action) {
      state.loading = false;
      state.members = action.payload.members;
      state.teams = action.payload.teams;
    },
    loadTeamDataFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    setMembers(state, action) {
      state.members = action.payload;
    },
    setTeams(state, action) {
      state.teams = action.payload;
    },
    setSelectedMemberIds(state, action) {
      state.selectedMemberIds = action.payload;
    },
    toggleMemberSelection(state, action) {
      const memberId = action.payload;
      if (state.selectedMemberIds.includes(memberId)) {
        state.selectedMemberIds = state.selectedMemberIds.filter(id => id !== memberId);
      } else {
        state.selectedMemberIds.push(memberId);
      }
    },
    setShowMemberModal(state, action) {
      state.showMemberModal = action.payload;
    },
    setShowTeamModal(state, action) {
      state.showTeamModal = action.payload;
    },
    setDeleteConfirmation(state, action) {
      state.deleteConfirmation = action.payload;
    },
    setDeleteTeamConfirmation(state, action) {
      state.deleteTeamConfirmation = action.payload;
    },
    setTeamDeleteError(state, action) {
      state.teamDeleteError = action.payload;
    },
    // Saga actions (no state changes in reducers directly, handled in Saga)
    createMemberRequest() {},
    createTeamRequest() {},
    deleteMembersRequest() {},
    deleteTeamRequest() {},
    toggleMemberStatusRequest() {},
    resetMemberPasswordRequest() {}
  }
});

export const {
  loadTeamDataRequest,
  loadTeamDataSuccess,
  loadTeamDataFailure,
  setMembers,
  setTeams,
  setSelectedMemberIds,
  toggleMemberSelection,
  setShowMemberModal,
  setShowTeamModal,
  setDeleteConfirmation,
  setDeleteTeamConfirmation,
  setTeamDeleteError,
  createMemberRequest,
  createTeamRequest,
  deleteMembersRequest,
  deleteTeamRequest,
  toggleMemberStatusRequest,
  resetMemberPasswordRequest
} = teamSlice.actions;

export default teamSlice.reducer;
