import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import LeaveForm from './components/LeaveForm';
import DashboardRouter from './components/DashboardRouter';

function App() {
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState({ ownForms: [], pendingApprovals: [] });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (typeof storedUser === 'string' && storedUser.length > 0) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser !== null && parsedUser !== undefined) {
          setUserData({ 
            ...parsedUser, 
            id: parseInt(parsedUser.id), 
            departemen_id: parseInt(parsedUser.departemen_id), 
            jabatan: parsedUser.jabatan.toLowerCase() 
          });
        } else {
          localStorage.removeItem('userData');
        }
      } catch (e) {
        console.error("Error parsing stored user data:", e);
        localStorage.removeItem('userData');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const fetchLeaveForms = async () => {
      if (userData && userData.departemen_id) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/dashboard-forms/${userData.id}?role=${userData.jabatan}&departmentId=${userData.departemen_id}`);
          if (response.ok) {
            const data = await response.json();
            setDashboardData(data);
          } else {
            setDashboardData({ ownForms: [], pendingApprovals: [] });
          }
        } catch (error) {
          console.error('Error fetching forms:', error);
          setDashboardData({ ownForms: [], pendingApprovals: [] });
        }
      }
    };
    fetchLeaveForms();
  }, [userData]);

  const handleLoginSuccess = (user) => {
    // Determine if user is HR Manager (Manager in HR department)
    let role = user.jabatan.toLowerCase();
    if (role === 'manager' && user.departemen === 'HR') {
      role = 'hr_manager';
    }
    
    const userToStore = {
      ...user,
      id: parseInt(user.id),
      departemen_id: parseInt(user.departemen_id),
      jabatan: role
    };

    setUserData(userToStore);
    localStorage.setItem('userData', JSON.stringify(userToStore));
    navigate(`/dashboard/${role}/${userToStore.id}`);
  };

  const handleLogout = () => {
    setUserData(null);
    localStorage.removeItem('userData');
    setDashboardData({ ownForms: [], pendingApprovals: [] });
    navigate('/login');
  };

  const handleRegisterSuccess = () => {
    // Placeholder if needed
  };

  const handleFormAction = async (formId, actionType, roleApproving, rejectReason = '') => {
    if (actionType === 'submit' || actionType === 'draft') {
      if (userData) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/dashboard-forms/${userData.id}?role=${userData.jabatan}&departmentId=${userData.departemen_id}`);
          if (response.ok) {
            const data = await response.json();
            setDashboardData(data);
          }
        } catch (error) {
          console.error('Error re-fetching leave forms:', error);
        }
      }
      return;
    }

    if (formId && roleApproving) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/${formId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionType,
            role: roleApproving,
            approverId: userData.id,
            approverName: userData.nama,
            rejectReason: rejectReason,
          }),
        });

        if (response.ok && userData) {
          const updatedResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/dashboard-forms/${userData.id}?role=${userData.jabatan}&departmentId=${userData.departemen_id}`);
          if (updatedResponse.ok) {
            const data = await updatedResponse.json();
            setDashboardData(data);
          }
        } else {
          const errorData = await response.json();
          alert(`Failed: ${errorData.message || response.statusText}`);
        }
      } catch (error) {
        console.error('Error during action:', error);
        alert(`Error during action: ${actionType}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="company-info">
            <div className="company-logo">
              <span className="logo-text">LAPI</span>
            </div>
            <div className="system-title">
              <h1>Sistem Manajemen Cuti</h1>
              <p className="company-subtitle">PT. LAPI LABORATORIES</p>
            </div>
          </div>
          {userData && (
            <nav className="user-nav">
              <div className="user-info">
                <div className="user-avatar">
                  {userData.nama.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <span className="user-name">{userData.nama}</span>
                  <span className="user-role">{userData.jabatan.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <span>LOGOUT</span>
              </button>
            </nav>
          )}
        </div>
      </header>
      
      <main className="main-content">
        <div className="content-wrapper">
          <Routes>
            {userData ? (
              <>
                <Route path="/dashboard/:role/:id" element={
                  <DashboardRouter
                    dashboardData={dashboardData}
                    onFormAction={handleFormAction}
                    userData={userData}
                  />
                } />
                <Route path="/create-leave" element={
                  <LeaveForm
                    userId={userData.id}
                    userName={userData.nama}
                    userDepartment={userData.departemen}
                    userDepartmentId={userData.departemen_id}
                    userRole={userData.jabatan}
                    onFormAction={handleFormAction}
                  />
                } />
                <Route path="/edit-leave/:id" element={
                  <LeaveForm
                    userId={userData.id}
                    userName={userData.nama}
                    userDepartment={userData.departemen}
                    userDepartmentId={userData.departemen_id}
                    userRole={userData.jabatan}
                    onFormAction={handleFormAction}
                  />
                } />
                <Route path="*" element={<Navigate to={`/dashboard/${userData.jabatan}/${userData.id}`} />} />
              </>
            ) : (
              <>
                <Route path="/login" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/register" element={<RegisterForm onRegisterSuccess={handleRegisterSuccess} />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </>
            )}
          </Routes>
        </div>
      </main>
      
      <footer className="App-footer">
        <p>&copy; 2024 PT. LAPI LABORATORIES. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;