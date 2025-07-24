import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function SupervisorDashboard({ ownForms, pendingApprovals, onFormAction, userData, children }) {
  const [showRejectReasonInput, setShowRejectReasonInput] = useState(false);
  const [currentRejectFormId, setCurrentRejectFormId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Use the separated data directly from props
  const supervisorOwnForms = ownForms || [];
  const supervisorPendingForms = pendingApprovals || []; // These should be forms with current_approver_level === 2
  
  // Combine for display
  const allForms = [...supervisorOwnForms, ...supervisorPendingForms];

  const filteredLeaveForms = allForms.filter((form) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'draft') return form.status?.toLowerCase() === 'draft';
    if (filterStatus === 'pending') return form.status?.toLowerCase().includes('pending');
    if (filterStatus === 'approved') return form.status?.toLowerCase() === 'approved';
    if (filterStatus === 'rejected') return form.status?.toLowerCase() === 'rejected';
    if (filterStatus === 'need_supervisor_approval') {
      return form.status?.toLowerCase().includes('pending approval') &&
             Number(form.current_approver_level) === 2;
    }
    return true;
  });

  const handleRejectClick = (formId) => {
    setCurrentRejectFormId(formId);
    setShowRejectReasonInput(true);
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (currentRejectFormId && rejectReason.trim() !== '') {
      // When supervisor rejects, the form should return to draft status for the original requester
      onFormAction(currentRejectFormId, 'reject', 'supervisor', rejectReason);
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
      <h2>Supervisor Dashboard</h2>

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
            <option value="need_supervisor_approval">Need Supervisor Approval</option>
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
          <span className="stat-number">{allForms.length}</span>
        </div>
        <div className="stat-card">
          <h4>Need Supervisor Approval</h4>
          <span className="stat-number">
            {allForms.filter(form => 
              form.status?.toLowerCase().includes('pending approval') &&
              Number(form.current_approver_level) === 2
            ).length}
          </span>
        </div>
        <div className="stat-card">
          <h4>Approved</h4>
          <span className="stat-number">
            {allForms.filter(form => form.status?.toLowerCase() === 'approved').length}
          </span>
        </div>
      </div>

      {filteredLeaveForms.length === 0 ? (
        <p>No leave requests to display.</p>
      ) : (
        <div className="leave-requests-grid">
          {filteredLeaveForms.map((form) => {
            const isOwnRequest = String(form.karyawan_id) === String(userData.id);
            const needsApproval = !isOwnRequest &&
                                form.status?.toLowerCase().startsWith('pending approval') &&
                                Number(form.current_approver_level) === 2; // Supervisor approval level is 2

            return (
              <div key={form.id} className="leave-card">
                <h3>
                  {isOwnRequest ? 'My Leave Request' : `Leave Request for ${form.nama_karyawan}`}
                </h3>
                <p><strong>Employee ID:</strong> {form.karyawan_id}</p>
                <p><strong>Department:</strong> {form.nama_departemen}</p>
                <p><strong>Role:</strong> {form.nama_jabatan}</p>
                <p><strong>Start Date:</strong> {new Date(form.tanggal_mulai).toLocaleDateString()}</p>
                <p><strong>End Date:</strong> {new Date(form.tanggal_selesai).toLocaleDateString()}</p>
                <p><strong>Total Days:</strong> {form.total_hari}</p>
                <p><strong>Reason:</strong> {form.alasan}</p>
                <p><strong>Status:</strong> 
                  <span className={`status-badge status-${form.status?.toLowerCase().replace(' ', '-')}`}>
                    {form.status}
                  </span>
                </p>

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

                {/* Edit own forms (draft or rejected) */}
                {isOwnRequest && (form.status === 'draft' || form.status === 'rejected') && (
                  <div className="card-actions">
                    <Link to={`/edit-leave/${form.id}`} className="edit-button">
                      Edit
                    </Link>
                  </div>
                )}

                {/* Supervisor approval for staff requests */}
                {needsApproval && (
                  <div className="card-actions">
                    <button 
                      onClick={() => onFormAction(form.id, 'approve', 'supervisor')} 
                      className="approve-button"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleRejectClick(form.id)} 
                      className="reject-button"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showRejectReasonInput && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Enter Rejection Reason</h3>
            <p>This request will be returned to draft status for the employee to revise.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows="5"
            ></textarea>
            <div className="modal-actions">
              <button onClick={handleConfirmReject} className="confirm-button">
                Confirm Rejection
              </button>
              <button onClick={handleCancelReject} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupervisorDashboard;