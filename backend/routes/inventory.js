import express from "express";
import {
  createInventoryItem,
  getAllInventoryItems,
  getInventoryItemById,
  getInventoryItemByItemId,
  updateInventoryItem,
  updateStock,
  deleteInventoryItem,
  getLowStockItems,
  getInventoryStats,
  getItemsByCategory,
  bulkUpdateStock,
  searchInventoryItems
} from "../controllers/InventoryItemcon.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Search route (should be before other parameterized routes)
router.get(
    "/search",
    authenticate,
    authorize("admin", "manager", "service_advisor", "technician", "cashier"),
    searchInventoryItems
);

// Statistics and reports routes
router.get(
    "/stats",
    authenticate,
    authorize("admin", "manager"),
    getInventoryStats
);

router.get(
    "/low-stock",
    authenticate,
    authorize("admin", "manager", "service_advisor"),
    getLowStockItems
);

// Category-based routes
router.get(
    "/category/:category",
    authenticate,
    authorize("admin", "manager", "service_advisor", "technician", "cashier"),
    getItemsByCategory
);

// Main CRUD routes - UPDATED: Added cashier role for GET
router.route("/")
    .get(
        authenticate,
        authorize("admin", "manager", "service_advisor", "technician", "cashier"),
        getAllInventoryItems
    )
    .post(
        authenticate,
        authorize("admin", "manager"),
        createInventoryItem
    );

// Bulk operations
router.patch(
    "/bulk-update-stock",
    authenticate,
    authorize("admin", "manager"),
    bulkUpdateStock
);

// Item by itemId (custom ID like ITM00001)
router.route("/item/:itemId")
    .get(
        authenticate,
        authorize("admin", "manager", "service_advisor", "technician", "cashier"),
        getInventoryItemByItemId
    );

// Item management by database ID
router.route("/:id")
    .get(
        authenticate,
        authorize("admin", "manager", "service_advisor", "technician", "cashier"),
        getInventoryItemById
    )
    .patch(
        authenticate,
        authorize("admin", "manager"),
        updateInventoryItem
    )
    .delete(
        authenticate,
        authorize("admin"),
        deleteInventoryItem
    );

// Stock management operations
router.patch(
    "/:id/stock",
    authenticate,
    authorize("admin", "manager"),
    updateStock
);

export default router;