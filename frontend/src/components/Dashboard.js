import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function Dashboard({ role, leaveForms, onFormAction, userData, children }) {
  const [showRejectReasonInput, setShowRejectReasonInput] = useState(false);
  const [currentRejectFormId, setCurrentRejectFormId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Ensure the role is consistently lowercase for internal component logic
  const normalizedRole = role.toLowerCase();

  const handleRejectClick = (formId) => {
    setCurrentRejectFormId(formId);
    setShowRejectReasonInput(true);
    setRejectReason(''); // Clear previous reason
  };

  const handleConfirmReject = () => {
    if (currentRejectFormId && rejectReason.trim() !== '') {
      onFormAction(currentRejectFormId, 'reject', role, rejectReason);
      setShowRejectReasonInput(false);
      setCurrentRejectFormId(null);
      setRejectReason('');
    } else {
      alert('Please provide a reason for rejection.');
    }
  };

  const handleCancelReject = () => {
    setShowRejectReasonInput(false);
    setCurrentRejectFormId(null);
    setRejectReason('');
  };

  return (
    <div className="dashboard-container">
      <h2>{role} Dashboard</h2>

      {(normalizedRole === 'staff' || normalizedRole === 'supervisor' || normalizedRole === 'manager') && (
        <div className="dashboard-actions">
          <Link to="/create-leave" className="create-leave-button">Create New Leave Request</Link>
        </div>
      )}

      {children} {/* This will render role-specific content */}

      {leaveForms.length === 0 ? (
        <p>No leave requests to display.</p>
      ) : (
        <div className="leave-requests-grid">
          {leaveForms.map((form) => (
            <div key={form.id} className="leave-card">
              <h3>Leave Request for {form.nama_karyawan}</h3>
              <p><strong>Department:</strong> {form.nama_departemen}</p>
              <p><strong>Role:</strong> {form.nama_jabatan}</p>
              <p><strong>Start Date:</strong> {new Date(form.tanggal_mulai).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {new Date(form.tanggal_selesai).toLocaleDateString()}</p>
              <p><strong>Reason:</strong> {form.alasan}</p>
              <p><strong>Status:</strong> {form.status === 'pending' ? `Pending ${form.current_approver_level} Approval` : form.status}</p>
              {form.alasan_reject && <p className="reject-reason"><strong>Reject Reason:</strong> {form.alasan_reject}</p>}
              {form.disetujui_oleh && <p><strong>Approved By:</strong> {form.disetujui_oleh_nama} on {new Date(form.tanggal_persetujuan).toLocaleDateString()}</p>}

              {/* Actions based on role and status */}
              {/* Edit for own forms (draft or rejected) */}
              {String(form.karyawan_id) === String(userData.id) && (form.status === 'draft' || form.status === 'rejected') && (
                <div className="card-actions">
                  <Link to={`/edit-leave/${form.id}`} className="edit-button">Edit</Link>
                </div>
              )}

              {/* Approval actions for supervisors */}
              {normalizedRole === 'supervisor' && form.status === 'pending' && form.current_approver_level === 'Supervisor' && (
                <div className="card-actions">
                  <button onClick={() => onFormAction(form.id, 'approve', 'supervisor')} className="approve-button">Approve</button>
                  <button onClick={() => handleRejectClick(form.id)} className="reject-button">Reject</button>
                </div>
              )}

              {/* Approval actions for managers */}
              {normalizedRole === 'manager' && form.status === 'pending' && form.current_approver_level === 'Manager' && (
                <div className="card-actions">
                  <button onClick={() => onFormAction(form.id, 'approve', 'manager')} className="approve-button">Approve</button>
                  <button onClick={() => handleRejectClick(form.id)} className="reject-button">Reject</button>
                </div>
              )}

              {/* Approval actions for HR managers */}
              {normalizedRole === 'hr_manager' && form.status === 'pending' && form.current_approver_level === 'HR Manager' && (
                <div className="card-actions">
                  <button onClick={() => onFormAction(form.id, 'approve', 'hr_manager')} className="approve-button">Approve</button>
                  <button onClick={() => handleRejectClick(form.id)} className="reject-button">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showRejectReasonInput && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Enter Rejection Reason</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows="5"
            ></textarea>
            <div className="modal-actions">
              <button onClick={handleConfirmReject} className="confirm-button">Confirm</button>
              <button onClick={handleCancelReject} className="cancel-button">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
