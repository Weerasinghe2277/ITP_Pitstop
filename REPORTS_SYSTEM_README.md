# 📊 Pitstop Reports System

A comprehensive report generation system for Pitstop Auto Service Management System with role-based access control and PDF generation capabilities.

## 🚀 Features

- **Role-based Access Control**: Different reports available for different user roles
- **PDF Generation**: Professional PDF reports with company branding
- **Real-time Data**: Reports generated from live database data
- **Flexible Filtering**: Customizable filters for date ranges, status, categories, etc.
- **Multiple Export Formats**: JSON and PDF formats supported
- **Responsive Templates**: Professional-looking reports with consistent styling

## 👥 User Roles and Available Reports

### **Cashier**
- 📊 **Bookings Report**: Overview of vehicle service bookings
- 💰 **Payments Report**: Financial summary of invoices and payments

### **Service Advisor**
- 🔧 **Jobs Report**: Technical work assignments and completion status

### **Technician**
- 🔧 **Jobs Report**: Their assigned jobs and completion status (filtered to their work only)

### **Admin**
- 📊 **Bookings Report**: Complete bookings overview
- 💰 **Payments Report**: Complete financial summary
- 🔧 **Jobs Report**: All jobs across all technicians
- 🏖️ **Leave Requests Report**: Employee leave requests and approvals
- 📦 **Inventory Report**: Parts and supplies inventory analysis
- 📈 **Dashboard Report**: Comprehensive summary dashboard

### **Manager**
- 📊 **Bookings Report**: Complete bookings overview
- 💰 **Payments Report**: Complete financial summary
- 🔧 **Jobs Report**: All jobs across all technicians
- 🏖️ **Leave Requests Report**: Employee leave requests and approvals
- 📦 **Inventory Report**: Parts and supplies inventory analysis
- 📈 **Dashboard Report**: Comprehensive summary dashboard

## 🛠️ API Endpoints

### Base URL: `/api/v1/reports`

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Available Endpoints

#### 1. Get Available Reports
```http
GET /api/v1/reports/available
```
**Access**: All authenticated users
**Returns**: List of reports available for the current user's role

#### 2. Bookings Report
```http
GET /api/v1/reports/bookings
```
**Access**: Cashier, Manager, Admin
**Query Parameters**:
- `status` (optional): pending, inspecting, working, completed, cancelled
- `serviceType` (optional): inspection, repair, maintenance, bodywork, detailing
- `priority` (optional): low, medium, high, urgent
- `dateFrom` (optional): Start date (YYYY-MM-DD)
- `dateTo` (optional): End date (YYYY-MM-DD)
- `format` (optional): json, pdf (default: pdf)

#### 3. Payments Report
```http
GET /api/v1/reports/payments
```
**Access**: Cashier, Manager, Admin
**Query Parameters**:
- `paymentStatus` (optional): pending, paid, overdue
- `dateFrom` (optional): Start date (YYYY-MM-DD)
- `dateTo` (optional): End date (YYYY-MM-DD)
- `format` (optional): json, pdf (default: pdf)

#### 4. Jobs Report
```http
GET /api/v1/reports/jobs
```
**Access**: Service Advisor, Technician, Manager, Admin
**Query Parameters**:
- `status` (optional): pending, working, completed, cancelled, on_hold
- `category` (optional): mechanical, electrical, bodywork, detailing, inspection, repair, maintenance
- `priority` (optional): low, medium, high, urgent
- `technicianId` (optional): Filter by specific technician (ignored for technician role - automatically filtered)
- `dateFrom` (optional): Start date (YYYY-MM-DD)
- `dateTo` (optional): End date (YYYY-MM-DD)
- `format` (optional): json, pdf (default: pdf)

#### 5. Leave Requests Report
```http
GET /api/v1/reports/leaves
```
**Access**: Admin, Manager
**Query Parameters**:
- `status` (optional): pending, approved, rejected
- `leaveType` (optional): annual, sick, emergency, maternity, paternity, unpaid
- `employeeId` (optional): Filter by specific employee
- `dateFrom` (optional): Start date (YYYY-MM-DD)
- `dateTo` (optional): End date (YYYY-MM-DD)
- `format` (optional): json, pdf (default: pdf)

