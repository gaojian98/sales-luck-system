CREATE TABLE IF NOT EXISTS user_payment_bindings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  channel_type VARCHAR(32) NOT NULL,
  label VARCHAR(64) DEFAULT NULL,
  account_mask VARCHAR(120) NOT NULL,
  account_ref VARCHAR(128) DEFAULT NULL,
  extra_note VARCHAR(255) DEFAULT NULL,
  is_default TINYINT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payment_bind_user_status (user_id, status),
  KEY idx_payment_bind_user_default (user_id, is_default),
  CONSTRAINT fk_payment_bind_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
