USE sales_luck_system;

ALTER TABLE user_daily_growth
  ADD COLUMN self_eval_score INT DEFAULT NULL AFTER action_consistency_index,
  ADD COLUMN self_eval_note VARCHAR(255) DEFAULT NULL AFTER self_eval_score,
  ADD COLUMN weekly_fear_score INT DEFAULT NULL AFTER self_eval_note,
  ADD COLUMN weekly_inferiority_score INT DEFAULT NULL AFTER weekly_fear_score,
  ADD COLUMN weekly_assessment_note VARCHAR(255) DEFAULT NULL AFTER weekly_inferiority_score,
  ADD COLUMN weekly_assessed_at DATETIME DEFAULT NULL AFTER weekly_assessment_note;

INSERT INTO system_configs (config_key, config_value, updated_by)
VALUES
  ('DEFAULT_ENERGY_KEYWORDS', '["稳住节奏","自我确认","先做一步","允许不完美","持续微进步"]', 1),
  ('DEFAULT_COSMIC_MICRO_CONTENTS', '["你不是在和别人赛跑，而是在训练一个更稳定的自己。先完成一个最小行动，能量就会流动起来。","恐惧不是停止的理由，而是你正在靠近升级边界的信号。今天保持行动，就在改写旧剧本。","你值得拥有更好的自己。把注意力从“我行不行”转到“我先做一小步”。"]', 1)
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  updated_by = VALUES(updated_by);
