USE sales_luck_system;

CREATE TABLE IF NOT EXISTS support_followup_tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  stage VARCHAR(16) NOT NULL,
  task_title VARCHAR(120) NOT NULL,
  task_content TEXT DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  due_at DATETIME NOT NULL,
  assigned_to BIGINT UNSIGNED DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_followup_user_stage (user_id, stage),
  KEY idx_followup_status_due (status, due_at),
  CONSTRAINT fk_followup_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_followup_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES admin_users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_followup_created_by
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;
