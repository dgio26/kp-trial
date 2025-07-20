import React, { useState, useEffect } from 'react'; // Import useEffect
import { useNavigate, Link } from 'react-router-dom';
import './RegisterForm.css'; // Assuming you'll create this CSS file

function RegisterForm({ onRegisterSuccess }) {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departemen, setDepartemen] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State for dropdown options
  const [departemenOptions, setDepartemenOptions] = useState([]);
  const [jabatanOptions, setJabatanOptions] = useState([]);

  const navigate = useNavigate();

  // Fetch departments and job titles on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch departments
        const departemenResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/departemen`);
        if (!departemenResponse.ok) throw new Error('Failed to fetch departments');
        const departemenData = await departemenResponse.json();
        // Ensure departemenData is always an array before setting state
        setDepartemenOptions(Array.isArray(departemenData) ? departemenData : []);

        // Fetch job titles
        const jabatanResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/jabatan`);
        if (!jabatanResponse.ok) throw new Error('Failed to fetch job titles');
        const jabatanData = await jabatanResponse.json();
        // Ensure jabatanData is always an array before setting state
        setJabatanOptions(Array.isArray( jabatanData) ?  jabatanData : []);
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
        setError('Failed to load dropdown options. Please try again later.');
      }
    };

    fetchDropdownData();
  }, []); // Empty dependency array means this effect runs once on mount

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }

    // Ensure a department and jabatan are selected
    if (!departemen || !jabatan) {
        setError('Please select both department and job title.');
        return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nama, email, password, confirmPassword, departemen, jabatan }),
      });

      if (response.ok) {
        setSuccess('Registration successful! You can now log in.');
        onRegisterSuccess();
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration. Please try again later.');
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="nama">Nama:</label>
          <input
            type="text"
            id="nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="departemen">Departemen:</label>
          {/* Changed input to select and mapped options */}
          <select
            id="departemen"
            value={departemen}
            onChange={(e) => setDepartemen(e.target.value)}
            required
          >
            <option value="">Select Departemen</option>
            {departemenOptions.map((dept) => (
              <option key={dept.id} value={dept.nama_departemen}>
                {dept.nama_departemen}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="jabatan">Jabatan:</label>
          {/* Changed select to use fetched options */}
          <select
            id="jabatan"
            value={jabatan}
            onChange={(e) => setJabatan(e.target.value)}
            required
          >
            <option value="">Select Jabatan</option>
            {jabatanOptions.map((job) => (
              <option key={job.id} value={job.nama_jabatan}>
                {job.nama_jabatan}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="register-button">Register</button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>
      <p className="login-link">
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

export default RegisterForm;
