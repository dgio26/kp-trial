import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function StaffDashboard({ leaveForms, userData, children }) {
  const staffLeaveForms = leaveForms.filter(form => 
    String(form.karyawan_id) === String(userData.id)
  );

  const [filterStatus, setFilterStatus] = useState('all');

  const filteredLeaveForms = staffLeaveForms.filter((form) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'draft') return form.status?.toLowerCase() === 'draft';
    if (filterStatus === 'pending') return form.status?.toLowerCase().includes('pending');
    if (filterStatus === 'approved') return form.status?.toLowerCase() === 'approved';
    if (filterStatus === 'rejected') return form.status?.toLowerCase() === 'rejected';
    return true;
  });

  return (
    <div className="dashboard-container">
      <h2>Staff Dashboard</h2>

      <div className="dashboard-actions">
        <Link to="/create-leave" className="create-leave-button">
          Create New Leave Request
        </Link>

        <div className="filter-section">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select 
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Requests</option>
            <option value="draft">Draft Requests</option>
            <option value="pending">Pending Requests</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {children}

      <div className="stats-section">
        <div className="stat-card">
          <h4>Total Requests</h4>
          <span className="stat-number">{staffLeaveForms.length}</span>
        </div>
        <div className="stat-card">
          <h4>Approved</h4>
          <span className="stat-number">
            {staffLeaveForms.filter(form => form.status?.toLowerCase() === 'approved').length}
          </span>
        </div>
      </div>

      {filteredLeaveForms.length === 0 ? (
        <p>No leave requests to display.</p>
      ) : (
        <div className="leave-requests-grid">
          {filteredLeaveForms.map((form) => (
            <div key={form.id} className="leave-card">
              <h3>My Leave Request</h3>
              <p><strong>Employee ID:</strong> {form.karyawan_id}</p>
              <p><strong>Department:</strong> {form.nama_departemen}</p>
              <p><strong>Role:</strong> {form.nama_jabatan}</p>
              <p><strong>Start Date:</strong> {new Date(form.tanggal_mulai).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {new Date(form.tanggal_selesai).toLocaleDateString()}</p>
              <p><strong>Total Days:</strong> {form.total_hari}</p>
              <p><strong>Reason:</strong> {form.alasan}</p>
              <p><strong>Status:</strong> 
                <span className={`status-badge ${form.status?.toLowerCase().includes('pending approval') && Number(form.current_approver_level) === 2
                    ? 'status-pending-approval-supervisor'
                    : form.status?.toLowerCase().includes('pending approval') && Number(form.current_approver_level) === 3
                    ? 'status-pending-approval-manager'
                    : form.status?.toLowerCase().includes('pending approval') && Number(form.current_approver_level) === 4
                    ? 'status-pending-approval-hr-manager'
                    : `status-${form.status?.toLowerCase().replace(/ /g, '-')}`
                  }`}>
                  {form.status?.toLowerCase().includes('pending approval') && Number(form.current_approver_level) === 2
                    ? 'Awaiting Supervisor'
                    : form.status?.toLowerCase().includes('pending approval') && Number(form.current_approver_level) === 3
                    ? 'Awaiting Manager'
                    : form.status?.toLowerCase().includes('pending approval') && Number(form.current_approver_level) === 4
                    ? 'Awaiting HR Manager'
                    : form.status}
                </span>
              </p>

              {form.alasan_reject && (
                <p className="reject-reason">
                  <strong>Reject Reason:</strong> {form.alasan_reject}
                </p>
              )}

              {form.diajukan_oleh_nama && form.tanggal_pengajuan && form.status?.toLowerCase() !== 'draft' && (
                <p>
                  <strong>Submitted By:</strong> {form.diajukan_oleh_nama} on {new Date(form.tanggal_pengajuan).toLocaleDateString()}
                </p>
              )}

              {form.disetujui_oleh && form.tanggal_persetujuan && (
                <p>
                  <strong>Approved By:</strong> {form.disetujui_oleh_nama} on {new Date(form.tanggal_persetujuan).toLocaleDateString()}
                </p>
              )}

              {/* Staff can edit their own forms if draft or rejected */}
              {(form.status === 'draft' || form.status === 'rejected') && (
                <div className="card-actions">
                  <Link to={`/edit-leave/${form.id}`} className="edit-button">
                    Edit
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StaffDashboard;
