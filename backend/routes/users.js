import express from "express";
import {
  registerUser,
  registerCustomerForBooking,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  adminResetPassword,
  deleteUser,
  updateUserStatus,
  addLoyaltyPoints,
  getUserStats,
  getTechniciansBySpecialization,
  updateCertifications,
  getUserByNic,
  searchCustomerForBooking,
  storeCustomerNic,
  deleteCustomerNic,
  getAllCustomerNics,
  updateCustomerNic,
} from "../controllers/users.js";
import { authenticate, authorize, authorizeOwnerOrRole } from "../middleware/auth.js";

const router = express.Router();

// Public authentication routes
router.post("/register", registerUser);
router.post("/register-customer", registerCustomerForBooking);
router.get("/search", searchCustomerForBooking);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected user profile routes
router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);
router.patch("/change-password", authenticate, changePassword);

// Admin and Manager management routes
router.route("/")
  .get(authenticate, authorize("admin", "manager", "owner"), getAllUsers)
  .post(authenticate, authorize("admin", "manager", "owner"), createUser);

// Lookup by NIC for front-desk and advisors
router.get("/lookup/by-nic", authenticate, authorize("admin", "manager", "cashier", "service_advisor"), getUserByNic);

// User management by ID
router.route("/:id")
  .get(authenticate, authorize("admin", "manager", "service_advisor"), getUserById)
  .patch(authenticate, authorize("admin", "manager"), updateUser)
  .delete(authenticate, authorize("admin"), deleteUser);

// Special management routes
router.get("/stats/overview", authenticate, authorize("admin", "manager"), getUserStats);
router.patch("/:id/status", authenticate, authorize("admin", "manager"), updateUserStatus);
router.patch("/:id/reset-password", authenticate, authorize("admin", "manager"), adminResetPassword);
router.patch("/:id/loyalty-points", authenticate, authorize("admin", "manager", "service_advisor"), addLoyaltyPoints);
router.patch("/:id/certifications", authenticate, authorize("admin", "manager"), updateCertifications);

// Specialized queries
router.get("/technicians/by-specialization", authenticate, authorize("admin", "manager", "service_advisor"), getTechniciansBySpecialization);

// Customer NIC management routes (cashier, admin, owner)
router.route("/customers/nic")
  .get(authenticate, authorize("admin", "cashier", "owner"), getAllCustomerNics)
  .post(authenticate, authorize("admin", "cashier", "owner"), storeCustomerNic);

router.route("/customers/nic/:nic")
  .patch(authenticate, authorize("admin", "cashier", "owner"), updateCustomerNic)
  .delete(authenticate, authorize("admin", "cashier", "owner"), deleteCustomerNic);

export default router;