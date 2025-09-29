import express from 'express';
import {
  generateBookingsReport,
  generatePaymentsReport,
  generateJobsReport,
  generateLeavesReport,
  generateInventoryReport,
  getAvailableReports,
  generateDashboardReport
} from '../controllers/reportsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/reports/available
 * @desc    Get available report types for current user role
 * @access  All authenticated users
 */
router.get('/available', authenticate, getAvailableReports);

/**
 * @route   GET /api/reports/bookings
 * @desc    Generate bookings report
 * @access  Cashier, Manager, Admin
 */
router.get('/bookings', authenticate, authorize('cashier', 'manager', 'admin'), generateBookingsReport);

/**
 * @route   GET /api/reports/payments
 * @desc    Generate payments report
 * @access  Cashier, Manager, Admin
 */
router.get('/payments', authenticate, authorize('cashier', 'manager', 'admin'), generatePaymentsReport);

/**
 * @route   GET /api/reports/jobs
 * @desc    Generate jobs report
 * @access  Service Advisor, Technician, Manager, Admin
 */
router.get('/jobs', authenticate, authorize('service_advisor', 'technician', 'manager', 'admin'), generateJobsReport);

/**
 * @route   GET /api/reports/leaves
 * @desc    Generate leave requests report
 * @access  Admin, Manager
 */
router.get('/leaves', authenticate, authorize('admin', 'manager'), generateLeavesReport);

/**
 * @route   GET /api/reports/inventory
 * @desc    Generate inventory report
 * @access  Manager, Admin (Note: Inventory Manager role might not exist, using manager instead)
 */
router.get('/inventory', authenticate, authorize('manager', 'admin'), generateInventoryReport);

/**
 * @route   GET /api/reports/dashboard
 * @desc    Generate dashboard summary report
 * @access  Manager, Admin
 */
router.get('/dashboard', authenticate, authorize('manager', 'admin'), generateDashboardReport);

export default router;