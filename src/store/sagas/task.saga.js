import { call, put, takeLatest, select } from 'redux-saga/effects';
import { fetchAPI } from '../../api/api.service.js';
import { API_ENDPOINTS } from '../../constants/api.constants.js';
import {
  loadTasksRequest,
  loadTasksSuccess,
  loadTasksFailure,
  loadDepsRequest,
  loadDepsSuccess,
  loadDepsFailure,
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
} from '../slices/task.slice.js';
import { loadTeamDataRequest } from '../slices/team.slice.js';
import { addToast } from '../slices/notification.slice.js';

// Selector to get selectedTaskId from state
const getSelectedTaskId = (state) => state.task.selectedTaskId;

function* loadTasksSaga() {
  try {
    const tasks = yield call(fetchAPI, API_ENDPOINTS.TASKS.BASE);
    yield put(loadTasksSuccess(tasks));
  } catch (err) {
    yield put(loadTasksFailure(err.message));
  }
}

function* loadDepsSaga(action) {
  try {
    const taskId = action.payload;
    const deps = yield call(fetchAPI, API_ENDPOINTS.TASKS.DEPENDENCIES(taskId));
    yield put(loadDepsSuccess(deps));
  } catch (err) {
    console.error('Failed loading dependencies:', err);
    yield put(loadDepsFailure());
  }
}

function* createTaskSaga(action) {
  try {
    const { data, onSuccess } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TASKS.BASE, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    yield put(loadTasksRequest());
    yield put(addToast({
      id: Date.now(),
      title: 'Task Created',
      message: `Task "${data.title}" created successfully.`,
      type: 'TASK_COMPLETED'
    }));
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Create Task',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* updateTaskSaga(action) {
  try {
    const { id, data, onSuccess } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TASKS.DETAIL(id), {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    yield put(loadTasksRequest());
    
    // Reload dependencies in case status changed
    const selectedTaskId = yield select(getSelectedTaskId);
    if (selectedTaskId === id) {
      yield put(loadDepsRequest(id));
    }

    yield put(addToast({
      id: Date.now(),
      title: 'Task Updated',
      message: `Task "${data.title}" updated successfully.`,
      type: 'TASK_COMPLETED'
    }));
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Update Task',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* deleteTaskSaga(action) {
  try {
    const taskId = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TASKS.DETAIL(taskId), {
      method: 'DELETE'
    });
    yield put(loadTasksRequest());
    yield put(addToast({
      id: Date.now(),
      title: 'Task Deleted',
      message: 'The task was successfully deleted.',
      type: 'TASK_COMPLETED'
    }));
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Delete Task',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* addDepSaga(action) {
  try {
    const { taskId, dependsOnId, onSuccess } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TASKS.DEPENDENCIES(taskId), {
      method: 'POST',
      body: JSON.stringify({ dependsOnId })
    });
    yield put(loadDepsRequest(taskId));
    yield put(loadTasksRequest());
    yield put(addToast({
      id: Date.now(),
      title: 'Dependency Linked',
      message: 'Tasks are now linked as dependencies.',
      type: 'TASK_COMPLETED'
    }));
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Add Dependency',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* removeDepSaga(action) {
  try {
    const { taskId, depId } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TASKS.DEPENDENCY_DETAIL(taskId, depId), {
      method: 'DELETE'
    });
    yield put(loadDepsRequest(taskId));
    yield put(loadTasksRequest());
    yield put(addToast({
      id: Date.now(),
      title: 'Dependency Removed',
      message: 'The dependency link has been removed.',
      type: 'TASK_COMPLETED'
    }));
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Remove Dependency',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* addSubtaskSaga(action) {
  try {
    const { taskId, title, onSuccess } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TASKS.SUBTASKS(taskId), {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    yield put(loadTasksRequest());
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Add Subtask',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* toggleSubtaskSaga(action) {
  try {
    const { taskId, subtaskId, done } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TASKS.SUBTASK_DETAIL(taskId, subtaskId), {
      method: 'PUT',
      body: JSON.stringify({ done })
    });
    yield put(loadTasksRequest());
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Toggle Subtask',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* deleteSubtaskSaga(action) {
  try {
    const { taskId, subtaskId } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TASKS.SUBTASK_DETAIL(taskId, subtaskId), {
      method: 'DELETE'
    });
    yield put(loadTasksRequest());
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Delete Subtask',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* addCommentSaga(action) {
  try {
    const { taskId, content, onSuccess } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TASKS.COMMENTS(taskId), {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    yield put(loadTasksRequest());
    // Also trigger activity reload since comments log to activity
    yield put(loadTeamDataRequest());
    if (onSuccess) onSuccess();
  } catch (err) {
    yield put(addToast({
      id: Date.now(),
      title: 'Failed to Post Comment',
      message: err.message,
      type: 'TASK_UPDATED'
    }));
  }
}

function* uploadProofSaga(action) {
  try {
    const { taskId, fileData, onSuccess } = action.payload;
    yield call(fetchAPI, API_ENDPOINTS.TASKS.PROOF(taskId), {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
    yield put(loadTasksRequest());
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

export default function* taskWatcherSaga() {
  yield takeLatest(loadTasksRequest.type, loadTasksSaga);
  yield takeLatest(loadDepsRequest.type, loadDepsSaga);
  yield takeLatest(createTaskRequest.type, createTaskSaga);
  yield takeLatest(updateTaskRequest.type, updateTaskSaga);
  yield takeLatest(deleteTaskRequest.type, deleteTaskSaga);
  yield takeLatest(addDepRequest.type, addDepSaga);
  yield takeLatest(removeDepRequest.type, removeDepSaga);
  yield takeLatest(addSubtaskRequest.type, addSubtaskSaga);
  yield takeLatest(toggleSubtaskRequest.type, toggleSubtaskSaga);
  yield takeLatest(deleteSubtaskRequest.type, deleteSubtaskSaga);
  yield takeLatest(addCommentRequest.type, addCommentSaga);
  yield takeLatest(uploadProofRequest.type, uploadProofSaga);
}
