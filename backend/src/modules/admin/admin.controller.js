const service = require('./admin.service');
const rechargeService = require('../recharge/recharge.service');
const { writeAdminAuditLog } = require('./admin.audit');

const EDITABLE_CONFIG_KEYS = new Set([
  'LIVE_QA_URL',
  'FRONTEND_ADMIN_URL',
  'RECHARGE_CHANNEL_OPTIONS',
  'ASSIST_REJECT_REASON_TEMPLATES',
  'INTERVENTION_TEMPLATES'
]);
const EDITABLE_PARAM_KEYS = new Set([
  'DAILY_MAX_SPIN',
  'LOW_SCORE_THRESHOLD',
  'VERY_LOW_SCORE_THRESHOLD'
]);

async function login(req, res) {
  try {
    const data = await service.adminLogin(req.body || {});
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listCustomers(req, res) {
  try {
    const data = await service.listCustomers(req.query || {});
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getCustomerDetail(req, res) {
  try {
    const data = await service.getCustomerDetail(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function createAssistRecharge(req, res) {
  try {
    const data = await service.createAssistRecharge({
      ...req.body,
      requestedBy: req.admin.adminId
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'assist_recharge_create',
      targetType: 'support_recharge_request',
      targetId: String(data.id),
      detail: JSON.stringify({
        userId: data.user_id,
        packageId: data.package_id,
        payChannel: data.pay_channel,
        paymentMode: data.payment_mode
      }),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function approveAssistRecharge(req, res) {
  try {
    const data = await service.approveAssistRecharge({
      requestId: req.params.id,
      approvedBy: req.admin.adminId,
      rechargeExecutor: rechargeService.createRecharge
    });

    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'assist_recharge_approve',
      targetType: 'support_recharge_request',
      targetId: String(req.params.id),
      detail: JSON.stringify({
        orderNo: data.rechargeResult.orderNo
      }),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function rejectAssistRecharge(req, res) {
  try {
    const data = await service.rejectAssistRecharge({
      requestId: req.params.id,
      rejectedBy: req.admin.adminId,
      reason: req.body?.reason
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'assist_recharge_reject',
      targetType: 'support_recharge_request',
      targetId: String(req.params.id),
      detail: JSON.stringify({ reason: req.body?.reason || '' }),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function cancelAssistRecharge(req, res) {
  try {
    const data = await service.cancelAssistRecharge({
      requestId: req.params.id,
      cancelledBy: req.admin.adminId,
      reason: req.body?.reason
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'assist_recharge_cancel',
      targetType: 'support_recharge_request',
      targetId: String(req.params.id),
      detail: JSON.stringify({ reason: req.body?.reason || '' }),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function sweepAssistRechargeTimeout(req, res) {
  try {
    const data = await service.sweepAssistRechargeTimeout({
      timeoutMinutes: req.body?.timeoutMinutes
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'assist_recharge_timeout_sweep',
      targetType: 'support_recharge_request',
      targetId: 'batch',
      detail: JSON.stringify(data),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getAssistRejectReasonTemplates(req, res) {
  try {
    const data = await service.getAssistRejectReasonTemplates();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getInterventionTemplates(req, res) {
  try {
    const data = await service.getInterventionTemplates();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getCustomerRiskProfile(req, res) {
  try {
    const data = await service.getCustomerRiskProfile(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function fillInterventionTemplate(req, res) {
  try {
    const data = await service.fillInterventionTemplate({
      templateKey: req.body?.templateKey,
      userId: req.body?.userId
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'intervention_template_fill',
      targetType: 'customer',
      targetId: String(req.body?.userId || ''),
      detail: JSON.stringify({ templateKey: req.body?.templateKey || '' }),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listAssistRechargeRequests(req, res) {
  try {
    const data = await service.listAssistRechargeRequests({
      status: req.query?.status,
      limit: req.query?.limit
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listSupportNotifications(req, res) {
  try {
    const data = await service.listSupportNotifications({
      userId: req.query?.userId,
      limit: req.query?.limit
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listConfigs(req, res) {
  try {
    const data = await service.listConfigItems();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getRechargeChannelOptions(req, res) {
  try {
    const data = await service.getRechargeChannelOptions();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function updateConfig(req, res) {
  try {
    const key = String(req.params.key || '').trim().toUpperCase();
    if (!EDITABLE_CONFIG_KEYS.has(key)) {
      return res.json({ success: false, message: '该配置项不允许在后台修改' });
    }

    const data = await service.upsertConfigItem({
      key,
      value: req.body?.value,
      updatedBy: req.admin.adminId
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'config_update',
      targetType: 'system_config',
      targetId: key,
      detail: JSON.stringify({ value: data.config_value }),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listConfigHistory(req, res) {
  try {
    const data = await service.listConfigHistory({
      key: req.query?.key,
      limit: req.query?.limit
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function rollbackConfig(req, res) {
  try {
    const data = await service.rollbackConfig({
      historyId: req.params.id,
      updatedBy: req.admin.adminId
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'config_rollback',
      targetType: 'system_config_history',
      targetId: String(req.params.id),
      detail: JSON.stringify({ configKey: data.config_key }),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listParams(req, res) {
  try {
    const data = await service.listBusinessParams();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function updateParam(req, res) {
  try {
    const key = String(req.params.key || '').trim().toUpperCase();
    if (!EDITABLE_PARAM_KEYS.has(key)) {
      return res.json({ success: false, message: '该参数不允许在后台修改' });
    }
    const data = await service.upsertBusinessParam({
      key,
      value: req.body?.value,
      updatedBy: req.admin.adminId
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'business_param_update',
      targetType: 'business_param',
      targetId: key,
      detail: JSON.stringify({ value: data.param_value }),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listAuditLogs(req, res) {
  try {
    const data = await service.listAuditLogs({
      limit: req.query?.limit,
      action: req.query?.action,
      admin: req.query?.admin
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listCustomerTags(req, res) {
  try {
    const data = await service.listCustomerTags();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function createCustomerTag(req, res) {
  try {
    const data = await service.createCustomerTag({
      name: req.body?.name,
      color: req.body?.color,
      createdBy: req.admin.adminId
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'customer_tag_create',
      targetType: 'customer_tag',
      targetId: String(data.id),
      detail: JSON.stringify(data),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function bindCustomerTag(req, res) {
  try {
    const data = await service.bindCustomerTag({
      customerId: req.params.id,
      tagId: req.body?.tagId
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'customer_tag_bind',
      targetType: 'customer',
      targetId: String(req.params.id),
      detail: JSON.stringify({ tagId: req.body?.tagId }),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listSupportTickets(req, res) {
  try {
    const data = await service.listSupportTickets({
      status: req.query?.status,
      limit: req.query?.limit
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function createSupportTicket(req, res) {
  try {
    const data = await service.createSupportTicket({
      userId: req.body?.userId,
      title: req.body?.title,
      content: req.body?.content,
      priority: req.body?.priority,
      createdBy: req.admin.adminId
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'support_ticket_create',
      targetType: 'support_ticket',
      targetId: String(data.id),
      detail: JSON.stringify(data),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function updateSupportTicketStatus(req, res) {
  try {
    const data = await service.updateSupportTicketStatus({
      ticketId: req.params.id,
      status: req.body?.status,
      assignedTo: req.body?.assignedTo,
      updatedBy: req.admin.adminId
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'support_ticket_status_update',
      targetType: 'support_ticket',
      targetId: String(req.params.id),
      detail: JSON.stringify(data),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listTicketComments(req, res) {
  try {
    const data = await service.listTicketComments(req.params.id, req.query?.limit);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function createTicketComment(req, res) {
  try {
    const data = await service.createTicketComment({
      ticketId: req.params.id,
      comment: req.body?.comment,
      createdBy: req.admin.adminId
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'support_ticket_comment_create',
      targetType: 'support_ticket',
      targetId: String(req.params.id),
      detail: JSON.stringify({ commentId: data.id }),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function createFollowupTasks(req, res) {
  try {
    const data = await service.createFollowupTasks({
      userId: req.body?.userId,
      assignedTo: req.body?.assignedTo,
      customContent: req.body?.content,
      createdBy: req.admin.adminId
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'followup_tasks_create',
      targetType: 'customer',
      targetId: String(req.body?.userId || ''),
      detail: JSON.stringify({
        count: Array.isArray(data) ? data.length : 0,
        assignedTo: req.body?.assignedTo ?? null
      }),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listFollowupTasks(req, res) {
  try {
    const data = await service.listFollowupTasks({
      status: req.query?.status,
      stage: req.query?.stage,
      userId: req.query?.userId,
      assignedTo: req.query?.assignedTo,
      overdueOnly: req.query?.overdueOnly,
      limit: req.query?.limit
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function updateFollowupTaskStatus(req, res) {
  try {
    const data = await service.updateFollowupTaskStatus({
      taskId: req.params.id,
      status: req.body?.status,
      updatedBy: req.admin.adminId
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'followup_task_status_update',
      targetType: 'support_followup_task',
      targetId: String(req.params.id),
      detail: JSON.stringify(data),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getConversionDashboard(req, res) {
  try {
    const data = await service.getConversionDashboard({
      days: req.query?.days,
      includeTrend: req.query?.includeTrend
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function remindFollowupOverdue(req, res) {
  try {
    const data = await service.remindFollowupOverdue({
      limit: req.body?.limit
    });
    await writeAdminAuditLog({
      adminId: req.admin.adminId,
      action: 'followup_overdue_remind',
      targetType: 'support_followup_task',
      targetId: 'batch',
      detail: JSON.stringify({ notified: data.notified }),
      req
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getCsPerformanceDashboard(req, res) {
  try {
    const data = await service.getCsPerformanceDashboard({
      days: req.query?.days,
      adminId: req.query?.adminId,
      viewerRole: req.admin.role,
      viewerAdminId: req.admin.adminId
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

module.exports = {
  login,
  listCustomers,
  getCustomerDetail,
  createAssistRecharge,
  approveAssistRecharge,
  rejectAssistRecharge,
  cancelAssistRecharge,
  sweepAssistRechargeTimeout,
  getAssistRejectReasonTemplates,
  getInterventionTemplates,
  getCustomerRiskProfile,
  fillInterventionTemplate,
  listAssistRechargeRequests,
  listSupportNotifications,
  getRechargeChannelOptions,
  listConfigs,
  updateConfig,
  listConfigHistory,
  rollbackConfig,
  listParams,
  updateParam,
  listAuditLogs,
  listCustomerTags,
  createCustomerTag,
  bindCustomerTag,
  listSupportTickets,
  createSupportTicket,
  updateSupportTicketStatus,
  listTicketComments,
  createTicketComment,
  createFollowupTasks,
  listFollowupTasks,
  updateFollowupTaskStatus,
  remindFollowupOverdue,
  getConversionDashboard,
  getCsPerformanceDashboard
};
