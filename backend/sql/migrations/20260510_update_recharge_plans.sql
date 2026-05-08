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
