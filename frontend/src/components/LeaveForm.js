import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './LeaveForm.css';

function LeaveForm({ userId, userName, userDepartment, userRole, onFormAction }) {
  const { id } = useParams(); // Get leave ID from URL for editing
  const navigate = useNavigate();

  const [namaKaryawan, setNamaKaryawan] = useState(userName);
  const [departemen, setDepartemen] = useState(userDepartment);
  const [tanggalMulai, setTanggalMulai] = useState(null);
  const [tanggalAkhir, setTanggalAkhir] = useState(null);
  const [alasan, setAlasan] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(userId);
  const [selectedEmployeeRole, setSelectedEmployeeRole] = useState(userRole);

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      // Fetch existing leave request data for editing
      const fetchLeaveRequest = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/${id}`);
          if (response.ok) {
            const data = await response.json();
            setNamaKaryawan(data.nama_karyawan);
            setDepartemen(data.departemen);
            setTanggalMulai(new Date(data.tanggal_mulai));
            setTanggalAkhir(new Date(data.tanggal_akhir));
            setAlasan(data.alasan);
            setSelectedEmployeeId(data.id_karyawan);
            setSelectedEmployeeRole(data.jabatan); // Set the role of the employee whose leave is being edited
          } else {
            console.error('Failed to fetch leave request for editing:', response.statusText);
            setError('Failed to load leave request for editing.');
          }
        } catch (err) {
          console.error('Error fetching leave request:', err);
          setError('An error occurred while loading the leave request.');
        }
      };
      fetchLeaveRequest();
    } else {
      setIsEditing(false);
      // For new forms, ensure current user's data is pre-filled
      setNamaKaryawan(userName);
      setDepartemen(userDepartment);
      setSelectedEmployeeId(userId);
      setSelectedEmployeeRole(userRole);
    }
  }, [id, userName, userDepartment, userId, userRole]);

  const fetchEmployeesInDepartment = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/karyawan/departemen/${userDepartment}`);
      if (response.ok) {
        const data = await response.json();
        setEmployeeList(data);
        setShowEmployeeList(true);
      } else {
        console.error('Failed to fetch employee list:', response.statusText);
        setError('Failed to fetch employee list.');
      }
    } catch (err) {
      console.error('Error fetching employee list:', err);
      setError('An error occurred while fetching employee list.');
    }
  };

  const handleEmployeeSelect = (employee) => {
    setNamaKaryawan(employee.nama);
    setSelectedEmployeeId(employee.id);
    setSelectedEmployeeRole(employee.jabatan); // Set the role of the selected employee
    setShowEmployeeList(false);
  };

  const calculateLeaveDays = () => {
    if (tanggalMulai && tanggalAkhir) {
      const diffTime = Math.abs(tanggalAkhir.getTime() - tanggalMulai.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include start day
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async (status) => {
    setError('');
    setSuccess('');

    if (!tanggalMulai || !tanggalAkhir || !alasan) {
      setError('Please fill in all required fields (Start Date, End Date, Reason).');
      return;
    }

    if (tanggalMulai > tanggalAkhir) {
      setError('End Date cannot be before Start Date.');
      return;
    }

    const leaveDays = calculateLeaveDays();
    if (leaveDays > 12) {
      setError(`Total leave days (${leaveDays}) exceed the maximum allowed (12 days).`);
      return;
    }

    const leaveData = {
      id_karyawan: selectedEmployeeId,
      nama_karyawan: namaKaryawan,
      departemen: departemen,
      jabatan: selectedEmployeeRole, // Use the role of the selected employee
      tanggal_mulai: tanggalMulai.toISOString().split('T')[0],
      tanggal_akhir: tanggalAkhir.toISOString().split('T')[0],
      alasan,
      status: status === 'draft' ? 'draft' : (
        userRole === 'staff' || userRole === 'supervisor' ? 'pending_supervisor' :
        userRole === 'manager' ? 'pending_hr_manager' :
        userRole === 'hr_manager' ? 'approved' : 'draft' // HR Manager's own leave is auto-approved for now
      ),
    };

    try {
      let response;
      if (isEditing) {
        response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(leaveData),
        });
      } else {
        response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(leaveData),
        });
      }

      if (response.ok) {
        setSuccess(`Leave request ${isEditing ? 'updated' : 'created'} and saved as ${status}.`);
        onFormAction(null, status); // Trigger re-fetch in App.js, passing status as actionType
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} leave request.`);
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError('An error occurred during form submission. Please try again later.');
    }
  };

  return (
    <div className="leave-form-container">
      <h2>{isEditing ? 'Edit Leave Request' : 'Create New Leave Request'}</h2>
      <form className="leave-form">
        <div className="form-group">
          <label htmlFor="namaKaryawan">Nama Karyawan:</label>
          <div className="input-with-button">
            <input
              type="text"
              id="namaKaryawan"
              value={namaKaryawan}
              readOnly // Name is auto-filled
            />
            <button type="button" onClick={fetchEmployeesInDepartment} className="small-button">
              List All Names
            </button>
          </div>
          {showEmployeeList && (
            <div className="employee-list-dropdown">
              {employeeList.length > 0 ? (
                <ul>
                  {employeeList.map((emp) => (
                    <li key={emp.id} onClick={() => handleEmployeeSelect(emp)}>
                      {emp.nama} ({emp.jabatan})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No other employees found in your department.</p>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="departemen">Departemen:</label>
          <input
            type="text"
            id="departemen"
            value={departemen}
            readOnly // Department is auto-filled
          />
        </div>

        <div className="form-group">
          <label htmlFor="tanggalMulai">Tanggal Mulai:</label>
          <DatePicker
            selected={tanggalMulai}
            onChange={(date) => setTanggalMulai(date)}
            selectsStart
            startDate={tanggalMulai}
            endDate={tanggalAkhir}
            dateFormat="yyyy/MM/dd"
            placeholderText="Select start date"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="tanggalAkhir">Tanggal Akhir:</label>
          <DatePicker
            selected={tanggalAkhir}
            onChange={(date) => setTanggalAkhir(date)}
            selectsEnd
            startDate={tanggalMulai}
            endDate={tanggalAkhir}
            minDate={tanggalMulai}
            dateFormat="yyyy/MM/dd"
            placeholderText="Select end date"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="alasan">Alasan Cuti:</label>
          <textarea
            id="alasan"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows="4"
            required
          ></textarea>
        </div>

        <p>Total Days: {calculateLeaveDays()}</p>

        <div className="form-actions">
          <button type="button" onClick={() => handleSubmit('draft')} className="save-draft-button">
            Save to Draft
          </button>
          <button type="button" onClick={() => handleSubmit('submit')} className="submit-button">
            Submit
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>
    </div>
  );
}

export default LeaveForm;
