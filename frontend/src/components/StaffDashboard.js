import React from 'react';
import Dashboard from './Dashboard';

function StaffDashboard({ leaveForms, onFormAction, userData }) {
  return (
    <Dashboard role="staff" leaveForms={leaveForms} onFormAction={onFormAction} userData={userData}>
      {/* Staff-specific content can go here if needed */}
    </Dashboard>
  );
}

export default StaffDashboard;
