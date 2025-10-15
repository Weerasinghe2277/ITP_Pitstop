import { InventoryItem } from "../models/InventoryItem.js";
import asyncWrapper from "../middleware/async.js";
import { createCustomError } from "../errors/custom-error.js";

// Create new inventory item
const createInventoryItem = asyncWrapper(async (req, res, next) => {
  const { name, category, unitPrice, unit } = req.body;

  // Validate required fields
  if (!name || !category || unitPrice === undefined || !unit) {
    return next(createCustomError("Name, category, unit price, and unit are required", 400));
  }

  // Validate category
  if (!["parts", "tools", "fluids", "consumables"].includes(category)) {
    return next(createCustomError("Invalid category. Must be: parts, tools, fluids, or consumables", 400));
  }

  // Validate unit
  if (!["piece", "liter", "kg", "meter", "set"].includes(unit)) {
    return next(createCustomError("Invalid unit. Must be: piece, liter, kg, meter, or set", 400));
  }

  // Validate unit price
  if (unitPrice < 0) {
    return next(createCustomError("Unit price cannot be negative", 400));
  }

  // Check if item with same name already exists (case-insensitive)
  const existingItem = await InventoryItem.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
  });

  if (existingItem) {
    return next(createCustomError("Item with this name already exists", 400));
  }

  // If partNumber provided, check for duplicate
  if (req.body.partNumber) {
    const duplicatePartNumber = await InventoryItem.findOne({
      partNumber: { $regex: new RegExp(`^${req.body.partNumber.trim()}$`, 'i') }
    });
    if (duplicatePartNumber) {
      return next(createCustomError("Item with this part number already exists", 400));
    }
  }

  const inventoryItem = await InventoryItem.create(req.body);

  res.status(201).json({
    success: true,
    message: "Inventory item created successfully",
    item: inventoryItem,
  });
});

// Get all inventory items with filtering and pagination
const getAllInventoryItems = asyncWrapper(async (req, res) => {
  const {
    category,
    status,
    brand,
    lowStock,
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    jobId
  } = req.query;

  let query = {};

  // Build query based on filters
  if (category) query.category = category;
  if (status) query.status = status;
  if (brand) query.brand = new RegExp(brand, 'i');
  if (jobId) query.assignedJobId = jobId;

  // Filter for low stock items
  if (lowStock === 'true') {
    query.$expr = { $lte: ['$currentStock', '$minimumStock'] };
  }

  // Add search functionality
  if (search && search.trim().length > 0) {
    query.$or = [
      { name: new RegExp(search.trim(), 'i') },
      { description: new RegExp(search.trim(), 'i') },
      { partNumber: new RegExp(search.trim(), 'i') },
      { itemId: new RegExp(search.trim(), 'i') },
      { brand: new RegExp(search.trim(), 'i') },
      { 'supplier.name': new RegExp(search.trim(), 'i') },
      { assignedJobId: new RegExp(search.trim(), 'i') }
    ];
  }

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Build sort object
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const items = await InventoryItem.find(query)
      .limit(limitNum)
      .skip(skip)
      .sort(sortOptions);

  const total = await InventoryItem.countDocuments(query);

  res.status(200).json({
    success: true,
    count: items.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    items,
  });
});

// Get inventory item by ID
const getInventoryItemById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return next(createCustomError("Invalid inventory item ID format", 400));
  }

  const item = await InventoryItem.findById(id);

  if (!item) {
    return next(createCustomError(`No inventory item found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    item,
  });
});

// Get inventory item by itemId
const getInventoryItemByItemId = asyncWrapper(async (req, res, next) => {
  const { itemId } = req.params;

  if (!itemId || itemId.trim().length === 0) {
    return next(createCustomError("Item ID is required", 400));
  }

  const item = await InventoryItem.findOne({ itemId: itemId.toUpperCase().trim() });

  if (!item) {
    return next(createCustomError(`No inventory item found with itemId: ${itemId}`, 404));
  }

  res.status(200).json({
    success: true,
    item,
  });
});

// Update inventory item
const updateInventoryItem = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return next(createCustomError("Invalid inventory item ID format", 400));
  }

  // Prevent updating auto-generated fields
  const restrictedFields = ["itemId", "_id", "createdAt"];
  restrictedFields.forEach(field => delete req.body[field]);

  // Validate category if provided
  if (req.body.category && !["parts", "tools", "fluids", "consumables"].includes(req.body.category)) {
    return next(createCustomError("Invalid category. Must be: parts, tools, fluids, or consumables", 400));
  }

  // Validate unit if provided
  if (req.body.unit && !["piece", "liter", "kg", "meter", "set"].includes(req.body.unit)) {
    return next(createCustomError("Invalid unit. Must be: piece, liter, kg, meter, or set", 400));
  }

  // Validate status if provided
  if (req.body.status && !["active", "inactive", "discontinued"].includes(req.body.status)) {
    return next(createCustomError("Invalid status. Must be: active, inactive, or discontinued", 400));
  }

  // Validate numeric fields
  if (req.body.unitPrice !== undefined && req.body.unitPrice < 0) {
    return next(createCustomError("Unit price cannot be negative", 400));
  }

  if (req.body.currentStock !== undefined && req.body.currentStock < 0) {
    return next(createCustomError("Current stock cannot be negative", 400));
  }

  if (req.body.minimumStock !== undefined && req.body.minimumStock < 0) {
    return next(createCustomError("Minimum stock cannot be negative", 400));
  }

  const item = await InventoryItem.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
  );

  if (!item) {
    return next(createCustomError(`No inventory item found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    message: "Inventory item updated successfully",
    item,
  });
});

