const express = require('express');
const controller = require('./admin.controller');
const {
  adminAuthMiddleware,
  requireAdminRoles
} = require('../../middlewares/admin-auth.middleware');

const router = express.Router();

router.post('/auth/login', controller.login);

router.get('/customers', adminAuthMiddleware, controller.listCustomers);
router.get('/customers/:id', adminAuthMiddleware, controller.getCustomerDetail);
router.get(
  '/customers/:id/risk-profile',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.getCustomerRiskProfile
);

router.post(
  '/recharge/assist/create',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.createAssistRecharge
);
router.post(
  '/recharge/assist/:id/approve',
  adminAuthMiddleware,
  requireAdminRoles('cs_lead', 'super_admin'),
  controller.approveAssistRecharge
);
router.post(
  '/recharge/assist/:id/reject',
  adminAuthMiddleware,
  requireAdminRoles('cs_lead', 'super_admin'),
  controller.rejectAssistRecharge
);
router.post(
  '/recharge/assist/:id/cancel',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.cancelAssistRecharge
);
router.post(
  '/recharge/assist/timeout/sweep',
  adminAuthMiddleware,
  requireAdminRoles('cs_lead', 'super_admin'),
  controller.sweepAssistRechargeTimeout
);
router.get(
  '/recharge/assist/reject-reasons',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.getAssistRejectReasonTemplates
);
router.get(
  '/intervention/templates',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.getInterventionTemplates
);
router.post(
  '/intervention/fill',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.fillInterventionTemplate
);
router.get(
  '/recharge/assist/requests',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.listAssistRechargeRequests
);
router.get(
  '/notifications',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.listSupportNotifications
);

router.get('/customer-tags', adminAuthMiddleware, controller.listCustomerTags);
router.post(
  '/customer-tags',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.createCustomerTag
);
router.post(
  '/customers/:id/tags',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.bindCustomerTag
);

router.get('/tickets', adminAuthMiddleware, controller.listSupportTickets);
router.post(
  '/tickets',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.createSupportTicket
);
router.put(
  '/tickets/:id/status',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.updateSupportTicketStatus
);
router.get('/tickets/:id/comments', adminAuthMiddleware, controller.listTicketComments);
router.post(
  '/tickets/:id/comments',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.createTicketComment
);
router.post(
  '/followups/create',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.createFollowupTasks
);
router.get(
  '/followups',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.listFollowupTasks
);
router.put(
  '/followups/:id/status',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.updateFollowupTaskStatus
);
router.post(
  '/followups/overdue/remind',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.remindFollowupOverdue
);
router.get(
  '/dashboard/conversion',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.getConversionDashboard
);
router.get(
  '/dashboard/cs-performance',
  adminAuthMiddleware,
  requireAdminRoles('cs', 'cs_lead', 'super_admin'),
  controller.getCsPerformanceDashboard
);

router.get('/configs', adminAuthMiddleware, controller.listConfigs);
router.get('/recharge/channel-options', adminAuthMiddleware, controller.getRechargeChannelOptions);
router.put(
  '/configs/:key',
  adminAuthMiddleware,
  requireAdminRoles('ops', 'super_admin'),
  controller.updateConfig
);
router.get(
  '/configs/history',
  adminAuthMiddleware,
  requireAdminRoles('ops', 'super_admin'),
  controller.listConfigHistory
);
router.post(
  '/configs/history/:id/rollback',
  adminAuthMiddleware,
  requireAdminRoles('super_admin'),
  controller.rollbackConfig
);

router.get('/params', adminAuthMiddleware, controller.listParams);
router.put(
  '/params/:key',
  adminAuthMiddleware,
  requireAdminRoles('ops', 'super_admin'),
  controller.updateParam
);

router.get(
  '/audit/logs',
  adminAuthMiddleware,
  requireAdminRoles('cs_lead', 'super_admin'),
  controller.listAuditLogs
);

module.exports = router;
