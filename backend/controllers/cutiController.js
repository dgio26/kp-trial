const pool = require('../config/database');

exports.ajukanCuti = async (req, res) => {
  const { karyawan_id, tanggal_mulai, tanggal_selesai, alasan, submit } = req.body;

  try {
    const jabatanResult = await pool.query(
      `SELECT j.nama_jabatan AS jabatan, j.level
       FROM karyawan k
       JOIN jabatan j ON k.jabatan_id = j.id
       WHERE k.id = $1`,
      [karyawan_id]
    );

    if (jabatanResult.rowCount === 0) {
      return res.status(404).json({ message: 'Karyawan tidak ditemukan.' });
    }

    const { jabatan, level } = jabatanResult.rows[0];

    let status = 'draft';
    let current_approver_level = 2; // default ke Supervisor

    if (submit) {
      current_approver_level = level + 1; // Atasan langsung
      status = `Pending Approval Level ${current_approver_level}`;
    }

    const result = await pool.query(
      `INSERT INTO cuti (karyawan_id, tanggal_mulai, tanggal_selesai, alasan, status, current_approver_level, diajukan_oleh)
       VALUES ($1, $2, $3, $4, $5, $6, $1) RETURNING *`,
      [karyawan_id, tanggal_mulai, tanggal_selesai, alasan, status, current_approver_level]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Error in ajukanCuti:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPengajuanByKaryawan = async (req, res) => {
  const { karyawan_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM cuti WHERE karyawan_id = $1 ORDER BY created_at DESC`,
      [karyawan_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error in getPengajuanByKaryawan:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getDetailPengajuan = async (req, res) => {
  const { cuti_id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM cuti WHERE id = $1`, [cuti_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Pengajuan tidak ditemukan.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in getDetailPengajuan:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updatePengajuan = async (req, res) => {
  const { cuti_id } = req.params;
  const { tanggal_mulai, tanggal_selesai, alasan, submit } = req.body;

  console.log('Request params:', req.params);
  console.log('Request body:', req.body);

  try {
    // Check if pengajuan exists
    console.log('Checking pengajuan with ID:', cuti_id);
    const pengajuan = await pool.query(`SELECT * FROM cuti WHERE id = $1`, [cuti_id]);
    
    if (pengajuan.rowCount === 0) {
      return res.status(404).json({ message: 'Pengajuan tidak ditemukan.' });
    }

    console.log('Current pengajuan status:', pengajuan.rows[0].status);
    
    if (!['draft', 'rejected'].includes(pengajuan.rows[0].status.toLowerCase()) && 
        !pengajuan.rows[0].status.toLowerCase().includes('pending')) {
      return res.status(400).json({ message: 'Hanya pengajuan draft, rejected, atau pending yang dapat diubah.' });
    }

    const karyawan_id = pengajuan.rows[0].karyawan_id;
    console.log('Getting jabatan for karyawan_id:', karyawan_id);
    
    const jabatanResult = await pool.query(
      `SELECT j.nama_jabatan AS jabatan, j.level FROM karyawan k
       JOIN jabatan j ON k.jabatan_id = j.id
       WHERE k.id = $1`,
      [karyawan_id]
    );

    if (jabatanResult.rowCount === 0) {
      return res.status(404).json({ message: 'Data karyawan atau jabatan tidak ditemukan.' });
    }

    const { jabatan, level } = jabatanResult.rows[0];
    console.log('Jabatan info:', { jabatan, level });

    let status = 'draft';
    let current_approver_level = 2;

    if (submit) {
      current_approver_level = level + 1;
      status = `Pending Approval Level ${current_approver_level}`;
    }

    console.log('Updating with:', { tanggal_mulai, tanggal_selesai, alasan, status, current_approver_level });

    const result = await pool.query(
      `UPDATE cuti SET tanggal_mulai = $1, tanggal_selesai = $2, alasan = $3, status = $4, current_approver_level = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [tanggal_mulai, tanggal_selesai, alasan, status, current_approver_level, cuti_id]
    );

    console.log('Update successful:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in updatePengajuan:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
};

exports.hapusPengajuan = async (req, res) => {
  const { cuti_id } = req.params;

  try {
    const pengajuan = await pool.query(`SELECT * FROM cuti WHERE id = $1`, [cuti_id]);
    if (pengajuan.rowCount === 0) {
      return res.status(404).json({ message: 'Pengajuan tidak ditemukan.' });
    }

    if (pengajuan.rows[0].status.toLowerCase() !== 'draft') {
      return res.status(400).json({ message: 'Hanya pengajuan draft yang dapat dihapus.' });
    }

    await pool.query(`DELETE FROM cuti WHERE id = $1`, [cuti_id]);
    res.json({ message: 'Pengajuan berhasil dihapus.' });
  } catch (err) {
    console.error('Error in hapusPengajuan:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboardForms = async (req, res) => {
  const { id } = req.params; // This 'id' is the user's ID
  const { role, departmentId } = req.query; // Get role and department from query parameters
  
  // Convert parameters to integers and validate
  const userId = parseInt(id, 10);
  const deptId = parseInt(departmentId, 10);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID parameter' });
  }
  
  if (role !== 'staff' && isNaN(deptId)) {
    return res.status(400).json({ error: 'Invalid departmentId parameter for non-staff role' });
  }

  console.log('getDashboardForms called with:', { userId, role, deptId });

  try {
    // Debug: Let's see what data exists in your database
    const debugQuery = `
      SELECT c.id, c.status, c.current_approver_level, k.nama AS nama_karyawan, k.departemen_id
      FROM cuti c
      JOIN karyawan k ON c.karyawan_id = k.id
      ORDER BY c.created_at DESC
      LIMIT 10
    `;
    const debugResult = await pool.query(debugQuery);
    console.log('DEBUG - Sample cuti records:', debugResult.rows);

    // First, get user's own forms
    const ownFormsQuery = `
      SELECT c.*, k.nama AS nama_karyawan, d.nama_departemen, j.nama_jabatan,
             app.nama AS disetujui_oleh_nama
      FROM cuti c
      JOIN karyawan k ON c.karyawan_id = k.id
      JOIN departemen d ON k.departemen_id = d.id
      JOIN jabatan j ON k.jabatan_id = j.id
      LEFT JOIN karyawan app ON c.disetujui_oleh = app.id
      WHERE c.karyawan_id = $1
      ORDER BY c.created_at DESC
    `;
    const ownFormsResult = await pool.query(ownFormsQuery, [userId]);
    console.log('DEBUG - Own forms found:', ownFormsResult.rows.length);
    
    let pendingFormsResult = { rows: [] };
    
    if (role === 'supervisor') {
      // Supervisor sees staff forms in their department pending supervisor approval (level 2)
      console.log('Fetching pending forms for supervisor with params:', [deptId, userId]);
      
      // Debug query - let's see what exists for this department
      const debugSupervisorQuery = `
        SELECT c.id, c.status, c.current_approver_level, k.nama, k.departemen_id
        FROM cuti c
        JOIN karyawan k ON c.karyawan_id = k.id
        WHERE k.departemen_id = $1 AND c.karyawan_id != $2
        ORDER BY c.created_at DESC
      `;
      const debugSupervisorResult = await pool.query(debugSupervisorQuery, [deptId, userId]);
      console.log('DEBUG - All forms in department for supervisor:', debugSupervisorResult.rows);
      
      const pendingFormsQuery = `
        SELECT c.*, k.nama AS nama_karyawan, d.nama_departemen, j.nama_jabatan,
               app.nama AS disetujui_oleh_nama
        FROM cuti c
        JOIN karyawan k ON c.karyawan_id = k.id
        JOIN departemen d ON k.departemen_id = d.id
        JOIN jabatan j ON k.jabatan_id = j.id
        LEFT JOIN karyawan app ON c.disetujui_oleh = app.id
        WHERE k.departemen_id = $1 
          AND c.current_approver_level = '2' 
          AND c.status LIKE 'Pending Approval%'
          AND c.karyawan_id != $2
        ORDER BY c.created_at DESC
      `;
      pendingFormsResult = await pool.query(pendingFormsQuery, [deptId, userId]);
      console.log('DEBUG - Supervisor pending forms found:', pendingFormsResult.rows.length);
      
    } else if (role === 'manager') {
      // Manager sees staff/supervisor forms in their department pending manager approval (level 3)
      console.log('Fetching pending forms for manager with params:', [deptId, userId]);
      
      // Debug query for manager
      const debugManagerQuery = `
        SELECT c.id, c.status, c.current_approver_level, k.nama, k.departemen_id
        FROM cuti c
        JOIN karyawan k ON c.karyawan_id = k.id
        WHERE k.departemen_id = $1 AND c.karyawan_id != $2
        ORDER BY c.created_at DESC
      `;
      const debugManagerResult = await pool.query(debugManagerQuery, [deptId, userId]);
      console.log('DEBUG - All forms in department for manager:', debugManagerResult.rows);
      
      const pendingFormsQuery = `
        SELECT c.*, k.nama AS nama_karyawan, d.nama_departemen, j.nama_jabatan,
               app.nama AS disetujui_oleh_nama
        FROM cuti c
        JOIN karyawan k ON c.karyawan_id = k.id
        JOIN departemen d ON k.departemen_id = d.id
        JOIN jabatan j ON k.jabatan_id = j.id
        LEFT JOIN karyawan app ON c.disetujui_oleh = app.id
        WHERE k.departemen_id = $1 
          AND c.current_approver_level = '3' 
          AND c.status LIKE 'Pending Approval%'
          AND c.karyawan_id != $2
        ORDER BY c.created_at DESC
      `;
      pendingFormsResult = await pool.query(pendingFormsQuery, [deptId, userId]);
      console.log('DEBUG - Manager pending forms found:', pendingFormsResult.rows.length);
      
    } else if (role === 'hr_manager') {
      // HR Manager sees all forms pending HR Manager approval (level 4) from any department
      console.log('Fetching pending forms for HR manager with params:', [userId]);
      
      // Debug query for HR manager
      const debugHRQuery = `
        SELECT c.id, c.status, c.current_approver_level, k.nama, k.departemen_id
        FROM cuti c
        JOIN karyawan k ON c.karyawan_id = k.id
        WHERE c.karyawan_id != $1
        ORDER BY c.created_at DESC
      `;
      const debugHRResult = await pool.query(debugHRQuery, [userId]);
      console.log('DEBUG - All forms for HR manager:', debugHRResult.rows);
      
      const pendingFormsQuery = `
        SELECT c.*, k.nama AS nama_karyawan, d.nama_departemen, j.nama_jabatan,
               app.nama AS disetujui_oleh_nama
        FROM cuti c
        JOIN karyawan k ON c.karyawan_id = k.id
        JOIN departemen d ON k.departemen_id = d.id
        JOIN jabatan j ON k.jabatan_id = j.id
        LEFT JOIN karyawan app ON c.disetujui_oleh = app.id
        WHERE c.current_approver_level = '4' 
          AND c.status LIKE 'Pending Approval%'
          AND c.karyawan_id != $1
        ORDER BY c.created_at DESC
      `;
      pendingFormsResult = await pool.query(pendingFormsQuery, [userId]);
      console.log('DEBUG - HR Manager pending forms found:', pendingFormsResult.rows.length);
    }
    
    console.log('Results:', {
      ownFormsCount: ownFormsResult.rows.length,
      pendingApprovalsCount: pendingFormsResult.rows.length
    });
    
    // Return structured data with separate sections
    res.json({
      ownForms: ownFormsResult.rows,
      pendingApprovals: pendingFormsResult.rows
    });
    
  } catch (err) {
    console.error('Error in getDashboardForms:', err);
    console.error('Error details:', err.stack);
    res.status(500).json({ 
      error: 'Failed to retrieve dashboard forms', 
      details: err.message, 
      stack: err.stack 
    });
  }
};

exports.handleCutiAction = async (req, res) => {
  const { cuti_id } = req.params;
  const { action, role, approverId, approverName, rejectReason } = req.body;

  try {
    const pengajuan = await pool.query(`SELECT * FROM cuti WHERE id = $1`, [cuti_id]);
    if (pengajuan.rowCount === 0) {
      return res.status(404).json({ message: 'Pengajuan tidak ditemukan.' });
    }

    const cuti = pengajuan.rows[0];

    // Determine approver level based on role
    let approver_level;
    switch (role) {
      case 'supervisor':
        approver_level = 2;
        break;
      case 'manager':
        approver_level = 3;
        break;
      case 'hr_manager':
        approver_level = 4;
        break;
      default:
        return res.status(400).json({ message: 'Role tidak valid.' });
    }

    // Check if this person can approve at this level
    if (cuti.current_approver_level != approver_level) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk menyetujui pengajuan ini.' });
    }

    let next_status = '';
    let next_approver_level = null;
    let final_approved = false;

    if (action === 'approve') {
      if (role === 'hr_manager') {
        // HR Manager gives final approval
        next_status = 'approved';
        final_approved = true;
        next_approver_level = null;
      } else {
        // Move to next approval level
        next_approver_level = approver_level + 1;
        if (next_approver_level > 3) {
          // If no HR approval needed, mark as approved
          next_status = 'approved';
          final_approved = true;
          next_approver_level = null;
        } else {
          next_status = `Pending Approval Level ${next_approver_level}`;
        }
      }
    } else if (action === 'reject') {
      next_status = 'rejected';
      next_approver_level = null;
    } else if (action === 'archive') {
      next_status = 'archived';
      next_approver_level = null;
    } else {
      return res.status(400).json({ message: 'Aksi tidak valid.' });
    }

    const result = await pool.query(
      `UPDATE cuti SET status = $1, current_approver_level = $2, disetujui_oleh = $3, tanggal_persetujuan = CURRENT_TIMESTAMP,
       alasan_reject = $4, final_approved = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [next_status, next_approver_level, approverId, rejectReason || null, final_approved, cuti_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in handleCutiAction:', err);
    res.status(500).json({ error: err.message });
  }
};