// Update stock levels (for inventory manager when receiving/releasing items)
const updateStock = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { quantity, operation, reason } = req.body;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return next(createCustomError("Invalid inventory item ID format", 400));
  }

  if (!quantity || !operation) {
    return next(createCustomError("Quantity and operation are required", 400));
  }

  if (!["add", "subtract"].includes(operation)) {
    return next(createCustomError("Operation must be 'add' or 'subtract'", 400));
  }

  const quantityNum = parseFloat(quantity);
  if (isNaN(quantityNum) || quantityNum <= 0) {
    return next(createCustomError("Quantity must be a positive number", 400));
  }

  const item = await InventoryItem.findById(id);

  if (!item) {
    return next(createCustomError(`No inventory item found with id: ${id}`, 404));
  }

  if (operation === "add") {
    item.currentStock += quantityNum;
  } else {
    if (item.currentStock < quantityNum) {
      return next(createCustomError(`Insufficient stock. Available: ${item.currentStock}, Requested: ${quantityNum}`, 400));
    }
    item.currentStock -= quantityNum;
  }

  await item.save();

  res.status(200).json({
    success: true,
    message: `Stock ${operation === "add" ? "added" : "removed"} successfully`,
    item: {
      itemId: item.itemId,
      name: item.name,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      isLowStock: item.currentStock <= item.minimumStock
    },
    operation: {
      type: operation,
      quantity: quantityNum,
      reason: reason || "Manual stock adjustment",
      performedAt: new Date()
    }
  });
});

