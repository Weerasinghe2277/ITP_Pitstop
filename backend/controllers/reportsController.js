import asyncHandler from '../middleware/async.js';
import reportsService from '../services/reportsService.js';
import { StatusCodes } from 'http-status-codes';
import { createCustomError } from '../errors/custom-error.js';

/**
 * @desc    Generate Bookings Report (for Cashier)
 * @route   GET /api/reports/bookings
 * @access  Cashier, Manager, Admin
 */
const generateBookingsReport = asyncHandler(async (req, res) => {
  const {
    status,
    serviceType,
    priority,
    dateFrom,
    dateTo,
    format = 'pdf'
  } = req.query;

  // Validate query parameters
  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    throw createCustomError('Invalid date range: dateFrom cannot be after dateTo', StatusCodes.BAD_REQUEST);
  }

  const filters = {
    status,
    serviceType,
    priority,
    dateFrom: dateFrom ? new Date(dateFrom) : null,
    dateTo: dateTo ? new Date(dateTo) : null
  };

  const reportData = await reportsService.generateBookingsReport(filters);

  if (format === 'pdf') {
    const pdfBuffer = await reportsService.generateReportPDF('bookings', reportData, filters, `${req.user.profile?.firstName || 'User'} ${req.user.profile?.lastName || ''}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bookings-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } else {
    res.status(StatusCodes.OK).json({
      success: true,
      data: reportData,
      filters: filters,
      generatedAt: new Date().toISOString()
    });
  }
});

/**
 * @desc    Generate Payments Report (for Cashier)
 * @route   GET /api/reports/payments
 * @access  Cashier, Manager, Admin
 */
const generatePaymentsReport = asyncHandler(async (req, res) => {
  const {
    paymentStatus,
    dateFrom,
    dateTo,
    format = 'pdf'
  } = req.query;

  // Validate query parameters
  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    throw createCustomError('Invalid date range: dateFrom cannot be after dateTo', StatusCodes.BAD_REQUEST);
  }

  const filters = {
    paymentStatus,
    dateFrom: dateFrom ? new Date(dateFrom) : null,
    dateTo: dateTo ? new Date(dateTo) : null
  };

  const reportData = await reportsService.generatePaymentsReport(filters);

  if (format === 'pdf') {
    const pdfBuffer = await reportsService.generateReportPDF('payments', reportData, filters, `${req.user.profile?.firstName || 'User'} ${req.user.profile?.lastName || ''}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payments-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } else {
    res.status(StatusCodes.OK).json({
      success: true,
      data: reportData,
      filters: filters,
      generatedAt: new Date().toISOString()
    });
  }
});

/**
 * @desc    Generate Jobs Report (for Service Advisor, Technician)
 * @route   GET /api/reports/jobs
 * @access  Service Advisor, Technician, Manager, Admin
 */
const generateJobsReport = asyncHandler(async (req, res) => {
  const {
    status,
    category,
    priority,
    technicianId,
    dateFrom,
    dateTo,
    format = 'pdf'
  } = req.query;

  // Validate query parameters
  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    throw createCustomError('Invalid date range: dateFrom cannot be after dateTo', StatusCodes.BAD_REQUEST);
  }

  const filters = {
    status,
    category,
    priority,
    technicianId,
    dateFrom: dateFrom ? new Date(dateFrom) : null,
    dateTo: dateTo ? new Date(dateTo) : null
  };

  // If user is a technician, filter by their own jobs
  if (req.user.role === 'technician') {
    filters.technicianId = req.user._id;
  }

  const reportData = await reportsService.generateJobsReport(filters);

  if (format === 'pdf') {
    const pdfBuffer = await reportsService.generateReportPDF('jobs', reportData, filters, `${req.user.profile?.firstName || 'User'} ${req.user.profile?.lastName || ''}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="jobs-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } else {
    res.status(StatusCodes.OK).json({
      success: true,
      data: reportData,
      filters: filters,
      generatedAt: new Date().toISOString()
    });
  }
});

/**
 * @desc    Generate Leave Requests Report (for Admin)
 * @route   GET /api/reports/leaves
 * @access  Admin, Manager
 */
const generateLeavesReport = asyncHandler(async (req, res) => {
  const {
    status,
    leaveType,
    employeeId,
    dateFrom,
    dateTo,
    format = 'pdf'
  } = req.query;

  // Validate query parameters
  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    throw createCustomError('Invalid date range: dateFrom cannot be after dateTo', StatusCodes.BAD_REQUEST);
  }

  const filters = {
    status,
    leaveType,
    employeeId,
    dateFrom: dateFrom ? new Date(dateFrom) : null,
    dateTo: dateTo ? new Date(dateTo) : null
  };

  const reportData = await reportsService.generateLeavesReport(filters);

  if (format === 'pdf') {
    const pdfBuffer = await reportsService.generateReportPDF('leaves', reportData, filters, `${req.user.profile?.firstName || 'User'} ${req.user.profile?.lastName || ''}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="leaves-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } else {
    res.status(StatusCodes.OK).json({
      success: true,
      data: reportData,
      filters: filters,
      generatedAt: new Date().toISOString()
    });
  }
});

/**
 * @desc    Generate Inventory Report (for Inventory Manager)
 * @route   GET /api/reports/inventory
 * @access  Inventory Manager, Manager, Admin
 */
