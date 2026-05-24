import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';

import { sessionRequest, saLoadRequest } from './store/slices/auth.slice.js';
import { loadOrganizationsRequest } from './store/slices/context.slice.js';
import { loadTasksRequest } from './store/slices/task.slice.js';
import { loadTeamDataRequest } from './store/slices/team.slice.js';
import { loadUDDataRequest } from './store/slices/userDashboard.slice.js';
import {
  addNotification,
  addToast,
  loadNotificationsRequest,
  loadUnreadCountRequest,
} from './store/slices/notification.slice.js';

import Sidebar from './components/Layout/Sidebar.jsx';
import Header from './components/Layout/Header.jsx';
import OrgProjectSwitcher from './components/Layout/OrgProjectSwitcher.jsx';
import ToastContainer from './components/Common/ToastContainer.jsx';

import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard.jsx';
import AuditLogsPanel from './components/SuperAdmin/AuditLogsPanel.jsx';
import UserDashboardView from './components/User/UserDashboardView.jsx';
import DashboardView from './components/Admin/DashboardView.jsx';
import KanbanBoard from './components/Task/KanbanBoard.jsx';
import TaskListView from './components/Task/TaskListView.jsx';
import CalendarView from './components/Task/CalendarView.jsx';
import MemberManagement from './components/Admin/MemberManagement.jsx';
import TeamManagement from './components/Admin/TeamManagement.jsx';
import ProfileView from './components/Admin/ProfileView.jsx';
import RaiseQueryView from './components/Query/RaiseQueryView.jsx';

import CreateTaskModal from './components/Task/CreateTaskModal.jsx';
import TaskDetailModal from './components/Task/TaskDetailModal.jsx';
import AddDependencyModal from './components/Task/AddDependencyModal.jsx';

export default function MainWorkspace() {
  const user = useSelector((state) => state.auth.user);
  const activeView = useSelector((state) => state.auth.activeView);
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    dispatch(sessionRequest());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      if (user.accountRole !== 'superadmin') {
        dispatch(loadOrganizationsRequest());
      }
      if (user.accountRole === 'superadmin') {
        dispatch(saLoadRequest());
      } else if (user.accountRole === 'user') {
        dispatch(loadUDDataRequest());
        dispatch(loadNotificationsRequest());
        dispatch(loadUnreadCountRequest());
      } else {
        dispatch(loadTasksRequest());
        dispatch(loadTeamDataRequest());
        dispatch(loadNotificationsRequest());
        dispatch(loadUnreadCountRequest());
      }
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (user) {
      const socket = io({ withCredentials: true });
      socketRef.current = socket;

      socket.on('notification', (notif) => {
        dispatch(addNotification(notif));
        dispatch(
          addToast({
            id: Date.now(),
            title: notif.title,
            message: notif.message,
            type: notif.type,
          })
        );

        if (
          ['TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_COMPLETED', 'DEPENDENCY_UNBLOCKED'].includes(
            notif.type
          )
        ) {
          if (user.accountRole === 'user') {
            dispatch(loadUDDataRequest());
          } else {
            dispatch(loadTasksRequest());
            dispatch(loadTeamDataRequest());
          }
        }
      });

      socket.on('connect_error', (err) => {
        console.warn('[Socket.io] Connection error:', err.message);
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [user, dispatch]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.accountRole === 'superadmin') {
    return (
      <div className="sa-container">
        <Sidebar />
        <main className="sa-main">
          <SuperAdminDashboard />
        </main>
      </div>
    );
  }

  if (user.accountRole === 'user') {
    return (
      <div className="ud-container">
        <ToastContainer />
        <OrgProjectSwitcher />
        <Sidebar />
        <UserDashboardView />
      </div>
    );
  }

  return (
    <div className="app-container">
      <ToastContainer />
      <Sidebar />
      <main className="main-content">
        <OrgProjectSwitcher />
        <Header />
        <div className="view-container">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'board' && <KanbanBoard />}
          {activeView === 'list' && <TaskListView />}
          {activeView === 'calendar' && <CalendarView />}
          {activeView === 'teams' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <TeamManagement />
              <MemberManagement />
            </div>
          )}
          {activeView === 'profile' && <ProfileView />}
          {activeView === 'queries' && <RaiseQueryView />}
          {activeView === 'audit-logs' && <AuditLogsPanel />}
        </div>
      </main>
      <CreateTaskModal />
      <TaskDetailModal />
      <AddDependencyModal />
    </div>
  );
}
