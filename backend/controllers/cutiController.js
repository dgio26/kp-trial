const pool = require('../config/database');

exports.ajukanCuti = async (req, res) => {
  const { karyawan_id, tanggal_mulai, tanggal_selesai, alasan } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO cuti (karyawan_id, tanggal_mulai, tanggal_selesai, alasan, status, current_approver_level)
       VALUES ($1, $2, $3, $4, 'draft', 'Supervisor') RETURNING *`,
      [karyawan_id, tanggal_mulai, tanggal_selesai, alasan]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error in ajukanCuti:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboardForms = async (req, res) => {
  const { id } = req.params; // This 'id' is the user's ID
  const { role, departmentId } = req.query; // Get role and department from query parameters

  try {
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
    const ownFormsResult = await pool.query(ownFormsQuery, [id]);

    let pendingFormsResult = { rows: [] };

    if (role === 'supervisor') {
      // Supervisor sees staff forms in their department pending supervisor approval
      const pendingFormsQuery = `
        SELECT c.*, k.nama AS nama_karyawan, d.nama_departemen, j.nama_jabatan,
               app.nama AS disetujui_oleh_nama
        FROM cuti c
        JOIN karyawan k ON c.karyawan_id = k.id
        JOIN departemen d ON k.departemen_id = d.id
        JOIN jabatan j ON k.jabatan_id = j.id
        LEFT JOIN karyawan app ON c.disetujui_oleh = app.id
        WHERE k.departemen_id = $1 AND c.current_approver_level = 'Supervisor' AND c.status = 'pending'
        AND c.karyawan_id != $2
        ORDER BY c.created_at DESC
      `;
      pendingFormsResult = await pool.query(pendingFormsQuery, [departmentId, id]);
    } else if (role === 'manager') {
      // Manager sees staff/supervisor forms in their department pending manager approval
      const pendingFormsQuery = `
        SELECT c.*, k.nama AS nama_karyawan, d.nama_departemen, j.nama_jabatan,
               app.nama AS disetujui_oleh_nama
        FROM cuti c
        JOIN karyawan k ON c.karyawan_id = k.id
        JOIN departemen d ON k.departemen_id = d.id
        JOIN jabatan j ON k.jabatan_id = j.id
        LEFT JOIN karyawan app ON c.disetujui_oleh = app.id
        WHERE k.departemen_id = $1 AND c.current_approver_level = 'Manager' AND c.status = 'pending'
        AND c.karyawan_id != $2
        ORDER BY c.created_at DESC
      `;
      pendingFormsResult = await pool.query(pendingFormsQuery, [departmentId, id]);
    } else if (role === 'hr_manager') {
      // HR Manager sees all forms pending HR Manager approval (from any department)
      const pendingFormsQuery = `
        SELECT c.*, k.nama AS nama_karyawan, d.nama_departemen, j.nama_jabatan,
               app.nama AS disetujui_oleh_nama
        FROM cuti c
        JOIN karyawan k ON c.karyawan_id = k.id
        JOIN departemen d ON k.departemen_id = d.id
        JOIN jabatan j ON k.jabatan_id = j.id
        LEFT JOIN karyawan app ON c.disetujui_oleh = app.id
        WHERE c.current_approver_level = 'HR Manager' AND c.status = 'pending'
        AND c.karyawan_id != $1
        ORDER BY c.created_at DESC
      `;
      pendingFormsResult = await pool.query(pendingFormsQuery, [id]);
    }

    // Return structured data with separate sections
    res.json({
      ownForms: ownFormsResult.rows,
      pendingApprovals: pendingFormsResult.rows
    });
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
      `SELECT c.*, k.nama AS nama_karyawan, d.nama_departemen, j.nama_jabatan,
              app.nama AS disetujui_oleh_nama
       FROM cuti c
       JOIN karyawan k ON c.karyawan_id = k.id
       JOIN departemen d ON k.departemen_id = d.id
       JOIN jabatan j ON k.jabatan_id = j.id
       LEFT JOIN karyawan app ON c.disetujui_oleh = app.id
       WHERE c.karyawan_id = $1 ORDER BY c.created_at DESC`,
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
      `SELECT c.*, k.nama AS nama_karyawan, d.nama_departemen, j.nama_jabatan,
              app.nama AS disetujui_oleh_nama
       FROM cuti c
       JOIN karyawan k ON c.karyawan_id = k.id
       JOIN departemen d ON k.departemen_id = d.id
       JOIN jabatan j ON k.jabatan_id = j.id
       LEFT JOIN karyawan app ON c.disetujui_oleh = app.id
       WHERE c.id = $1`,
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
  const { tanggal_mulai, tanggal_selesai, alasan } = req.body;
  try {
    const result = await pool.query(
      `UPDATE cuti
       SET tanggal_mulai = $1, tanggal_selesai = $2, alasan = $3, updated_at = CURRENT_TIMESTAMP, alasan_reject = NULL, status = 'draft', current_approver_level = 'Supervisor'
       WHERE id = $4 AND (status = 'draft' OR status = 'rejected') RETURNING *`,
      [tanggal_mulai, tanggal_selesai, alasan, id]
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
      `DELETE FROM cuti WHERE id = $1 AND status = 'draft' RETURNING *`,
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
    const currentCuti = await pool.query('SELECT * FROM cuti WHERE id = $1', [id]);
    if (currentCuti.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }
    const cuti = currentCuti.rows[0];

    if (action === 'approve') {
      if (role === 'supervisor' && cuti.current_approver_level === 'Supervisor' && cuti.status === 'pending') {
        newStatus = 'pending';
        updateQuery = `UPDATE cuti SET status = $1, current_approver_level = 'Manager', disetujui_oleh = $2, tanggal_persetujuan = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`;
        queryParams = [newStatus, approverId, id];
      } else if (role === 'manager' && cuti.current_approver_level === 'Manager' && cuti.status === 'pending') {
        newStatus = 'pending';
        updateQuery = `UPDATE cuti SET status = $1, current_approver_level = 'HR Manager', disetujui_oleh = $2, tanggal_persetujuan = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`;
        queryParams = [newStatus, approverId, id];
      } else if (role === 'hr_manager' && cuti.current_approver_level === 'HR Manager' && cuti.status === 'pending') {
        newStatus = 'approved';
        updateQuery = `UPDATE cuti SET status = $1, current_approver_level = 'Approved', disetujui_oleh = $2, tanggal_persetujuan = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`;
        queryParams = [newStatus, approverId, id];

        // If approved by HR Manager, update total_cuti_taken for the employee
        const startDate = new Date(cuti.tanggal_mulai);
        const endDate = new Date(cuti.tanggal_selesai);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        await pool.query(
          `UPDATE karyawan SET total_cuti_taken = COALESCE(total_cuti_taken, 0) + $1 WHERE id = $2`,
          [diffDays, cuti.karyawan_id]
        );
      } else {
        return res.status(400).json({ message: 'Invalid approval stage or status.' });
      }
    } else if (action === 'reject') {
      newStatus = 'rejected';
      updateQuery = `UPDATE cuti SET status = $1, alasan_reject = $2, disetujui_oleh = $3, tanggal_persetujuan = CURRENT_TIMESTAMP, current_approver_level = 'Supervisor' WHERE id = $4 RETURNING *`;
      queryParams = [newStatus, rejectReason, approverId, id];
    } else if (action === 'submit') {
      if (cuti.status === 'draft' || cuti.status === 'rejected') {
        newStatus = 'pending';
        updateQuery = `UPDATE cuti SET status = $1, alasan_reject = NULL, updated_at = CURRENT_TIMESTAMP, current_approver_level = 'Supervisor' WHERE id = $2 RETURNING *`;
        queryParams = [newStatus, id];
      } else {
        return res.status(400).json({ message: 'Cannot submit a leave request that is not in draft or rejected status.' });
      }
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
