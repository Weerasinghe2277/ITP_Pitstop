import User from "../models/User.js";
import asyncWrapper from "../middleware/async.js";
import { createCustomError } from "../errors/custom-error.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
// Import email service when available
// import { sendEmail } from "../utils/email.js";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Public customer registration for booking forms
const registerCustomerForBooking = asyncWrapper(async (req, res, next) => {
  const { email, firstName, lastName, phone, nic, address } = req.body;

  console.log('📝 Customer registration request:', { email, firstName, lastName, phone, nic, address });

  // Validate required fields
  if (!email || !firstName || !lastName || !phone || !nic || !address) {
    console.log('❌ Missing required fields:', {
      email: !email ? 'MISSING' : 'OK',
      firstName: !firstName ? 'MISSING' : 'OK',
      lastName: !lastName ? 'MISSING' : 'OK',
      phone: !phone ? 'MISSING' : 'OK',
      nic: !nic ? 'MISSING' : 'OK',
      address: !address ? 'MISSING' : 'OK'
    });
    return next(createCustomError("All fields are required: email, firstName, lastName, phone, nic, address", 400));
  }

  // Function to create customer with retry logic for duplicate userId errors
  const createCustomerWithRetry = async (customerData, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Creating customer attempt ${attempt}...`);
        const customer = await User.create(customerData);
        console.log('✅ Customer created successfully:', customer._id, 'UserId:', customer.userId);
        return customer;
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);

        // Check if it's a duplicate key error for userId
        if (error.code === 11000 && error.message.includes('userId')) {
          console.log(`🔄 Duplicate userId detected, retrying... (${attempt}/${maxRetries})`);
          if (attempt < maxRetries) {
            // Add a small random delay to help avoid race conditions
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            continue;
          } else {
            throw new Error('Failed to generate unique customer ID after multiple attempts');
          }
        }

        // Check if it's a duplicate key error for email
        if (error.code === 11000 && error.message.includes('email')) {
          throw new Error('A user with this email already exists');
        }

        // Check if it's a duplicate key error for NIC
        if (error.code === 11000 && error.message.includes('nic')) {
          throw new Error('A user with this NIC already exists');
        }

        // For any other error, throw immediately
        throw error;
      }
    }
  };

  try {
    // Check if customer already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        { "profile.nic": nic }
      ]
    });

    if (existingUser) {
      // Customer exists, return existing customer data for booking
      console.log('✅ Found existing customer:', existingUser.email, 'UserId:', existingUser.userId);
      const customerResponse = existingUser.toObject();
      delete customerResponse.password;
      delete customerResponse.emailVerificationToken;

      return res.status(200).json({
        success: true,
        message: "Existing customer found for booking",
        user: customerResponse,
        isExisting: true
      });
    }

    console.log('🔄 Creating new customer...');

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');

    // Create customer data
    const customerData = {
      email,
      password: tempPassword,
      role: "customer",
      profile: {
        firstName,
        lastName,
        phoneNumber: phone,
        nic,
        address: {
          street: address,
          city: "Colombo", // Default values
          province: "Western",
          postalCode: "10100"
        },
        dateOfBirth: new Date(1990, 0, 1) // Default date
      },
      customerDetails: {
        loyaltyPoints: 0,
        membershipTier: "bronze",
        emergencyContact: {
          name: "Emergency Contact",
          phoneNumber: phone,
          relationship: "other"
        }
      },
      emailVerificationToken: generateRandomToken(),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    const customer = await createCustomerWithRetry(customerData);

    // Generate token
    const token = generateToken(customer._id);

    // Remove sensitive data from response
    const customerResponse = customer.toObject();
    delete customerResponse.password;
    delete customerResponse.emailVerificationToken;

    res.status(201).json({
      success: true,
      message: "Customer registered successfully for booking",
      user: customerResponse,
      token,
      tempPassword // Include temp password in response so booking system can inform customer
    });

  } catch (error) {
    console.error('❌ Error creating customer:', error);

    // Return appropriate error messages
    if (error.message === 'A user with this email already exists') {
      return next(createCustomError("A customer with this email already exists", 400));
    } else if (error.message === 'A user with this NIC already exists') {
      return next(createCustomError("A customer with this NIC already exists", 400));
    } else if (error.message === 'Failed to generate unique customer ID after multiple attempts') {
      return next(createCustomError("Unable to register customer at this time. Please try again.", 500));
    } else {
      return next(createCustomError(error.message || "Failed to register customer", 500));
    }
  }
});

// Search customer by NIC or email for booking forms
const searchCustomerForBooking = asyncWrapper(async (req, res, next) => {
  const { q } = req.query;

  if (!q) {
    return next(createCustomError("Search query is required", 400));
  }

  // Search by email or NIC
  const customer = await User.findOne({
    $or: [
      { email: q },
      { "profile.nic": q }
    ],
    role: "customer"
  }).select("-password -emailVerificationToken");

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Customer not found"
    });
  }

  res.status(200).json({
    success: true,
    message: "Customer found",
    user: customer
  });
});

// Generate random token for password reset/email verification
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Register user
const registerUser = asyncWrapper(async (req, res, next) => {
  const { email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email },
      { "profile.nic": req.body.profile?.nic }
    ]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      console.log(existingUser);
      return next(createCustomError("User with this email already exists", 400));
    }
    if (existingUser.profile?.nic === req.body.profile?.nic) {
      return next(createCustomError("User with this NIC already exists", 400));
    }
  }

  // Validate role-specific required fields
  if (role === "customer" && !req.body.customerDetails) {
    return next(createCustomError("Customer details are required for customer role", 400));
  }

  if (["technician", "service_advisor", "manager", "cashier"].includes(role) && !req.body.employeeDetails) {
    return next(createCustomError("Employee details are required for staff roles", 400));
  }

  // Create user (password will be hashed by middleware)
  const userData = {
    ...req.body,
    emailVerificationToken: generateRandomToken(),
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  const user = await User.create(userData);

  // Generate token
  const token = generateToken(user._id);

  // Remove sensitive data from response
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.emailVerificationToken;
  delete userResponse.passwordResetToken;

  // TODO: Send verification email
  // await sendEmail({
  //   to: user.email,
  //   subject: "Verify your email - PitStop",
  //   text: `Please verify your email by clicking: ${process.env.FRONTEND_URL}/verify-email?token=${user.emailVerificationToken}`
  // });

  res.status(201).json({
    success: true,
    message: "User registered successfully. Please check your email for verification.",
    user: userResponse,
    token,
  });
});

// Login user
const loginUser = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createCustomError("Please provide email and password", 400));
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(createCustomError("Invalid email or password", 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(createCustomError("Account is temporarily locked due to too many failed attempts", 423));
  }

  // Check if account is active
  if (user.status !== "active") {
    return next(createCustomError("Account is not active. Please contact support.", 403));
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    // Increment login attempts
    user.loginAttempts += 1;

    // Lock account after 5 failed attempts for 30 minutes
    if (user.loginAttempts >= 5) {
      user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
    }

    await user.save();
    return next(createCustomError("Invalid email or password", 401));
  }

  // Reset login attempts and lock on successful login
  if (user.loginAttempts > 0) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Remove sensitive data from response
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.emailVerificationToken;
  delete userResponse.passwordResetToken;

  res.status(200).json({
    success: true,
    message: "Login successful",
    user: userResponse,
    token,
  });
});

// Verify email
const verifyEmail = asyncWrapper(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(createCustomError("Verification token is required", 400));
  }

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(createCustomError("Invalid or expired verification token", 400));
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  });
});

// Request password reset
const forgotPassword = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(createCustomError("Email is required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(createCustomError("No user found with this email", 404));
  }

  // Generate reset token
  const resetToken = generateRandomToken();
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // TODO: Send reset email
  // await sendEmail({
  //   to: user.email,
  //   subject: "Password Reset - PitStop",
  //   text: `Reset your password by clicking: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
  // });

  res.status(200).json({
    success: true,
    message: "Password reset link sent to your email",
  });
});

// Reset password
const resetPassword = asyncWrapper(async (req, res, next) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return next(createCustomError("Token and new password are required", 400));
  }

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(createCustomError("Invalid or expired reset token", 400));
  }

  // Update password (will be hashed by middleware)
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

