import React from 'react';
import Dashboard from './Dashboard';

function HRManagerDashboard({ leaveForms, onFormAction, userData }) {
  return (
    <Dashboard role="hr_manager" leaveForms={leaveForms} onFormAction={onFormAction} userData={userData}>
      {/* HR Manager-specific content can go here if needed */}
    </Dashboard>
  );
}

export default HRManagerDashboard;
