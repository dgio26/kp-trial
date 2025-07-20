-- PostgreSQL schema for the leave management system (Revised)

-- Table for departments
CREATE TABLE departemen (
    id SERIAL PRIMARY KEY,
    nama_departemen VARCHAR(255) NOT NULL UNIQUE
);

-- Table for job titles
CREATE TABLE jabatan (
    id SERIAL PRIMARY KEY,
    nama_jabatan VARCHAR(255) NOT NULL UNIQUE
);

-- Table for employees (users)
CREATE TABLE karyawan (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    departemen_id INT,
    jabatan_id INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (departemen_id) REFERENCES departemen(id),
    FOREIGN KEY (jabatan_id) REFERENCES jabatan(id)
);

-- Table for leave requests
CREATE TABLE cuti (
    id SERIAL PRIMARY KEY,
    karyawan_id INT NOT NULL,
    jenis_cuti VARCHAR(255) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    alasan TEXT,
    status VARCHAR(50) DEFAULT 'Pending', -- e.g., 'Pending', 'Approved', 'Rejected', 'Cancelled'
    diajukan_oleh INT, -- ID of the employee who submitted the request
    tanggal_pengajuan TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    disetujui_oleh INT, -- ID of the employee who approved/rejected the request
    tanggal_persetujuan TIMESTAMP WITH TIME ZONE,
    alasan_reject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (karyawan_id) REFERENCES karyawan(id),
    FOREIGN KEY (diajukan_oleh) REFERENCES karyawan(id),
    FOREIGN KEY (disetujui_oleh) REFERENCES karyawan(id)
);

INSERT INTO departemen (nama_departemen) VALUES
('R&D'),
('QC'),
('QA'),
('Warehouse (WH)'),
('HR'),
('IT'),
('Production (PN)'),
('Engineering (EG)');

INSERT INTO jabatan (nama_jabatan) VALUES
('Staff'),
('Supervisor'),
('Manager');