// Get current user profile
const getProfile = asyncWrapper(async (req, res, next) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    return next(createCustomError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Update user profile
const updateProfile = asyncWrapper(async (req, res, next) => {
  const { userId } = req.user;

  // Prevent updating sensitive fields
  const restrictedFields = ["userId", "role", "password", "loginAttempts", "lockUntil", "emailVerificationToken", "passwordResetToken"];
  restrictedFields.forEach(field => delete req.body[field]);

  // Handle nested profile updates properly
  const updateData = {};

  // If profile fields are provided, merge with existing profile
  if (req.body.profile) {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return next(createCustomError(`No user with id: ${userId}`, 404));
    }

    // Merge existing profile with new profile data
    updateData.profile = { ...currentUser.profile.toObject(), ...req.body.profile };
  }

  // Handle other nested objects
  if (req.body.customerDetails) {
    const currentUser = await User.findById(userId);
    updateData.customerDetails = { ...currentUser.customerDetails?.toObject(), ...req.body.customerDetails };
  }

  if (req.body.employeeDetails) {
    const currentUser = await User.findById(userId);
    updateData.employeeDetails = { ...currentUser.employeeDetails?.toObject(), ...req.body.employeeDetails };
  }

  if (req.body.preferences) {
    const currentUser = await User.findById(userId);
    updateData.preferences = { ...currentUser.preferences?.toObject(), ...req.body.preferences };
  }

  // Handle other top-level fields
  Object.keys(req.body).forEach(key => {
    if (!['profile', 'customerDetails', 'employeeDetails', 'preferences'].includes(key)) {
      updateData[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(createCustomError(`No user with id: ${userId}`, 404));
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

// Change password
const changePassword = asyncWrapper(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const { userId } = req.user;

  if (!currentPassword || !newPassword) {
    return next(createCustomError("Please provide current and new password", 400));
  }

  // Get user with password
  const user = await User.findById(userId).select("+password");

  if (!user) {
    return next(createCustomError("User not found", 404));
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return next(createCustomError("Current password is incorrect", 400));
  }

  // Update password (will be hashed by middleware)
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

// Get all users (admin/manager only)
const getAllUsers = asyncWrapper(async (req, res) => {
  const { role, status, department, membershipTier, page = 1, limit = 10, search } = req.query;
  let query = {};

  // Build query based on filters
  if (role) query.role = role;
  if (status) query.status = status;
  if (department) query["employeeDetails.department"] = department;
  if (membershipTier) query["customerDetails.membershipTier"] = membershipTier;

  // Add search functionality
  if (search) {
    query.$or = [
      { "profile.firstName": { $regex: search, $options: "i" } },
      { "profile.lastName": { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { userId: { $regex: search, $options: "i" } },
      { "profile.nic": { $regex: search, $options: "i" } },
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const users = await User.find(query)
    .select("-password -emailVerificationToken -passwordResetToken")
    .limit(limit * 1)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page * 1,
    users,
  });
});

// Get user by NIC (admin/manager/cashier/service_advisor)
const getUserByNic = asyncWrapper(async (req, res, next) => {
  const { nic } = req.query;
  if (!nic) {
    return next(createCustomError("NIC is required", 400));
  }

  const user = await User.findOne({ "profile.nic": nic });
  if (!user) {
    return next(createCustomError("User with this NIC not found", 404));
  }

  res.status(200).json({ success: true, user });
});

// Get user by ID (admin/manager only)
const getUserById = asyncWrapper(async (req, res, next) => {
  const { id: userId } = req.params;

  const user = await User.findById(userId)
    .select("-password -emailVerificationToken -passwordResetToken");

  if (!user) {
    return next(createCustomError(`No user with id: ${userId}`, 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Create user (admin/manager only)
const createUser = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email },
      { "profile.nic": req.body.profile?.nic }
    ]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return next(createCustomError("User with this email already exists", 400));
    }
    if (existingUser.profile?.nic === req.body.profile?.nic) {
      return next(createCustomError("User with this NIC already exists", 400));
    }
  }

  const user = await User.create(req.body);

  // Remove sensitive data from response
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.emailVerificationToken;
  delete userResponse.passwordResetToken;

  res.status(201).json({
    success: true,
    message: "User created successfully",
    user: userResponse,
  });
});

// Update user (admin/manager only)
const updateUser = asyncWrapper(async (req, res, next) => {
  const { id: userId } = req.params;

  // Prevent updating sensitive fields through this route
  const restrictedFields = ["password", "userId", "loginAttempts", "lockUntil", "emailVerificationToken", "passwordResetToken"];
  restrictedFields.forEach(field => delete req.body[field]);

  // Build update object using dot notation for nested fields
  const updateData = {};

  // Handle profile nested updates
  if (req.body.profile) {
    Object.keys(req.body.profile).forEach(key => {
      if (key === 'address' && typeof req.body.profile[key] === 'object') {
        Object.keys(req.body.profile[key]).forEach(addrKey => {
          updateData[`profile.address.${addrKey}`] = req.body.profile[key][addrKey];
        });
      } else {
        updateData[`profile.${key}`] = req.body.profile[key];
      }
    });
  }

  // Handle customerDetails nested updates
  if (req.body.customerDetails) {
    Object.keys(req.body.customerDetails).forEach(key => {
      if (key === 'emergencyContact' && typeof req.body.customerDetails[key] === 'object') {
        Object.keys(req.body.customerDetails[key]).forEach(contactKey => {
          updateData[`customerDetails.emergencyContact.${contactKey}`] = req.body.customerDetails[key][contactKey];
        });
      } else {
        updateData[`customerDetails.${key}`] = req.body.customerDetails[key];
      }
    });
  }

  // Handle employeeDetails nested updates
  if (req.body.employeeDetails) {
    Object.keys(req.body.employeeDetails).forEach(key => {
      updateData[`employeeDetails.${key}`] = req.body.employeeDetails[key];
    });
  }

  // Handle preferences nested updates
  if (req.body.preferences) {
    Object.keys(req.body.preferences).forEach(key => {
      if (key === 'notifications' && typeof req.body.preferences[key] === 'object') {
        Object.keys(req.body.preferences[key]).forEach(notifKey => {
          updateData[`preferences.notifications.${notifKey}`] = req.body.preferences[key][notifKey];
        });
      } else {
        updateData[`preferences.${key}`] = req.body.preferences[key];
      }
    });
  }

  // Handle top-level fields
  const topLevelFields = ['email', 'role', 'status', 'emailVerified', 'phoneVerified', 'twoFactorEnabled'];
  topLevelFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Use $set operator to update only specified fields
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    {
      new: true,
      runValidators: false, // Disable full document validation to allow partial updates
    }
  ).select("-password -emailVerificationToken -passwordResetToken");

  if (!user) {
    return next(createCustomError(`No user with id: ${userId}`, 404));
  }

  // Optional: Run custom validation on the updated document
  try {
    await user.validate();
  } catch (validationError) {
    return next(createCustomError(`Validation failed: ${validationError.message}`, 400));
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    user,
  });
});

// Admin reset user password
const adminResetPassword = asyncWrapper(async (req, res, next) => {
  const { id: targetUserId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return next(createCustomError("Please provide new password", 400));
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    return next(createCustomError(`No user with id: ${targetUserId}`, 404));
  }

  // Update password (will be hashed by middleware)
  user.password = newPassword;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

// Delete user (admin only)
const deleteUser = asyncWrapper(async (req, res, next) => {
  const { id: userId } = req.params;

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    return next(createCustomError(`No user with id: ${userId}`, 404));
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName
    },
  });
});

// Update user status (admin/manager only)
const updateUserStatus = asyncWrapper(async (req, res, next) => {
  const { id: userId } = req.params;
  const { status } = req.body;

  if (!status || !["active", "inactive", "suspended", "terminated"].includes(status)) {
    return next(createCustomError("Please provide a valid status", 400));
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true, runValidators: true }
  ).select("-password -emailVerificationToken -passwordResetToken");

  if (!user) {
    return next(createCustomError(`No user with id: ${userId}`, 404));
  }

  res.status(200).json({
    success: true,
    message: "User status updated successfully",
    user,
  });
});

// Add loyalty points (for customers)
const addLoyaltyPoints = asyncWrapper(async (req, res, next) => {
  const { id: userId } = req.params;
  const { points, reason } = req.body;

  if (!points || points <= 0) {
    return next(createCustomError("Please provide valid points amount", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(createCustomError(`No user with id: ${userId}`, 404));
  }

  if (user.role !== "customer") {
    return next(createCustomError("Loyalty points can only be added to customers", 400));
  }

  user.customerDetails.loyaltyPoints += points;
  await user.save(); // This will trigger membership tier update

  res.status(200).json({
    success: true,
    message: "Loyalty points added successfully",
    user: {
      userId: user.userId,
      loyaltyPoints: user.customerDetails.loyaltyPoints,
      membershipTier: user.customerDetails.membershipTier,
    },
  });
});

// Get user statistics (admin/manager only)
const getUserStats = asyncWrapper(async (req, res) => {
  const roleStats = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  const statusStats = await User.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const membershipStats = await User.aggregate([
    {
      $match: { role: "customer" }
    },
    {
      $group: {
        _id: "$customerDetails.membershipTier",
        count: { $sum: 1 },
      },
    },
  ]);

  const departmentStats = await User.aggregate([
    {
      $match: {
        role: { $in: ["technician", "service_advisor", "manager"] }
      }
    },
    {
      $group: {
        _id: "$employeeDetails.department",
        count: { $sum: 1 },
      },
    },
  ]);

  const recentRegistrations = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);

  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ status: "active" });
  const verifiedUsers = await User.countDocuments({ emailVerified: true });

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      activeUsers,
      verifiedUsers,
      roleStats,
      statusStats,
      membershipStats,
      departmentStats,
      recentRegistrations,
    },
  });
});

// Get technicians by specialization
const getTechniciansBySpecialization = asyncWrapper(async (req, res) => {
  const { specialization } = req.query;

  let query = {
    role: "technician",
    status: "active"
  };

  if (specialization) {
    query["employeeDetails.specializations"] = specialization;
  }

  const technicians = await User.find(query)
    .select("userId profile.firstName profile.lastName employeeDetails.specializations employeeDetails.department employeeDetails.certifications")
    .sort({ "employeeDetails.joinDate": 1 });

  res.status(200).json({
    success: true,
    count: technicians.length,
    technicians,
  });
});

// Update employee certifications
const updateCertifications = asyncWrapper(async (req, res, next) => {
  const { id: userId } = req.params;
  const { certifications } = req.body;

  if (!certifications || !Array.isArray(certifications)) {
    return next(createCustomError("Please provide valid certifications array", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(createCustomError(`No user with id: ${userId}`, 404));
  }

  if (!["technician", "service_advisor", "manager"].includes(user.role)) {
    return next(createCustomError("Certifications can only be updated for employees", 400));
  }

  user.employeeDetails.certifications = certifications;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Certifications updated successfully",
    certifications: user.employeeDetails.certifications,
  });
});

// Store customer NIC (cashier, admin, owner)
const storeCustomerNic = asyncWrapper(async (req, res, next) => {
  const { nic, customerData } = req.body;

  if (!nic) {
    return next(createCustomError("NIC is required", 400));
  }

  // Check if NIC already exists
  const existingUser = await User.findOne({ "profile.nic": nic });
  if (existingUser) {
    return next(createCustomError("Customer with this NIC already exists", 400));
  }

  // Validate required customer data
  if (!customerData || !customerData.profile) {
    return next(createCustomError("Customer profile data is required", 400));
  }

  // Create customer with NIC
  const userData = {
    ...customerData,
    role: "customer",
    profile: {
      ...customerData.profile,
      nic: nic
    },
    customerDetails: {
      loyaltyPoints: 0,
      membershipTier: "bronze",
      ...customerData.customerDetails
    }
  };

  const customer = await User.create(userData);

  // Remove sensitive data from response
  const customerResponse = customer.toObject();
  delete customerResponse.password;
  delete customerResponse.emailVerificationToken;
  delete customerResponse.passwordResetToken;

  res.status(201).json({
    success: true,
    message: "Customer NIC stored successfully",
    customer: customerResponse
  });
});

// Delete customer NIC (cashier, admin, owner)
const deleteCustomerNic = asyncWrapper(async (req, res, next) => {
  const { nic } = req.params;

  if (!nic) {
    return next(createCustomError("NIC is required", 400));
  }

  // Find customer by NIC
  const customer = await User.findOne({
    "profile.nic": nic,
    role: "customer"
  });

  if (!customer) {
    return next(createCustomError("Customer with this NIC not found", 404));
  }

  // Check if customer has any active bookings or jobs
  // You might want to add additional checks here based on your business logic
  // For now, we'll allow deletion but you can add restrictions as needed

  await User.findByIdAndDelete(customer._id);

  res.status(200).json({
    success: true,
    message: "Customer NIC deleted successfully",
    deletedCustomer: {
      id: customer._id,
      nic: customer.profile.nic,
      name: customer.fullName
    }
  });
});

// Get all customer NICs (cashier, admin, owner)
const getAllCustomerNics = asyncWrapper(async (req, res, next) => {
  const { page = 1, limit = 50, search = "" } = req.query;

  // Build search query
  const searchQuery = {
    role: "customer"
  };

  if (search) {
    searchQuery.$or = [
      { "profile.nic": { $regex: search, $options: "i" } },
      { "profile.firstName": { $regex: search, $options: "i" } },
      { "profile.lastName": { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get customers with NIC information
  const customers = await User.find(searchQuery)
    .select("profile.nic profile.firstName profile.lastName email customerDetails.membershipTier customerDetails.loyaltyPoints createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const totalCustomers = await User.countDocuments(searchQuery);

  res.status(200).json({
    success: true,
    data: customers,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCustomers / parseInt(limit)),
      totalCustomers,
      hasNext: skip + customers.length < totalCustomers,
      hasPrev: parseInt(page) > 1
    }
  });
});

// Update customer NIC information (cashier, admin, owner)
const updateCustomerNic = asyncWrapper(async (req, res, next) => {
  const { nic } = req.params;
  const updateData = req.body;

  if (!nic) {
    return next(createCustomError("NIC is required", 400));
  }

  // Find customer by NIC
  const customer = await User.findOne({
    "profile.nic": nic,
    role: "customer"
  });

  if (!customer) {
    return next(createCustomError("Customer with this NIC not found", 404));
  }

  // If updating NIC itself, check for duplicates
  if (updateData.profile && updateData.profile.nic && updateData.profile.nic !== nic) {
    const existingNic = await User.findOne({
      "profile.nic": updateData.profile.nic,
      _id: { $ne: customer._id }
    });

    if (existingNic) {
      return next(createCustomError("Another customer with this NIC already exists", 400));
    }
  }

  // Update customer data
  if (updateData.profile) {
    Object.assign(customer.profile, updateData.profile);
  }

  if (updateData.customerDetails) {
    Object.assign(customer.customerDetails, updateData.customerDetails);
  }

  if (updateData.email) {
    // Check if email is already in use
    const existingEmail = await User.findOne({
      email: updateData.email,
      _id: { $ne: customer._id }
    });

    if (existingEmail) {
      return next(createCustomError("Email is already in use", 400));
    }
    customer.email = updateData.email;
  }

  await customer.save();

  // Remove sensitive data from response
  const customerResponse = customer.toObject();
  delete customerResponse.password;
  delete customerResponse.emailVerificationToken;
  delete customerResponse.passwordResetToken;

  res.status(200).json({
    success: true,
    message: "Customer NIC information updated successfully",
    customer: customerResponse
  });
});

export {
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
};