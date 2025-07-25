import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import StaffDashboard from './StaffDashboard';
import SupervisorDashboard from './SupervisorDashboard';
import ManagerDashboard from './ManagerDashboard';
import HRManagerDashboard from './HRManagerDashboard';

const DashboardRouter = ({ dashboardData, onFormAction, userData }) => {
  const { role, id } = useParams();

  if (!userData || String(userData.id) !== id || userData.jabatan !== role) {
    return <Navigate to="/login" />;
  }

  const { ownForms = [], pendingApprovals = [] } = dashboardData;

  switch (role) {
    case 'staff':
      return (
        <StaffDashboard 
          leaveForms={[...ownForms, ...pendingApprovals]} 
          ownForms={ownForms}
          pendingApprovals={pendingApprovals}
          onFormAction={onFormAction} 
          userData={userData} 
        />
      );
    case 'supervisor':
      return (
        <SupervisorDashboard 
          leaveForms={[...ownForms, ...pendingApprovals]} 
          ownForms={ownForms}
          pendingApprovals={pendingApprovals}
          onFormAction={onFormAction} 
          userData={userData} 
          departmentId={userData.departemen_id} 
        />
      );
    case 'manager':
      return (
        <ManagerDashboard 
          leaveForms={[...ownForms, ...pendingApprovals]} 
          ownForms={ownForms}
          pendingApprovals={pendingApprovals}
          onFormAction={onFormAction} 
          userData={userData} 
          departmentId={userData.departemen_id} 
        />
      );
    case 'hr_manager':
      return (
        <HRManagerDashboard 
          leaveForms={[...ownForms, ...pendingApprovals]} 
          ownForms={ownForms}
          pendingApprovals={pendingApprovals}
          onFormAction={onFormAction} 
          userData={userData} 
        />
      );
    default:
      return <Navigate to="/login" />;
  }
};

export default DashboardRouter;
