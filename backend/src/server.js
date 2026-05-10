const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

/** 用于确认当前进程是本仓库后端（若访问不到说明 3001 上不是本服务，常见原因：Vite 占用了 3001） */
app.get('/sls-health', (req, res) => {
  res.json({
    ok: true,
    service: 'sales-luck-system-backend',
    adminUi: '/admin',
    api: '/api'
  });
});

app.use('/api', routes);

app.get('/', (req, res) => {
  res.redirect('/admin');
});

app.get('/admin', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const html = `
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sales Luck System - Backend Admin</title>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f5f7fb;
        color: #1f2937;
      }
      .container {
        max-width: 1120px;
        margin: 24px auto;
        padding: 0 16px;
      }
      .card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      }
      h1, h2, h3 {
        margin: 0 0 8px;
      }
      h1 {
        margin: 0 0 8px 0;
        font-size: 24px;
      }
      .muted {
        color: #6b7280;
        margin: 0 0 16px 0;
      }
      .row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }
      .row > .card {
        flex: 1 1 320px;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      label {
        font-size: 13px;
        color: #4b5563;
      }
      input, select, textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 10px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: #fff;
      }
      textarea {
        min-height: 80px;
      }
      button {
        border: 0;
        background: #2563eb;
        color: #fff;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
      }
      button.secondary {
        background: #4b5563;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      th, td {
        border-bottom: 1px solid #e5e7eb;
        text-align: left;
        padding: 8px 6px;
        vertical-align: top;
      }
      .hidden {
        display: none;
      }
      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 999px;
        background: #e5e7eb;
        font-size: 12px;
      }
      .toolbar {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 10px;
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        white-space: pre-wrap;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 10px;
      }
      .danger {
        color: #b91c1c;
      }
      .detail-section {
        margin-bottom: 14px;
      }
      .detail-section h4 {
        margin: 0 0 8px;
        font-size: 14px;
        color: #374151;
      }
      .detail-empty {
        font-size: 12px;
        color: #6b7280;
      }
      .section-tools {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <h1>客服运营后台</h1>
        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:10px 14px;margin:0 0 14px;font-size:13px;color:#065f46;line-height:1.5">
          <strong>界面版本 2026-05-11（ops-v3）</strong>
          · 本页应看到「转化漏斗看板（日/周）」「客服绩效面板」「客户详情 · 一键创建D1/D3/D7」等区块（在登录后向下滚动）。
          若完全没有变化，请在本机<strong>停止并重新启动</strong>后端进程，并对本页执行<strong>强制刷新</strong>（Windows：Ctrl+F5；Mac：Cmd+Shift+R）。
        </div>
        <p class="muted">入口地址：${baseUrl}/admin</p>
        <div id="loginPanel" class="stack">
          <h3>客服登录</h3>
          <label>账号</label>
          <input id="loginAccount" placeholder="例如：cs_admin" />
          <label>密码</label>
          <input id="loginPassword" type="password" placeholder="默认：admin123456" />
          <div class="toolbar">
            <button id="btnLogin">登录后台</button>
          </div>
          <div class="muted">默认测试账号：<span class="badge">cs_admin / admin123456</span></div>
          <div id="loginMsg" class="danger"></div>
        </div>
        <div id="appPanel" class="hidden">
          <div class="toolbar">
            <span id="currentAdmin" class="badge"></span>
            <button class="secondary" id="btnLogout">退出登录</button>
          </div>
        </div>
      </div>

      <div id="mainPanel" class="hidden">
        <div class="row">
          <div class="card">
            <h3>客户查询</h3>
            <div class="toolbar">
              <input id="customerKeyword" placeholder="用户名/手机号/邮箱" />
              <button id="btnSearchCustomers">查询客户</button>
            </div>
            <div class="toolbar">
              <button id="btnPrevCustomers" class="secondary">上一页</button>
              <button id="btnNextCustomers" class="secondary">下一页</button>
              <span id="customerPageInfo" class="badge">第 1 页</span>
            </div>
            <table id="customerTable">
              <thead>
                <tr><th>ID</th><th>用户</th><th>积分</th><th>能量</th><th>操作</th></tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="card">
            <h3>客户详情</h3>
            <div id="customerDetail" class="detail-empty">请先在左侧选择客户。</div>
          </div>
        </div>

        <div class="row">
          <div class="card">
            <h3>客服代充值</h3>
            <div class="stack">
              <label>客户ID</label>
              <input id="assistUserId" placeholder="例如 1" />
              <label>充值包ID</label>
              <input id="assistPackageId" placeholder="例如 2" />
              <label>充值渠道</label>
              <select id="assistPayChannel">
                <option value="wechat">微信</option>
                <option value="alipay">支付宝</option>
                <option value="manual">人工代充</option>
                <option value="cold_wallet">冷钱包</option>
              </select>
              <label>备注</label>
              <textarea id="assistRemark" placeholder="请填写客服备注"></textarea>
              <div class="toolbar">
                <button id="btnCreateAssist">提交代充值申请</button>
                <button id="btnApproveAssist" class="secondary">按申请ID审批并执行</button>
                <button id="btnRejectAssist" class="secondary">按申请ID驳回</button>
                <button id="btnCancelAssist" class="secondary">按申请ID撤销</button>
                <button id="btnSweepAssistTimeout" class="secondary">扫描超时申请</button>
              </div>
              <label>审批申请ID</label>
              <input id="assistRequestId" placeholder="例如 1" />
              <label>驳回原因</label>
              <input id="assistRejectReason" placeholder="请填写驳回原因" />
              <label>驳回原因模板</label>
              <select id="assistRejectReasonTemplate">
                <option value="">请选择模板</option>
              </select>
              <label>干预话术模板</label>
              <select id="interventionTemplate">
                <option value="">请选择话术模板</option>
              </select>
              <button id="btnFillInterventionTemplate" class="secondary">一键填充话术</button>
              <label>超时阈值（分钟）</label>
              <input id="assistTimeoutMinutes" placeholder="默认 30" />
              <div id="assistMsg" class="mono"></div>
              <div class="toolbar">
                <input id="assistFilter" placeholder="筛选审批列表（客户/套餐/申请人）" />
              </div>
              <button id="btnLoadAssistRequests" class="secondary">刷新审批列表</button>
              <div id="assistRequests" class="detail-empty">暂无审批数据</div>
              <button id="btnLoadNotifications" class="secondary">刷新通知记录</button>
              <div id="notificationList" class="detail-empty">暂无通知数据</div>
            </div>
          </div>

          <div class="card">
            <h3>配置与逻辑参数</h3>
            <div class="stack">
              <label>API 配置键（LIVE_QA_URL / FRONTEND_ADMIN_URL）</label>
              <input id="configKey" placeholder="LIVE_QA_URL" />
              <label>配置值</label>
              <input id="configValue" placeholder="https://..." />
              <button id="btnSaveConfig">保存配置</button>
              <button id="btnLoadConfig" class="secondary">加载当前配置</button>

              <label>业务参数键（DAILY_MAX_SPIN / LOW_SCORE_THRESHOLD / VERY_LOW_SCORE_THRESHOLD）</label>
              <input id="paramKey" placeholder="DAILY_MAX_SPIN" />
              <label>参数值</label>
              <input id="paramValue" placeholder="20" />
              <button id="btnSaveParam" class="secondary">保存参数</button>
              <label>充值渠道配置（JSON）</label>
              <textarea id="channelOptionsJson" placeholder='[{"value":"wechat","label":"微信"}]'></textarea>
              <button id="btnSaveChannelOptions" class="secondary">保存渠道配置</button>
              <div class="toolbar">
                <button id="btnLoadConfigHistory" class="secondary">加载配置历史</button>
                <button id="btnRollbackConfig" class="secondary">按历史ID回滚</button>
              </div>
              <label>配置历史ID（用于回滚）</label>
              <input id="configHistoryId" placeholder="例如：12" />
              <div id="settingMsg" class="mono"></div>
              <div id="configHistory" class="detail-empty">暂无配置历史</div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="card">
            <h3>转化漏斗看板（日 / 周）</h3>
            <div class="toolbar">
              <button id="btnLoadDashboardDaily" type="button" class="secondary">日度（1天）</button>
              <button id="btnLoadDashboardWeekly" type="button" class="secondary">周度（7天）</button>
              <input id="dashboardDays" placeholder="自定义统计天数" />
              <label style="display:inline-flex;align-items:center;gap:6px;">
                <input type="checkbox" id="dashboardIncludeTrend" />
                每日拆解
              </label>
              <button id="btnLoadDashboard" type="button">刷新看板</button>
            </div>
            <div id="dashboardCards" class="detail-empty">暂无数据</div>
            <h4 style="margin:14px 0 8px;font-size:14px;color:#64748b">每日趋势（需勾选「每日拆解」）</h4>
            <div id="dashboardTrend" class="detail-empty">暂无趋势数据</div>
          </div>
          <div class="card">
            <h3>自动跟进任务（D1/D3/D7）</h3>
            <div class="stack">
              <label>客户ID</label>
              <input id="followupUserId" placeholder="例如：1" />
              <label>任务备注（可空）</label>
              <textarea id="followupContent" placeholder="例如：优先安抚恐惧情绪"></textarea>
              <label style="display:inline-flex;align-items:center;gap:6px;">
                <input type="checkbox" id="followupAssignToMe" checked />
                创建时分配给当前登录客服（可取消）
              </label>
              <label>指定处理人后台ID（可空，填写则优先于上一项）</label>
              <input id="followupCreateAssignOverride" placeholder="例如：组长指定给其他客服" />
              <label style="display:inline-flex;align-items:center;gap:6px;">
                <input type="checkbox" id="followupOverdueOnly" />
                仅显示逾期（pending 且已过到期时间）
              </label>
              <label>处理人后台ID（可空，筛选 assigned_to）</label>
              <input id="followupAssignedTo" placeholder="例如：2" />
              <div class="toolbar">
                <button id="btnCreateFollowupTasks" type="button">创建D1/D3/D7任务</button>
                <button id="btnLoadFollowups" type="button" class="secondary">刷新任务</button>
                <button id="btnRemindFollowupOverdue" type="button" class="secondary">发送逾期提醒通知</button>
                <button id="btnExportFollowupCsv" type="button" class="secondary">导出列表CSV</button>
              </div>
              <label>任务ID（用于更新状态）</label>
              <input id="followupTaskId" placeholder="例如：10" />
              <label>状态（pending/done/cancelled）</label>
              <input id="followupStatus" placeholder="done" />
              <button id="btnUpdateFollowupStatus" type="button" class="secondary">更新任务状态</button>
              <div id="followupMsg" class="mono"></div>
              <div id="followupList" class="detail-empty">暂无跟进任务</div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="card" style="flex:1">
            <h3>客服绩效面板</h3>
            <p style="margin:0 0 10px;font-size:13px;color:#64748b">
              跟进完成率 = 周期内已完成 /（已完成 + 当前待办）；转化贡献 = 周期内代充审批通过金额。
            </p>
            <div class="toolbar">
              <input id="csPerfDays" placeholder="统计天数，默认7" />
              <input id="csPerfAdminId" placeholder="筛选后台账号ID（组长可用）" />
              <button id="btnLoadCsPerformance" type="button">刷新绩效</button>
              <button id="btnExportCsPerfCsv" type="button" class="secondary">导出绩效CSV</button>
            </div>
            <div id="csPerformanceTable" class="detail-empty">暂无绩效数据</div>
          </div>
        </div>

        <div class="row">
          <div class="card">
            <h3>审计日志（最近20条）</h3>
            <div class="toolbar">
              <input id="auditAction" placeholder="按动作筛选（如 config_update）" />
              <input id="auditAdmin" placeholder="按后台账号筛选（如 cs_admin）" />
            </div>
            <div class="toolbar">
              <input id="auditFilter" placeholder="本地筛选日志（动作/对象/账号）" />
            </div>
            <button id="btnLoadAudit">刷新日志</button>
            <div id="auditLogs" class="detail-empty">暂无审计日志</div>
          </div>
        </div>

        <div class="row">
          <div class="card">
            <h3>客户标签</h3>
            <div class="stack">
              <label>新标签名</label>
              <input id="newTagName" placeholder="例如：高价值客户" />
              <label>颜色（HEX）</label>
              <input id="newTagColor" placeholder="#16a34a" />
              <button id="btnCreateTag">创建标签</button>
              <label>绑定客户ID</label>
              <input id="bindTagCustomerId" placeholder="例如：1" />
              <label>绑定标签ID</label>
              <input id="bindTagId" placeholder="例如：2" />
              <div class="toolbar">
                <input id="tagFilter" placeholder="筛选标签（标签名/颜色）" />
              </div>
              <button id="btnBindTag" class="secondary">给客户打标签</button>
              <button id="btnLoadTags" class="secondary">刷新标签列表</button>
              <div id="tagMsg" class="mono"></div>
              <div id="tagList" class="detail-empty">暂无标签数据</div>
            </div>
          </div>
          <div class="card">
            <h3>客服工单</h3>
            <div class="stack">
              <label>客户ID（可空）</label>
              <input id="ticketUserId" placeholder="例如：1" />
              <label>工单标题</label>
              <input id="ticketTitle" placeholder="例如：客户反馈充值未到账" />
              <label>工单内容</label>
              <textarea id="ticketContent" placeholder="详细描述问题"></textarea>
              <label>优先级（normal/high/urgent）</label>
              <input id="ticketPriority" placeholder="normal" />
              <button id="btnCreateTicket">创建工单</button>
              <label>更新工单ID</label>
              <input id="ticketIdForUpdate" placeholder="例如：1" />
              <label>新状态（open/processing/resolved/closed）</label>
              <input id="ticketStatusForUpdate" placeholder="processing" />
              <div class="toolbar">
                <input id="ticketFilter" placeholder="筛选工单（标题/客户/状态）" />
              </div>
              <button id="btnUpdateTicketStatus" class="secondary">更新工单状态</button>
              <button id="btnLoadTickets" class="secondary">刷新工单列表</button>
              <label>工单评论</label>
              <textarea id="ticketCommentInput" placeholder="输入评论后点击添加"></textarea>
              <button id="btnCreateTicketComment" class="secondary">添加工单评论</button>
              <div id="ticketMsg" class="mono"></div>
              <div id="ticketList" class="detail-empty">暂无工单数据</div>
              <div id="ticketComments" class="detail-empty">请选择工单查看评论</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <script>
      const API_BASE = '${baseUrl}/api/admin';
      let adminToken = '';
      let currentAdminRole = '';
      let customerPage = 1;
      const customerPageSize = 20;
      let customerDetailSortDesc = true;
      let customerIdentitySortDesc = true;
      let rechargeChannelOptions = [
        { value: 'wechat', label: '微信' },
        { value: 'alipay', label: '支付宝' },
        { value: 'manual', label: '人工代充' },
        { value: 'cold_wallet', label: '冷钱包' }
      ];
      let assistRequestRows = [];
      let assistRejectReasons = [];
      let interventionTemplates = [];
      let supportNotifications = [];
      let auditLogRows = [];
      let tagRowsCache = [];
      let ticketRowsCache = [];
      let followupRowsCache = [];
      let csPerformanceRowsCache = [];
      let currentCustomerId = null;
      let currentAdminId = null;

      function setLoggedIn(loggedIn, adminName = '') {
        document.getElementById('loginPanel').classList.toggle('hidden', loggedIn);
        document.getElementById('appPanel').classList.toggle('hidden', !loggedIn);
        document.getElementById('mainPanel').classList.toggle('hidden', !loggedIn);
        document.getElementById('currentAdmin').textContent = adminName ? ('已登录：' + adminName) : '';
      }

      function applyRolePermissions() {
        const isSuperAdmin = currentAdminRole === 'super_admin';
        const isOps = currentAdminRole === 'ops' || isSuperAdmin;
        const isLead = currentAdminRole === 'cs_lead' || isSuperAdmin;
        const isCs = ['cs', 'cs_lead', 'super_admin'].includes(currentAdminRole);

        const setDisabled = (id, disabled) => {
          const el = document.getElementById(id);
          if (el) el.disabled = disabled;
        };
        const setHidden = (id, hidden) => {
          const el = document.getElementById(id);
          if (el) el.style.display = hidden ? 'none' : '';
        };

        setDisabled('btnSaveConfig', !isOps);
        setDisabled('btnSaveParam', !isOps);
        setDisabled('btnSaveChannelOptions', !isOps);
        setDisabled('btnApproveAssist', !isLead);
        setDisabled('btnRejectAssist', !isLead);
        setDisabled('btnCancelAssist', !isCs);
        setDisabled('btnSweepAssistTimeout', !isLead);
        setDisabled('btnCreateAssist', !isCs);
        setDisabled('btnCreateTicket', !isCs);
        setDisabled('btnUpdateTicketStatus', !isCs);
        setDisabled('btnCreateTag', !isCs);
        setDisabled('btnBindTag', !isCs);
        setHidden('btnRollbackConfig', !isSuperAdmin);
        const perfFilter = document.getElementById('csPerfAdminId');
        if (perfFilter) {
          perfFilter.disabled = currentAdminRole === 'cs';
          if (currentAdminRole === 'cs' && currentAdminId) {
            perfFilter.value = String(currentAdminId);
          }
        }
      }

      function channelLabel(value) {
        const code = String(value || '').trim().toLowerCase();
        const hit = rechargeChannelOptions.find((item) => item.value === code);
        if (hit) return hit.label;
        if (code === 'wechat') return '微信';
        if (code === 'alipay') return '支付宝';
        if (code === 'manual') return '人工代充';
        if (code === 'cold_wallet') return '冷钱包';
        if (code) return code;
        return '系统充值';
      }

      async function api(path, options = {}) {
        const headers = Object.assign(
          { 'Content-Type': 'application/json' },
          options.headers || {}
        );
        if (adminToken) headers.Authorization = 'Bearer ' + adminToken;
        const res = await fetch(API_BASE + path, {
          method: options.method || 'GET',
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined
        });
        return res.json();
      }

      async function login() {
        const account = document.getElementById('loginAccount').value.trim();
        const password = document.getElementById('loginPassword').value;
        const data = await api('/auth/login', { method: 'POST', body: { account, password } });
        if (!data.success) {
          document.getElementById('loginMsg').textContent = data.message || '登录失败';
          return;
        }
        adminToken = data.data.token;
        currentAdminRole = data.data.admin.role || '';
        currentAdminId = data.data.admin.id != null ? Number(data.data.admin.id) : null;
        setLoggedIn(true, data.data.admin.username + '（' + data.data.admin.role + '）');
        applyRolePermissions();
        document.getElementById('loginMsg').textContent = '';
        customerPage = 1;
        await loadRechargeChannelOptions();
        await loadConfigPanel();
        await loadConfigHistory();
        await loadCustomers();
        await loadAssistRequests();
        await loadAssistRejectReasons();
        await loadInterventionTemplates();
        await loadSupportNotifications();
        await loadConversionDashboard();
        await loadFollowupTasks();
        await loadCsPerformance();
        await loadAuditLogs();
      }

      function renderRechargeChannelSelect() {
        const select = document.getElementById('assistPayChannel');
        if (!select) return;
        const current = select.value || 'manual';
        select.innerHTML = rechargeChannelOptions
          .map((item) => '<option value="' + esc(item.value) + '">' + esc(item.label) + '</option>')
          .join('');
        select.value = rechargeChannelOptions.some((item) => item.value === current) ? current : 'manual';
      }

      async function loadRechargeChannelOptions() {
        const data = await api('/recharge/channel-options');
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          rechargeChannelOptions = data.data.map((item) => ({
            value: String(item.value || '').trim().toLowerCase(),
            label: String(item.label || item.value || '').trim()
          })).filter((item) => item.value && item.label);
        }
        if (rechargeChannelOptions.length === 0) {
          rechargeChannelOptions = [
            { value: 'wechat', label: '微信' },
            { value: 'alipay', label: '支付宝' },
            { value: 'manual', label: '人工代充' },
            { value: 'cold_wallet', label: '冷钱包' }
          ];
        }
        renderRechargeChannelSelect();
      }

      async function loadCustomers() {
        const keyword = document.getElementById('customerKeyword').value.trim();
        const query = '?keyword=' + encodeURIComponent(keyword) +
          '&page=' + customerPage +
          '&pageSize=' + customerPageSize;
        const data = await api('/customers' + query);
        const tbody = document.querySelector('#customerTable tbody');
        tbody.innerHTML = '';
        if (!data.success) return;
        (data.data.list || []).forEach((item) => {
          const tr = document.createElement('tr');
          tr.innerHTML = '<td>' + item.id + '</td>' +
            '<td>' + (item.username || '-') + '</td>' +
            '<td>' + (item.points_balance ?? '-') + '</td>' +
            '<td>' + (item.energy_balance ?? '-') + '</td>' +
            '<td><button data-id="' + item.id + '">详情</button></td>';
          tr.querySelector('button').addEventListener('click', () => loadCustomerDetail(item.id));
          tbody.appendChild(tr);
        });
        const p = data.data.pagination || {};
        const totalPages = Math.max(1, Math.ceil((p.total || 0) / (p.pageSize || customerPageSize)));
        document.getElementById('customerPageInfo').textContent =
          '第 ' + (p.page || customerPage) + ' 页 / 共 ' + totalPages + ' 页（总 ' + (p.total || 0) + '）';
      }

      async function loadCustomerDetail(id) {
        const data = await api('/customers/' + id);
        if (!data.success) {
          document.getElementById('customerDetail').innerHTML =
            '<div class="detail-empty">' + (data.message || '查询失败') + '</div>';
          return;
        }
        document.getElementById('assistUserId').value = id;
        currentCustomerId = Number(id);
        renderCustomerDetail(data.data || {});
        await loadCustomerRiskProfile(id);
      }

      async function loadCustomerRiskProfile(customerId) {
        const data = await api('/customers/' + customerId + '/risk-profile');
        if (!data.success) return;
        const badge = document.getElementById('customerRiskBadge');
        if (!badge) return;
        const risk = data.data?.riskLevel || 'medium';
        const text = risk === 'high' ? '高风险' : risk === 'low' ? '低风险' : '中风险';
        badge.textContent = '风险分层：' + text;
        badge.style.color = risk === 'high' ? '#b91c1c' : risk === 'low' ? '#15803d' : '#b45309';
      }

      function esc(value) {
        return String(value ?? '')
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }

      function renderRows(rows, columns) {
        if (!Array.isArray(rows) || rows.length === 0) {
          return '<div class="detail-empty">暂无数据</div>';
        }
        const thead = '<thead><tr>' + columns.map((c) => '<th>' + esc(c.title) + '</th>').join('') + '</tr></thead>';
        const tbody = '<tbody>' + rows.map((row) => {
          return '<tr>' + columns.map((c) => '<td>' + esc(c.render(row)) + '</td>').join('') + '</tr>';
        }).join('') + '</tbody>';
        return '<table>' + thead + tbody + '</table>';
      }

      function renderSimpleTable(targetId, rows, columns, emptyText) {
        const el = document.getElementById(targetId);
        if (!el) return;
        if (!Array.isArray(rows) || rows.length === 0) {
          el.innerHTML = '<div class="detail-empty">' + esc(emptyText || '暂无数据') + '</div>';
          return;
        }
        el.innerHTML = renderRows(rows, columns);
      }

      function renderInteractiveTable(targetId, rows, columns, emptyText, onRowClick) {
        const el = document.getElementById(targetId);
        if (!el) return;
        if (!Array.isArray(rows) || rows.length === 0) {
          el.innerHTML = '<div class="detail-empty">' + esc(emptyText || '暂无数据') + '</div>';
          return;
        }

        const thead = '<thead><tr>' + columns.map((c) => '<th>' + esc(c.title) + '</th>').join('') + '</tr></thead>';
        const tbody = '<tbody>' + rows.map((row, idx) => {
          return '<tr data-row-idx="' + idx + '" style="cursor:pointer;">' +
            columns.map((c) => '<td>' + esc(c.render(row)) + '</td>').join('') +
            '</tr>';
        }).join('') + '</tbody>';
        el.innerHTML = '<table>' + thead + tbody + '</table>';

        if (typeof onRowClick === 'function') {
          el.querySelectorAll('tr[data-row-idx]').forEach((tr) => {
            tr.addEventListener('click', () => {
              const idx = Number(tr.getAttribute('data-row-idx'));
              onRowClick(rows[idx]);
            });
          });
        }
      }

      function includeFilter(row, fields, keyword) {
        if (!keyword) return true;
        const low = keyword.toLowerCase();
        return fields.some((f) => String(row?.[f] ?? '').toLowerCase().includes(low));
      }

      function renderCustomerDetail(detail) {
        const profile = detail.profile || {};
        const tags = Array.isArray(detail.tags) ? detail.tags : [];
        const tests = Array.isArray(detail.tests) ? [...detail.tests] : [];
        const recharges = Array.isArray(detail.recharges) ? [...detail.recharges] : [];
        const energy = Array.isArray(detail.energy) ? [...detail.energy] : [];
        const mindset = detail.mindset || {};
        const identity = detail.identity || {};

        const sortByDate = (a, b) => {
          const ta = new Date(a?.created_at || 0).getTime();
          const tb = new Date(b?.created_at || 0).getTime();
          return customerDetailSortDesc ? tb - ta : ta - tb;
        };
        tests.sort(sortByDate);
        recharges.sort(sortByDate);
        energy.sort(sortByDate);

        const profileTable = renderRows(
          [profile],
          [
            { title: 'ID', render: (r) => r.id ?? '-' },
            { title: '用户名', render: (r) => r.username || '-' },
            { title: '手机号', render: (r) => r.phone || '-' },
            { title: '邮箱', render: (r) => r.email || '-' },
            { title: '状态', render: (r) => (r.status === 1 ? '正常' : '禁用') },
            { title: '积分', render: (r) => r.points_balance ?? '-' },
            { title: '能量', render: (r) => r.energy_balance ?? '-' }
          ]
        );

        const tagsTable = renderRows(
          tags,
          [
            { title: '标签ID', render: (r) => r.id ?? '-' },
            { title: '标签名', render: (r) => r.name || '-' },
            { title: '颜色', render: (r) => r.color || '-' }
          ]
        );

        const testsTable = renderRows(
          tests.slice(0, 10),
          [
            { title: '记录ID', render: (r) => r.id ?? '-' },
            { title: '奖励类型', render: (r) => r.reward_type || '-' },
            { title: '奖励值', render: (r) => r.reward_value ?? '-' },
            { title: '积分变化', render: (r) => (r.points_before ?? '-') + ' → ' + (r.points_after ?? '-') },
            { title: '时间', render: (r) => r.created_at || '-' }
          ]
        );

        const rechargesTable = renderRows(
          recharges.slice(0, 10),
          [
            { title: '记录ID', render: (r) => r.id ?? '-' },
            { title: '订单号', render: (r) => r.order_no || '-' },
            { title: '充值渠道', render: (r) => channelLabel(r.pay_channel) },
            { title: '套餐', render: (r) => r.package_name || '-' },
            { title: '金额', render: (r) => r.pay_amount ?? '-' },
            { title: '能量', render: (r) => r.energy_value ?? '-' },
            { title: '状态', render: (r) => r.status || '-' }
          ]
        );

        const energyTable = renderRows(
          energy.slice(0, 10),
          [
            { title: '记录ID', render: (r) => r.id ?? '-' },
            { title: '类型', render: (r) => r.type || '-' },
            { title: '变化值', render: (r) => r.change_amount ?? '-' },
            { title: '变更后', render: (r) => r.balance_after ?? '-' },
            { title: '来源', render: (r) => r.source || '-' },
            { title: '备注', render: (r) => r.remark || '-' }
          ]
        );

        const mindsetTable = renderRows(
          [
            {
              latestDate: mindset.latest?.practice_date || '-',
              selfNow: mindset.latest?.self_confirmation_score ?? '-',
              selfWeek: mindset.thisWeek?.selfConfirmation ?? '-',
              selfPrevWeek: mindset.prevWeek?.selfConfirmation ?? '-',
              actionNow: mindset.latest?.action_consistency_index ?? '-',
              actionWeek: mindset.thisWeek?.actionConsistency ?? '-',
              actionPrevWeek: mindset.prevWeek?.actionConsistency ?? '-',
              fearNow: mindset.latest?.fear_interference_index ?? '-',
              fearWeek: mindset.thisWeek?.fearInterference ?? '-',
              fearPrevWeek: mindset.prevWeek?.fearInterference ?? '-'
            }
          ],
          [
            { title: '最新日期', render: (r) => r.latestDate },
            { title: '自我确认(最新/本周/上周)', render: (r) => String(r.selfNow) + ' / ' + String(r.selfWeek) + ' / ' + String(r.selfPrevWeek) },
            { title: '行动稳定(最新/本周/上周)', render: (r) => String(r.actionNow) + ' / ' + String(r.actionWeek) + ' / ' + String(r.actionPrevWeek) },
            { title: '恐惧干扰(最新/本周/上周)', render: (r) => String(r.fearNow) + ' / ' + String(r.fearWeek) + ' / ' + String(r.fearPrevWeek) }
          ]
        );

        const identityTable = renderRows(
          [{
            level: identity.level ? ('Lv.' + identity.level + ' ' + (identity.levelName || '')) : '--',
            levelScore: identity.levelScore ?? '--',
            currentStreak: identity.currentStreak ?? '--',
            evidenceCount: identity.evidenceCount ?? '--'
          }],
          [
            { title: '身份等级', render: (r) => r.level },
            { title: '身份分', render: (r) => r.levelScore },
            { title: '连续行动天数', render: (r) => r.currentStreak },
            { title: '证据墙数量', render: (r) => r.evidenceCount }
          ]
        );

        const badgeUnlocks = Array.isArray(identity.badgeUnlocks) ? identity.badgeUnlocks : [];
        const sortIdentityRowsByTime = (rows, fields) => {
          const list = Array.isArray(rows) ? [...rows] : [];
          list.sort((a, b) => {
            const getTs = (row) => {
              for (const key of fields) {
                if (row?.[key]) return new Date(row[key]).getTime();
              }
              return 0;
            };
            const ta = getTs(a);
            const tb = getTs(b);
            return customerIdentitySortDesc ? tb - ta : ta - tb;
          });
          return list;
        };

        const badgeRows = sortIdentityRowsByTime(badgeUnlocks, ['unlocked_at', 'created_at']);
        const buildBadgeTable = () => renderRows(
          badgeRows.slice(0, 10),
          [
            { title: '徽章Key', render: (r) => r.badge_key || '-' },
            { title: '徽章名称', render: (r) => r.badge_title || '-' },
            { title: '来源', render: (r) => r.source_type || '-' },
            { title: '领取时间', render: (r) => r.unlocked_at || '-' }
          ]
        );
        const badgeTable = buildBadgeTable();

        const evidenceRows = sortIdentityRowsByTime(Array.isArray(identity.evidences) ? identity.evidences : [], ['created_at', 'evidence_date']);
        const evidencePhaseOptions = [
          { value: 'all', label: '全部阶段' },
          { value: 'day_1_7', label: '第1-7天' },
          { value: 'day_8_21', label: '第8-21天' },
          { value: 'day_22_90', label: '第22-90天' }
        ];
        const buildEvidenceTable = (phase = 'all') => {
          const filtered = phase === 'all'
            ? evidenceRows
            : evidenceRows.filter((r) => (r.phase || '') === phase);
          return renderRows(
            filtered.slice(0, 10),
            [
              { title: '证据ID', render: (r) => r.id ?? '-' },
              { title: '标题', render: (r) => r.title || '-' },
              { title: '内容', render: (r) => r.content || '-' },
              { title: '阶段', render: (r) => r.phase_label || '-' },
              { title: '来源', render: (r) => r.source_type || '-' },
              { title: '日期', render: (r) => r.evidence_date || '-' }
            ]
          );
        };
        const evidenceTable = buildEvidenceTable('all');
        const evidencePhaseSelect = '<select id="evidencePhaseFilter">' +
          evidencePhaseOptions.map((item) => (
            '<option value="' + esc(item.value) + '">' + esc(item.label) + '</option>'
          )).join('') +
          '</select>';
        const evidenceSectionHtml = '<div class="detail-section"><div class="section-tools">' +
          evidencePhaseSelect +
          '<button id="btnToggleIdentitySort" class="secondary">身份排序：' + (customerIdentitySortDesc ? '倒序' : '正序') + '</button>' +
          '<button id="btnExportEvidenceCsv" class="secondary">导出证据CSV</button>' +
          '</div><h4>成长证据墙（最近10条）</h4><div id="customerEvidenceTableWrap">' + evidenceTable + '</div></div>';

        const evidenceColumns = [
          { title: '证据ID', render: (r) => r.id ?? '-' },
          { title: '标题', render: (r) => r.title || '-' },
          { title: '内容', render: (r) => r.content || '-' },
          { title: '阶段', render: (r) => r.phase_label || '-' },
          { title: '来源', render: (r) => r.source_type || '-' },
          { title: '日期', render: (r) => r.evidence_date || '-' }
        ];

        document.getElementById('customerDetail').innerHTML = [
          '<div class="detail-section"><div class="section-tools"><button id="btnCreateFollowupFromDetail" type="button">一键创建D1/D3/D7</button><button id="btnFillFollowupFromDetail" type="button" class="secondary">仅填入客户ID</button></div><h4>基础信息</h4>' + profileTable + '</div>',
          '<div class="detail-section"><h4 id="customerRiskBadge">风险分层：--</h4></div>',
          '<div class="detail-section"><h4>客户标签</h4>' + tagsTable + '</div>',
          '<div class="detail-section"><h4>心理画像（周对比）</h4>' + mindsetTable + '</div>',
          '<div class="detail-section"><h4>身份升级（等级）</h4>' + identityTable + '</div>',
          '<div class="detail-section"><h4>徽章领取记录（最近10条）</h4><div id="customerBadgeTableWrap">' + badgeTable + '</div></div>',
          evidenceSectionHtml,
          '<div class="detail-section"><div class="section-tools"><button id="btnToggleDetailSort" class="secondary">时间排序：' + (customerDetailSortDesc ? '倒序' : '正序') + '</button><button id="btnExportTestsCsv" class="secondary">导出检测CSV</button></div><h4>检测记录（最近10条）</h4>' + testsTable + '</div>',
          '<div class="detail-section"><div class="section-tools"><button id="btnCopyOrders" class="secondary">复制订单号</button><button id="btnExportRechargesCsv" class="secondary">导出充值CSV</button></div><h4>充值记录（最近10条）</h4>' + rechargesTable + '</div>',
          '<div class="detail-section"><div class="section-tools"><button id="btnExportEnergyCsv" class="secondary">导出能量CSV</button></div><h4>能量变更（最近10条）</h4>' + energyTable + '</div>'
        ].join('');

        const toCsv = (rows, columns) => {
          const header = columns.map((c) => '"' + c.title.replaceAll('"', '""') + '"').join(',');
          const body = rows.map((row) => {
            return columns.map((c) => {
              const raw = c.render(row);
              return '"' + String(raw ?? '').replaceAll('"', '""') + '"';
            }).join(',');
          }).join('\\n');
          return header + '\\n' + body;
        };

        const downloadCsv = (filename, csvText) => {
          const blob = new Blob(['\uFEFF' + csvText], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

        const testsColumns = [
          { title: '记录ID', render: (r) => r.id ?? '-' },
          { title: '奖励类型', render: (r) => r.reward_type || '-' },
          { title: '奖励值', render: (r) => r.reward_value ?? '-' },
          { title: '积分前', render: (r) => r.points_before ?? '-' },
          { title: '积分后', render: (r) => r.points_after ?? '-' },
          { title: '时间', render: (r) => r.created_at || '-' }
        ];
        const rechargeColumns = [
          { title: '记录ID', render: (r) => r.id ?? '-' },
          { title: '订单号', render: (r) => r.order_no || '-' },
          { title: '充值渠道', render: (r) => channelLabel(r.pay_channel) },
          { title: '套餐', render: (r) => r.package_name || '-' },
          { title: '金额', render: (r) => r.pay_amount ?? '-' },
          { title: '能量', render: (r) => r.energy_value ?? '-' },
          { title: '状态', render: (r) => r.status || '-' },
          { title: '时间', render: (r) => r.created_at || '-' }
        ];
        const energyColumns = [
          { title: '记录ID', render: (r) => r.id ?? '-' },
          { title: '类型', render: (r) => r.type || '-' },
          { title: '变化值', render: (r) => r.change_amount ?? '-' },
          { title: '变更后余额', render: (r) => r.balance_after ?? '-' },
          { title: '来源', render: (r) => r.source || '-' },
          { title: '备注', render: (r) => r.remark || '-' },
          { title: '时间', render: (r) => r.created_at || '-' }
        ];

        const getFilteredEvidenceRows = () => {
          const phase = document.getElementById('evidencePhaseFilter')?.value || 'all';
          if (phase === 'all') return evidenceRows;
          return evidenceRows.filter((r) => (r.phase || '') === phase);
        };

        const ordersText = recharges
          .map((item) => item.order_no)
          .filter(Boolean)
          .join('\\n');

        document.getElementById('btnCreateFollowupFromDetail')?.addEventListener('click', async () => {
          const uid = profile.id;
          if (!uid) {
            alert('当前详情缺少客户ID');
            return;
          }
          const el = document.getElementById('followupUserId');
          if (el) el.value = String(uid);
          const data = await submitFollowupCreate(uid);
          if (data && data.success) {
            alert('已为该客户创建 D1 / D3 / D7 跟进任务（使用下方「任务备注」与分配规则）。可在「自动跟进任务」中刷新列表。');
          }
        });
        document.getElementById('btnFillFollowupFromDetail')?.addEventListener('click', () => {
          const uid = profile.id;
          if (!uid) {
            alert('当前详情缺少客户ID');
            return;
          }
          const el = document.getElementById('followupUserId');
          if (el) el.value = String(uid);
          alert('已填入跟进模块的客户ID：' + uid + '。请到「自动跟进任务」区域创建或刷新列表。');
        });
        document.getElementById('btnToggleDetailSort')?.addEventListener('click', () => {
          customerDetailSortDesc = !customerDetailSortDesc;
          renderCustomerDetail(detail);
        });
        document.getElementById('btnToggleIdentitySort')?.addEventListener('click', () => {
          customerIdentitySortDesc = !customerIdentitySortDesc;
          renderCustomerDetail(detail);
        });
        document.getElementById('btnCopyOrders')?.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(ordersText || '');
            alert(ordersText ? '订单号已复制' : '当前没有可复制的订单号');
          } catch (err) {
            alert('复制失败，请检查浏览器权限');
          }
        });
        document.getElementById('btnExportTestsCsv')?.addEventListener('click', () => {
          downloadCsv('customer_tests.csv', toCsv(tests, testsColumns));
        });
        document.getElementById('btnExportRechargesCsv')?.addEventListener('click', () => {
          downloadCsv('customer_recharges.csv', toCsv(recharges, rechargeColumns));
        });
        document.getElementById('btnExportEnergyCsv')?.addEventListener('click', () => {
          downloadCsv('customer_energy_logs.csv', toCsv(energy, energyColumns));
        });
        document.getElementById('evidencePhaseFilter')?.addEventListener('change', () => {
          const wrap = document.getElementById('customerEvidenceTableWrap');
          if (!wrap) return;
          const phase = document.getElementById('evidencePhaseFilter')?.value || 'all';
          wrap.innerHTML = buildEvidenceTable(phase);
        });
        document.getElementById('btnExportEvidenceCsv')?.addEventListener('click', () => {
          const filtered = getFilteredEvidenceRows();
          downloadCsv('customer_growth_evidence.csv', toCsv(filtered, evidenceColumns));
        });
      }

      async function createAssistRecharge() {
        const userId = Number(document.getElementById('assistUserId').value);
        const packageId = Number(document.getElementById('assistPackageId').value);
        const payChannel = document.getElementById('assistPayChannel').value;
        const remark = document.getElementById('assistRemark').value;
        const data = await api('/recharge/assist/create', {
          method: 'POST',
          body: { userId, packageId, payChannel, remark, paymentMode: 'manual_topup' }
        });
        document.getElementById('assistMsg').textContent = JSON.stringify(data, null, 2);
        await loadAssistRequests();
        await loadSupportNotifications();
      }

      async function approveAssistRecharge() {
        const requestId = document.getElementById('assistRequestId').value.trim();
        const data = await api('/recharge/assist/' + requestId + '/approve', { method: 'POST' });
        document.getElementById('assistMsg').textContent = JSON.stringify(data, null, 2);
        await loadAssistRequests();
        await loadSupportNotifications();
      }

      async function rejectAssistRecharge() {
        const requestId = document.getElementById('assistRequestId').value.trim();
        const reason = document.getElementById('assistRejectReason').value.trim();
        const data = await api('/recharge/assist/' + requestId + '/reject', {
          method: 'POST',
          body: { reason }
        });
        document.getElementById('assistMsg').textContent = JSON.stringify(data, null, 2);
        await loadAssistRequests();
        await loadSupportNotifications();
      }

      async function cancelAssistRecharge() {
        const requestId = document.getElementById('assistRequestId').value.trim();
        const reason = document.getElementById('assistRejectReason').value.trim() || '客服手动撤销';
        const data = await api('/recharge/assist/' + requestId + '/cancel', {
          method: 'POST',
          body: { reason }
        });
        document.getElementById('assistMsg').textContent = JSON.stringify(data, null, 2);
        await loadAssistRequests();
        await loadSupportNotifications();
      }

      async function sweepAssistTimeout() {
        const timeoutMinutes = Number(document.getElementById('assistTimeoutMinutes').value.trim() || 30);
        const data = await api('/recharge/assist/timeout/sweep', {
          method: 'POST',
          body: { timeoutMinutes }
        });
        document.getElementById('assistMsg').textContent = JSON.stringify(data, null, 2);
        await loadAssistRequests();
        await loadSupportNotifications();
      }

      async function loadAssistRejectReasons() {
        const data = await api('/recharge/assist/reject-reasons');
        if (!data.success || !Array.isArray(data.data)) return;
        assistRejectReasons = data.data;
        const select = document.getElementById('assistRejectReasonTemplate');
        if (!select) return;
        const current = select.value;
        select.innerHTML = '<option value="">请选择模板</option>' +
          assistRejectReasons.map((item) => '<option value="' + esc(item) + '">' + esc(item) + '</option>').join('');
        if (assistRejectReasons.includes(current)) select.value = current;
      }

      async function loadInterventionTemplates() {
        const data = await api('/intervention/templates');
        if (!data.success || !Array.isArray(data.data)) return;
        interventionTemplates = data.data;
        const select = document.getElementById('interventionTemplate');
        if (!select) return;
        const current = select.value;
        select.innerHTML = '<option value="">请选择话术模板</option>' +
          interventionTemplates.map((item) => '<option value="' + esc(item.key) + '">' + esc(item.title) + '</option>').join('');
        if (interventionTemplates.some((item) => item.key === current)) select.value = current;
      }

      async function fillInterventionTemplate() {
        const templateKey = document.getElementById('interventionTemplate').value.trim();
        const userId = Number(document.getElementById('assistUserId').value || currentCustomerId || 0);
        if (!templateKey) {
          alert('请先选择话术模板');
          return;
        }
        if (!userId) {
          alert('请先选择客户');
          return;
        }
        const data = await api('/intervention/fill', {
          method: 'POST',
          body: { templateKey, userId }
        });
        if (!data.success) {
          alert(data.message || '填充失败');
          return;
        }
        const content = data.data?.content || '';
        document.getElementById('assistRemark').value = content;
        document.getElementById('ticketCommentInput').value = content;
      }

      async function loadSupportNotifications() {
        const data = await api('/notifications?limit=30');
        if (!data.success) {
          document.getElementById('notificationList').innerHTML =
            '<div class="detail-empty">' + esc(data.message || '查询失败') + '</div>';
          return;
        }
        supportNotifications = Array.isArray(data.data) ? data.data : [];
        renderSimpleTable(
          'notificationList',
          supportNotifications,
          [
            { title: '通知ID', render: (r) => r.id ?? '-' },
            { title: '客户', render: (r) => r.customer_username || r.user_id || '-' },
            { title: '事件', render: (r) => r.event_type || '-' },
            { title: '标题', render: (r) => r.title || '-' },
            { title: '时间', render: (r) => r.created_at || '-' }
          ],
          '暂无通知数据'
        );
      }

      async function loadConversionDashboard() {
        const days = Number(document.getElementById('dashboardDays')?.value?.trim() || 7);
        const includeTrend = document.getElementById('dashboardIncludeTrend')?.checked;
        const data = await api(
          '/dashboard/conversion?days=' +
            encodeURIComponent(days) +
            '&includeTrend=' +
            (includeTrend ? '1' : '0')
        );
        if (!data.success) {
          document.getElementById('dashboardCards').innerHTML =
            '<div class="detail-empty">' + esc(data.message || '查询失败') + '</div>';
          document.getElementById('dashboardTrend').innerHTML =
            '<div class="detail-empty">' + esc(data.message || '查询失败') + '</div>';
          return;
        }
        const d = data.data || {};
        const rows = [
          { k: '统计周期', v: (d.days ?? '-') + ' 天' },
          { k: '新增用户', v: d.registeredUsers ?? 0 },
          { k: '付费用户', v: d.paidUsers ?? 0 },
          { k: '转化率', v: (d.conversionRate ?? 0) + '%' },
          { k: '订单量', v: d.orderCount ?? 0 },
          { k: '总收入', v: d.totalAmount ?? 0 },
          { k: 'ARPPU', v: d.arppu ?? 0 },
          { k: '跟进任务完成率', v: (d.followupDoneRate ?? 0) + '%' }
        ];
        renderSimpleTable(
          'dashboardCards',
          rows,
          [
            { title: '指标', render: (r) => r.k },
            { title: '数值', render: (r) => r.v }
          ],
          '暂无看板数据'
        );
        const trend = Array.isArray(d.dailyTrend) ? d.dailyTrend : [];
        if (includeTrend && trend.length > 0) {
          renderSimpleTable(
            'dashboardTrend',
            trend,
            [
              { title: '日期', render: (r) => r.date || '-' },
              { title: '新增用户', render: (r) => r.registeredUsers ?? 0 },
              { title: '付费人数', render: (r) => r.paidUsers ?? 0 },
              { title: '订单量', render: (r) => r.orderCount ?? 0 },
              { title: '金额', render: (r) => r.totalAmount ?? 0 }
            ],
            '暂无趋势数据'
          );
        } else {
          document.getElementById('dashboardTrend').innerHTML =
            '<div class="detail-empty">' +
            (includeTrend ? '所选周期内无分日数据' : '勾选「每日拆解」后刷新可查看分日曲线表') +
            '</div>';
        }
      }

      function loadConversionDashboardDaily() {
        const el = document.getElementById('dashboardDays');
        if (el) el.value = '1';
        return loadConversionDashboard();
      }

      function loadConversionDashboardWeekly() {
        const el = document.getElementById('dashboardDays');
        if (el) el.value = '7';
        return loadConversionDashboard();
      }

      function downloadTextFile(filename, text, mime) {
        const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      function exportCsPerformanceCsv() {
        if (!csPerformanceRowsCache.length) {
          alert('请先点击「刷新绩效」加载数据');
          return;
        }
        const days = Number(document.getElementById('csPerfDays')?.value?.trim() || 7);
        const escCell = (v) => '"' + String(v ?? '').replaceAll('"', '""') + '"';
        const header = [
          '统计天数',
          '后台ID',
          '账号',
          '跟进完成',
          '待办',
          '逾期待办',
          '跟进完成率%',
          '代充通过笔数',
          '代充金额'
        ]
          .map(escCell)
          .join(',');
        const lines = csPerformanceRowsCache.map((r) =>
          [
            days,
            r.adminId ?? '',
            r.username ?? '',
            r.followupDone ?? 0,
            r.followupPending ?? 0,
            r.followupOverdue ?? 0,
            r.followupCompletionRate ?? 0,
            r.assistApproved ?? 0,
            r.assistAmount ?? 0
          ]
            .map(escCell)
            .join(',')
        );
        const csv = header + '\\n' + lines.join('\\n');
        downloadTextFile(
          'cs_performance_' + days + 'd.csv',
          String.fromCharCode(0xfeff) + csv,
          'text/csv;charset=utf-8;'
        );
      }

      async function loadCsPerformance() {
        const days = Number(document.getElementById('csPerfDays')?.value?.trim() || 7);
        let path = '/dashboard/cs-performance?days=' + encodeURIComponent(days);
        const adminFilter = document.getElementById('csPerfAdminId')?.value?.trim();
        if (adminFilter) {
          path += '&adminId=' + encodeURIComponent(adminFilter);
        }
        const data = await api(path);
        if (!data.success) {
          csPerformanceRowsCache = [];
          document.getElementById('csPerformanceTable').innerHTML =
            '<div class="detail-empty">' + esc(data.message || '查询失败') + '</div>';
          return;
        }
        const payload = data.data || {};
        const rows = Array.isArray(payload.rows) ? payload.rows : [];
        csPerformanceRowsCache = rows;
        renderSimpleTable(
          'csPerformanceTable',
          rows,
          [
            { title: '后台ID', render: (r) => r.adminId ?? '-' },
            { title: '账号', render: (r) => r.username || '-' },
            { title: '跟进完成', render: (r) => r.followupDone ?? 0 },
            { title: '待办', render: (r) => r.followupPending ?? 0 },
            { title: '逾期待办', render: (r) => r.followupOverdue ?? 0 },
            { title: '跟进完成率%', render: (r) => r.followupCompletionRate ?? 0 },
            { title: '代充通过笔数', render: (r) => r.assistApproved ?? 0 },
            { title: '代充金额', render: (r) => r.assistAmount ?? 0 }
          ],
          '暂无绩效数据'
        );
      }

      async function remindFollowupOverdue() {
        const data = await api('/followups/overdue/remind', { method: 'POST', body: {} });
        document.getElementById('followupMsg').textContent = JSON.stringify(data, null, 2);
        if (data.success) {
          await loadSupportNotifications();
          await loadFollowupTasks();
        }
      }

      function buildFollowupCreateBody(userId) {
        const uid = Number(userId || 0);
        if (!uid) return null;
        const content = document.getElementById('followupContent')?.value?.trim() || '';
        const overrideRaw = document.getElementById('followupCreateAssignOverride')?.value?.trim() || '';
        const overrideId = Number(overrideRaw || 0);
        const assignToMe = document.getElementById('followupAssignToMe')?.checked;
        let assignedTo = null;
        if (overrideId > 0) {
          assignedTo = overrideId;
        } else if (assignToMe && currentAdminId) {
          assignedTo = currentAdminId;
        }
        return { userId: uid, content, assignedTo };
      }

      async function submitFollowupCreate(userId) {
        const body = buildFollowupCreateBody(userId);
        if (!body) {
          const err = { success: false, message: '客户ID无效' };
          document.getElementById('followupMsg').textContent = JSON.stringify(err, null, 2);
          return err;
        }
        const data = await api('/followups/create', {
          method: 'POST',
          body
        });
        document.getElementById('followupMsg').textContent = JSON.stringify(data, null, 2);
        if (data.success) {
          const el = document.getElementById('followupUserId');
          if (el) el.value = String(body.userId);
          await loadFollowupTasks();
          await loadConversionDashboard();
        }
        return data;
      }

      async function createFollowupTasks() {
        const userId = Number(document.getElementById('followupUserId').value);
        await submitFollowupCreate(userId);
      }

      function exportFollowupListCsv() {
        if (!followupRowsCache.length) {
          alert('当前列表为空，请先「刷新任务」');
          return;
        }
        const escCell = (v) => '"' + String(v ?? '').replaceAll('"', '""') + '"';
        const header = [
          '任务ID',
          '客户ID',
          '客户名',
          '优先级',
          '阶段',
          '标题',
          '备注',
          '状态',
          '逾期',
          '到期时间',
          '处理人ID',
          '处理人',
          '完成时间',
          '结案人'
        ]
          .map(escCell)
          .join(',');
        const lines = followupRowsCache.map((r) =>
          [
            r.id ?? '',
            r.user_id ?? '',
            r.customer_username ?? '',
            r.priority ?? '',
            r.stage ?? '',
            r.task_title ?? '',
            r.task_content ?? '',
            r.status ?? '',
            r.is_overdue ? '是' : '否',
            r.due_at ?? '',
            r.assigned_to ?? '',
            r.assigned_to_username ?? '',
            r.completed_at ?? '',
            r.completed_by_username ?? ''
          ]
            .map(escCell)
            .join(',')
        );
        const csv = header + '\\n' + lines.join('\\n');
        downloadTextFile(
          'followup_tasks.csv',
          String.fromCharCode(0xfeff) + csv,
          'text/csv;charset=utf-8;'
        );
      }

      async function loadFollowupTasks() {
        const userId = Number(document.getElementById('followupUserId')?.value || 0);
        const overdueOnly = document.getElementById('followupOverdueOnly')?.checked;
        const assignedRaw = document.getElementById('followupAssignedTo')?.value?.trim() || '';
        const assignedTo = Number(assignedRaw || 0);
        let query = '?limit=50';
        if (userId > 0) query += '&userId=' + userId;
        if (overdueOnly) query += '&overdueOnly=1';
        if (assignedTo > 0) query += '&assignedTo=' + assignedTo;
        const data = await api('/followups' + query);
        if (!data.success) {
          followupRowsCache = [];
          document.getElementById('followupList').innerHTML =
            '<div class="detail-empty">' + esc(data.message || '查询失败') + '</div>';
          return;
        }
        followupRowsCache = Array.isArray(data.data) ? data.data : [];
        renderInteractiveTable(
          'followupList',
          followupRowsCache,
          [
            { title: '任务ID', render: (r) => r.id ?? '-' },
            { title: '优先级', render: (r) => (r.priority != null ? r.priority : '-') },
            { title: '客户', render: (r) => r.customer_username || r.user_id || '-' },
            { title: '阶段', render: (r) => r.stage || '-' },
            { title: '标题', render: (r) => r.task_title || '-' },
            { title: '状态', render: (r) => r.status || '-' },
            { title: '逾期', render: (r) => (r.is_overdue ? '是' : '-') },
            { title: '到期', render: (r) => r.due_at || '-' },
            { title: '处理人', render: (r) => r.assigned_to_username || r.assigned_to || '-' }
          ],
          '暂无跟进任务',
          (row) => {
            document.getElementById('followupTaskId').value = row?.id ?? '';
            document.getElementById('followupStatus').value = row?.status || '';
            if (row?.user_id) document.getElementById('followupUserId').value = row.user_id;
          }
        );
      }

      async function updateFollowupStatus() {
        const taskId = document.getElementById('followupTaskId').value.trim();
        const status = document.getElementById('followupStatus').value.trim();
        const data = await api('/followups/' + taskId + '/status', {
          method: 'PUT',
          body: { status }
        });
        document.getElementById('followupMsg').textContent = JSON.stringify(data, null, 2);
        if (data.success) {
          await loadFollowupTasks();
          await loadConversionDashboard();
        }
      }

      async function loadAssistRequests() {
        const data = await api('/recharge/assist/requests?status=pending&limit=30');
        if (!data.success) {
          document.getElementById('assistRequests').innerHTML =
            '<div class="detail-empty">' + esc(data.message || '查询失败') + '</div>';
          return;
        }
        assistRequestRows = Array.isArray(data.data) ? data.data : [];
        renderAssistRequestsTable();
      }

      function renderAssistRequestsTable() {
        const keyword = document.getElementById('assistFilter')?.value?.trim() || '';
        const rows = assistRequestRows.filter((row) =>
          includeFilter(row, ['customer_username', 'package_name', 'requested_by_username', 'status'], keyword)
        );
        renderInteractiveTable(
          'assistRequests',
          rows,
          [
            { title: '申请ID', render: (r) => r.id ?? '-' },
            { title: '客户', render: (r) => r.customer_username || r.user_id || '-' },
            { title: '套餐', render: (r) => r.package_name || r.package_id || '-' },
            { title: '渠道', render: (r) => channelLabel(r.pay_channel) },
            { title: '状态', render: (r) => r.status || '-' },
            { title: '申请人', render: (r) => r.requested_by_username || '-' },
            { title: '驳回原因', render: (r) => r.reject_reason || '-' },
            { title: '时间', render: (r) => r.created_at || '-' }
          ],
          '暂无审批数据',
          (row) => {
            document.getElementById('assistRequestId').value = row?.id ?? '';
            if (row?.user_id) document.getElementById('assistUserId').value = row.user_id;
            if (row?.package_id) document.getElementById('assistPackageId').value = row.package_id;
            if (row?.pay_channel) document.getElementById('assistPayChannel').value = row.pay_channel;
            document.getElementById('assistRejectReason').value = row?.reject_reason || '';
          }
        );
      }

      async function saveConfig() {
        const key = document.getElementById('configKey').value.trim();
        const value = document.getElementById('configValue').value.trim();
        const data = await api('/configs/' + encodeURIComponent(key), {
          method: 'PUT',
          body: { value }
        });
        document.getElementById('settingMsg').textContent = JSON.stringify(data, null, 2);
      }

      async function loadConfigPanel() {
        const data = await api('/configs');
        if (!data.success || !Array.isArray(data.data)) {
          return;
        }
        const map = {};
        data.data.forEach((item) => {
          map[item.config_key] = item.config_value;
        });
        if (map.LIVE_QA_URL) {
          document.getElementById('configKey').value = 'LIVE_QA_URL';
          document.getElementById('configValue').value = map.LIVE_QA_URL;
        }
        if (map.RECHARGE_CHANNEL_OPTIONS) {
          try {
            const parsed = JSON.parse(map.RECHARGE_CHANNEL_OPTIONS);
            document.getElementById('channelOptionsJson').value = JSON.stringify(parsed, null, 2);
          } catch (err) {
            document.getElementById('channelOptionsJson').value = map.RECHARGE_CHANNEL_OPTIONS;
          }
        } else {
          document.getElementById('channelOptionsJson').value = JSON.stringify(rechargeChannelOptions, null, 2);
        }
      }

      async function loadConfigHistory() {
        const data = await api('/configs/history?limit=30');
        if (!data.success) {
          document.getElementById('configHistory').innerHTML =
            '<div class="detail-empty">' + esc(data.message || '查询失败') + '</div>';
          return;
        }
        renderInteractiveTable(
          'configHistory',
          data.data || [],
          [
            { title: '历史ID', render: (r) => r.id ?? '-' },
            { title: '键', render: (r) => r.config_key || '-' },
            { title: '操作人', render: (r) => r.updated_by_username || '-' },
            { title: '时间', render: (r) => r.created_at || '-' }
          ],
          '暂无配置历史',
          (row) => {
            document.getElementById('configHistoryId').value = row?.id ?? '';
            document.getElementById('configKey').value = row?.config_key || '';
          }
        );
      }

      async function rollbackConfig() {
        const historyId = document.getElementById('configHistoryId').value.trim();
        if (!historyId) {
          alert('请先填写配置历史ID');
          return;
        }
        const data = await api('/configs/history/' + historyId + '/rollback', { method: 'POST' });
        document.getElementById('settingMsg').textContent = JSON.stringify(data, null, 2);
        if (data.success) {
          await loadConfigPanel();
          await loadConfigHistory();
          await loadRechargeChannelOptions();
        }
      }

      async function saveParam() {
        const key = document.getElementById('paramKey').value.trim();
        const value = document.getElementById('paramValue').value.trim();
        const data = await api('/params/' + encodeURIComponent(key), {
          method: 'PUT',
          body: { value }
        });
        document.getElementById('settingMsg').textContent = JSON.stringify(data, null, 2);
      }

      async function saveChannelOptions() {
        const text = document.getElementById('channelOptionsJson').value.trim();
        let parsed;
        try {
          parsed = JSON.parse(text);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('渠道配置必须是非空数组');
          }
          parsed.forEach((item) => {
            if (!item || !item.value || !item.label) {
              throw new Error('每个渠道都必须包含 value 和 label');
            }
          });
        } catch (err) {
          alert('渠道配置 JSON 不合法：' + err.message);
          return;
        }

        const data = await api('/configs/RECHARGE_CHANNEL_OPTIONS', {
          method: 'PUT',
          body: { value: JSON.stringify(parsed) }
        });
        document.getElementById('settingMsg').textContent = JSON.stringify(data, null, 2);
        if (data.success) {
          rechargeChannelOptions = parsed.map((item) => ({
            value: String(item.value).trim().toLowerCase(),
            label: String(item.label).trim()
          }));
          renderRechargeChannelSelect();
        }
      }

      async function loadAuditLogs() {
        const action = document.getElementById('auditAction').value.trim();
        const admin = document.getElementById('auditAdmin').value.trim();
        const query = '?limit=20&action=' + encodeURIComponent(action) + '&admin=' + encodeURIComponent(admin);
        const data = await api('/audit/logs' + query);
        if (!data.success) {
          document.getElementById('auditLogs').innerHTML =
            '<div class="detail-empty">' + esc(data.message || '查询失败') + '</div>';
          return;
        }
        auditLogRows = Array.isArray(data.data) ? data.data : [];
        renderAuditLogsTable();
      }

      function renderAuditLogsTable() {
        const keyword = document.getElementById('auditFilter')?.value?.trim() || '';
        const rows = auditLogRows.filter((row) =>
          includeFilter(row, ['admin_username', 'action', 'target_type', 'target_id'], keyword)
        );
        renderInteractiveTable(
          'auditLogs',
          rows,
          [
            { title: '日志ID', render: (r) => r.id ?? '-' },
            { title: '账号', render: (r) => r.admin_username || '-' },
            { title: '动作', render: (r) => r.action || '-' },
            { title: '对象', render: (r) => r.target_type || '-' },
            { title: '对象ID', render: (r) => r.target_id || '-' },
            { title: '时间', render: (r) => r.created_at || '-' }
          ],
          '暂无审计日志',
          (row) => {
            document.getElementById('auditAction').value = row?.action || '';
            document.getElementById('auditAdmin').value = row?.admin_username || '';
          }
        );
      }

      async function createTag() {
        const name = document.getElementById('newTagName').value.trim();
        const color = document.getElementById('newTagColor').value.trim() || '#64748b';
        const data = await api('/customer-tags', { method: 'POST', body: { name, color } });
        document.getElementById('tagMsg').textContent = JSON.stringify(data, null, 2);
        await loadTags();
      }

      async function bindTag() {
        const customerId = document.getElementById('bindTagCustomerId').value.trim();
        const tagId = Number(document.getElementById('bindTagId').value);
        const data = await api('/customers/' + customerId + '/tags', {
          method: 'POST',
          body: { tagId }
        });
        document.getElementById('tagMsg').textContent = JSON.stringify(data, null, 2);
      }

      async function loadTags() {
        const data = await api('/customer-tags');
        if (!data.success) {
          document.getElementById('tagList').innerHTML =
            '<div class="detail-empty">' + esc(data.message || '查询失败') + '</div>';
          return;
        }
        tagRowsCache = Array.isArray(data.data) ? data.data : [];
        renderTagsTable();
      }

      function renderTagsTable() {
        const keyword = document.getElementById('tagFilter')?.value?.trim() || '';
        const rows = tagRowsCache.filter((row) =>
          includeFilter(row, ['name', 'color'], keyword)
        );
        renderInteractiveTable(
          'tagList',
          rows,
          [
            { title: '标签ID', render: (r) => r.id ?? '-' },
            { title: '标签名', render: (r) => r.name || '-' },
            { title: '颜色', render: (r) => r.color || '-' },
            { title: '创建时间', render: (r) => r.created_at || '-' }
          ],
          '暂无标签数据',
          (row) => {
            document.getElementById('bindTagId').value = row?.id ?? '';
            document.getElementById('newTagName').value = row?.name || '';
            document.getElementById('newTagColor').value = row?.color || '';
          }
        );
      }

      async function createTicket() {
        const userId = document.getElementById('ticketUserId').value.trim();
        const title = document.getElementById('ticketTitle').value.trim();
        const content = document.getElementById('ticketContent').value.trim();
        const priority = document.getElementById('ticketPriority').value.trim() || 'normal';
        const data = await api('/tickets', {
          method: 'POST',
          body: { userId: userId ? Number(userId) : null, title, content, priority }
        });
        document.getElementById('ticketMsg').textContent = JSON.stringify(data, null, 2);
        await loadTickets();
      }

      async function updateTicketStatus() {
        const ticketId = document.getElementById('ticketIdForUpdate').value.trim();
        const status = document.getElementById('ticketStatusForUpdate').value.trim();
        const data = await api('/tickets/' + ticketId + '/status', {
          method: 'PUT',
          body: { status }
        });
        document.getElementById('ticketMsg').textContent = JSON.stringify(data, null, 2);
        await loadTickets();
      }

      async function loadTickets() {
        const data = await api('/tickets?limit=30');
        if (!data.success) {
          document.getElementById('ticketList').innerHTML =
            '<div class="detail-empty">' + esc(data.message || '查询失败') + '</div>';
          return;
        }
        ticketRowsCache = Array.isArray(data.data) ? data.data : [];
        renderTicketsTable();
      }

      function renderTicketsTable() {
        const keyword = document.getElementById('ticketFilter')?.value?.trim() || '';
        const rows = ticketRowsCache.filter((row) =>
          includeFilter(row, ['title', 'customer_username', 'status', 'priority'], keyword)
        );
        renderInteractiveTable(
          'ticketList',
          rows,
          [
            { title: '工单ID', render: (r) => r.id ?? '-' },
            { title: '客户', render: (r) => r.customer_username || r.user_id || '-' },
            { title: '标题', render: (r) => r.title || '-' },
            { title: '状态', render: (r) => r.status || '-' },
            { title: 'SLA', render: (r) => (r.sla_status === 'overdue' ? '超时' : '正常') },
            { title: '优先级', render: (r) => r.priority || '-' },
            { title: '处理人', render: (r) => r.assigned_to_username || '-' },
            { title: '更新时间', render: (r) => r.updated_at || '-' }
          ],
          '暂无工单数据',
          (row) => {
            document.getElementById('ticketIdForUpdate').value = row?.id ?? '';
            document.getElementById('ticketStatusForUpdate').value = row?.status || '';
            document.getElementById('ticketUserId').value = row?.user_id ?? '';
            document.getElementById('ticketTitle').value = row?.title || '';
            document.getElementById('ticketContent').value = row?.content || '';
            document.getElementById('ticketPriority').value = row?.priority || '';
            loadTicketComments(row?.id);
          }
        );
      }

      async function loadTicketComments(ticketId) {
        if (!ticketId) {
          document.getElementById('ticketComments').innerHTML = '<div class="detail-empty">请选择工单</div>';
          return;
        }
        const data = await api('/tickets/' + ticketId + '/comments?limit=50');
        if (!data.success) {
          document.getElementById('ticketComments').innerHTML =
            '<div class="detail-empty">' + esc(data.message || '查询失败') + '</div>';
          return;
        }
        renderSimpleTable(
          'ticketComments',
          data.data || [],
          [
            { title: '评论ID', render: (r) => r.id ?? '-' },
            { title: '评论人', render: (r) => r.created_by_username || '-' },
            { title: '内容', render: (r) => r.comment || '-' },
            { title: '时间', render: (r) => r.created_at || '-' }
          ],
          '暂无评论'
        );
      }

      async function createTicketComment() {
        const ticketId = document.getElementById('ticketIdForUpdate').value.trim();
        const comment = document.getElementById('ticketCommentInput').value.trim();
        if (!ticketId) {
          alert('请先选择工单');
          return;
        }
        if (!comment) {
          alert('请输入评论内容');
          return;
        }
        const data = await api('/tickets/' + ticketId + '/comments', {
          method: 'POST',
          body: { comment }
        });
        document.getElementById('ticketMsg').textContent = JSON.stringify(data, null, 2);
        if (data.success) {
          document.getElementById('ticketCommentInput').value = '';
          await loadTicketComments(ticketId);
        }
      }

      document.getElementById('btnLogin').addEventListener('click', login);
      document.getElementById('btnLogout').addEventListener('click', () => {
        adminToken = '';
        currentAdminId = null;
        currentAdminRole = '';
        setLoggedIn(false);
      });
      document.getElementById('btnSearchCustomers').addEventListener('click', loadCustomers);
      document.getElementById('btnPrevCustomers').addEventListener('click', async () => {
        customerPage = Math.max(1, customerPage - 1);
        await loadCustomers();
      });
      document.getElementById('btnNextCustomers').addEventListener('click', async () => {
        customerPage += 1;
        await loadCustomers();
      });
      document.getElementById('btnCreateAssist').addEventListener('click', createAssistRecharge);
      document.getElementById('btnApproveAssist').addEventListener('click', approveAssistRecharge);
      document.getElementById('btnRejectAssist').addEventListener('click', rejectAssistRecharge);
      document.getElementById('btnCancelAssist').addEventListener('click', cancelAssistRecharge);
      document.getElementById('btnSweepAssistTimeout').addEventListener('click', sweepAssistTimeout);
      document.getElementById('btnLoadAssistRequests').addEventListener('click', loadAssistRequests);
      document.getElementById('btnLoadNotifications').addEventListener('click', loadSupportNotifications);
      document.getElementById('btnFillInterventionTemplate').addEventListener('click', fillInterventionTemplate);
      document.getElementById('btnLoadDashboard').addEventListener('click', loadConversionDashboard);
      document.getElementById('btnLoadDashboardDaily').addEventListener('click', loadConversionDashboardDaily);
      document.getElementById('btnLoadDashboardWeekly').addEventListener('click', loadConversionDashboardWeekly);
      document.getElementById('btnCreateFollowupTasks').addEventListener('click', createFollowupTasks);
      document.getElementById('btnLoadFollowups').addEventListener('click', loadFollowupTasks);
      document.getElementById('btnRemindFollowupOverdue').addEventListener('click', remindFollowupOverdue);
      document.getElementById('btnUpdateFollowupStatus').addEventListener('click', updateFollowupStatus);
      document.getElementById('btnLoadCsPerformance').addEventListener('click', loadCsPerformance);
      document.getElementById('btnExportCsPerfCsv').addEventListener('click', exportCsPerformanceCsv);
      document.getElementById('btnExportFollowupCsv').addEventListener('click', exportFollowupListCsv);
      document.getElementById('btnSaveConfig').addEventListener('click', saveConfig);
      document.getElementById('btnLoadConfig').addEventListener('click', loadConfigPanel);
      document.getElementById('btnSaveParam').addEventListener('click', saveParam);
      document.getElementById('btnSaveChannelOptions').addEventListener('click', saveChannelOptions);
      document.getElementById('btnLoadConfigHistory').addEventListener('click', loadConfigHistory);
      document.getElementById('btnRollbackConfig').addEventListener('click', rollbackConfig);
      document.getElementById('btnLoadAudit').addEventListener('click', loadAuditLogs);
      document.getElementById('btnCreateTag').addEventListener('click', createTag);
      document.getElementById('btnBindTag').addEventListener('click', bindTag);
      document.getElementById('btnLoadTags').addEventListener('click', loadTags);
      document.getElementById('btnCreateTicket').addEventListener('click', createTicket);
      document.getElementById('btnUpdateTicketStatus').addEventListener('click', updateTicketStatus);
      document.getElementById('btnLoadTickets').addEventListener('click', loadTickets);
      document.getElementById('btnCreateTicketComment').addEventListener('click', createTicketComment);
      document.getElementById('assistFilter').addEventListener('input', renderAssistRequestsTable);
      document.getElementById('assistRejectReasonTemplate').addEventListener('change', (e) => {
        const value = e.target.value || '';
        if (value) document.getElementById('assistRejectReason').value = value;
      });
      document.getElementById('auditFilter').addEventListener('input', renderAuditLogsTable);
      document.getElementById('tagFilter').addEventListener('input', renderTagsTable);
      document.getElementById('ticketFilter').addEventListener('input', renderTicketsTable);
    </script>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.send(html);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = Number(process.env.PORT) || 3001;

const server = http.createServer(app);

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(
      '[sales-luck-system] 端口 ' + PORT + ' 已被占用（EADDRINUSE）。请先执行: lsof -i :' + PORT + ' 再 kill 对应 PID，或改 backend/.env 的 PORT。'
    );
  } else {
    console.error('[sales-luck-system] HTTP 服务错误:', err);
  }
  process.exitCode = 1;
});

server.listen(PORT, () => {
  console.log('');
  console.log('[sales-luck-system] 后端已启动（进程会保持运行，请勿关闭本终端）');
  console.log('  · 当前入口文件: ' + path.resolve(__filename));
  console.log('  · 客服运营后台 HTML: http://127.0.0.1:' + PORT + '/admin');
  console.log('  · API 前缀: http://127.0.0.1:' + PORT + '/api');
  console.log('  · 健康探测: http://127.0.0.1:' + PORT + '/sls-health');
  console.log('  · 若 nodemon 立刻显示 clean exit：请在本目录执行 node src/server.js 对比；或检查是否重复启动了多个后端。');
  console.log('  · 若浏览器 /admin 显示 Cannot GET，说明 3001 上不是本进程，请停掉冲突进程后重启。');
  console.log('');
});
