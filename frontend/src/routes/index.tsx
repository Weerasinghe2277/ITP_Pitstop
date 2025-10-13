import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, type RouteObject } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";
import { AuthProvider } from "../store/AuthContext";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import Dashboard from "../pages/Dashboard";
import NoAccess from "../pages/NoAccess";
import NotFound from "../pages/NotFound";

// Auth
import Login from "../features/auth/Login";

// Bookings
import BookingsList from "../features/bookings/BookingsList";
import CreateBooking from "../features/bookings/CreateBooking";
import BookingDetail from "../features/bookings/BookingDetail";

// Jobs
import JobsList from "../features/jobs/JobsList";
import CreateJob from "../features/jobs/CreateJob";
import JobDetail from "../features/jobs/JobDetail";
import MyJobs from "../features/jobs/MyJobs";

// Goods Requests
import GoodsRequestsList from "../features/goods/GoodsRequestsList";
import CreateGoodsRequest from "../features/goods/CreateGoodsRequest";

// Inventory
import InventoryList from "../features/inventory/InventoryList";
import CreateItem from "../features/inventory/CreateItem";
import ItemDetail from "../features/inventory/ItemDetail";
import LowStock from "../features/inventory/LowStock";

// Invoices
import InvoicesList from "../features/invoices/InvoicesList";
import CreateInvoice from "../features/invoices/CreateInvoice";
import InvoiceDetail from "../features/invoices/InvoiceDetail";

// Leave
import MyLeave from "../features/leave/MyLeave";
import ManageLeave from "../features/leave/ManageLeave";

// Users
import UsersList from "../features/users/UsersList";
import CreateUser from "../features/users/CreateUser";
import UserDetail from "../features/users/UserDetail";
import MyProfile from "../features/users/MyProfile";

// Vehicles
import VehiclesList from "../features/vehicles/VehiclesList";
import CreateVehicle from "../features/vehicles/CreateVehicle";
import VehicleDetail from "../features/vehicles/VehicleDetail";

// Reports
import ReportsList from "../features/reports/ReportsList";
import SalaryReport from "../features/reports/SalaryReport";
import StockReport from "../features/reports/StockReport";
import BookingReport from "../features/reports/BookingReport";
import WorkAllocationReport from "../features/reports/WorkAllocationReport";
import EmployeeReport from "../features/reports/EmployeeReport";

// API Reports
import BookingsReport from "../features/reports/api/BookingsReport";
import PaymentsReport from "../features/reports/api/PaymentsReport";
import JobsReport from "../features/reports/api/JobsReport";
import LeavesReport from "../features/reports/api/LeavesReport";
import InventoryReport from "../features/reports/api/InventoryReport";
import UsersReport from "../features/reports/api/UsersReport";

