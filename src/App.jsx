import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';

// Actions
import { sessionRequest, saLoadRequest } from './store/slices/auth.slice.js';
import { loadTasksRequest } from './store/slices/task.slice.js';
import { loadTeamDataRequest } from './store/slices/team.slice.js';
import { loadUDDataRequest } from './store/slices/userDashboard.slice.js';
import { 
  addNotification, 
  addToast, 
  loadNotificationsRequest, 
  loadUnreadCountRequest 
} from './store/slices/notification.slice.js';

// Layout & Common components
import Sidebar from './components/Layout/Sidebar.jsx';
import Header from './components/Layout/Header.jsx';
import AuthGateway from './components/Common/AuthGateway.jsx';
import ToastContainer from './components/Common/ToastContainer.jsx';

// Views
import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard.jsx';
import UserDashboardView from './components/User/UserDashboardView.jsx';
import DashboardView from './components/Admin/DashboardView.jsx';
import KanbanBoard from './components/Task/KanbanBoard.jsx';
import TaskListView from './components/Task/TaskListView.jsx';
import CalendarView from './components/Task/CalendarView.jsx';
import MemberManagement from './components/Admin/MemberManagement.jsx';
import TeamManagement from './components/Admin/TeamManagement.jsx';
import ProfileView from './components/Admin/ProfileView.jsx';
import RaiseQueryView from './components/Query/RaiseQueryView.jsx';

// Modals
import CreateTaskModal from './components/Task/CreateTaskModal.jsx';
import TaskDetailModal from './components/Task/TaskDetailModal.jsx';
import AddDependencyModal from './components/Task/AddDependencyModal.jsx';

export default function App() {
  const user = useSelector(state => state.auth.user);
  const activeView = useSelector(state => state.auth.activeView);
  
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  // Check auth session on application load
  useEffect(() => {
    dispatch(sessionRequest());
  }, [dispatch]);

  // Load app data based on logged in user's role
  useEffect(() => {
    if (user) {
      if (user.accountRole === 'superadmin') {
        dispatch(saLoadRequest());
      } else if (user.accountRole === 'user') {
        dispatch(loadUDDataRequest());
        dispatch(loadNotificationsRequest());
        dispatch(loadUnreadCountRequest());
      } else {
        // Admin / PM
        dispatch(loadTasksRequest());
        dispatch(loadTeamDataRequest());
        dispatch(loadNotificationsRequest());
        dispatch(loadUnreadCountRequest());
      }
    }
  }, [user, dispatch]);

  // Connect Socket.io for real-time notifications
  useEffect(() => {
    if (user) {
      const socket = io({ withCredentials: true });
      socketRef.current = socket;

      socket.on('notification', (notif) => {
        // Update notification state and show toast
        dispatch(addNotification(notif));
        dispatch(addToast({
          id: Date.now(),
          title: notif.title,
          message: notif.message,
          type: notif.type
        }));

        // Dynamically trigger state updates on real-time task alterations
        if (['TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_COMPLETED', 'DEPENDENCY_UNBLOCKED'].includes(notif.type)) {
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

  // If not authenticated, render the Gateway Login Page
  if (!user) {
    return <AuthGateway />;
  }

  // Render Super Admin Workspace
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

  // Render Team Member Dashboard Workspace
  if (user.accountRole === 'user') {
    return (
      <div className="ud-container">
        <ToastContainer />
        <Sidebar />
        <UserDashboardView />
      </div>
    );
  }

  // Render Admin / Project Manager Workspace
  return (
    <div className="app-container">
      {/* Toast Overlay */}
      <ToastContainer />

      {/* Workspace Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <main className="main-content">
        {/* Top Controls Bar */}
        <Header />

        {/* View Layout Router */}
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
        </div>
      </main>

      {/* Overlay Modals Section */}
      <CreateTaskModal />
      <TaskDetailModal />
      <AddDependencyModal />
    </div>
  );
}
