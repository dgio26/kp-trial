import React from 'react';
import Dashboard from './Dashboard';

function SupervisorDashboard({ leaveForms, onFormAction, userData }) {
  return (
    <Dashboard role="supervisor" leaveForms={leaveForms} onFormAction={onFormAction} userData={userData}>
      {/* Supervisor-specific content can go here if needed */}
    </Dashboard>
  );
}

export default SupervisorDashboard;
