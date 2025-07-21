import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import StaffDashboard from './components/StaffDashboard';
import LeaveForm from './components/LeaveForm';
import SupervisorDashboard from './components/SupervisorDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import HRManagerDashboard from './components/HRManagerDashboard';

function App() {
  const [userData, setUserData] = useState(null);
  const [leaveForms, setLeaveForms] = useState([]);

  useEffect(() => {
    // Check for stored user data on component mount
    const storedUser = localStorage.getItem('userData');
    // Ensure storedUser is a valid JSON string before parsing
    if (typeof storedUser === 'string' && storedUser.length > 0) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Check if the parsed data is not null or undefined (after parsing)
        if (parsedUser !== null && parsedUser !== undefined) {
          // Ensure id is a number, as it comes from localStorage as a string
          // Ensure jabatan is lowercase for consistent comparison
          setUserData({ ...parsedUser, id: parseInt(parsedUser.id), jabatan: parsedUser.jabatan ? parsedUser.jabatan.toLowerCase() : '' });
        } else {
          // If parsed to null/undefined, it's effectively invalid data
          localStorage.removeItem('userData');
          console.warn("Cleared invalid 'userData' from localStorage.");
        }
      } catch (e) {
        console.error("Error parsing stored user data:", e);
        localStorage.removeItem('userData'); // Clear invalid data
        console.warn("Cleared corrupted 'userData' from localStorage due to parsing error.");
      }
    }
  }, []);

  useEffect(() => {
    const fetchLeaveForms = async () => {
      if (userData) {
        try {
          // Use departemen_id for fetching forms
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/dashboard-forms/${userData.id}?role=${userData.jabatan}&departmentId=${userData.departemen_id}`);
          if (response.ok) {
            const data = await response.json();
            setLeaveForms(data);
          } else {
            console.error('Failed to fetch dashboard leave forms:', response.statusText);
            setLeaveForms({ ownForms: [], pendingApprovals: [] });
          }
        } catch (error) {
          console.error('Error fetching dashboard leave forms:', error);
          setLeaveForms({ ownForms: [], pendingApprovals: [] });
        }
      }
    };
    fetchLeaveForms();
  }, [userData]);

  const handleLoginSuccess = (user) => {
    // Ensure jabatan is stored in lowercase for consistency
    const userToStore = { ...user, jabatan: user.jabatan ? user.jabatan.toLowerCase() : '' };
    setUserData(userToStore);
    localStorage.setItem('userData', JSON.stringify(userToStore)); // Store user data
    console.log('Login successful. User data:', userToStore);
  };

  const handleLogout = () => {
    setUserData(null);
    localStorage.removeItem('userData'); // Clear stored user data
    setLeaveForms([]);
  };

  const handleRegisterSuccess = () => {
    // Optionally redirect to login or show a success message
  };

  const handleFormAction = async (formId, actionType, roleApproving, rejectReason = '') => {
    console.log(`[App.js] handleFormAction called with formId: ${formId}, actionType: ${actionType}`);
    // Re-fetch forms after any form submission/save/update
    if (actionType === 'submit' || actionType === 'draft') {
      // For save/submit, the LeaveForm component handles the API call, just re-fetch
      if (userData) {
        console.log(`[App.js] Re-fetching leave forms for user ID: ${userData.id}`);
        try {
          // Use departemen_id for re-fetching forms
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/dashboard-forms/${userData.id}?role=${userData.jabatan}&departmentId=${userData.departemen_id}`);
          if (response.ok) {
            const data = await response.json();
            console.log('[App.js] Fetched leave forms data:', data);
            setLeaveForms(data); // This should update the state and re-render
          } else {
            console.error('[App.js] Failed to re-fetch leave forms:', response.statusText);
          }
        } catch (error) {
          console.error('[App.js] Error re-fetching leave forms:', error);
        }
      }
      return;
    }

    // For approve/reject actions
    if (formId && roleApproving) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/${formId}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: actionType,
            role: roleApproving,
            approverId: userData.id,
            approverName: userData.nama,
            rejectReason: rejectReason,
          }),
        });

        if (response.ok) {
          console.log(`Leave request ${formId} ${actionType} by ${roleApproving}`);
          // Re-fetch all leave forms to update the dashboard
          if (userData) {
            // Use departemen_id for re-fetching forms
            const updatedResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/dashboard-forms/${userData.id}?role=${userData.jabatan}&departmentId=${userData.departemen_id}`);
            if (updatedResponse.ok) {
              const data = await updatedResponse.json();
              setLeaveForms(data);
            }
          }
        } else {
          const errorData = await response.json();
          console.error(`Failed to ${actionType} leave request:`, errorData.message || response.statusText);
          alert(`Failed to ${actionType} leave request: ${errorData.message || response.statusText}`);
        }
      } catch (error) {
        console.error(`Error during ${actionType} action:`, error);
        alert(`An error occurred during ${actionType} action.`);
      }
    }
  };

  const filterFormsByRole = (forms) => {
    console.log('[App.js] filterFormsByRole - All forms received:', forms);
    console.log('[App.js] filterFormsByRole - User Data:', userData);

    if (!userData) return [];

    // Handle case where forms might be an object with ownForms and pendingApprovals
    let formsArray = [];
    if (Array.isArray(forms)) {
      formsArray = forms;
    } else if (forms && typeof forms === 'object') {
      // If forms is an object, combine ownForms and pendingApprovals
      formsArray = [
        ...(Array.isArray(forms.ownForms) ? forms.ownForms : []),
        ...(Array.isArray(forms.pendingApprovals) ? forms.pendingApprovals : [])
      ];
    }

    // The backend now handles most of the filtering based on role and department.
    // This frontend filter primarily ensures that only forms relevant to the user's direct view are shown,
    // especially for their own forms or those explicitly needing their action.
    return formsArray.filter(form => {
      // Always include own forms (draft, pending, approved, rejected)
      if (String(form.karyawan_id) === String(userData.id)) {
        return true;
      }

      // Include forms pending approval for the current user's role
      // The backend query already filters by department for Supervisor/Manager and by current_approver_level
      // So, here we just need to check if the form is pending and the current user is the designated approver.
      if (form.status === 'pending') {
        switch (userData.jabatan) {
          case 'supervisor':
            return form.current_approver_level === 'Supervisor';
          case 'manager':
            return form.current_approver_level === 'Manager';
          case 'hr_manager':
            return form.current_approver_level === 'HR Manager';
          default:
            return false;
        }
      }
      return false;
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sistem Manajemen Cuti</h1>
        {userData && (
          <nav>
            <span>Welcome, {userData.nama} ({userData.jabatan})</span> {/* Changed userData.role to userData.jabatan */}
            <button onClick={handleLogout}>Logout</button>
          </nav>
        )}
      </header>
      <main className="main-content">
        <Routes>
          {userData ? (
            <>
              {/* Redirect logged-in users from login/register to dashboard */}
              <Route path="/login" element={<Navigate to="/dashboard" />} />
              <Route path="/register" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={
                userData.jabatan === 'staff' ? (
                  <StaffDashboard leaveForms={filterFormsByRole(leaveForms)} onFormAction={handleFormAction} userData={userData} />
                ) : userData.jabatan === 'supervisor' ? (
                  <SupervisorDashboard leaveForms={filterFormsByRole(leaveForms)} onFormAction={handleFormAction} userData={userData} />
                ) : userData.jabatan === 'manager' ? (
                  <ManagerDashboard leaveForms={filterFormsByRole(leaveForms)} onFormAction={handleFormAction} userData={userData} />
                ) : userData.jabatan === 'hr_manager' ? (
                  <HRManagerDashboard leaveForms={filterFormsByRole(leaveForms)} onFormAction={handleFormAction} userData={userData} />
                ) : (
                  <Navigate to="/dashboard" />
                )
              } />
              <Route path="/create-leave" element={
                <LeaveForm
                  userId={userData.id}
                  userName={userData.nama}
                  userDepartment={userData.departemen}
                  userDepartmentId={userData.departemen_id} // Pass department ID
                  userRole={userData.jabatan}
                  onFormAction={handleFormAction}
                />
              } />
              <Route path="/edit-leave/:id" element={
                <LeaveForm
                  userId={userData.id}
                  userName={userData.nama}
                  userDepartment={userData.departemen}
                  userDepartmentId={userData.departemen_id} // Pass department ID
                  userRole={userData.jabatan}
                  onFormAction={handleFormAction}
                />
              } />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />
              <Route path="/register" element={<RegisterForm onRegisterSuccess={handleRegisterSuccess} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

export default App;