#### 6. Inventory Report
```http
GET /api/v1/reports/inventory
```
**Access**: Manager, Admin
**Query Parameters**:
- `category` (optional): parts, tools, fluids, consumables
- `lowStock` (optional): true (show only low stock items)
- `outOfStock` (optional): true (show only out of stock items)
- `format` (optional): json, pdf (default: pdf)

#### 7. Dashboard Report
```http
GET /api/v1/reports/dashboard
```
**Access**: Manager, Admin
**Query Parameters**:
- `format` (optional): json, pdf (default: json)

## 📋 Example Usage

### JavaScript/Fetch API
```javascript
// Get available reports for current user
const response = await fetch('/api/v1/reports/available', {
  headers: {
    'Authorization': `Bearer ${your_jwt_token}`
  }
});

// Generate bookings report for last month
const bookingsReport = await fetch('/api/v1/reports/bookings?dateFrom=2024-01-01&dateTo=2024-01-31&format=pdf', {
  headers: {
    'Authorization': `Bearer ${your_jwt_token}`
  }
});

// The PDF will be returned as a blob that can be downloaded
const blob = await bookingsReport.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'bookings-report.pdf';
a.click();
```

### cURL
```bash
# Get available reports
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/v1/reports/available

# Generate jobs report in JSON format
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:5000/api/v1/reports/jobs?status=completed&format=json"

# Download inventory PDF report
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:5000/api/v1/reports/inventory?format=pdf" \
     --output inventory-report.pdf
```

## 🧪 Testing

A comprehensive test interface is available at:
```
http://localhost:5000/reports-api-test.html
```

This interface allows you to:
- Test all endpoints with different parameters
- Download PDF reports
- View JSON responses
- Test role-based access control

## 🏗️ System Architecture

### Files Structure
```
backend/
├── controllers/
│   └── reportsController.js     # Report generation endpoints
├── services/
│   └── reportsService.js        # Core report logic and PDF generation
├── routes/
│   └── reports.js               # API routes with role-based access
├── templates/                   # Handlebars templates
│   ├── base.hbs                # Base template with styling
│   ├── bookings-report.hbs     # Bookings report template
│   ├── payments-report.hbs     # Payments report template
│   ├── jobs-report.hbs         # Jobs report template
│   ├── leaves-report.hbs       # Leave requests template
│   └── inventory-report.hbs    # Inventory report template
└── public/
    └── reports-api-test.html    # Test interface
```

### Dependencies
- **puppeteer**: PDF generation from HTML
- **handlebars**: Template engine for dynamic reports
- **moment**: Date formatting and manipulation

## 🎨 Report Styling

Each report type has its own color theme:
- **Bookings**: Blue theme (#2563eb)
- **Payments**: Green theme (#059669)
- **Jobs**: Orange theme (#f59e0b)
- **Leaves**: Purple theme (#7c3aed)
- **Inventory**: Red theme (#dc2626)

## 🔒 Security Features

- **JWT Authentication**: All endpoints require valid authentication
- **Role-based Authorization**: Users can only access reports for their role
- **Data Filtering**: Technicians can only see their own jobs
- **Input Validation**: All query parameters are validated
- **Error Handling**: Comprehensive error messages and status codes

## 🚀 Deployment Notes

1. **Puppeteer Setup**: Ensure Puppeteer can run in your environment
2. **Font Support**: Arial/Helvetica fonts are used for cross-platform compatibility
3. **Memory Management**: PDF generation may require adequate memory allocation
4. **Logo Asset**: Place company logo at `backend/public/pitstop-logo.png` for branding

## 📝 Error Codes

- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: User role doesn't have access to the requested report
- **400 Bad Request**: Invalid query parameters (e.g., invalid date range)
- **500 Internal Server Error**: PDF generation or database errors

## 🔄 Future Enhancements

- **Report Scheduling**: Automated report generation and email delivery
- **Custom Report Builder**: User-defined reports with drag-and-drop interface
- **Data Export**: Excel and CSV export options
- **Report Caching**: Cache frequently requested reports for better performance
- **Email Integration**: Direct email delivery of reports
- **Report History**: Track generated reports and provide download history

---

**Last Updated**: September 30, 2025
**Version**: 1.0.0