USE sales_luck_system;

INSERT INTO system_configs (config_key, config_value, updated_by)
VALUES
  ('INTERVENTION_TEMPLATES', '[{"key":"low_energy_reactivate","title":"低能量唤醒","content":"你好，{username}。你不是做不到，而是最近能量波动较大。今天先完成一个最小行动，我们会陪你把节奏拉回来。"},{"key":"fear_stabilize","title":"恐惧安抚","content":"你好，{username}。你现在的压力是成长前的正常反应。先别追求完美，先完成一步，你会重新找回掌控感。"},{"key":"upgrade_conversion","title":"升级转化","content":"你好，{username}。你已经有了基础，建议进入更系统的21天重塑节奏，让改变稳定发生。"}]', 1)
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  updated_by = VALUES(updated_by);