// Delete inventory item
const deleteInventoryItem = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return next(createCustomError("Invalid inventory item ID format", 400));
  }

  const item = await InventoryItem.findByIdAndDelete(id);

  if (!item) {
    return next(createCustomError(`No inventory item found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    message: "Inventory item deleted successfully",
    item: {
      id: item._id,
      itemId: item.itemId,
      name: item.name
    },
  });
});

// Get low stock items
const getLowStockItems = asyncWrapper(async (req, res) => {
  const { category, limit = 50 } = req.query;

  let query = {
    $expr: { $lte: ['$currentStock', '$minimumStock'] },
    status: { $ne: 'discontinued' }
  };

  if (category) {
    if (!["parts", "tools", "fluids", "consumables"].includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }
    query.category = category;
  }

  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

  const lowStockItems = await InventoryItem.find(query)
      .limit(limitNum)
      .sort({ currentStock: 1, minimumStock: -1 });

  res.status(200).json({
    success: true,
    count: lowStockItems.length,
    items: lowStockItems,
    alert: lowStockItems.length > 0 ? "Items below minimum stock level found" : "All items are above minimum stock level"
  });
});

// Get inventory statistics
const getInventoryStats = asyncWrapper(async (req, res) => {
  // Category-wise stats
  const categoryStats = await InventoryItem.aggregate([
    { $match: { status: { $ne: 'discontinued' } } },
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$currentStock', '$unitPrice'] } },
        averageStock: { $avg: '$currentStock' },
        totalStock: { $sum: '$currentStock' }
      }
    },
    { $sort: { totalItems: -1 } }
  ]);

  // Status-wise stats
  const statusStats = await InventoryItem.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Low stock count
  const lowStockCount = await InventoryItem.countDocuments({
    $expr: { $lte: ['$currentStock', '$minimumStock'] },
    status: { $ne: 'discontinued' }
  });

  // Total inventory value
  const totalValue = await InventoryItem.aggregate([
    { $match: { status: { $ne: 'discontinued' } } },
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$currentStock', '$unitPrice'] } },
        totalItems: { $sum: 1 }
      }
    }
  ]);

  // Most expensive items
  const expensiveItems = await InventoryItem.find({ status: 'active' })
      .sort({ unitPrice: -1 })
      .limit(5)
      .select('itemId name unitPrice currentStock category');

  res.status(200).json({
    success: true,
    stats: {
      categoryBreakdown: categoryStats,
      statusBreakdown: statusStats,
      lowStockAlert: {
        count: lowStockCount,
        needsAttention: lowStockCount > 0
      },
      totalInventoryValue: totalValue[0]?.totalValue || 0,
      totalActiveItems: totalValue[0]?.totalItems || 0,
      topExpensiveItems: expensiveItems
    }
  });
});

// Get items by category
const getItemsByCategory = asyncWrapper(async (req, res, next) => {
  const { category } = req.params;
  const { status = 'active', limit = 50, sortBy = 'name', sortOrder = 'asc' } = req.query;

  if (!["parts", "tools", "fluids", "consumables"].includes(category)) {
    return next(createCustomError("Invalid category. Must be: parts, tools, fluids, or consumables", 400));
  }

  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const items = await InventoryItem.find({
    category,
    status
  })
      .limit(limitNum)
      .sort(sortOptions);

  res.status(200).json({
    success: true,
    category,
    count: items.length,
    items
  });
});

// Bulk update stock (for multiple items at once)
const bulkUpdateStock = asyncWrapper(async (req, res, next) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(createCustomError("Items array is required and must not be empty", 400));
  }

  if (items.length > 50) {
    return next(createCustomError("Maximum 50 items can be updated at once", 400));
  }

  const results = [];
  const errors = [];

  for (const stockUpdate of items) {
    try {
      const { itemId, quantity, operation, reason } = stockUpdate;

      if (!itemId || !quantity || !operation) {
        errors.push({ itemId: itemId || 'unknown', error: "ItemId, quantity, and operation are required" });
        continue;
      }

      if (!["add", "subtract"].includes(operation)) {
        errors.push({ itemId, error: "Operation must be 'add' or 'subtract'" });
        continue;
      }

      const quantityNum = parseFloat(quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        errors.push({ itemId, error: "Quantity must be a positive number" });
        continue;
      }

      const item = await InventoryItem.findOne({ itemId: itemId.toUpperCase().trim() });

      if (!item) {
        errors.push({ itemId, error: "Item not found" });
        continue;
      }

      if (operation === "subtract" && item.currentStock < quantityNum) {
        errors.push({ itemId, error: `Insufficient stock. Available: ${item.currentStock}` });
        continue;
      }

      if (operation === "add") {
        item.currentStock += quantityNum;
      } else {
        item.currentStock -= quantityNum;
      }

      await item.save();

      results.push({
        itemId: item.itemId,
        name: item.name,
        operation,
        quantity: quantityNum,
        previousStock: operation === "add" ? item.currentStock - quantityNum : item.currentStock + quantityNum,
        newStock: item.currentStock,
        isLowStock: item.currentStock <= item.minimumStock,
        reason: reason || "Bulk stock update"
      });

    } catch (error) {
      errors.push({ itemId: stockUpdate.itemId || 'unknown', error: error.message });
    }
  }

  res.status(200).json({
    success: errors.length === 0,
    message: errors.length === 0 ? "Bulk stock update completed successfully" : "Bulk stock update completed with errors",
    processed: results.length,
    failed: errors.length,
    results,
    errors
  });
});

// Search inventory items
const searchInventoryItems = asyncWrapper(async (req, res, next) => {
  const { q, category, limit = 20 } = req.query;

  if (!q || q.trim().length < 2) {
    return next(createCustomError("Search query must be at least 2 characters long", 400));
  }

  const searchTerm = q.trim();
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));

  let query = {
    $or: [
      { name: new RegExp(searchTerm, 'i') },
      { description: new RegExp(searchTerm, 'i') },
      { partNumber: new RegExp(searchTerm, 'i') },
      { itemId: new RegExp(searchTerm, 'i') },
      { brand: new RegExp(searchTerm, 'i') },
      { 'supplier.name': new RegExp(searchTerm, 'i') }
    ],
    status: { $ne: 'discontinued' }
  };

  if (category) {
    if (!["parts", "tools", "fluids", "consumables"].includes(category)) {
      return next(createCustomError("Invalid category", 400));
    }
    query.category = category;
  }

  const items = await InventoryItem.find(query)
      .limit(limitNum)
      .sort({ name: 1 })
      .select('itemId name description category unitPrice currentStock minimumStock unit status');

  res.status(200).json({
    success: true,
    query: searchTerm,
    count: items.length,
    items
  });
});

export {
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
};