const generateInventoryReport = asyncHandler(async (req, res) => {
  const {
    category,
    lowStock,
    outOfStock,
    format = 'pdf'
  } = req.query;

  const filters = {
    category,
    lowStock,
    outOfStock
  };

  const reportData = await reportsService.generateInventoryReport(filters);

  if (format === 'pdf') {
    const pdfBuffer = await reportsService.generateReportPDF('inventory', reportData, filters, `${req.user.profile?.firstName || 'User'} ${req.user.profile?.lastName || ''}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } else {
    res.status(StatusCodes.OK).json({
      success: true,
      data: reportData,
      filters: filters,
      generatedAt: new Date().toISOString()
    });
  }
});

/**
 * @desc    Get Available Report Types for User Role
 * @route   GET /api/reports/available
 * @access  All authenticated users
 */
const getAvailableReports = asyncHandler(async (req, res) => {
  const userRole = req.user.role;

  const allReports = {
    bookings: {
      name: 'Bookings Report',
      description: 'Comprehensive overview of vehicle service bookings',
      roles: ['cashier', 'manager', 'admin'],
      filters: ['status', 'serviceType', 'priority', 'dateRange']
    },
    payments: {
      name: 'Payments Report',
      description: 'Financial summary of invoices and payments',
      roles: ['cashier', 'manager', 'admin'],
      filters: ['paymentStatus', 'dateRange']
    },
    jobs: {
      name: 'Jobs Report',
      description: 'Technical work assignments and completion status',
      roles: ['service_advisor', 'technician', 'manager', 'admin'],
      filters: ['status', 'category', 'priority', 'technicianId', 'dateRange']
    },
    leaves: {
      name: 'Leave Requests Report',
      description: 'Employee leave requests and approvals',
      roles: ['admin', 'manager'],
      filters: ['status', 'leaveType', 'employeeId', 'dateRange']
    },
    inventory: {
      name: 'Inventory Report',
      description: 'Parts and supplies inventory analysis',
      roles: ['manager', 'admin'],
      filters: ['category', 'lowStock', 'outOfStock']
    }
  };

  const availableReports = Object.entries(allReports)
    .filter(([key, report]) => report.roles.includes(userRole))
    .reduce((acc, [key, report]) => {
      acc[key] = report;
      return acc;
    }, {});

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      userRole,
      availableReports
    }
  });
});

/**
 * @desc    Generate Summary Dashboard Report
 * @route   GET /api/reports/dashboard
 * @access  Manager, Admin
 */
const generateDashboardReport = asyncHandler(async (req, res) => {
  const { format = 'json' } = req.query;

  // Get current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const filters = {
    dateFrom: startOfMonth,
    dateTo: endOfMonth
  };

  try {
    // Generate all reports in parallel
    const [bookingsData, paymentsData, jobsData, inventoryData] = await Promise.all([
      reportsService.generateBookingsReport(filters),
      reportsService.generatePaymentsReport(filters),
      reportsService.generateJobsReport(filters),
      reportsService.generateInventoryReport({})
    ]);

    const dashboardData = {
      summary: {
        totalBookings: bookingsData.summary.totalBookings,
        completedBookings: bookingsData.summary.completedBookings,
        totalRevenue: paymentsData.summary.totalRevenue,
        paidInvoices: paymentsData.summary.paidInvoices,
        totalJobs: jobsData.summary.totalJobs,
        completedJobs: jobsData.summary.completedJobs,
        lowStockItems: inventoryData.summary.lowStockItems,
        totalInventoryValue: inventoryData.summary.totalValue
      },
      bookingsByStatus: bookingsData.bookingsByStatus,
      jobsByCategory: jobsData.jobsByCategory,
      paymentsByStatus: paymentsData.paymentsByStatus,
      inventoryByCategory: inventoryData.itemsByCategory
    };

    if (format === 'pdf') {
      // For PDF, we could create a dashboard template
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Dashboard PDF generation coming soon',
        data: dashboardData
      });
    } else {
      res.status(StatusCodes.OK).json({
        success: true,
        data: dashboardData,
        generatedAt: new Date().toISOString(),
        period: `${startOfMonth.toISOString().split('T')[0]} to ${endOfMonth.toISOString().split('T')[0]}`
      });
    }
  } catch (error) {
    console.error('Error generating dashboard report:', error);
    throw createCustomError('Failed to generate dashboard report', StatusCodes.INTERNAL_SERVER_ERROR);
  }
});

/**
 * @desc    Generate Users Report (for Admin, Manager)
 * @route   GET /api/reports/users
 * @access  Admin, Manager
 */
const generateUsersReport = asyncHandler(async (req, res) => {
  const {
    role,
    status,
    specialization,
    dateFrom,
    dateTo,
    format = 'pdf'
  } = req.query;

  // Validate query parameters
  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    throw createCustomError('Invalid date range: dateFrom cannot be after dateTo', StatusCodes.BAD_REQUEST);
  }

  const filters = {
    role,
    status,
    specialization,
    dateFrom: dateFrom ? new Date(dateFrom) : null,
    dateTo: dateTo ? new Date(dateTo) : null
  };

  const reportData = await reportsService.generateUsersReport(filters);

  if (format === 'pdf') {
    const pdfBuffer = await reportsService.generateReportPDF('users', reportData, filters, `${req.user.profile?.firstName || 'User'} ${req.user.profile?.lastName || ''}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="users-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } else {
    res.status(StatusCodes.OK).json({
      success: true,
      data: reportData,
      filters: filters,
      generatedAt: new Date().toISOString()
    });
  }
});

export {
  generateBookingsReport,
  generatePaymentsReport,
  generateJobsReport,
  generateLeavesReport,
  generateInventoryReport,
  generateUsersReport,
  getAvailableReports,
  generateDashboardReport
};