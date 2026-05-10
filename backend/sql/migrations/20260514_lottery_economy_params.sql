-- 转盘与注册经济参数（仅调数值，逻辑读 business_params）
INSERT INTO business_params (param_key, param_value, updated_by)
VALUES
  ('LOTTERY_SPIN_POINTS_COST', '22', 1),
  ('LOTTERY_ENERGY_BOOST_COST', '1', 1),
  ('REGISTER_GIFT_POINTS', '48', 1)
ON DUPLICATE KEY UPDATE
  param_value = VALUES(param_value),
  updated_by = VALUES(updated_by);
