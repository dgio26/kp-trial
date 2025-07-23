import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './LeaveForm.css';

function LeaveForm({ userId, userName, userDepartment, userDepartmentId, userRole, onFormAction }) {
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
  const [sisaCuti, setSisaCuti] = useState(12); // Remaining leave days from backend

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/karyawan/${selectedEmployeeId}`);
        if (response.ok) {
          const data = await response.json();
          setSisaCuti(data.sisa_cuti || 12);
        } else {
          console.error('Failed to fetch user data:', response.statusText);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    if (selectedEmployeeId) {
      fetchUserData();
    }

    if (id) {
      setIsEditing(true);
      // Fetch existing leave request data for editing
      const fetchLeaveRequest = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cuti/${id}`);
          if (response.ok) {
            const data = await response.json();
            setNamaKaryawan(data.nama_karyawan);
            setDepartemen(data.nama_departemen);
            setTanggalMulai(new Date(data.tanggal_mulai));
            setTanggalAkhir(new Date(data.tanggal_selesai));
            setAlasan(data.alasan);
            setSelectedEmployeeId(data.karyawan_id);
            setSelectedEmployeeRole(data.nama_jabatan);
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
  }, [id, userName, userDepartment, userDepartmentId, userId, userRole]);

  // Separate useEffect to fetch user data when selectedEmployeeId changes
  useEffect(() => {
    const fetchSelectedEmployeeData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/karyawan/${selectedEmployeeId}`);
        if (response.ok) {
          const data = await response.json();
          setSisaCuti(data.sisa_cuti || 12);
        } else {
          console.error('Failed to fetch selected employee data:', response.statusText);
        }
      } catch (err) {
        console.error('Error fetching selected employee data:', err);
      }
    };

    if (selectedEmployeeId) {
      fetchSelectedEmployeeData();
    }
  }, [selectedEmployeeId]);

  const fetchEmployeesInDepartment = async () => {
    try {
      // Use userDepartmentId for fetching employees
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/karyawan/by-departemen/${userDepartmentId}`);
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
      let count = 0;
      const current = new Date(tanggalMulai);
      const end = new Date(tanggalAkhir);

      while (current <= end) {
        const dayOfWeek = current.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }

      return count;
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

    if (status === 'submit' && leaveDays > sisaCuti) {
      setError(`Total leave days (${leaveDays}) exceed your remaining leave (${sisaCuti} days).`);
      return;
    }

    // Fix timezone issue by using local date string
    const formatDateForBackend = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const leaveData = {
      karyawan_id: parseInt(selectedEmployeeId),
      tanggal_mulai: formatDateForBackend(tanggalMulai),
      tanggal_selesai: formatDateForBackend(tanggalAkhir),
      alasan,
      submit: status === 'submit'
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

      // Debug the response
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Get response text first to check what we're receiving
      const responseText = await response.text();
      console.log('Raw response:', responseText.substring(0, 200));
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response was not valid JSON:', responseText);
        throw new Error('Server returned invalid response format');
      }

      if (response.ok) {
        // Remove the problematic second API call for now
        // The backend should handle the submission status based on the 'submit' field
        
        setSuccess(`Leave request ${isEditing ? 'updated' : 'created'} and saved as ${status}.`);
        if (onFormAction) {
          onFormAction(null, status);
        }
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setError(responseData.message || `Failed to ${isEditing ? 'update' : 'create'} leave request.`);
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
          <label htmlFor="tanggalAkhir">Tanggal Selesai:</label>
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
        <p>Remaining Leave Days: {sisaCuti}</p>

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
