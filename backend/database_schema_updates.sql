-- Add 'HR Manager' to the jabatan table if it doesn't exist
INSERT INTO jabatan (nama_jabatan)
SELECT 'HR Manager'
WHERE NOT EXISTS (SELECT 1 FROM jabatan WHERE nama_jabatan = 'HR Manager');

-- Add current_approver_level column to cuti table
ALTER TABLE cuti
ADD COLUMN current_approver_level VARCHAR(50) DEFAULT 'Supervisor'; -- e.g., 'Supervisor', 'Manager', 'HR Manager', 'Approved'

-- Update existing 'Pending' statuses to 'Pending Supervisor' for consistency
UPDATE cuti
SET status = 'Pending Supervisor'
WHERE status = 'Pending';

-- Add total_cuti_taken column to karyawan table
ALTER TABLE karyawan
ADD COLUMN total_cuti_taken INT DEFAULT 0;

-- Remove jenis_cuti column from cuti table
ALTER TABLE cuti
DROP COLUMN IF EXISTS jenis_cuti;
