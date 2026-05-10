-- 能量转赠、能量兑换现金（待运营打款）
CREATE TABLE IF NOT EXISTS energy_cash_redemptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  energy_amount INT NOT NULL,
  cash_amount DECIMAL(10, 2) NOT NULL,
  energy_per_yuan_snapshot INT NOT NULL,
  payment_binding_id BIGINT UNSIGNED DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_note VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_energy_redeem_user_status (user_id, status),
  KEY idx_energy_redeem_created (created_at),
  CONSTRAINT fk_energy_redeem_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO business_params (param_key, param_value, updated_by)
VALUES
  ('ENERGY_PER_YUAN_REDEEM', '100', 1),
  ('MIN_REDEEM_ENERGY', '100', 1),
  ('MAX_GIFT_ENERGY_PER_TX', '5000', 1)
ON DUPLICATE KEY UPDATE
  param_value = VALUES(param_value),
  updated_by = VALUES(updated_by);
