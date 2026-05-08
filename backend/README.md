# Sales Luck System Backend

## 环境要求

- Node.js 18+
- MySQL 8+

## 1) 安装依赖

```bash
npm install
```

## 2) 配置环境变量

在 `backend/.env` 中确认以下配置：

```env
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sales_luck_system
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d
LIVE_QA_URL=https://www.tiktok.com/live
FRONTEND_ADMIN_URL=http://127.0.0.1:5176/
```

## 3) 初始化数据库

在 MySQL 中执行：

```bash
mysql -u root -p < sql/schema.sql
mysql -u root -p < sql/seed.sql
```

如果你本地 `root` 无密码，可以去掉 `-p`。

如果你是从旧版本升级，请额外执行本次增量脚本：

```bash
mysql -u root -p < sql/migrations/20260508_add_community_posts.sql
mysql -u root -p < sql/migrations/20260509_add_admin_console.sql
```

## 4) 启动服务

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

## 5) 运行测试

```bash
npm test
```

端到端冒烟（要求后端服务已启动）：

```bash
python3 scripts/e2e_smoke.py
```

## 6) 联调流程（前端配合）

推荐按照下面顺序验证：

1. 注册：`POST /api/auth/register`
2. 登录：`POST /api/auth/login`
3. 钱包：`GET /api/wallet`
4. 抽奖：`POST /api/lottery/spin`
5. 抽奖记录：`GET /api/lottery/records`
6. 学习分享列表：`GET /api/community/posts`
7. 学习分享发布：`POST /api/community/posts`
8. 查询充值套餐：`GET /api/recharge/packages`
9. 充值：`POST /api/recharge/create`
10. 充值记录：`GET /api/recharge/records`
11. 在线答疑链接配置：`GET /api/public/config`

只要 1~11 全部通过，就说明前后端核心流程联通。

## 7) 客服运营后台（Phase 1）

- 后台入口：`/admin`
- 后台登录接口：`POST /api/admin/auth/login`
- 默认种子账号（见 `sql/seed.sql`）：
  - 超级管理员：`cs_admin / admin123456`
  - 客服账号：`cs_agent / admin123456`

Phase 1 能力包含：
- 客户列表/详情查询（含检测记录、充值记录、能量变更）
- 客服代充值申请与审批执行
- API 配置管理（`LIVE_QA_URL` / `FRONTEND_ADMIN_URL`）
- 业务参数管理（每日次数阈值等）
- 审计日志查询
