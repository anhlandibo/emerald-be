-- ============================================
-- EMERALD APARTMENT MANAGEMENT SYSTEM
-- Complete Database Schema for dbdiagram.io
-- ============================================

-- Table: accounts
-- Description: User authentication and role management
CREATE TABLE accounts (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: blocks
-- Description: Building/Tower structure
CREATE TABLE blocks (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR NOT NULL,
  manager_name VARCHAR,
  manager_phone VARCHAR,
  total_floors INT,
  status VARCHAR DEFAULT 'OPERATING',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: apartments
-- Description: Individual apartment units
CREATE TABLE apartments (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR NOT NULL,
  block_id INT NOT NULL REFERENCES blocks(id),
  floor INT NOT NULL,
  type VARCHAR NOT NULL,
  area DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (block_id) REFERENCES blocks(id)
);

-- Table: residents
-- Description: Tenant/Resident profiles
CREATE TABLE residents (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  account_id INT NOT NULL UNIQUE REFERENCES accounts(id),
  full_name VARCHAR NOT NULL,
  citizen_id VARCHAR NOT NULL UNIQUE,
  image_url VARCHAR,
  dob DATE NOT NULL,
  gender VARCHAR NOT NULL,
  phone_number VARCHAR NOT NULL,
  nationality VARCHAR NOT NULL,
  province VARCHAR,
  district VARCHAR,
  ward VARCHAR,
  detail_address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: apartment_residents
-- Description: Many-to-many relationship between apartments and residents
CREATE TABLE apartment_residents (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  apartment_id INT NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  resident_id INT NOT NULL REFERENCES residents(id),
  relationship VARCHAR NOT NULL,
  FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
  FOREIGN KEY (resident_id) REFERENCES residents(id)
);

-- Table: asset_types
-- Description: Categories of building assets/equipment
CREATE TABLE asset_types (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: assets
-- Description: Building equipment and assets
CREATE TABLE assets (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR NOT NULL,
  type_id INT NOT NULL REFERENCES asset_types(id),
  block_id INT NOT NULL REFERENCES blocks(id),
  floor INT NOT NULL,
  location_detail VARCHAR,
  status VARCHAR DEFAULT 'ACTIVE',
  installation_date DATE,
  warranty_years INT,
  warranty_expiration_date DATE,
  maintenance_interval_months INT,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  description TEXT,
  note TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES asset_types(id),
  FOREIGN KEY (block_id) REFERENCES blocks(id)
);

-- Table: technicians
-- Description: Maintenance/Repair staff
CREATE TABLE technicians (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  full_name VARCHAR NOT NULL,
  phone_number VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'AVAILABLE',
  description VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: fees
-- Description: Service fee types and configuration
CREATE TABLE fees (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR NOT NULL,
  unit VARCHAR,
  type VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: fee_tiers
-- Description: Tiered pricing for fees
CREATE TABLE fee_tiers (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  fee_type_id INT NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  from_value DECIMAL(10,2) NOT NULL,
  to_value DECIMAL(10,2),
  unit_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fee_type_id) REFERENCES fees(id) ON DELETE CASCADE
);

-- Table: meter_readings
-- Description: Utility meter readings for billing
CREATE TABLE meter_readings (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  apartment_id INT NOT NULL REFERENCES apartments(id),
  fee_type_id INT NOT NULL REFERENCES fees(id),
  reading_date DATE NOT NULL,
  billing_month DATE NOT NULL,
  old_index DECIMAL(10,2) NOT NULL,
  new_index DECIMAL(10,2) NOT NULL,
  usage_amount DECIMAL(10,2) NOT NULL,
  image_proof_url VARCHAR,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (apartment_id) REFERENCES apartments(id),
  FOREIGN KEY (fee_type_id) REFERENCES fees(id)
);

-- Table: invoices
-- Description: Monthly bills for apartments
CREATE TABLE invoices (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invoice_code VARCHAR NOT NULL UNIQUE,
  apartment_id INT NOT NULL REFERENCES apartments(id),
  period DATE NOT NULL,
  subtotal_amount DECIMAL(12,2) NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 8,
  vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'UNPAID',
  due_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (apartment_id) REFERENCES apartments(id)
);

-- Table: invoice_details
-- Description: Line items in invoices
CREATE TABLE invoice_details (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  fee_type_id INT NOT NULL REFERENCES fees(id),
  amount DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(12,2) NOT NULL,
  vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_with_vat DECIMAL(12,2) NOT NULL DEFAULT 0,
  calculation_breakdown JSONB,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_type_id) REFERENCES fees(id)
);

-- Table: services
-- Description: Utility/Amenity services
CREATE TABLE services (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR NOT NULL,
  description TEXT,
  open_hour TIME NOT NULL,
  close_hour TIME NOT NULL,
  image_url VARCHAR,
  unit_price INT NOT NULL,
  unit_time_block INT NOT NULL,
  total_slot INT NOT NULL,
  type VARCHAR DEFAULT 'NORMAL',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: slot_availabilities
-- Description: Available time slots for services
CREATE TABLE slot_availabilities (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  service_id INT NOT NULL REFERENCES services(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  remaining_slot INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Table: bookings
-- Description: Service bookings by residents
CREATE TABLE bookings (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code VARCHAR NOT NULL UNIQUE,
  resident_id INT NOT NULL REFERENCES residents(id),
  service_id INT NOT NULL REFERENCES services(id),
  booking_date DATE NOT NULL,
  timestamps JSONB NOT NULL,
  unit_price INT NOT NULL,
  total_price INT NOT NULL,
  status VARCHAR DEFAULT 'PENDING',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resident_id) REFERENCES residents(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Table: booking_payments
-- Description: Payments for service bookings
CREATE TABLE booking_payments (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  booking_id INT NOT NULL REFERENCES bookings(id),
  amount INT NOT NULL,
  method VARCHAR NOT NULL,
  note TEXT,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Table: issues
-- Description: Resident complaints and problem reports
CREATE TABLE issues (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  reporter_id INT NOT NULL REFERENCES residents(id),
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  block_id INT,
  floor INT,
  detail_location VARCHAR,
  file_urls VARCHAR[],
  status VARCHAR DEFAULT 'PENDING',
  rating INT,
  feedback TEXT,
  rejection_reason TEXT,
  is_urgent BOOLEAN DEFAULT false,
  estimated_completion_date TIMESTAMP,
  maintenance_ticket_id INT,
  assigned_to_technician_department BOOLEAN DEFAULT false,
  technician_id INT REFERENCES technicians(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES residents(id),
  FOREIGN KEY (block_id) REFERENCES blocks(id),
  FOREIGN KEY (technician_id) REFERENCES technicians(id)
);

-- Table: maintenance_tickets
-- Description: Repair and maintenance work orders
CREATE TABLE maintenance_tickets (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  priority VARCHAR DEFAULT 'MEDIUM',
  description TEXT,
  block_id INT NOT NULL REFERENCES blocks(id),
  floor INT NOT NULL,
  asset_id INT REFERENCES assets(id),
  technician_id INT REFERENCES technicians(id),
  status VARCHAR DEFAULT 'PENDING',
  checklist_items JSONB,
  assigned_date TIMESTAMP,
  started_date TIMESTAMP,
  completed_date TIMESTAMP,
  result VARCHAR,
  result_note TEXT,
  has_issue BOOLEAN DEFAULT false,
  issue_detail TEXT,
  estimated_cost DECIMAL(15,2),
  actual_cost DECIMAL(15,2),
  evidence_image VARCHAR,
  evidence_video VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (block_id) REFERENCES blocks(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (technician_id) REFERENCES technicians(id)
);

-- Table: payment_transactions
-- Description: Payment records for invoices and bookings
CREATE TABLE payment_transactions (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  txn_ref VARCHAR NOT NULL UNIQUE,
  target_type VARCHAR NOT NULL,
  target_id INT NOT NULL,
  account_id INT NOT NULL REFERENCES accounts(id),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR DEFAULT 'VND',
  payment_method VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'PENDING',
  gateway_txn_id VARCHAR,
  gateway_response_code VARCHAR,
  raw_log JSONB,
  description TEXT,
  payment_url VARCHAR,
  expires_at TIMESTAMP,
  retry_count INT DEFAULT 0,
  pay_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Table: votings
-- Description: Resident voting system for community decisions
CREATE TABLE votings (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  target_scope VARCHAR DEFAULT 'ALL',
  is_required BOOLEAN DEFAULT false,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  file_urls JSON,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: options
-- Description: Voting choices/options
CREATE TABLE options (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  voting_id INT NOT NULL REFERENCES votings(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  FOREIGN KEY (voting_id) REFERENCES votings(id) ON DELETE CASCADE
);

-- Table: resident_options
-- Description: Resident voting selections
CREATE TABLE resident_options (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  resident_id INT NOT NULL REFERENCES residents(id),
  option_id INT NOT NULL REFERENCES options(id) ON DELETE CASCADE,
  voting_id INT NOT NULL REFERENCES votings(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resident_id, voting_id),
  FOREIGN KEY (resident_id) REFERENCES residents(id),
  FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE CASCADE,
  FOREIGN KEY (voting_id) REFERENCES votings(id) ON DELETE CASCADE
);

-- Table: notifications
-- Description: User notifications and announcements
CREATE TABLE notifications (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR DEFAULT 'GENERAL',
  is_urgent BOOLEAN DEFAULT false,
  file_urls VARCHAR[],
  target_scope VARCHAR DEFAULT 'ALL',
  channels VARCHAR[],
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: target_blocks
-- Description: Target blocks for notifications
CREATE TABLE target_blocks (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  notification_id INT REFERENCES notifications(id) ON DELETE CASCADE,
  voting_id INT,
  block_id INT NOT NULL REFERENCES blocks(id),
  target_floor_numbers VARCHAR[],
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (block_id) REFERENCES blocks(id)
);

-- Table: user_notifications
-- Description: User notification tracking and read status
CREATE TABLE user_notifications (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  account_id INT NOT NULL REFERENCES accounts(id),
  notification_id INT NOT NULL REFERENCES notifications(id),
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (notification_id) REFERENCES notifications(id)
);

-- Table: system_notifications
-- Description: System-level notifications for administrators
CREATE TABLE system_notifications (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR NOT NULL DEFAULT 'INFO',
  priority VARCHAR DEFAULT 'NORMAL',
  target_user_ids VARCHAR[],
  metadata JSONB,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  scheduled_for TIMESTAMP,
  created_by INT NOT NULL,
  action_url VARCHAR(500),
  action_text VARCHAR(100),
  is_persistent BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Apartment queries
CREATE INDEX idx_apartments_block_id ON apartments(block_id);
CREATE INDEX idx_apartments_is_active ON apartments(is_active);

-- Resident queries
CREATE INDEX idx_residents_account_id ON residents(account_id);
CREATE INDEX idx_residents_is_active ON residents(is_active);

-- Invoice queries
CREATE INDEX idx_invoices_apartment_id ON invoices(apartment_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_period ON invoices(period);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);

-- Invoice detail queries
CREATE INDEX idx_invoice_details_invoice_id ON invoice_details(invoice_id);
CREATE INDEX idx_invoice_details_fee_type_id ON invoice_details(fee_type_id);

-- Meter reading queries
CREATE INDEX idx_meter_readings_apartment_id ON meter_readings(apartment_id);
CREATE INDEX idx_meter_readings_billing_month ON meter_readings(billing_month);
CREATE INDEX idx_meter_readings_is_verified ON meter_readings(is_verified);

-- Asset queries
CREATE INDEX idx_assets_block_id ON assets(block_id);
CREATE INDEX idx_assets_type_id ON assets(type_id);
CREATE INDEX idx_assets_status ON assets(status);

-- Booking queries
CREATE INDEX idx_bookings_resident_id ON bookings(resident_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);

-- Issue queries
CREATE INDEX idx_issues_reporter_id ON issues(reporter_id);
CREATE INDEX idx_issues_block_id ON issues(block_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_is_urgent ON issues(is_urgent);
CREATE INDEX idx_issues_created_at ON issues(created_at);

-- Maintenance ticket queries
CREATE INDEX idx_maintenance_tickets_block_id ON maintenance_tickets(block_id);
CREATE INDEX idx_maintenance_tickets_technician_id ON maintenance_tickets(technician_id);
CREATE INDEX idx_maintenance_tickets_status ON maintenance_tickets(status);

-- Payment transaction queries
CREATE INDEX idx_payment_transactions_account_id ON payment_transactions(account_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_target_type_id ON payment_transactions(target_type, target_id);

-- Resident option queries (voting)
CREATE INDEX idx_resident_options_voting_id ON resident_options(voting_id);
CREATE INDEX idx_resident_options_resident_id ON resident_options(resident_id);

-- Notification queries
CREATE INDEX idx_notifications_is_active ON notifications(is_active);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- User notification queries
CREATE INDEX idx_user_notifications_account_id ON user_notifications(account_id);
CREATE INDEX idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);

-- System notification queries
CREATE INDEX idx_system_notifications_type ON system_notifications(type);
CREATE INDEX idx_system_notifications_created_at ON system_notifications(created_at);
CREATE INDEX idx_system_notifications_is_sent ON system_notifications(is_sent, scheduled_for);

-- ============================================
-- FOREIGN KEY CONSTRAINTS SUMMARY
-- ============================================
-- accounts (base)
--  ├─ residents (one-to-one)
--  ├─ payment_transactions (one-to-many)
--  └─ user_notifications (one-to-many)
--
-- blocks (base)
--  ├─ apartments (one-to-many)
--  ├─ assets (one-to-many)
--  ├─ target_blocks (one-to-many)
--  └─ maintenance_tickets (one-to-many)
--
-- apartments (base)
--  ├─ apartment_residents (one-to-many, cascade delete)
--  ├─ invoices (one-to-many)
--  └─ meter_readings (one-to-many)
--
-- residents (base)
--  ├─ apartment_residents (one-to-many)
--  ├─ bookings (one-to-many)
--  ├─ issues (one-to-many)
--  └─ resident_options (one-to-many)
--
-- fees (base)
--  ├─ fee_tiers (one-to-many, cascade delete)
--  ├─ meter_readings (one-to-many)
--  └─ invoice_details (one-to-many)
--
-- services (base)
--  ├─ slot_availabilities (one-to-many)
--  └─ bookings (one-to-many)
--
-- bookings (base)
--  └─ booking_payments (one-to-many)
--
-- votings (base)
--  ├─ options (one-to-many, cascade delete)
--  └─ resident_options (one-to-many, cascade delete)
--
-- options (base)
--  └─ resident_options (one-to-many, cascade delete)
--
-- notifications (base)
--  ├─ target_blocks (one-to-many, cascade delete)
--  └─ user_notifications (one-to-many)
--
-- asset_types (base)
--  └─ assets (one-to-many)
--
-- technicians (base)
--  ├─ issues (one-to-many)
--  └─ maintenance_tickets (one-to-many)
--
-- invoices (base)
--  └─ invoice_details (one-to-many, cascade delete)
--
-- ============================================
-- ENUM VALUES REFERENCE
-- ============================================
-- UserRole: ADMIN, MANAGER, RESIDENT, TECHNICIAN
-- Gender: MALE, FEMALE, OTHER
-- ApartmentType: STUDIO, ONE_BEDROOM, TWO_BEDROOM, THREE_BEDROOM, PENTHOUSE
-- RelationshipType: OWNER, FAMILY_MEMBER, TENANT
-- BlockStatus: OPERATING, UNDER_CONSTRUCTION, CLOSED
-- FeeType: ELECTRICITY, WATER, INTERNET, PARKING, MANAGEMENT, OTHER
-- AssetStatus: ACTIVE, MAINTENANCE, INACTIVE, RETIRED
-- InvoiceStatus: UNPAID, PAID, OVERDUE, CANCELLED
-- ServiceType: NORMAL, PREMIUM
-- BookingStatus: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
-- IssueType: MAINTENANCE, NOISE, GARBAGE, WATER, ELECTRICITY, HVAC, OTHER
-- IssueStatus: PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED
-- TicketType: PREVENTIVE, CORRECTIVE, EMERGENCY
-- TicketStatus: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED
-- TicketPriority: LOW, MEDIUM, HIGH, URGENT
-- MaintenanceResult: SUCCESS, PARTIAL_SUCCESS, FAILED
-- TechnicianStatus: AVAILABLE, BUSY, ON_LEAVE, INACTIVE
-- PaymentStatus: PENDING, COMPLETED, FAILED, CANCELLED
-- PaymentTargetType: INVOICE, BOOKING
-- PaymentGateway: STRIPE, PAYPAL, ZALOPAY, VIETQR
-- NotiType: GENERAL, MAINTENANCE, BILLING, VOTING, EMERGENCY
-- ScopeType: ALL, SPECIFIC_BLOCKS, SPECIFIC_FLOORS
-- SystemNotificationType: INFO, SUCCESS, WARNING, ERROR, SYSTEM
-- SystemNotificationPriority: LOW, NORMAL, HIGH, URGENT
