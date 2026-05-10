CREATE TABLE IF NOT EXISTS user_identity_badge_unlocks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  badge_key VARCHAR(64) NOT NULL,
  badge_title VARCHAR(120) NOT NULL,
  source_type VARCHAR(32) NOT NULL DEFAULT 'system',
  unlocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_identity_badge_user_key (user_id, badge_key),
  KEY idx_identity_badge_user_unlocked (user_id, unlocked_at),
  CONSTRAINT fk_identity_badge_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
