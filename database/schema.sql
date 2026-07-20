CREATE DATABASE IF NOT EXISTS `eccardb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `eccardb`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `position` VARCHAR(100) NULL,
  `department` VARCHAR(100) NULL,
  `bu` VARCHAR(50) NULL, -- AOEM, AMAP, AMPC, MO, GEN, PTC, CED, PDP, OSSC
  `role` VARCHAR(50) NOT NULL, -- SALES, TS, PURCHASE, QC, PRODUCTION, INVENTORY, QEM, QMR, DEPT_HEAD, DIV_MANAGER, TN
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CCAR Records Table
CREATE TABLE IF NOT EXISTS `ccar_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ccar_no` VARCHAR(50) UNIQUE NOT NULL,
  `bu` VARCHAR(50) NOT NULL,
  `requested_by` VARCHAR(50) NOT NULL, -- Sales, TS, Purchase
  `subject` VARCHAR(100) NOT NULL, -- Product Quality, Shade, Packaging, Delivery, Other
  `subject_other` VARCHAR(255) NULL,
  `product_termination` VARCHAR(10) NULL, -- Yes, No
  `product_termination_ref` VARCHAR(100) NULL,
  `ccr_no` VARCHAR(100) NULL,
  `customer_written_doc` VARCHAR(255) NULL,
  `customer_code` VARCHAR(50) NULL,
  `customer_name` VARCHAR(255) NULL,
  `product_code` VARCHAR(50) NULL,
  `product_name` VARCHAR(255) NULL,
  `batch_no` VARCHAR(100) NULL,
  `lot_no` VARCHAR(100) NULL,
  `do_no` VARCHAR(100) NULL,
  `item` VARCHAR(100) NULL,
  `quantity` DECIMAL(12,2) NULL,
  `quantity_unit` VARCHAR(20) NULL,
  `found_problem` VARCHAR(1000) NULL, -- JSON string representing checkboxes
  `containment_action` VARCHAR(100) NULL,
  `containment_action_detail` VARCHAR(1000) NULL,
  `compensation` VARCHAR(255) NULL,
  `problem_detail` TEXT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Closed, Rejected
  `current_step` VARCHAR(50) DEFAULT '1.1', -- 1.1, 1.2, 1.3, 2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4, 5, 7.1, 7.2, 7.3, Closed
  `requester_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CCAR Steps / Actions Log
CREATE TABLE IF NOT EXISTS `ccar_steps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ccar_id` INT NOT NULL,
  `step` VARCHAR(10) NOT NULL, -- '1.1', '1.2', '1.3', '2', '2.1', '2.2', '2.3', '3.1', '3.2', '3.3', '3.4', '4', '5', '7.1', '7.2', '7.3'
  `actor_id` INT NOT NULL,
  `result` VARCHAR(50) NOT NULL, -- Correct, Incorrect, Approve, Reject, Call meeting, Not call meeting, Satisfaction, Unsatisfaction, Finish, Not finish
  `reason` TEXT NULL,
  `data_json` TEXT NULL, -- Custom step information
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ccar_id`) REFERENCES `ccar_records`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. NCR Records Table
CREATE TABLE IF NOT EXISTS `ncr_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ncr_no` VARCHAR(50) UNIQUE NOT NULL,
  `plant` VARCHAR(50) NOT NULL, -- EN, TH, DR, AR, WT, WB/RM, ED, PP/RM, PT/RM
  `bu` VARCHAR(50) NOT NULL, -- AM, MO, GN
  `issued_by_dept` VARCHAR(100) NOT NULL, -- Sale, MRP, PD, QC, etc.
  `product_code` VARCHAR(50) NULL,
  `product_name` VARCHAR(255) NULL,
  `batch_no` VARCHAR(100) NULL,
  `lot_no` VARCHAR(100) NULL,
  `defect_qty` DECIMAL(12,2) NULL,
  `defect_unit` VARCHAR(20) NULL,
  `defect_detail` TEXT NULL,
  `transfer_qi` VARCHAR(20) DEFAULT 'No', -- Yes, No
  `status` VARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Closed, Rejected
  `current_step` VARCHAR(50) DEFAULT '1', -- 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, Closed
  `requester_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. NCR Steps / Actions Log
CREATE TABLE IF NOT EXISTS `ncr_steps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ncr_id` INT NOT NULL,
  `step` VARCHAR(10) NOT NULL, -- '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
  `actor_id` INT NOT NULL,
  `result` VARCHAR(50) NOT NULL, -- Approve, Reject, Verify, Inspect, Transfer Stock, Reprocess, Disposition
  `reason` TEXT NULL,
  `data_json` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ncr_id`) REFERENCES `ncr_records`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Attachments Table
CREATE TABLE IF NOT EXISTS `attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `record_type` VARCHAR(10) NOT NULL, -- 'CCAR', 'NCR'
  `record_id` INT NOT NULL,
  `step` VARCHAR(10) NOT NULL, -- step code where file was attached e.g. '3.1'
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(100) NULL,
  `uploaded_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Master Data / User Defined Fields Table
CREATE TABLE IF NOT EXISTS `master_data` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` VARCHAR(50) NOT NULL,
  `field_name` VARCHAR(50) NOT NULL,
  `value_key` VARCHAR(100) NOT NULL,
  `value_label` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NULL,
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_category_key` (`category`, `value_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

