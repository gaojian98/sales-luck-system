USE sales_luck_system;

CREATE TABLE IF NOT EXISTS user_daily_growth (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  practice_date DATE NOT NULL,
  affirmation_text VARCHAR(255) DEFAULT NULL,
  action_text VARCHAR(255) DEFAULT NULL,
  reflection_text VARCHAR(500) DEFAULT NULL,
  affirmation_done TINYINT NOT NULL DEFAULT 0,
  action_done TINYINT NOT NULL DEFAULT 0,
  reflection_done TINYINT NOT NULL DEFAULT 0,
  self_confirmation_score INT NOT NULL DEFAULT 50,
  fear_interference_index INT NOT NULL DEFAULT 50,
  action_consistency_index INT NOT NULL DEFAULT 50,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_daily_growth (user_id, practice_date),
  KEY idx_user_daily_growth_user_date (user_id, practice_date),
  CONSTRAINT fk_user_daily_growth_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO system_configs (config_key, config_value, updated_by)
VALUES
  ('DEFAULT_DAILY_AFFIRMATIONS', '["我正在不断升级自己的能量级别","我有力量超越恐惧与自卑","我值得拥有更好的自己"]', 1),
  ('DEFAULT_DAILY_ACTION_TEMPLATES', '["完成一个最小行动","向目标推进 15 分钟","完成今天最关键的一步"]', 1)
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  updated_by = VALUES(updated_by);
