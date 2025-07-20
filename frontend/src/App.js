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
          setUserData({ ...parsedUser, id: parseInt(parsedUser.id) });
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
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/dashboard-forms/${userData.id}?role=${userData.jabatan}&department=${userData.departemen}`);
          if (response.ok) {
            const data = await response.json();
            setLeaveForms(data);
          } else {
            console.error('Failed to fetch dashboard leave forms:', response.statusText);
            setLeaveForms([]);
          }
        } catch (error) {
          console.error('Error fetching dashboard leave forms:', error);
          setLeaveForms([]);
        }
      }
    };
    fetchLeaveForms();
  }, [userData]);

  const handleLoginSuccess = (user) => {
    setUserData(user);
    localStorage.setItem('userData', JSON.stringify(user)); // Store user data
    console.log('Login successful. User data:', user);
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
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/dashboard-forms/${userData.id}?role=${userData.jabatan}&department=${userData.departemen}`);
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/action/${formId}`, {
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
            const updatedResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/dashboard-forms/${userData.id}?role=${userData.jabatan}&department=${userData.departemen}`);
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

    // The backend now handles most of the filtering based on role and department.
    // This frontend filter primarily ensures that only forms relevant to the user's direct view are shown,
    // especially for their own forms or those explicitly needing their action.
    return forms.filter(form => {
      console.log(`[App.js] Filtering form ID: ${form.id}, Status: ${form.status}, Karyawan ID: ${form.id_karyawan}, Jabatan: ${form.jabatan}`);
      console.log(`[App.js] userData.id: ${userData.id} (Type: ${typeof userData.id}), form.id_karyawan: ${form.id_karyawan} (Type: ${typeof form.id_karyawan})`);
      console.log(`[App.js] User Jabatan for filtering: ${userData.jabatan}`);
      
      let shouldInclude = false;
      
      // Always include own forms
      if (String(form.id_karyawan) === String(userData.id)) {
        shouldInclude = true;
      } else {
        // Include forms pending approval for the current user's role and department
        switch (userData.jabatan) {
          case 'supervisor':
            shouldInclude = form.departemen === userData.departemen && form.jabatan === 'staff' && form.status === 'pending_supervisor';
            break;
          case 'manager':
            shouldInclude = form.departemen === userData.departemen && (form.jabatan === 'staff' || form.jabatan === 'supervisor') && form.status === 'pending_manager';
            break;
          case 'hr_manager':
            shouldInclude = form.status === 'pending_hr_manager'; // HR Manager sees all pending HR Manager forms
            break;
          default:
            shouldInclude = false;
        }
      }
      
      console.log(`[App.js] Form ID: ${form.id} - Included: ${shouldInclude}`);
      return shouldInclude;
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
                  userRole={userData.jabatan}
                  onFormAction={handleFormAction}
                />
              } />
              <Route path="/edit-leave/:id" element={
                <LeaveForm
                  userId={userData.id}
                  userName={userData.nama}
                  userDepartment={userData.departemen}
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
