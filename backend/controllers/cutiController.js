const pool = require('../config/database');

// Helper function to calculate business days (excluding weekends)
function calculateBusinessDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);

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

// Helper function to update employee's remaining leave balance
async function updateSisaCuti(karyawanId, totalHari, operation = 'subtract') {
  const operator = operation === 'subtract' ? '-' : '+';
  await pool.query(
    `UPDATE karyawan SET sisa_cuti = sisa_cuti ${operator} $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [totalHari, karyawanId]
  );
}

exports.ajukanCuti = async (req, res) => {
  const { karyawan_id, tanggal_mulai, tanggal_selesai, alasan, submit } = req.body;

  try {
    // Calculate total business days
    const totalHari = calculateBusinessDays(tanggal_mulai, tanggal_selesai);

    // Check employee's remaining leave balance
    const karyawanResult = await pool.query(
      `SELECT k.sisa_cuti, j.nama_jabatan AS jabatan, j.level
       FROM karyawan k
       JOIN jabatan j ON k.jabatan_id = j.id
       WHERE k.id = $1`,
      [karyawan_id]
    );

    if (karyawanResult.rowCount === 0) {
      return res.status(404).json({ message: 'Karyawan tidak ditemukan.' });
    }

    const { sisa_cuti, jabatan, level } = karyawanResult.rows[0];

    // Check if employee has enough leave balance
    if (submit && sisa_cuti < totalHari) {
      return res.status(400).json({ 
        message: `Sisa cuti tidak mencukupi. Anda memiliki ${sisa_cuti} hari cuti, sedangkan pengajuan memerlukan ${totalHari} hari.` 
      });
    }

    let status = 'draft';
    let current_approver_level = 2; // default ke Supervisor

    if (submit) {
      current_approver_level = level + 1; // Atasan langsung
      status = `Pending Approval Level ${current_approver_level}`;
    }

    const result = await pool.query(
      `INSERT INTO cuti (karyawan_id, tanggal_mulai, tanggal_selesai, total_hari, alasan, status, current_approver_level, diajukan_oleh)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $1) RETURNING *`,
      [karyawan_id, tanggal_mulai, tanggal_selesai, totalHari, alasan, status, current_approver_level]
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
      `SELECT c.*, k.sisa_cuti FROM cuti c
       JOIN karyawan k ON c.karyawan_id = k.id
       WHERE c.karyawan_id = $1 ORDER BY c.created_at DESC`,
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
    const result = await pool.query(
      `SELECT c.*, k.sisa_cuti, k.nama AS nama_karyawan
       FROM cuti c
       JOIN karyawan k ON c.karyawan_id = k.id
       WHERE c.id = $1`, 
      [cuti_id]
    );
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
    const oldTotalHari = pengajuan.rows[0].total_hari;
    const newTotalHari = calculateBusinessDays(tanggal_mulai, tanggal_selesai);
    
    console.log('Getting jabatan for karyawan_id:', karyawan_id);
    
    const karyawanResult = await pool.query(
      `SELECT k.sisa_cuti, j.nama_jabatan AS jabatan, j.level FROM karyawan k
       JOIN jabatan j ON k.jabatan_id = j.id
       WHERE k.id = $1`,
      [karyawan_id]
    );

    if (karyawanResult.rowCount === 0) {
      return res.status(404).json({ message: 'Data karyawan atau jabatan tidak ditemukan.' });
    }

    const { sisa_cuti, jabatan, level } = karyawanResult.rows[0];
    console.log('Karyawan info:', { sisa_cuti, jabatan, level });

    // If this was previously submitted (not draft), ensure the balance is correct before re-checking
    // The balance is no longer deducted on submission, so no need to restore/deduct here.

    // Check if employee has enough leave balance for new dates when submitting
    if (submit && sisa_cuti < newTotalHari) {
      return res.status(400).json({ 
        message: `Sisa cuti tidak mencukupi. Anda memiliki ${sisa_cuti} hari cuti, sedangkan pengajuan memerlukan ${newTotalHari} hari.` 
      });
    }

    let status = 'draft';
    let current_approver_level = 2;

    if (submit) {
      current_approver_level = level + 1;
      status = `Pending Approval Level ${current_approver_level}`;
    }

    console.log('Updating with:', { tanggal_mulai, tanggal_selesai, alasan, status, current_approver_level, newTotalHari });

    // Clear rejection reason when resubmitting (either as draft or submit)
    const result = await pool.query(
      `UPDATE cuti SET tanggal_mulai = $1, tanggal_selesai = $2, total_hari = $3, alasan = $4, status = $5, current_approver_level = $6, alasan_reject = NULL, disetujui_oleh = NULL, tanggal_persetujuan = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [tanggal_mulai, tanggal_selesai, newTotalHari, alasan, status, current_approver_level, cuti_id]
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

    // If the leave was finally approved, restore the leave balance
    if (pengajuan.rows[0].final_approved) {
      await updateSisaCuti(pengajuan.rows[0].karyawan_id, pengajuan.rows[0].total_hari, 'add');
    }

    // Only allow deletion of draft or rejected applications
    if (!['draft', 'rejected'].includes(pengajuan.rows[0].status.toLowerCase())) {
      return res.status(400).json({ message: 'Hanya pengajuan draft atau rejected yang dapat dihapus.' });
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
    // First, get user's own forms with remaining leave balance
    const ownFormsQuery = `
      SELECT c.*, k.nama AS nama_karyawan, k.sisa_cuti, d.nama_departemen, j.nama_jabatan,
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
    
    let pendingFormsResult = { rows: [] };
    
    if (role === 'supervisor') {
      // Supervisor sees staff forms in their department pending supervisor approval (level 2)
      console.log('Fetching pending forms for supervisor with params:', [deptId, userId]);
      
      const pendingFormsQuery = `
        SELECT c.*, k.nama AS nama_karyawan, k.sisa_cuti, d.nama_departemen, j.nama_jabatan,
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
    } else if (role === 'manager') {
      // Manager sees staff/supervisor forms in their department pending manager approval (level 3)
      console.log('Fetching pending forms for manager with params:', [deptId, userId]);
      
      const pendingFormsQuery = `
        SELECT c.*, k.nama AS nama_karyawan, k.sisa_cuti, d.nama_departemen, j.nama_jabatan,
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
    } else if (role === 'hr_manager') {
      // HR Manager sees all forms pending HR Manager approval (level 4) from any department
      console.log('Fetching pending forms for HR manager with params:', [userId]);
      
      const pendingFormsQuery = `
        SELECT c.*, k.nama AS nama_karyawan, k.sisa_cuti, d.nama_departemen, j.nama_jabatan,
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
        // ONLY HR Manager can give final approval
        next_status = 'approved';
        final_approved = true;
        next_approver_level = null;
        await updateSisaCuti(cuti.karyawan_id, cuti.total_hari, 'subtract'); // Deduct leave when finally approved
      } else {
        // ALL other approvals must go to the next level, eventually reaching HR Manager
        next_approver_level = approver_level + 1;
        
        // Always continue to next level until HR Manager (level 4)
        if (next_approver_level <= 4) {
          next_status = `Pending Approval Level ${next_approver_level}`;
        } else {
          // This should never happen, but just in case
          return res.status(400).json({ message: 'Invalid approval flow.' });
        }
      }
    } else if (action === 'reject') {
      next_status = 'rejected';
      next_approver_level = null;
      
      // No need to restore balance since it's not deducted on submission
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

// New endpoint to get employee's current leave balance
exports.getSisaCuti = async (req, res) => {
  const { karyawan_id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT sisa_cuti, nama FROM karyawan WHERE id = $1`,
      [karyawan_id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Karyawan tidak ditemukan.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in getSisaCuti:', err);
    res.status(500).json({ error: err.message });
  }
};
