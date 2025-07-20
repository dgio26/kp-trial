const pool = require('../config/database');

exports.ajukanCuti = async (req, res) => {
  const { id_karyawan, nama_karyawan, departemen, jabatan, tanggal_mulai, tanggal_akhir, alasan, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pengajuan_cuti (id_karyawan, nama_karyawan, departemen, jabatan, tanggal_mulai, tanggal_akhir, alasan, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id_karyawan, nama_karyawan, departemen, jabatan, tanggal_mulai, tanggal_akhir, alasan, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error in ajukanCuti:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboardForms = async (req, res) => {
  const { id } = req.params; // This 'id' is the user's ID
  const { role, department } = req.query; // Get role and department from query parameters

  try {
    let query = `SELECT * FROM pengajuan_cuti WHERE id_karyawan = $1`;
    let queryParams = [id];

    if (role === 'supervisor') {
      // Supervisor sees their own forms AND staff forms in their department pending supervisor approval
      query = `
        SELECT * FROM pengajuan_cuti
        WHERE id_karyawan = $1
        OR (departemen = $2 AND jabatan = 'staff' AND status = 'pending_supervisor')
        ORDER BY dibuat_pada DESC
      `;
      queryParams = [id, department];
    } else if (role === 'manager') {
      // Manager sees their own forms AND staff/supervisor forms in their department pending manager approval
      query = `
        SELECT * FROM pengajuan_cuti
        WHERE id_karyawan = $1
        OR (departemen = $2 AND (jabatan = 'staff' OR jabatan = 'supervisor') AND status = 'pending_manager')
        ORDER BY dibuat_pada DESC
      `;
      queryParams = [id, department];
    } else if (role === 'hr_manager') {
      // HR Manager sees their own forms AND all forms pending HR Manager approval (from any department)
      query = `
        SELECT * FROM pengajuan_cuti
        WHERE id_karyawan = $1
        OR status = 'pending_hr_manager'
        ORDER BY dibuat_pada DESC
      `;
      queryParams = [id];
    } else {
      // Default for staff: only their own forms
      query = `SELECT * FROM pengajuan_cuti WHERE id_karyawan = $1 ORDER BY dibuat_pada DESC`;
      queryParams = [id];
    }

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in getDashboardForms:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPengajuanByKaryawan = async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch all leave requests for the user, regardless of status
    const result = await pool.query(
      `SELECT * FROM pengajuan_cuti WHERE id_karyawan = $1 ORDER BY dibuat_pada DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error in getPengajuanByKaryawan:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getDetailPengajuan = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM pengajuan_cuti WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pengajuan tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePengajuan = async (req, res) => {
  const { id } = req.params;
  const { nama_karyawan, departemen, jabatan, tanggal_mulai, tanggal_akhir, alasan, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE pengajuan_cuti 
       SET nama_karyawan = $1, departemen = $2, jabatan = $3, tanggal_mulai = $4, tanggal_akhir = $5, alasan = $6, status = $7, diperbarui_pada = CURRENT_TIMESTAMP, alasan_reject = NULL
       WHERE id = $8 AND (status = 'draft' OR status = 'rejected') RETURNING *`,
      [nama_karyawan, departemen, jabatan, tanggal_mulai, tanggal_akhir, alasan, status, id]
    );
    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Tidak dapat mengubah pengajuan yang sudah diproses, disetujui, atau tidak ditemukan.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in updatePengajuan:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.hapusPengajuan = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM pengajuan_cuti WHERE id = $1 AND status = 'draft' RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Tidak dapat menghapus pengajuan yang sudah diproses atau tidak ditemukan.' });
    }
    res.json({ message: 'Pengajuan berhasil dihapus' });
  } catch (err) {
    console.error('Error in hapusPengajuan:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.handleCutiAction = async (req, res) => {
  const { id } = req.params;
  const { action, role, approverId, approverName, rejectReason } = req.body;

  try {
    let newStatus;
    let updateQuery;
    let queryParams;

    // Fetch current leave request to check status and calculate days if needed
    const currentCuti = await pool.query('SELECT * FROM pengajuan_cuti WHERE id = $1', [id]);
    if (currentCuti.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }
    const cuti = currentCuti.rows[0];

    if (action === 'approve') {
      if (role === 'supervisor' && cuti.status === 'pending_supervisor') {
        newStatus = 'pending_manager'; // Supervisor approval moves to Manager
        updateQuery = `UPDATE pengajuan_cuti SET status = $1, approved_by_supervisor = $2, tanggal_approve_supervisor = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`;
        queryParams = [newStatus, approverName, id];
      } else if (role === 'manager' && cuti.status === 'pending_manager') { // Manager approves requests pending manager
        newStatus = 'pending_hr_manager'; // Manager approval moves to HR Manager
        updateQuery = `UPDATE pengajuan_cuti SET status = $1, approved_by_manager = $2, tanggal_approve_manager = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`;
        queryParams = [newStatus, approverName, id];
      } else if (role === 'hr_manager' && cuti.status === 'pending_hr_manager') { // HR Manager approves requests pending HR Manager
        newStatus = 'approved'; // Final approval
        updateQuery = `UPDATE pengajuan_cuti SET status = $1, approved_by_hr_manager = $2, tanggal_approve_hr_manager = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`;
        queryParams = [newStatus, approverName, id];

        // If approved by HR Manager, update total_cuti_terpakai for the employee
        const startDate = new Date(cuti.tanggal_mulai);
        const endDate = new Date(cuti.tanggal_akhir);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        await pool.query(
          `UPDATE karyawan SET total_cuti_terpakai = COALESCE(total_cuti_terpakai, 0) + $1 WHERE id = $2`,
          [diffDays, cuti.id_karyawan]
        );
      } else {
        return res.status(400).json({ message: 'Invalid approval stage or status.' });
      }
    } else if (action === 'reject') {
      newStatus = 'draft'; // Revert to draft status
      updateQuery = `UPDATE pengajuan_cuti SET status = $1, alasan_reject = $2, approved_by_supervisor = NULL, tanggal_approve_supervisor = NULL, approved_by_manager = NULL, tanggal_approve_manager = NULL, approved_by_hr_manager = NULL, tanggal_approve_hr_manager = NULL WHERE id = $3 RETURNING *`;
      queryParams = [newStatus, rejectReason, id];
    } else {
      return res.status(400).json({ message: 'Invalid action.' });
    }

    const result = await pool.query(updateQuery, queryParams);
    res.json(result.rows[0]);

  } catch (err) {
    console.error('Error in handleCutiAction:', err);
    res.status(500).json({ error: err.message });
  }
};
