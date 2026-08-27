-- MySQL 8.x Database Schema for Rohma Draws Studio
-- Database: rohmnkmq_rohmaadraws

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    weight DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    dimensions VARCHAR(100) DEFAULT NULL,
    type ENUM('original', 'print', 'digital') NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 1,
    image_url VARCHAR(500) NOT NULL,
    secondary_images JSON DEFAULT NULL,
    digital_file_url VARCHAR(500) DEFAULT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    allow_original BOOLEAN DEFAULT TRUE,
    allow_print BOOLEAN DEFAULT TRUE,
    allow_digital BOOLEAN DEFAULT TRUE,
    print_price DECIMAL(10,2) DEFAULT NULL,
    digital_price DECIMAL(10,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping_country VARCHAR(100) NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    status ENUM('pending', 'paid', 'shipped', 'cancelled') DEFAULT 'pending',
    items JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Commission Requests Table
CREATE TABLE IF NOT EXISTS commission_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    size VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    reference_url VARCHAR(500) DEFAULT NULL,
    reference_image_url VARCHAR(500) DEFAULT NULL,
    status ENUM('pending', 'new', 'reviewed', 'accepted', 'declined') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Shipping Rates Table
CREATE TABLE IF NOT EXISTS shipping_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    country_code VARCHAR(5) NOT NULL UNIQUE,
    country_name VARCHAR(100) NOT NULL,
    base_rate DECIMAL(10,2) NOT NULL,
    per_kg_rate DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

-- Initial Seed Data for Shipping Rates
INSERT INTO shipping_rates (country_code, country_name, base_rate, per_kg_rate) VALUES
('SG', 'Singapore', 12.00, 4.00),
('AU', 'Australia', 25.00, 8.50),
('US', 'United States', 35.00, 12.00),
('GB', 'United Kingdom', 35.00, 11.50),
('CA', 'Canada', 38.00, 12.50),
('MY', 'Malaysia', 18.00, 5.00),
('GLOBAL', 'Rest of World', 45.00, 15.00)
ON DUPLICATE KEY UPDATE base_rate=VALUES(base_rate), per_kg_rate=VALUES(per_kg_rate);
