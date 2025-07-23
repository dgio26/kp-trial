import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function StaffDashboard({ leaveForms, userData, children }) {
  // Staff can only see their own leave requests
  const staffLeaveForms = leaveForms.filter(form => 
    String(form.karyawan_id) === String(userData.id)
  );

  return (
    <div className="dashboard-container">
      <h2>Staff Dashboard</h2>

      <div className="dashboard-actions">
        <Link to="/create-leave" className="create-leave-button">
          Create New Leave Request
        </Link>
      </div>

      {children}

      {staffLeaveForms.length === 0 ? (
        <p>No leave requests to display.</p>
      ) : (
        <div className="leave-requests-grid">
          {staffLeaveForms.map((form) => (
            <div key={form.id} className="leave-card">
              <h3>My Leave Request</h3>
              <p><strong>Department:</strong> {form.nama_departemen}</p>
              <p><strong>Role:</strong> {form.nama_jabatan}</p>
              <p><strong>Start Date:</strong> {new Date(form.tanggal_mulai).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {new Date(form.tanggal_selesai).toLocaleDateString()}</p>
              <p><strong>Reason:</strong> {form.alasan}</p>
              <p><strong>Status:</strong> {form.status}</p>

              {form.alasan_reject && (
                <p className="reject-reason">
                  <strong>Reject Reason:</strong> {form.alasan_reject}
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