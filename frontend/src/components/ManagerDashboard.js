import React from 'react';
import Dashboard from './Dashboard';

function ManagerDashboard({ leaveForms, onFormAction, userData }) {
  return (
    <Dashboard role="manager" leaveForms={leaveForms} onFormAction={onFormAction} userData={userData}>
      {/* Manager-specific content can go here if needed */}
    </Dashboard>
  );
}

export default ManagerDashboard;
