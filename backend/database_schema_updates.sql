-- Create departemen table
CREATE TABLE departemen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_departemen VARCHAR(255) NOT NULL
);

-- Populate departemen table
INSERT INTO departemen (nama_departemen) VALUES
('R&D'),
('QC'),
('QA'),
('Warehouse (WH)'),
('HR'),
('IT'),
('Production (PN)'),
('Engineering (EG)');

-- Create jabatan table
CREATE TABLE jabatan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_jabatan VARCHAR(255) NOT NULL
);

-- Populate jabatan table (assuming common job titles)
INSERT INTO jabatan (nama_jabatan) VALUES
('Staff'),
('Supervisor'),
('Manager');
