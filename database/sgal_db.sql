CREATE DATABASE sgal_db;

USE sgal_db;

CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    documentType ENUM('tp', 'cc', 'ppt') NOT NULL,
    documentNumber VARCHAR(20) NOT NULL UNIQUE,
    userType VARCHAR(50) NOT NULL,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    confirmEmail VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_emails_match CHECK (email = confirmEmail)
);