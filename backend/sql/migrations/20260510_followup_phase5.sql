USE sales_luck_system;

ALTER TABLE support_followup_tasks
  ADD COLUMN priority INT NOT NULL DEFAULT 0 AFTER task_content,
  ADD COLUMN completed_by BIGINT UNSIGNED DEFAULT NULL AFTER completed_at,
  ADD COLUMN overdue_reminder_at DATETIME DEFAULT NULL AFTER completed_by,
  ADD KEY idx_followup_assigned_status_due (assigned_to, status, due_at),
  ADD CONSTRAINT fk_followup_completed_by
    FOREIGN KEY (completed_by) REFERENCES admin_users(id)
    ON DELETE SET NULL;

UPDATE support_followup_tasks SET priority = CASE stage
  WHEN 'D1' THEN 15
  WHEN 'D3' THEN 25
  WHEN 'D7' THEN 40
  ELSE 10
END WHERE priority = 0;
