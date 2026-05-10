USE sales_luck_system;

CREATE TABLE IF NOT EXISTS user_weekly_goals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  week_start_date DATE NOT NULL,
  goal_title VARCHAR(120) NOT NULL,
  goal_description VARCHAR(500) DEFAULT NULL,
  split_tasks TEXT DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  completion_rate INT NOT NULL DEFAULT 0,
  evidence_note VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_weekly_goal_user_week (user_id, week_start_date),
  KEY idx_weekly_goal_user_week (user_id, week_start_date),
  CONSTRAINT fk_weekly_goal_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
