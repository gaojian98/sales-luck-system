USE sales_luck_system;

INSERT INTO recharge_packages (id, name, amount, energy_value, is_enabled)
VALUES
  (1, '7天能量重启包', 9.90, 12, 1),
  (2, '21天信念重塑包', 59.90, 88, 1),
  (3, '90天身份升级包', 199.00, 320, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  amount = VALUES(amount),
  energy_value = VALUES(energy_value),
  is_enabled = VALUES(is_enabled);

INSERT INTO admin_users (id, username, password_hash, role, status)
VALUES
  (1, 'cs_admin', '$2b$10$6KR2qk8RNUSSxL9X70wiiezDkYC6LDcvJUOxaVF79O0zaeWO5uyQW', 'super_admin', 1),
  (2, 'cs_agent', '$2b$10$6KR2qk8RNUSSxL9X70wiiezDkYC6LDcvJUOxaVF79O0zaeWO5uyQW', 'cs', 1)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  status = VALUES(status);

INSERT INTO system_configs (config_key, config_value, updated_by)
VALUES
  ('LIVE_QA_URL', 'https://www.tiktok.com/live', 1),
  ('FRONTEND_ADMIN_URL', 'http://127.0.0.1:5176/', 1),
  ('DEFAULT_ENERGY_KEYWORDS', '["稳住节奏","自我确认","先做一步","允许不完美","持续微进步"]', 1),
  ('DEFAULT_COSMIC_MICRO_CONTENTS', '["你不是在和别人赛跑，而是在训练一个更稳定的自己。先完成一个最小行动，能量就会流动起来。","恐惧不是停止的理由，而是你正在靠近升级边界的信号。今天保持行动，就在改写旧剧本。","你值得拥有更好的自己。把注意力从“我行不行”转到“我先做一小步”。"]', 1),
  ('RECHARGE_CHANNEL_OPTIONS', '[{"value":"wechat","label":"微信"},{"value":"alipay","label":"支付宝"},{"value":"bank_card","label":"银行卡"},{"value":"cold_wallet","label":"冷钱包"},{"value":"manual","label":"人工代充"}]', 1),
  ('INTERVENTION_TEMPLATES', '[{"key":"low_energy_reactivate","title":"低能量唤醒","content":"你好，{username}。你不是做不到，而是最近能量波动较大。今天先完成一个最小行动，我们会陪你把节奏拉回来。"},{"key":"fear_stabilize","title":"恐惧安抚","content":"你好，{username}。你现在的压力是成长前的正常反应。先别追求完美，先完成一步，你会重新找回掌控感。"},{"key":"upgrade_conversion","title":"升级转化","content":"你好，{username}。你已经有了基础，建议进入更系统的21天重塑节奏，让改变稳定发生。"}]', 1)
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  updated_by = VALUES(updated_by);

INSERT INTO business_params (param_key, param_value, updated_by)
VALUES
  ('DAILY_MAX_SPIN', '20', 1),
  ('LOW_SCORE_THRESHOLD', '60', 1),
  ('VERY_LOW_SCORE_THRESHOLD', '40', 1),
  ('ENERGY_PER_YUAN_REDEEM', '100', 1),
  ('MIN_REDEEM_ENERGY', '100', 1),
  ('MAX_GIFT_ENERGY_PER_TX', '5000', 1),
  ('LOTTERY_SPIN_POINTS_COST', '22', 1),
  ('LOTTERY_ENERGY_BOOST_COST', '1', 1),
  ('REGISTER_GIFT_POINTS', '48', 1)
ON DUPLICATE KEY UPDATE
  param_value = VALUES(param_value),
  updated_by = VALUES(updated_by);

INSERT INTO customer_tags (name, color, created_by)
VALUES
  ('高意向', '#16a34a', 1),
  ('重点跟进', '#dc2626', 1),
  ('潜力客户', '#2563eb', 1)
ON DUPLICATE KEY UPDATE
  color = VALUES(color),
  created_by = VALUES(created_by);
