import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/globals.css";
import { AuthProvider } from "./store/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import NoAccess from "./pages/NoAccess";
import NotFound from "./pages/NotFound";

// Auth
import Login from "./features/auth/Login";

// Bookings
import BookingsRouter from "./features/bookings/BookingsRouter";
import CreateBooking from "./features/bookings/CreateBooking";
import BookingDetail from "./features/bookings/BookingDetail";

// Jobs
import JobsList from "./features/jobs/JobsList";
import CreateJob from "./features/jobs/CreateJob";
import JobDetail from "./features/jobs/JobDetail";
import MyJobs from "./features/jobs/MyJobs";
import MyCreatedJobs from "./features/jobs/MyCreatedJobs";

// Goods Requests
import GoodsRequestsList from "./features/goods/GoodsRequestsList";
import CreateGoodsRequest from "./features/goods/CreateGoodsRequest";
import GoodsRouter from "./features/goods/GoodsRouter";

// Inventory
import InventoryList from "./features/inventory/InventoryList";
import CreateItem from "./features/inventory/CreateItem";
import EditItem from "./features/inventory/EditItem";
import ItemDetail from "./features/inventory/ItemDetail";
import LowStock from "./features/inventory/LowStock";

// Invoices
import InvoicesList from "./features/invoices/InvoicesList";
import CreateInvoice from "./features/invoices/CreateInvoice";
import InvoiceDetail from "./features/invoices/InvoiceDetail";

// Leave
import MyLeave from "./features/leave/MyLeave";
import ManageLeave from "./features/leave/ManageLeave";

// Users
import UsersList from "./features/users/UsersList";
import CreateUser from "./features/users/CreateUser";
import UserDetail from "./features/users/UserDetail";
import MyProfile from "./features/users/MyProfile";

// Vehicles
import VehiclesList from "./features/vehicles/VehiclesList";
import CreateVehicle from "./features/vehicles/CreateVehicle";
import VehicleDetail from "./features/vehicles/VehicleDetail";

// Reports
import ReportsList from "./features/reports/ReportsList";
import SalaryReport from "./features/reports/SalaryReport";
import StockReport from "./features/reports/StockReport";
import BookingReport from "./features/reports/BookingReport";
import WorkAllocationReport from "./features/reports/WorkAllocationReport";
import EmployeeReport from "./features/reports/EmployeeReport";

const router = createBrowserRouter([
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
            { index: true, element: <Dashboard /> },
            {
                path: "dashboard",
                element: (
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                ),
            },

            // Bookings - Smart router that shows different views based on user role
            {
                path: "bookings",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "manager", "service_advisor", "owner"]}>
                        <BookingsRouter />
                    </ProtectedRoute>
                ),
            },
            {
                path: "bookings/new",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "owner"]}>
                        <CreateBooking />
                    </ProtectedRoute>
                ),
            },
            {
                path: "bookings/:id",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "manager", "service_advisor", "owner"]}>
                        <BookingDetail />
                    </ProtectedRoute>
                ),
            },

            // Jobs (Inspector, Labourers, Admin, Owner)
            {
                path: "jobs",
                element: (
                    <ProtectedRoute roles={["service_advisor", "technician", "admin", "owner"]}>
                        <JobsList />
                    </ProtectedRoute>
                ),
            },
            {
                path: "jobs/new/:bookingId",
                element: (
                    <ProtectedRoute roles={["service_advisor", "admin", "owner"]}>
                        <CreateJob />
                    </ProtectedRoute>
                ),
            },
            {
                path: "jobs/:id",
                element: (
                    <ProtectedRoute roles={["service_advisor", "technician", "admin", "owner"]}>
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
            {
                path: "jobs/my-created",
                element: (
                    <ProtectedRoute roles={["service_advisor", "manager", "admin"]}>
                        <MyCreatedJobs />
                    </ProtectedRoute>
                ),
            },

            // Goods Requests (Inspector, Inventory Manager, Admin, Owner)
            {
                path: "goods",
                element: (
                    <ProtectedRoute roles={["service_advisor", "manager", "admin", "owner"]}>
                        <GoodsRouter />
                    </ProtectedRoute>
                ),
            },
            {
                path: "goods/new/:jobId",
                element: (
                    <ProtectedRoute roles={["service_advisor", "admin", "owner"]}>
                        <CreateGoodsRequest />
                    </ProtectedRoute>
                ),
            },
            {
                path: "goods/pending",
                element: (
                    <ProtectedRoute roles={["manager", "admin", "owner"]}>
                        <GoodsRequestsList mode="pending" />
                    </ProtectedRoute>
                ),
            },

            // Inventory (Inventory Manager, Admin, Owner)
            {
                path: "inventory",
                element: (
                    <ProtectedRoute roles={["manager", "admin", "owner"]}>
                        <InventoryList />
                    </ProtectedRoute>
                ),
            },
            {
                path: "inventory/low",
                element: (
                    <ProtectedRoute roles={["manager", "admin", "owner"]}>
                        <LowStock />
                    </ProtectedRoute>
                ),
            },
            {
                path: "inventory/new",
                element: (
                    <ProtectedRoute roles={["manager", "admin", "owner"]}>
                        <CreateItem />
                    </ProtectedRoute>
                ),
            },
            {
                path: "inventory/:id/edit",
                element: (
                    <ProtectedRoute roles={["manager", "admin", "owner"]}>
                        <EditItem />
                    </ProtectedRoute>
                ),
            },
            {
                path: "inventory/:id",
                element: (
                    <ProtectedRoute roles={["manager", "admin", "owner"]}>
                        <ItemDetail />
                    </ProtectedRoute>
                ),
            },

            // Invoices (Cashier, Admin, Owner)
            {
                path: "invoices",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "owner"]}>
                        <InvoicesList />
                    </ProtectedRoute>
                ),
            },
            {
                path: "invoices/new/:bookingId",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "owner"]}>
                        <CreateInvoice />
                    </ProtectedRoute>
                ),
            },
            {
                path: "invoices/:id",
                element: (
                    <ProtectedRoute roles={["cashier", "admin", "owner"]}>
                        <InvoiceDetail />
                    </ProtectedRoute>
                ),
            },

            // Leave (All roles for MyLeave, Admin and Owner for ManageLeave)
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
                    <ProtectedRoute roles={["admin", "owner"]}>
                        <ManageLeave />
                    </ProtectedRoute>
                ),
            },

            // Users (Admin, Manager, Owner)
            {
                path: "users",
                element: (
                    <ProtectedRoute roles={["admin", "manager", "owner"]}>
                        <UsersList />
                    </ProtectedRoute>
                ),
            },
            {
                path: "users/new",
                element: (
                    <ProtectedRoute roles={["admin", "manager", "owner"]}>
                        <CreateUser />
                    </ProtectedRoute>
                ),
            },
            {
                path: "users/:id",
                element: (
                    <ProtectedRoute roles={["admin", "manager", "service_advisor", "owner"]}>
                        <UserDetail />
                    </ProtectedRoute>
                ),
            },

            // Vehicles (All roles for viewing, Cashier, Admin, Owner for creating)
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
                    <ProtectedRoute roles={["cashier", "admin", "owner"]}>
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
        ],
    },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
            <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
    </React.StrictMode>
);