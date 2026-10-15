-- Seed roles
INSERT INTO roles (code, name, description) VALUES ('admin', 'Administrator', 'Full system access');
INSERT INTO roles (code, name, description) VALUES ('executive', 'Executive', 'Strategic decision making');
INSERT INTO roles (code, name, description) VALUES ('manager', 'Manager', 'Department management');
INSERT INTO roles (code, name, description) VALUES ('user', 'User', 'Standard user');
INSERT INTO roles (code, name, description) VALUES ('viewer', 'Viewer', 'Read-only access');

-- Seed admin user (password: admin123)
INSERT INTO users (username, password_hash, full_name, role_id) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 1);

-- Seed planning years
INSERT INTO planning_years (year, label, status, start_date, end_date) VALUES (2026, '2026 Annual Plan', 'active', '2026-01-01', '2026-12-31');
INSERT INTO planning_years (year, label, status, start_date, end_date) VALUES (2027, '2027 Annual Plan', 'draft', '2027-01-01', '2027-12-31');

-- Seed organization
INSERT INTO org_units (unit_type, name, code) VALUES ('company', 'IJA Headquarters', 'IJA-HQ');

-- Seed master data categories
INSERT INTO settings (category, key, value, value_type, label) VALUES 
('finance_income_category', 'income_sales', 'Sales Revenue', 'text', 'Sales Revenue'),
('finance_income_category', 'income_services', 'Service Revenue', 'text', 'Service Revenue'),
('finance_expense_category', 'expense_salary', 'Salary & Wages', 'text', 'Salary & Wages'),
('finance_expense_category', 'expense_ops', 'Operational Expenses', 'text', 'Operational Expenses'),
('kpi_frequency', 'frequency_monthly', 'Monthly', 'text', 'Monthly'),
('kpi_frequency', 'frequency_quarterly', 'Quarterly', 'text', 'Quarterly'),
('kpi_frequency', 'frequency_annual', 'Annual', 'text', 'Annual'),
('period', 'period_annual', 'Annual', 'text', 'Annual'),
('period', 'period_quarter', 'Quarterly', 'text', 'Quarterly'),
('period', 'period_month', 'Monthly', 'text', 'Monthly'),
('risk_category', 'risk_operational', 'Operational', 'text', 'Operational Risk'),
('risk_category', 'risk_financial', 'Financial', 'text', 'Financial Risk'),
('evaluation_criterion', 'eval_plan', 'Plan Achievement', 'text', 'Plan Achievement'),
('evaluation_criterion', 'eval_quality', 'Quality of Work', 'text', 'Quality of Work'),
('evaluation_criterion', 'eval_timeliness', 'Timeliness', 'text', 'Timeliness'),
('project_category', 'proj_infrastructure', 'Infrastructure', 'text', 'Infrastructure'),
('project_category', 'proj_it', 'IT Systems', 'text', 'IT Systems'),
('tourism_category', 'tourism_domestic', 'Domestic', 'text', 'Domestic Tourism'),
('tourism_category', 'tourism_international', 'International', 'text', 'International Tourism');