const routes: RouteObject[] = [
    { path: "/login", element: <Login /> },
    { path: "/no-access", element: <NoAccess /> },
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),
        errorElement: <NotFound />,
        children: [
            {
                index: true,
                element: (
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                )
            },
            {
                path: "dashboard",
                element: (
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                ),
            },
            {
                path: "users-report-test",
                element: (
                    <ProtectedRoute roles={["manager", "admin"]}>
                        <UsersReport />
                    </ProtectedRoute>
                ),
            },

            // Bookings (cashier, admin, manager, service_advisor)
            {
                path: "bookings",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "manager", "service_advisor"]}>
                        <BookingsList />
                    </ProtectedRoute>
                ),
            },
            {
                path: "bookings/new",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "manager", "service_advisor"]}>
                        <CreateBooking />
                    </ProtectedRoute>
                ),
            },
            {
                path: "bookings/:id",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "manager", "service_advisor"]}>
                        <BookingDetail />
                    </ProtectedRoute>
                ),
            },

            // Jobs
            {
                path: "jobs",
                element: (
                    <ProtectedRoute roles={["service_advisor", "admin", "manager", "technician"]}>
                        <JobsList />
                    </ProtectedRoute>
                ),
            },
            {
                path: "jobs/new/:bookingId",
                element: (
                    <ProtectedRoute roles={["service_advisor", "admin", "manager"]}>
                        <CreateJob />
                    </ProtectedRoute>
                ),
            },
            {
                path: "jobs/:id",
                element: (
                    <ProtectedRoute roles={["service_advisor", "admin", "manager", "technician"]}>
                        <JobDetail />
                    </ProtectedRoute>
                ),
            },
            {
                path: "jobs/my",
                element: (
                    <ProtectedRoute roles={["technician"]}>
                        <MyJobs />
                    </ProtectedRoute>
                ),
            },

            // Goods Requests
            {
                path: "goods",
                element: (
                    <ProtectedRoute roles={["service_advisor", "admin", "manager"]}>
                        <GoodsRequestsList mode={undefined} />
                    </ProtectedRoute>
                ),
            },
            {
                path: "goods/new/:jobId",
                element: (
                    <ProtectedRoute roles={["service_advisor", "admin", "manager"]}>
                        <CreateGoodsRequest />
                    </ProtectedRoute>
                ),
            },
            {
                path: "goods/pending",
                element: (
                    <ProtectedRoute roles={["admin", "manager"]}>
                        <GoodsRequestsList mode="pending" />
                    </ProtectedRoute>
                ),
            },

            // Inventory
            {
                path: "inventory",
                element: (
                    <ProtectedRoute roles={["admin", "manager", "service_advisor", "technician"]}>
                        <InventoryList />
                    </ProtectedRoute>
                ),
            },
            {
                path: "inventory/low",
                element: (
                    <ProtectedRoute roles={["admin", "manager", "service_advisor"]}>
                        <LowStock />
                    </ProtectedRoute>
                ),
            },
            {
                path: "inventory/new",
                element: (
                    <ProtectedRoute roles={["admin", "manager"]}>
                        <CreateItem />
                    </ProtectedRoute>
                ),
            },
            {
                path: "inventory/:id",
                element: (
                    <ProtectedRoute roles={["admin", "manager", "service_advisor", "technician"]}>
                        <ItemDetail />
                    </ProtectedRoute>
                ),
            },

            // Invoices
            {
                path: "invoices",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "manager", "service_advisor"]}>
                        <InvoicesList />
                    </ProtectedRoute>
                ),
            },
            {
                path: "invoices/new/:bookingId",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "manager", "service_advisor"]}>
                        <CreateInvoice />
                    </ProtectedRoute>
                ),
            },
            {
                path: "invoices/:id",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "manager", "service_advisor"]}>
                        <InvoiceDetail />
                    </ProtectedRoute>
                ),
            },

            // Leave
            {
                path: "leave",
                element: (
                    <ProtectedRoute>
                        <MyLeave />
                    </ProtectedRoute>
                ),
            },
            {
                path: "profile",
                element: (
                    <ProtectedRoute>
                        <MyProfile />
                    </ProtectedRoute>
                ),
            },
            {
                path: "leave/manage",
                element: (
                    <ProtectedRoute roles={["admin", "manager"]}>
                        <ManageLeave />
                    </ProtectedRoute>
                ),
            },

            // Users
            {
                path: "users",
                element: (
                    <ProtectedRoute roles={["admin", "manager"]}>
                        <UsersList />
                    </ProtectedRoute>
                ),
            },
            {
                path: "users/new",
                element: (
                    <ProtectedRoute roles={["admin", "manager"]}>
                        <CreateUser />
                    </ProtectedRoute>
                ),
            },
            {
                path: "users/:id",
                element: (
                    <ProtectedRoute roles={["admin", "manager", "service_advisor"]}>
                        <UserDetail />
                    </ProtectedRoute>
                ),
            },

            // Vehicles
            {
                path: "vehicles",
                element: (
                    <ProtectedRoute>
                        <VehiclesList />
                    </ProtectedRoute>
                ),
            },
            {
                path: "vehicles/new",
                element: (
                    <ProtectedRoute roles={["admin", "manager", "cashier"]}>
                        <CreateVehicle />
                    </ProtectedRoute>
                ),
            },
            {
                path: "vehicles/:id",
                element: (
                    <ProtectedRoute>
                        <VehicleDetail />
                    </ProtectedRoute>
                ),
            },

            // Reports (Owner, Admin, Manager)
            {
                path: "reports",
                element: (
                    <ProtectedRoute roles={["owner", "admin", "manager"]}>
                        <ReportsList />
                    </ProtectedRoute>
                ),
            },
            {
                path: "reports/salary",
                element: (
                    <ProtectedRoute roles={["owner", "admin", "manager"]}>
                        <SalaryReport />
                    </ProtectedRoute>
                ),
            },
            {
                path: "reports/stock",
                element: (
                    <ProtectedRoute roles={["owner", "admin", "manager"]}>
                        <StockReport />
                    </ProtectedRoute>
                ),
            },
            {
                path: "reports/bookings",
                element: (
                    <ProtectedRoute roles={["owner", "admin", "manager"]}>
                        <BookingReport />
                    </ProtectedRoute>
                ),
            },
            {
                path: "reports/work-allocation",
                element: (
                    <ProtectedRoute roles={["owner", "admin", "manager"]}>
                        <WorkAllocationReport />
                    </ProtectedRoute>
                ),
            },
            {
                path: "reports/employees",
                element: (
                    <ProtectedRoute roles={["owner", "admin", "manager"]}>
                        <EmployeeReport />
                    </ProtectedRoute>
                ),
            },

            // API Reports with role-based access
            {
                path: "reports/api/bookings",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "manager", "service_advisor"]}>
                        <BookingsReport />
                    </ProtectedRoute>
                ),
            },
            {
                path: "reports/api/payments",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "manager"]}>
                        <PaymentsReport />
                    </ProtectedRoute>
                ),
            },
            {
                path: "reports/api/jobs",
                element: (
                    <ProtectedRoute roles={["technician", "service_advisor", "admin", "manager"]}>
                        <JobsReport />
                    </ProtectedRoute>
                ),
            },
            {
                path: "reports/api/leaves",
                element: (
                    <ProtectedRoute roles={["admin", "manager"]}>
                        <LeavesReport />
                    </ProtectedRoute>
                ),
            },
            {
                path: "reports/api/users",
                element: (
                    <ProtectedRoute roles={["manager", "admin"]}>
                        <UsersReport />
                    </ProtectedRoute>
                ),
            },
            {
                path: "reports/api/inventory",
                element: (
                    <ProtectedRoute roles={["manager", "admin"]}>
                        <InventoryReport />
                    </ProtectedRoute>
                ),
            },
        ],
    },
];

const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
            <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
    </React.StrictMode>
);