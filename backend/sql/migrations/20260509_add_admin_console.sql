USE sales_luck_system;

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'cs',
  status TINYINT NOT NULL DEFAULT 1,
  last_login_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_admin_users_username (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS support_recharge_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  package_id BIGINT UNSIGNED NOT NULL,
  payment_mode VARCHAR(32) NOT NULL DEFAULT 'manual_topup',
  pay_channel VARCHAR(32) NOT NULL DEFAULT 'manual',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  remark VARCHAR(255) DEFAULT NULL,
  requested_by BIGINT UNSIGNED NOT NULL,
  approved_by BIGINT UNSIGNED DEFAULT NULL,
  processed_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_support_recharge_user_created (user_id, created_at),
  KEY idx_support_recharge_status_created (status, created_at),
  CONSTRAINT fk_support_recharge_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_support_recharge_package
    FOREIGN KEY (package_id) REFERENCES recharge_packages(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_support_recharge_requested_by
    FOREIGN KEY (requested_by) REFERENCES admin_users(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_support_recharge_approved_by
    FOREIGN KEY (approved_by) REFERENCES admin_users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS support_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED DEFAULT NULL,
  event_type VARCHAR(64) NOT NULL,
  title VARCHAR(120) NOT NULL,
  content TEXT NOT NULL,
  related_type VARCHAR(64) DEFAULT NULL,
  related_id VARCHAR(64) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_support_notifications_user_created (user_id, created_at),
  CONSTRAINT fk_support_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE support_recharge_requests
  ADD COLUMN IF NOT EXISTS reject_reason VARCHAR(255) DEFAULT NULL AFTER approved_by;

ALTER TABLE recharge_orders
  ADD COLUMN IF NOT EXISTS pay_channel VARCHAR(32) NOT NULL DEFAULT 'manual' AFTER pay_amount;

CREATE TABLE IF NOT EXISTS system_configs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  config_key VARCHAR(64) NOT NULL,
  config_value TEXT NOT NULL,
  updated_by BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_system_config_key (config_key),
  CONSTRAINT fk_system_configs_updated_by
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS system_config_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  config_key VARCHAR(64) NOT NULL,
  old_value TEXT DEFAULT NULL,
  new_value TEXT NOT NULL,
  updated_by BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_config_history_key_created (config_key, created_at),
  CONSTRAINT fk_system_config_history_updated_by
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS business_params (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  param_key VARCHAR(64) NOT NULL,
  param_value VARCHAR(128) NOT NULL,
  updated_by BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_business_param_key (param_key),
  CONSTRAINT fk_business_params_updated_by
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_user_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(64) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id VARCHAR(128) DEFAULT NULL,
  detail TEXT DEFAULT NULL,
  ip_address VARCHAR(64) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_audit_action_created (action, created_at),
  KEY idx_admin_audit_admin_created (admin_user_id, created_at),
  CONSTRAINT fk_admin_audit_admin_user
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_tags (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  color VARCHAR(16) NOT NULL DEFAULT '#64748b',
  created_by BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_customer_tag_name (name),
  CONSTRAINT fk_customer_tags_created_by
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_tag_links (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_customer_tag_link (customer_id, tag_id),
  CONSTRAINT fk_customer_tag_link_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_customer_tag_link_tag
    FOREIGN KEY (tag_id) REFERENCES customer_tags(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED DEFAULT NULL,
  title VARCHAR(120) NOT NULL,
  content TEXT DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  sla_due_at DATETIME DEFAULT NULL,
  assigned_to BIGINT UNSIGNED DEFAULT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_support_ticket_status_created (status, created_at),
  CONSTRAINT fk_support_ticket_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_support_ticket_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES admin_users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_support_ticket_created_by
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_support_ticket_updated_by
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS sla_due_at DATETIME DEFAULT NULL AFTER priority;

CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  comment TEXT NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ticket_comments_ticket_created (ticket_id, created_at),
  CONSTRAINT fk_ticket_comments_ticket
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_ticket_comments_created_by
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO admin_users (id, username, password_hash, role, status)
VALUES
  (1, 'cs_admin', '$2b$10$6KR2qk8RNUSSxL9X70wiiezDkYC6LDcvJUOxaVF79O0zaeWO5uyQW', 'super_admin', 1),
  (2, 'cs_agent', '$2b$10$6KR2qk8RNUSSxL9X70wiiezDkYC6LDcvJUOxaVF79O0zaeWO5uyQW', 'cs', 1)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  status = VALUES(status);

INSERT INTO system_configs (config_key, config_value, updated_by)
VALUES
  ('LIVE_QA_URL', 'https://www.tiktok.com/live', 1),
  ('FRONTEND_ADMIN_URL', 'http://127.0.0.1:5176/', 1),
  ('RECHARGE_CHANNEL_OPTIONS', '[{"value":"wechat","label":"微信"},{"value":"alipay","label":"支付宝"},{"value":"manual","label":"人工代充"},{"value":"cold_wallet","label":"冷钱包"}]', 1),
  ('ASSIST_REJECT_REASON_TEMPLATES', '["客户信息不完整","支付凭证无效","超出今日代充限额","需客户先补充资料"]', 1)
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  updated_by = VALUES(updated_by);

INSERT INTO business_params (param_key, param_value, updated_by)
VALUES
  ('DAILY_MAX_SPIN', '20', 1),
  ('LOW_SCORE_THRESHOLD', '60', 1),
  ('VERY_LOW_SCORE_THRESHOLD', '40', 1)
ON DUPLICATE KEY UPDATE
  param_value = VALUES(param_value),
  updated_by = VALUES(updated_by);

INSERT INTO customer_tags (name, color, created_by)
VALUES
  ('高意向', '#16a34a', 1),
  ('重点跟进', '#dc2626', 1),
  ('潜力客户', '#2563eb', 1)
ON DUPLICATE KEY UPDATE
  color = VALUES(color),
  created_by = VALUES(created_by);
