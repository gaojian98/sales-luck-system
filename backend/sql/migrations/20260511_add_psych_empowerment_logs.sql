USE sales_luck_system;

CREATE TABLE IF NOT EXISTS user_psych_empowerment_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  tool_type VARCHAR(32) NOT NULL,
  input_text VARCHAR(500) DEFAULT NULL,
  output_text TEXT DEFAULT NULL,
  distress_before INT DEFAULT NULL,
  distress_after INT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_psych_logs_user_type_created (user_id, tool_type, created_at),
  CONSTRAINT fk_psych_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
