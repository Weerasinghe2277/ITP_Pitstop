import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import moment from 'moment';
import puppeteer from 'puppeteer';
import { Booking } from '../models/Booking.js';
import Job from '../models/Job.js';
import { Invoice } from '../models/Invoice.js';
import { LeaveRequest } from '../models/LeaveRequest .js';
import { InventoryItem } from '../models/InventoryItem.js';
import User from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReportsService {
  constructor() {
    this.templatePath = path.join(__dirname, '../templates');
    this.registerHandlebarsHelpers();
  }

  /**
   * Get report theme based on report type
   */
  getReportTheme(reportType = 'default') {
    const themes = {
      default: {
        primaryColor: '#dc2626',
        primaryDark: '#991b1b',
        secondaryColor: '#64748b',
        accentColor: '#059669',
        textColor: '#2c3e50',
        backgroundColor: '#ffffff',
        headerBackground: '#fef2f2',
        borderColor: '#e5e7eb',
        tableBorder: '#d1d5db',
        tableHeaderBackground: '#dc2626',
        tableHeaderBorder: '#991b1b'
      },
      bookings: {
        primaryColor: '#2563eb',
        primaryDark: '#1e40af',
        secondaryColor: '#6b7280',
        accentColor: '#059669',
        textColor: '#1f2937',
        backgroundColor: '#ffffff',
        headerBackground: '#eff6ff',
        borderColor: '#dbeafe',
        tableBorder: '#93c5fd',
        tableHeaderBackground: '#2563eb',
        tableHeaderBorder: '#1d4ed8'
      },
      payments: {
        primaryColor: '#059669',
        primaryDark: '#047857',
        secondaryColor: '#6b7280',
        accentColor: '#2563eb',
        textColor: '#1f2937',
        backgroundColor: '#ffffff',
        headerBackground: '#f0fdf4',
        borderColor: '#d1fae5',
        tableBorder: '#a7f3d0',
        tableHeaderBackground: '#059669',
        tableHeaderBorder: '#047857'
      },
      jobs: {
        primaryColor: '#f59e0b',
        primaryDark: '#d97706',
        secondaryColor: '#6b7280',
        accentColor: '#2563eb',
        textColor: '#1f2937',
        backgroundColor: '#ffffff',
        headerBackground: '#fffbeb',
        borderColor: '#fed7aa',
        tableBorder: '#fdba74',
        tableHeaderBackground: '#f59e0b',
        tableHeaderBorder: '#d97706'
      },
      leaves: {
        primaryColor: '#7c3aed',
        primaryDark: '#5b21b6',
        secondaryColor: '#6b7280',
        accentColor: '#f59e0b',
        textColor: '#1f2937',
        backgroundColor: '#ffffff',
        headerBackground: '#faf5ff',
        borderColor: '#e9d5ff',
        tableBorder: '#c4b5fd',
        tableHeaderBackground: '#7c3aed',
        tableHeaderBorder: '#5b21b6'
      },
      inventory: {
        primaryColor: '#dc2626',
        primaryDark: '#991b1b',
        secondaryColor: '#6b7280',
        accentColor: '#059669',
        textColor: '#1f2937',
        backgroundColor: '#ffffff',
        headerBackground: '#fef2f2',
        borderColor: '#fecaca',
        tableBorder: '#fca5a5',
        tableHeaderBackground: '#dc2626',
        tableHeaderBorder: '#991b1b'
      }
    };

    return themes[reportType] || themes.default;
  }

  /**
   * Register Handlebars helper functions
   */
  registerHandlebarsHelpers() {
    handlebars.registerHelper('formatDate', (date) => {
      if (!date || date === 'Never' || date === null || date === undefined) {
        return 'N/A';
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }

      return moment(date).format('MMM DD, YYYY');
    });

    handlebars.registerHelper('formatDateTime', (date) => {
      if (!date || date === 'Never' || date === null || date === undefined) {
        return 'N/A';
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }

      return moment(date).format('MMM DD, YYYY [at] h:mm A');
    });

    handlebars.registerHelper('formatCurrency', (amount) => {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount || 0);
    });

    handlebars.registerHelper('eq', (a, b) => a === b);
    handlebars.registerHelper('gt', (a, b) => a > b);
    handlebars.registerHelper('lt', (a, b) => a < b);
  }

  /**
   * Load company logo as base64
   */
  async loadLogo() {
    try {
      const logoPath = path.join(__dirname, '../public/pitstop-logo.png');
      const logoContent = await fs.readFile(logoPath);
      return logoContent.toString('base64');
    } catch (error) {
      console.warn('Logo file not found, proceeding without logo');
      return '';
    }
  }

  /**
   * Load and compile Handlebars template
   */
  async loadTemplate(templateName) {
    try {
      const templatePath = path.join(this.templatePath, `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      return handlebars.compile(templateContent);
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Generate PDF from HTML content
   */
  async generatePDF(htmlContent, options = {}) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 1
      });

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: false,
        displayHeaderFooter: false,
        margin: {
          top: '15px',
          right: '15px',
          bottom: '15px',
          left: '15px'
        },
        ...options
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('PDF generation failed');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate Bookings Report Data
   */
  async generateBookingsReport(filters = {}) {
    try {
      let query = {};

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.serviceType) {
        query.serviceType = filters.serviceType;
      }

      if (filters.priority) {
        query.priority = filters.priority;
      }

      if (filters.dateFrom && filters.dateTo) {
        query.scheduledDate = {
          $gte: new Date(filters.dateFrom),
          $lte: new Date(filters.dateTo)
        };
      }

      const bookings = await Booking.find(query)
        .populate('customer', 'profile.firstName profile.lastName email')
        .populate('vehicle', 'make model year licensePlate')
        .populate('assignedInspector', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .lean();

      // Generate summary statistics
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const inProgressBookings = bookings.filter(b => ['inspecting', 'working'].includes(b.status)).length;
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.actualCost || b.estimatedCost || 0), 0);

      // Group by status
      const bookingsByStatus = this.groupAndCalculatePercentage(bookings, 'status', totalBookings);

      // Group by service type
      const bookingsByServiceType = bookings.reduce((acc, booking) => {
        const serviceType = booking.serviceType || 'unknown';
        if (!acc[serviceType]) {
          acc[serviceType] = { count: 0, totalCost: 0 };
        }
        acc[serviceType].count++;
        acc[serviceType].totalCost += (booking.actualCost || booking.estimatedCost || 0);
        return acc;
      }, {});

      const serviceTypeStats = Object.entries(bookingsByServiceType).map(([serviceType, data]) => ({
        serviceType: serviceType.charAt(0).toUpperCase() + serviceType.slice(1),
        count: data.count,
        percentage: totalBookings > 0 ? ((data.count / totalBookings) * 100).toFixed(1) : 0,
        averageCost: data.count > 0 ? data.totalCost / data.count : 0
      }));

      return {
        bookings: bookings.map(booking => ({
          bookingId: booking.bookingId || booking._id.toString().slice(-6).toUpperCase(),
          customerName: booking.customer ?
            `${booking.customer.profile?.firstName || 'N/A'} ${booking.customer.profile?.lastName || 'N/A'}` : 'N/A',
          vehicleInfo: booking.vehicle ?
            `${booking.vehicle.make || 'N/A'} ${booking.vehicle.model || 'N/A'} (${booking.vehicle.year || 'N/A'})` : 'N/A',
          serviceType: booking.serviceType ? booking.serviceType.charAt(0).toUpperCase() + booking.serviceType.slice(1) : 'N/A',
          scheduledDate: booking.scheduledDate,
          status: booking.status,
          priority: booking.priority,
          estimatedCost: booking.estimatedCost || 0,
          actualCost: booking.actualCost || 0
        })),
        summary: {
          totalBookings,
          completedBookings,
          inProgressBookings,
          totalRevenue,
          completionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0
        },
        bookingsByStatus,
        bookingsByServiceType: serviceTypeStats
      };
    } catch (error) {
      console.error('Error generating bookings report:', error);
      throw new Error('Failed to generate bookings report');
    }
  }

  /**
   * Generate Payments Report Data
   */
  async generatePaymentsReport(filters = {}) {
    try {
      let query = {};

      if (filters.paymentStatus) {
        query.paymentStatus = filters.paymentStatus;
      }

      if (filters.dateFrom && filters.dateTo) {
        query.issueDate = {
          $gte: new Date(filters.dateFrom),
          $lte: new Date(filters.dateTo)
        };
      }

      const invoices = await Invoice.find(query)
        .populate('customer', 'profile.firstName profile.lastName email')
        .populate('booking', 'bookingId')
        .sort({ createdAt: -1 })
        .lean();

      // Generate summary statistics
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(i => i.paymentStatus === 'paid').length;
      const totalRevenue = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
      const averageInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

      // Group by payment status
      const paymentsByStatus = invoices.reduce((acc, invoice) => {
        const status = invoice.paymentStatus || 'pending';
        if (!acc[status]) {
          acc[status] = { count: 0, totalAmount: 0 };
        }
        acc[status].count++;
        acc[status].totalAmount += (invoice.totalAmount || 0);
        return acc;
      }, {});

      const statusStats = Object.entries(paymentsByStatus).map(([status, data]) => ({
        status,
        count: data.count,
        totalAmount: data.totalAmount,
        percentage: totalInvoices > 0 ? ((data.count / totalInvoices) * 100).toFixed(1) : 0
      }));

      return {
        invoices: invoices.map(invoice => ({
          invoiceId: invoice.invoiceId || invoice._id.toString().slice(-6).toUpperCase(),
          bookingId: invoice.booking?.bookingId || 'N/A',
          customerName: invoice.customer ?
            `${invoice.customer.profile?.firstName || 'N/A'} ${invoice.customer.profile?.lastName || 'N/A'}` : 'N/A',
          issueDate: invoice.issueDate || invoice.createdAt,
          dueDate: invoice.dueDate,
          subtotal: invoice.subtotal || 0,
          tax: invoice.tax || 0,
          totalAmount: invoice.totalAmount || 0,
          paymentStatus: invoice.paymentStatus || 'pending'
        })),
        summary: {
          totalInvoices,
          paidInvoices,
          totalRevenue,
          averageInvoice,
          paymentRate: totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : 0
        },
        paymentsByStatus: statusStats
      };
    } catch (error) {
      console.error('Error generating payments report:', error);
      throw new Error('Failed to generate payments report');
    }
  }

  /**
   * Generate Jobs Report Data
   */
  async generateJobsReport(filters = {}) {
    try {
      let query = {};

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.priority) {
        query.priority = filters.priority;
      }

      if (filters.technicianId) {
        query['assignedLabourers.labourer'] = filters.technicianId;
      }

      if (filters.dateFrom && filters.dateTo) {
        query.createdAt = {
          $gte: new Date(filters.dateFrom),
          $lte: new Date(filters.dateTo)
        };
      }

      const jobs = await Job.find(query)
        .populate('booking', 'bookingId customer')
        .populate('assignedLabourers.labourer', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .lean();

      // Generate summary statistics
      const totalJobs = jobs.length;
      const completedJobs = jobs.filter(j => j.status === 'completed').length;
      const inProgressJobs = jobs.filter(j => j.status === 'working').length;
      const totalHours = jobs.reduce((sum, j) => sum + (j.actualHours || j.estimatedHours || 0), 0);

      // Group by category
      const jobsByCategory = jobs.reduce((acc, job) => {
        const category = job.category || 'unknown';
        if (!acc[category]) {
          acc[category] = { count: 0, totalHours: 0 };
        }
        acc[category].count++;
        acc[category].totalHours += (job.actualHours || job.estimatedHours || 0);
        return acc;
      }, {});

      const categoryStats = Object.entries(jobsByCategory).map(([category, data]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        count: data.count,
        percentage: totalJobs > 0 ? ((data.count / totalJobs) * 100).toFixed(1) : 0,
        averageHours: data.count > 0 ? (data.totalHours / data.count).toFixed(1) : 0
      }));

      // Group by status
      const jobsByStatus = this.groupAndCalculatePercentage(jobs, 'status', totalJobs);

      return {
        jobs: jobs.map(job => ({
          jobId: job.jobId || job._id.toString().slice(-6).toUpperCase(),
          title: job.title,
          category: job.category ? job.category.charAt(0).toUpperCase() + job.category.slice(1) : 'N/A',
          technicianName: job.assignedLabourers && job.assignedLabourers.length > 0 ?
            job.assignedLabourers.map(assignment => {
              const labourer = assignment.labourer;
              return `${labourer?.profile?.firstName || 'N/A'} ${labourer?.profile?.lastName || 'N/A'}`;
            }).join(', ') : 'Unassigned',
          status: job.status,
          priority: job.priority,
          estimatedHours: job.estimatedHours || 0,
          actualHours: job.actualHours || 0,
          createdAt: job.createdAt,
          completedAt: job.completedAt
        })),
        summary: {
          totalJobs,
          completedJobs,
          inProgressJobs,
          totalHours,
          completionRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : 0
        },
        jobsByCategory: categoryStats,
        jobsByStatus
      };
    } catch (error) {
      console.error('Error generating jobs report:', error);
      throw new Error('Failed to generate jobs report');
    }
  }

  /**
   * Generate Leave Requests Report Data
   */
  async generateLeavesReport(filters = {}) {
    try {
      let query = {};

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.leaveType) {
        query.leaveType = filters.leaveType;
      }

      if (filters.employeeId) {
        query.employee = filters.employeeId;
      }

      if (filters.dateFrom && filters.dateTo) {
        query.$or = [
          {
            startDate: {
              $gte: new Date(filters.dateFrom),
              $lte: new Date(filters.dateTo)
            }
          },
          {
            endDate: {
              $gte: new Date(filters.dateFrom),
              $lte: new Date(filters.dateTo)
            }
          }
        ];
      }

      const leaveRequests = await LeaveRequest.find(query)
        .populate('employee', 'profile.firstName profile.lastName email role')
        .populate('approvedBy', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .lean();

      // Generate summary statistics
      const totalRequests = leaveRequests.length;
      const approvedRequests = leaveRequests.filter(l => l.status === 'approved').length;
      const pendingRequests = leaveRequests.filter(l => l.status === 'pending').length;
      const totalDays = leaveRequests.reduce((sum, l) => sum + (l.totalDays || 0), 0);

      // Group by leave type
      const leavesByType = leaveRequests.reduce((acc, leave) => {
        const leaveType = leave.leaveType || 'unknown';
        if (!acc[leaveType]) {
          acc[leaveType] = { count: 0, totalDays: 0 };
        }
        acc[leaveType].count++;
        acc[leaveType].totalDays += (leave.totalDays || 0);
        return acc;
      }, {});

      const typeStats = Object.entries(leavesByType).map(([leaveType, data]) => ({
        leaveType: leaveType.charAt(0).toUpperCase() + leaveType.slice(1),
        count: data.count,
        totalDays: data.totalDays,
        percentage: totalRequests > 0 ? ((data.count / totalRequests) * 100).toFixed(1) : 0
      }));

      // Group by status
      const leavesByStatus = this.groupAndCalculatePercentage(leaveRequests, 'status', totalRequests);

      return {
        leaveRequests: leaveRequests.map(leave => ({
          requestId: leave.requestId || leave._id.toString().slice(-6).toUpperCase(),
          employeeName: leave.employee ?
            `${leave.employee.profile?.firstName || 'N/A'} ${leave.employee.profile?.lastName || 'N/A'}` : 'N/A',
          leaveType: leave.leaveType ? leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1) : 'N/A',
          startDate: leave.startDate,
          endDate: leave.endDate,
          totalDays: leave.totalDays || 0,
          status: leave.status,
          approvedByName: leave.approvedBy ?
            `${leave.approvedBy.profile?.firstName || 'N/A'} ${leave.approvedBy.profile?.lastName || 'N/A'}` : 'N/A'
        })),
        summary: {
          totalRequests,
          approvedRequests,
          pendingRequests,
          totalDays,
          approvalRate: totalRequests > 0 ? ((approvedRequests / totalRequests) * 100).toFixed(1) : 0
        },
        leavesByType: typeStats,
        leavesByStatus
      };
    } catch (error) {
      console.error('Error generating leaves report:', error);
      throw new Error('Failed to generate leaves report');
    }
  }

  /**
   * Generate Inventory Report Data
   */
  async generateInventoryReport(filters = {}) {
    try {
      let query = {};

      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.lowStock === 'true') {
        query.$expr = { $lte: ['$currentStock', '$minimumStock'] };
      }

      if (filters.outOfStock === 'true') {
        query.currentStock = { $lte: 0 };
      }

      const inventoryItems = await InventoryItem.find(query)
        .sort({ name: 1 })
        .lean();

      // Generate summary statistics
      const totalItems = inventoryItems.length;
      const lowStockItems = inventoryItems.filter(i => i.currentStock <= i.minimumStock).length;
      const outOfStockItems = inventoryItems.filter(i => i.currentStock <= 0).length;
      const totalValue = inventoryItems.reduce((sum, i) => sum + ((i.currentStock || 0) * (i.unitPrice || 0)), 0);

      // Group by category
      const itemsByCategory = inventoryItems.reduce((acc, item) => {
        const category = item.category || 'unknown';
        if (!acc[category]) {
          acc[category] = { count: 0, totalValue: 0 };
        }
        acc[category].count++;
        acc[category].totalValue += ((item.currentStock || 0) * (item.unitPrice || 0));
        return acc;
      }, {});

      const categoryStats = Object.entries(itemsByCategory).map(([category, data]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        count: data.count,
        totalValue: data.totalValue,
        percentage: totalItems > 0 ? ((data.count / totalItems) * 100).toFixed(1) : 0
      }));

      // Get low stock items for alert section
      const lowStockAlert = inventoryItems
        .filter(i => i.currentStock <= i.minimumStock && i.currentStock > 0)
        .map(item => ({
          itemId: item.itemId || item._id.toString().slice(-6).toUpperCase(),
          name: item.name,
          category: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'N/A',
          currentStock: item.currentStock || 0,
          minimumStock: item.minimumStock || 0,
          unitPrice: item.unitPrice || 0
        }));

      return {
        inventoryItems: inventoryItems.map(item => ({
          itemId: item.itemId || item._id.toString().slice(-6).toUpperCase(),
          name: item.name,
          category: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'N/A',
          brand: item.brand || 'N/A',
          currentStock: item.currentStock || 0,
          unit: item.unit || 'piece',
          unitPrice: item.unitPrice || 0,
          totalValue: (item.currentStock || 0) * (item.unitPrice || 0)
        })),
        summary: {
          totalItems,
          lowStockItems,
          outOfStockItems,
          totalValue,
          stockHealth: totalItems > 0 ? (((totalItems - lowStockItems) / totalItems) * 100).toFixed(1) : 0
        },
        itemsByCategory: categoryStats,
        lowStockItems: lowStockAlert
      };
    } catch (error) {
      console.error('Error generating inventory report:', error);
      throw new Error('Failed to generate inventory report');
    }
  }

  /**
   * Generate Users Report Data
   */
  async generateUsersReport(filters = {}) {
    try {
      let query = {};

      // Apply filters
      if (filters.role) {
        query.role = filters.role;
      }

      if (filters.status) {
        query.isActive = filters.status === 'active';
      }

      if (filters.specialization) {
        query['profile.specialization'] = { $regex: filters.specialization, $options: 'i' };
      }

      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) {
          query.createdAt.$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          query.createdAt.$lte = filters.dateTo;
        }
      }

      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .lean();

      // Generate summary statistics
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.isActive).length;
      const inactiveUsers = totalUsers - activeUsers;

      // Group by role
      const usersByRole = users.reduce((acc, user) => {
        const role = user.role || 'unknown';
        if (!acc[role]) {
          acc[role] = { count: 0, active: 0, inactive: 0 };
        }
        acc[role].count++;
        if (user.isActive) {
          acc[role].active++;
        } else {
          acc[role].inactive++;
        }
        return acc;
      }, {});

      const roleStats = Object.entries(usersByRole).map(([role, data]) => ({
        role: role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' '),
        count: data.count,
        active: data.active,
        inactive: data.inactive,
        percentage: totalUsers > 0 ? ((data.count / totalUsers) * 100).toFixed(1) : 0
      }));

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRegistrations = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;

      // Calculate user engagement metrics
      const usersWithProfiles = users.filter(u => u.profile && (u.profile.firstName || u.profile.lastName)).length;
      const profileCompletionRate = totalUsers > 0 ? ((usersWithProfiles / totalUsers) * 100).toFixed(1) : 0;

      return {
        users: users.map(user => ({
          userId: user.userId || user._id.toString().slice(-6).toUpperCase(),
          email: user.email,
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          role: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ') : 'N/A',
          phone: user.profile?.phone || 'N/A',
          specialization: user.profile?.specialization || 'N/A',
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin || null,
          loyaltyPoints: user.loyaltyPoints || 0
        })),
        summary: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          recentRegistrations,
          profileCompletionRate
        },
        roleDistribution: roleStats,
        activeUsersPercentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error generating users report:', error);
      throw new Error('Failed to generate users report');
    }
  }

  /**
   * Helper method to group data and calculate percentages
   */
  groupAndCalculatePercentage(data, field, total) {
    const grouped = data.reduce((acc, item) => {
      const value = item[field] || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([key, count]) => ({
      [field]: key,
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
    }));
  }

  /**
   * Generate PDF for any report type
   */
  async generateReportPDF(reportType, reportData, filters, generatedBy = 'System Administrator') {
    try {
      const baseTemplate = await this.loadTemplate('base');
      const contentTemplate = await this.loadTemplate(`${reportType}-report`);
      const logoBase64 = await this.loadLogo();

      const reportTitles = {
        bookings: 'Bookings Report',
        payments: 'Payments Report',
        jobs: 'Jobs Report',
        leaves: 'Leave Requests Report',
        inventory: 'Inventory Report',
        users: 'Users Report'
      };

      const reportSubtitles = {
        bookings: 'Comprehensive overview of vehicle service bookings',
        payments: 'Financial summary of invoices and payments',
        jobs: 'Technical work assignments and completion status',
        leaves: 'Employee leave requests and approvals',
        inventory: 'Parts and supplies inventory analysis',
        users: 'System user accounts and role distribution'
      };

      const templateData = {
        reportTitle: reportTitles[reportType] || 'Report',
        reportSubtitle: reportSubtitles[reportType] || 'System report',
        generatedBy,
        generatedDate: moment().format('MMMM DD, YYYY'),
        reportPeriod: filters.dateFrom && filters.dateTo ?
          `${moment(filters.dateFrom).format('MMM DD, YYYY')} - ${moment(filters.dateTo).format('MMM DD, YYYY')}` :
          'All Time',
        totalRecords: reportData[Object.keys(reportData)[0]]?.length || 0,
        reportType: reportType.charAt(0).toUpperCase() + reportType.slice(1),
        currentYear: new Date().getFullYear(),
        timestamp: moment().format('MMMM DD, YYYY [at] h:mm A'),
        logoBase64: logoBase64,
        theme: this.getReportTheme(reportType),
        ...reportData
      };

      // Register the content partial
      handlebars.registerPartial('content', contentTemplate);

      const html = baseTemplate(templateData);
      return await this.generatePDF(html);
    } catch (error) {
      console.error(`Error generating ${reportType} PDF:`, error);
      throw new Error(`Failed to generate ${reportType} PDF report`);
    }
  }
}

export default new ReportsService();