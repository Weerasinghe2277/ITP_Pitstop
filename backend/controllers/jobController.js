import Job from "../models/Job.js";
import User from "../models/User.js";
import { Booking } from "../models/Booking.js";
import { GoodsRequest } from "../models/GoodsRequest.js";
import { createCustomError } from "../errors/custom-error.js";
import asyncWrapper from "../middleware/async.js";

// Create a new job (Inspector only)
const createJob = asyncWrapper(async (req, res, next) => {
  const { bookingId } = req.params;
  const { userId, role } = req.user;
  const { requirements, assignedTechnician, assignedLabourers, ...jobFields } = req.body;

  // Check if user is inspector or manager
  if (!["service_advisor", "manager", "admin"].includes(role)) {
    return next(createCustomError("Only inspectors can create jobs", 403));
  }

  console.log("permitted to create job");

  // Verify booking exists and is in correct status
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return next(createCustomError("Booking not found", 404));
  }

  console.log("Booking is found");

  if (booking.status !== "inspecting") {
    return next(createCustomError("Booking must be in 'inspecting' status to create jobs", 400));
  }

  console.log("Booking is in inspecting state");

  // Prepare assigned labourers array
  let assignedLabourersData = [];

  // Handle both assignedTechnician (single) and assignedLabourers (array)
  if (assignedTechnician) {
    // Verify the technician exists and is active
    const technician = await User.findOne({
      _id: assignedTechnician,
      role: "technician",
      status: "active"
    });

    if (!technician) {
      return next(createCustomError("Selected technician not found or not active", 400));
    }

    assignedLabourersData.push({
      labourer: assignedTechnician,
      assignedAt: new Date(),
      hoursWorked: 0,
    });

    console.log(`Technician ${assignedTechnician} assigned to job`);
  } else if (assignedLabourers && Array.isArray(assignedLabourers) && assignedLabourers.length > 0) {
    // Verify all labourers exist and are active technicians
    const labourers = await User.find({
      _id: { $in: assignedLabourers },
      role: "technician",
      status: "active"
    });

    if (labourers.length !== assignedLabourers.length) {
      return next(createCustomError("Some labourers not found or not active technicians", 400));
    }

    assignedLabourersData = assignedLabourers.map(labourerId => ({
      labourer: labourerId,
      assignedAt: new Date(),
      hoursWorked: 0,
    }));

    console.log(`${assignedLabourers.length} labourers assigned to job`);
  }

  // Generate job ID
  const jobCount = await Job.countDocuments();
  const jobId = `JOB${String(jobCount + 1).padStart(5, '0')}`;

  // Create job with inspector as creator and assigned labourers
  const jobData = {
    ...jobFields,
    booking: bookingId,
    createdBy: userId,
    assignedLabourers: assignedLabourersData,
    jobId,
    status: jobFields.status || "pending",
    estimatedHours: jobFields.estimatedHours || 0,
    actualHours: 0,
    estimatedCost: jobFields.estimatedCost || 0,
    actualCost: 0,
    partsCost: 0,
    labourCost: 0,
    requirements: {
      skills: jobFields.requirements?.skills || [],
      tools: jobFields.requirements?.tools || [],
      materials: jobFields.requirements?.materials || []
    },
    inspectionReport: {
      preWorkInspection: {
        issues: [],
        photos: [],
        approved: false
      },
      postWorkInspection: {
        issues: [],
        photos: []
      }
    },
    workLog: []
  };

  const job = await Job.create(jobData);
  await job.populate([
    { path: "booking", select: "bookingId customer vehicle serviceType" },
    { path: "createdBy", select: "userId profile.firstName profile.lastName" },
    { path: "assignedLabourers.labourer", select: "userId profile.firstName profile.lastName employeeDetails.department employeeDetails.employeeId" },
  ]);

  console.log("Job created with assigned labourers:", job.assignedLabourers);

  // Create goods request if inventory items were requested
  let goodsRequest = null;
  // console.log(requestedItems)
  if (requirements.materials && Array.isArray(requirements.materials) && requirements.materials.length > 0) {
    try {
      // Transform requirements.material to match GoodsRequest schema
      const items = requirements.materials.map(item => ({
        item: item.itemId,
        quantity: item.requestedQuantity || 1,
        purpose: `Required for job: ${job.title}`
      }));

      requirements.materials.forEach(async (material, index) => {
        // const item = {
        // item: material.itemId,
        // quantity: material.requestedQuantity || 1,
        // purpose: `Required for job: ${job.title}`
        // }
        // const existing = items.find(item => item.item.equals(mat.itemId));
        // if (existing) {
        //   existing.quantity += mat.requestedQuantity || 1;
        // } else {
        //   items.push({
        //     item: mat.itemId,
        //     quantity: mat.requestedQuantity || 1,
        //     purpose: `Required for job: ${job.title}`
        //   });
        // }

        goodsRequest = await GoodsRequest.create({
          requestId: job._id + "_GR_" + (index + 1),
          job: job._id,
          requestedBy: userId,
          item: material.itemId,
          quantity: material.requestedQuantity || 1,
          purpose: `Required for job: ${job.title}`,
          notes: `Automatically created for job: ${job.title}`
        });

        // Populate the goods request
        await goodsRequest.populate([
          { path: "job", select: "jobId title" },
          { path: "requestedBy", select: "userId profile.firstName profile.lastName" },
          // { path: "items.item", select: "name category currentStock unitPrice" }
          { path: "item", select: "name category currentStock unitPrice" }
        ]);

        console.log("Goods request created");

      });
    } catch (error) {
      console.error("Failed to create goods request:", error);
      // Don't fail the job creation if goods request fails
    }
  }

  console.log("Success - Job created with assigned technicians");

  res.status(201).json({
    success: true,
    message: "Job created successfully",
    job,
    goodsRequest: goodsRequest || undefined,
  });
});

// Get all jobs with filtering and pagination
const getAllJobs = asyncWrapper(async (req, res) => {
  const {
    status,
    priority,
    category,
    bookingId,
    assignedTo,
    createdBy,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    search
  } = req.query;

  let query = {};

  // Build query based on filters
  if (status) query.status = { $in: status.split(",") };
  if (priority) query.priority = { $in: priority.split(",") };
  if (category) query.category = { $in: category.split(",") };
  if (bookingId) query.booking = bookingId;
  if (createdBy) query.createdBy = createdBy;
  if (assignedTo) query["assignedLabourers.labourer"] = assignedTo;

  // Add search functionality
  if (search) {
    query.$or = [
      { jobId: { $regex: search, $options: "i" } },
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Role-based filtering
  const { role, userId } = req.user;
  if (role === "technician") {
    // For technicians, we need to find their actual ObjectId
    const currentUser = await User.findOne({
      $or: [
        { _id: userId },
        { userId: userId }
      ]
    });

    if (currentUser) {
      query["assignedLabourers.labourer"] = currentUser._id;
    } else {
      // If user not found, return empty results
      query["assignedLabourers.labourer"] = null;
    }
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  const jobs = await Job.find(query)
    .populate([
      {
        path: "booking",
        select: "bookingId customer vehicle serviceType scheduledDate",
        populate: [
          { path: "customer", select: "userId profile.firstName profile.lastName" },
          { path: "vehicle", select: "registrationNumber make model" }
        ]
      },
      { path: "createdBy", select: "userId profile.firstName profile.lastName" },
      { path: "inspectedBy", select: "userId profile.firstName profile.lastName" },
      { path: "assignedLabourers.labourer", select: "userId profile.firstName profile.lastName employeeDetails.specializations employeeDetails.department employeeDetails.employeeId" },
    ])
    .limit(limit * 1)
    .skip(skip)
    .sort(sortOptions);

  const total = await Job.countDocuments(query);

  res.status(200).json({
    success: true,
    count: jobs.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page * 1,
    jobs,
  });
});

// Get job by ID
const getJobById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { role, userId } = req.user;

  console.log(`🔍 getJobById called by user: ${userId}, role: ${role}, jobId: ${id}`);

  const job = await Job.findById(id).populate([
    {
      path: "booking",
      select: "bookingId customer vehicle serviceType scheduledDate description",
      populate: [
        { path: "customer", select: "userId profile.firstName profile.lastName profile.phoneNumber" },
        { path: "vehicle", select: "registrationNumber make model year color" }
      ]
    },
    { path: "createdBy", select: "userId profile.firstName profile.lastName role" },
    { path: "inspectedBy", select: "userId profile.firstName profile.lastName" },
    {
      path: "assignedLabourers.labourer",
      select: "userId profile.firstName profile.lastName employeeDetails.specializations employeeDetails.department employeeDetails.employeeId"
    },
    { path: "workLog.labourer", select: "userId profile.firstName profile.lastName" },
  ]);

  if (!job) {
    console.log(`❌ Job not found: ${id}`);
    return next(createCustomError("Job not found", 404));
  }

  console.log(`✅ Job found: ${job.jobId}`);
  console.log(`📋 Assigned labourers:`, job.assignedLabourers.map(al => ({
    id: al.labourer._id.toString(),
    userId: al.labourer.userId,
    name: `${al.labourer.profile.firstName} ${al.labourer.profile.lastName}`
  })));

  // Role-based access control
  if (role === "technician") {
    console.log(`🔧 Checking technician access for user: ${userId}`);

    // Get the current user's ObjectId
    const currentUser = await User.findOne({
      $or: [
        { _id: userId },
        { userId: userId }
      ]
    });

    if (!currentUser) {
      console.log(`❌ Current user not found: ${userId}`);
      return next(createCustomError("User not found", 404));
    }

    console.log(`👤 Current user ObjectId: ${currentUser._id}`);

    // Check if technician is assigned to this job
    const isAssigned = job.assignedLabourers.some(assignment => {
      const labourerId = assignment.labourer._id.toString();
      const currentUserId = currentUser._id.toString();
      console.log(`🔍 Comparing: ${labourerId} === ${currentUserId}`);
      return labourerId === currentUserId;
    });

    console.log(`🎯 Is technician assigned: ${isAssigned}`);

    if (!isAssigned) {
      console.log(`❌ Access denied for technician ${userId}`);
      return next(createCustomError("Access denied. Job not assigned to you", 403));
    }

    console.log(`✅ Access granted for technician ${userId}`);
  }

  res.status(200).json({
    success: true,
    job,
  });
});

// Update job status (Labourers and Inspectors) - WITH BOOKING STATUS SYNC
const updateJobStatus = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const { userId, role } = req.user;

  console.log(`🔄 updateJobStatus called by user: ${userId}, role: ${role}, new status: ${status}`);

  const job = await Job.findById(id).populate('booking');
  if (!job) {
    return next(createCustomError("Job not found", 404));
  }

  // Role-based access control for status updates
  if (role === "technician") {
    // Get the current user's ObjectId
    const currentUser = await User.findOne({
      $or: [
        { _id: userId },
        { userId: userId }
      ]
    });

    if (!currentUser) {
      return next(createCustomError("User not found", 404));
    }

    // Technicians can only update jobs assigned to them
    const isAssigned = job.assignedLabourers.some(assignment => {
      return assignment.labourer.toString() === currentUser._id.toString();
    });

    if (!isAssigned) {
      return next(createCustomError("Access denied. Job not assigned to you", 403));
    }

    // Technicians can only change status from pending to working, or working to completed
    const allowedTransitions = {
      "pending": ["working"],
      "working": ["completed", "on_hold"],
      "on_hold": ["working"]
    };

    if (!allowedTransitions[job.status]?.includes(status)) {
      return next(createCustomError(`Invalid status transition from ${job.status} to ${status}`, 400));
    }
  }

  // Store old status for comparison
  const oldStatus = job.status;

  // Update job
  job.status = status;

  // Set timestamps based on status changes
  if (status === "working" && oldStatus !== "working") {
    job.startedAt = new Date();
  } else if (status === "completed" && oldStatus !== "completed") {
    job.completedAt = new Date();
  }

  if (notes) job.notes = notes;

  await job.save();

  // NEW: SYNC BOOKING STATUS
  if (job.booking && job.booking._id) {
    try {
      console.log(`🔄 Syncing booking status for booking: ${job.booking._id}`);

      // Define job status to booking status mapping
      const statusMapping = {
        'working': 'working',
        'completed': 'completed',
        'on_hold': 'on_hold',
        'cancelled': 'cancelled'
      };

      const bookingStatus = statusMapping[status];

      if (bookingStatus) {
        console.log(`📋 Mapping job status "${status}" to booking status "${bookingStatus}"`);

        // Update the booking status
        const updatedBooking = await Booking.findByIdAndUpdate(
          job.booking._id,
          {
            status: bookingStatus,
            $push: {
              notes: {
                note: `Status updated to ${bookingStatus} via job ${job.jobId} status change`,
                createdBy: userId,
                createdAt: new Date()
              }
            }
          },
          { new: true, runValidators: true }
        );

        if (updatedBooking) {
          console.log(`✅ Booking status synced successfully to: ${bookingStatus}`);
        } else {
          console.log(`❌ Failed to update booking status`);
        }
      } else {
        console.log(`ℹ️ No booking status mapping for job status: ${status}`);
      }
    } catch (bookingError) {
      console.error(`❌ Error syncing booking status:`, bookingError);
      // Don't fail the job update if booking sync fails
    }
  } else {
    console.log(`ℹ️ No booking associated with this job, skipping sync`);
  }

  // Populate job data for response
  await job.populate([
    { path: "booking", select: "bookingId status" },
    { path: "assignedLabourers.labourer", select: "userId profile.firstName profile.lastName" },
  ]);

  console.log(`✅ Job status updated to: ${status}`);

  res.status(200).json({
    success: true,
    message: "Job status updated successfully" + (job.booking ? " and booking status synced" : ""),
    job,
  });
});

// Assign labourers to job (Inspector only)
const assignLabourers = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { labourerIds } = req.body;
  const { role } = req.user;

  // Check if user is inspector or manager
  if (!["service_advisor", "manager", "admin"].includes(role)) {
    return next(createCustomError("Only inspectors can assign labourers", 403));
  }

  const job = await Job.findById(id);
  if (!job) {
    return next(createCustomError("Job not found", 404));
  }

  if (job.status !== "pending") {
    return next(createCustomError("Can only assign labourers to pending jobs", 400));
  }

  // Verify all labourers exist and are technicians
  const labourers = await User.find({
    _id: { $in: labourerIds },
    role: "technician",
    status: "active"
  });

  if (labourers.length !== labourerIds.length) {
    return next(createCustomError("Some labourers not found or not active technicians", 400));
  }

  // Check if labourers have required skills
  const requiredSkills = job.requirements?.skills || [];
  if (requiredSkills.length > 0) {
    const skilledLabourers = labourers.filter(labourer =>
      labourer.employeeDetails?.specializations?.some(skill =>
        requiredSkills.includes(skill)
      )
    );

    if (skilledLabourers.length === 0) {
      return next(createCustomError("None of the selected labourers have the required skills", 400));
    }
  }

  // Assign labourers
  job.assignedLabourers = labourerIds.map(labourerId => ({
    labourer: labourerId,
    assignedAt: new Date(),
    hoursWorked: 0,
  }));

  await job.save();
  await job.populate([
    { path: "booking", select: "bookingId" },
    { path: "assignedLabourers.labourer", select: "userId profile.firstName profile.lastName employeeDetails.specializations" },
  ]);

  res.status(200).json({
    success: true,
    message: "Labourers assigned successfully",
    job,
  });
});

// Add work log entry (Labourers only)
const addWorkLog = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { startTime, endTime, description } = req.body;
  const { userId, role } = req.user;

  console.log(`📝 addWorkLog called by user: ${userId}, role: ${role}`);

  if (role !== "technician") {
    return next(createCustomError("Only technicians can add work logs", 403));
  }

  const job = await Job.findById(id);
  if (!job) {
    return next(createCustomError("Job not found", 404));
  }

  // Get the current user's ObjectId
  const currentUser = await User.findOne({
    $or: [
      { _id: userId },
      { userId: userId }
    ]
  });

  if (!currentUser) {
    return next(createCustomError("User not found", 404));
  }

  // Check if user is assigned to this job
  const isAssigned = job.assignedLabourers.some(assignment => {
    return assignment.labourer.toString() === currentUser._id.toString();
  });

  if (!isAssigned) {
    return next(createCustomError("Access denied. Job not assigned to you", 403));
  }

  // Validate times
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (start >= end) {
    return next(createCustomError("End time must be after start time", 400));
  }

  // Calculate hours worked
  const hoursWorked = (end - start) / (1000 * 60 * 60);

  // Add work log entry
  const workLogEntry = {
    labourer: currentUser._id,
    startTime: start,
    endTime: end,
    hoursWorked: hoursWorked,
    description: description || "Work logged",
    loggedAt: new Date()
  };

  job.workLog.push(workLogEntry);

  // Update actual hours and assigned labourer hours
  job.actualHours = (job.actualHours || 0) + hoursWorked;

  // Update hours worked for this specific labourer
  const labourerAssignment = job.assignedLabourers.find(assignment =>
    assignment.labourer.toString() === currentUser._id.toString()
  );
  if (labourerAssignment) {
    labourerAssignment.hoursWorked = (labourerAssignment.hoursWorked || 0) + hoursWorked;
  }

  await job.save();

  await job.populate([
    { path: "workLog.labourer", select: "userId profile.firstName profile.lastName" },
    { path: "assignedLabourers.labourer", select: "userId profile.firstName profile.lastName" },
  ]);

  console.log(`✅ Work log added: ${hoursWorked.toFixed(2)} hours`);

  res.status(200).json({
    success: true,
    message: "Work log added successfully",
    job,
  });
});

// Add inspection report (Inspector only)
const addInspectionReport = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { type, condition, issues, photos, qualityRating, approved } = req.body;
  const { userId, role } = req.user;

  // Check if user is inspector or manager
  if (!["service_advisor", "manager", "admin"].includes(role)) {
    return next(createCustomError("Only inspectors can add inspection reports", 403));
  }

  const job = await Job.findById(id);
  if (!job) {
    return next(createCustomError("Job not found", 404));
  }

  if (type === "pre" || type === "preWork") {
    job.inspectionReport.preWorkInspection = {
      condition,
      issues: issues || [],
      photos: photos || [],
      inspector: userId,
      inspectedAt: new Date(),
    };
  } else if (type === "post" || type === "postWork") {
    if (job.status !== "completed") {
      return next(createCustomError("Job must be completed before post-work inspection", 400));
    }

    job.inspectionReport.postWorkInspection = {
      condition,
      issues: issues || [],
      photos: photos || [],
      qualityRating,
      inspector: userId,
      inspectedAt: new Date(),
      approved: approved || false,
    };

    if (approved) {
      job.approvedAt = new Date();
      job.inspectedBy = userId;
    }
  } else {
    return next(createCustomError("Invalid inspection type. Use 'pre' or 'post'", 400));
  }

  await job.save();
  await job.populate([
    { path: "inspectionReport.preWorkInspection.inspector", select: "userId profile.firstName profile.lastName" },
    { path: "inspectionReport.postWorkInspection.inspector", select: "userId profile.firstName profile.lastName" },
  ]);

  res.status(200).json({
    success: true,
    message: "Inspection report added successfully",
    job,
  });
});

// Get jobs by booking ID
const getJobsByBooking = asyncWrapper(async (req, res, next) => {
  const { bookingId } = req.params;
  const { role, userId } = req.user;

  let query = { booking: bookingId };

  // Role-based filtering
  if (role === "technician") {
    // Get the current user's ObjectId
    const currentUser = await User.findOne({
      $or: [
        { _id: userId },
        { userId: userId }
      ]
    });

    if (currentUser) {
      query["assignedLabourers.labourer"] = currentUser._id;
    } else {
      query["assignedLabourers.labourer"] = null;
    }
  }

  const jobs = await Job.find(query).populate([
    { path: "createdBy", select: "userId profile.firstName profile.lastName" },
    { path: "assignedLabourers.labourer", select: "userId profile.firstName profile.lastName employeeDetails.department employeeDetails.employeeId" },
  ]);

  res.status(200).json({
    success: true,
    count: jobs.length,
    jobs,
  });
});

// Get jobs assigned to current user (Technicians)
const getMyJobs = asyncWrapper(async (req, res) => {
  const { userId, role } = req.user;
  const { status, page = 1, limit = 10 } = req.query;

  // Log the request for debugging
  console.log(`🔍 getMyJobs called by user: ${userId}, role: ${role}`);

  // Ensure user is a technician
  if (role !== "technician") {
    console.log(`❌ User ${userId} with role ${role} attempted to access technician jobs`);
    return res.status(403).json({
      success: false,
      message: "Only technicians can access their jobs"
    });
  }

  // Get the current user's ObjectId
  const currentUser = await User.findOne({
    $or: [
      { _id: userId },
      { userId: userId }
    ]
  });

  if (!currentUser) {
    console.log(`❌ Current user not found: ${userId}`);
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  console.log(`👤 Current user found: ${currentUser._id} (${currentUser.userId})`);
  console.log(`👤 User profile: ${currentUser.profile.firstName} ${currentUser.profile.lastName}`);

  // Build query for jobs assigned to this technician using their ObjectId
  let query = { "assignedLabourers.labourer": currentUser._id };

  if (status) {
    const statusArray = status.split(",").map(s => s.trim());
    query.status = { $in: statusArray };
    console.log(`🔍 Filtering by status: ${statusArray.join(", ")}`);
  }

  console.log(`🔍 Query: ${JSON.stringify(query)}`);

  const skip = (page - 1) * limit;
  const limitNum = parseInt(limit);
  const pageNum = parseInt(page);

  try {
    // Get jobs assigned to this technician
    const jobs = await Job.find(query)
      .populate([
        {
          path: "booking",
          select: "bookingId customer vehicle serviceType scheduledDate status",
          populate: [
            { path: "customer", select: "userId profile.firstName profile.lastName profile.phoneNumber" },
            { path: "vehicle", select: "registrationNumber make model year" }
          ]
        },
        {
          path: "createdBy",
          select: "userId profile.firstName profile.lastName role"
        },
        {
          path: "assignedLabourers.labourer",
          select: "userId profile.firstName profile.lastName role employeeDetails.department employeeDetails.employeeId"
        }
      ])
      .limit(limitNum)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Job.countDocuments(query);

    console.log(`✅ Found ${jobs.length} jobs for technician ${currentUser.userId} (${total} total)`);

    // Log some details about the jobs found
    if (jobs.length > 0) {
      console.log(`📋 Job details:`);
      jobs.forEach(job => {
        const assignedLabourers = job.assignedLabourers.map(al =>
          `${al.labourer.profile.firstName} ${al.labourer.profile.lastName} (${al.labourer.userId})`
        ).join(", ");
        console.log(`  - Job ${job.jobId || job._id}: ${job.title} (${job.status}) - Assigned: ${assignedLabourers}`);
      });
    } else {
      console.log(`📋 No jobs found for technician ${currentUser.userId}`);

      // Debug: Let's check if there are any jobs with this user in assignedLabourers
      const allJobs = await Job.find({}).populate('assignedLabourers.labourer', 'userId profile.firstName profile.lastName');
      console.log(`🔍 Debug: Total jobs in system: ${allJobs.length}`);
      allJobs.forEach(job => {
        const assignedIds = job.assignedLabourers.map(al => al.labourer._id.toString());
        console.log(`  - Job ${job.jobId}: assigned to ${assignedIds.join(", ")}`);
      });
    }

    res.status(200).json({
      success: true,
      message: `Found ${jobs.length} jobs assigned to you`,
      count: jobs.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      jobs,
    });

  } catch (error) {
    console.error(`❌ Error in getMyJobs for user ${userId}:`, error);
    res.status(500).json({
      success: false,
      message: "Error fetching your jobs",
      error: error.message
    });
  }
});

// Get jobs created by service advisor (Service Advisor only)
const getMyCreatedJobs = asyncWrapper(async (req, res) => {
  const { userId, role } = req.user;
  const { status, page = 1, limit = 10, priority, category } = req.query;

  // Log the request for debugging
  console.log(`🔍 getMyCreatedJobs called by user: ${userId}, role: ${role}`);

  // Ensure user is a service advisor, manager, or admin
  if (!["service_advisor", "manager", "admin"].includes(role)) {
    console.log(`❌ User ${userId} with role ${role} attempted to access created jobs`);
    return res.status(403).json({
      success: false,
      message: "Only service advisors, managers, or admins can access created jobs"
    });
  }

  // Build query for jobs created by this user
  let query = { createdBy: userId };

  if (status) {
    const statusArray = status.split(",").map(s => s.trim());
    query.status = { $in: statusArray };
    console.log(`🔍 Filtering by status: ${statusArray.join(", ")}`);
  }

  if (priority) {
    query.priority = priority;
    console.log(`🔍 Filtering by priority: ${priority}`);
  }

  if (category) {
    query.category = category;
    console.log(`🔍 Filtering by category: ${category}`);
  }

  console.log(`🔍 Query: ${JSON.stringify(query)}`);

  const skip = (page - 1) * limit;
  const limitNum = parseInt(limit);
  const pageNum = parseInt(page);

  try {
    // Get jobs created by this service advisor
    const jobs = await Job.find(query)
      .populate([
        {
          path: "booking",
          select: "bookingId customer vehicle serviceType scheduledDate status estimatedCost",
          populate: [
            { path: "customer", select: "userId profile.firstName profile.lastName profile.phoneNumber" },
            { path: "vehicle", select: "registrationNumber make model year color" }
          ]
        },
        {
          path: "assignedLabourers.labourer",
          select: "userId profile.firstName profile.lastName role employeeDetails.specializations employeeDetails.department employeeDetails.employeeId"
        },
        {
          path: "inspectedBy",
          select: "userId profile.firstName profile.lastName role"
        }
      ])
      .limit(limitNum)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Job.countDocuments(query);

    console.log(`✅ Found ${jobs.length} jobs created by ${role} ${userId} (${total} total)`);

    // Log some details about the jobs found
    if (jobs.length > 0) {
      console.log(`📋 Created Jobs details:`);
      jobs.forEach(job => {
        const assignedCount = job.assignedLabourers?.length || 0;
        console.log(`  - Job ${job.jobId || job._id}: ${job.title} (${job.status}) - ${assignedCount} labourers assigned`);
      });
    }

    // Calculate some statistics
    const stats = {
      total,
      byStatus: {},
      byPriority: {},
      byCategory: {},
      totalAssignedLabourers: 0
    };

    // Get statistics for all jobs by this service advisor
    const allJobs = await Job.find({ createdBy: userId });
    allJobs.forEach(job => {
      // Status stats
      stats.byStatus[job.status] = (stats.byStatus[job.status] || 0) + 1;

      // Priority stats
      stats.byPriority[job.priority] = (stats.byPriority[job.priority] || 0) + 1;

      // Category stats
      stats.byCategory[job.category] = (stats.byCategory[job.category] || 0) + 1;

      // Count assigned labourers
      stats.totalAssignedLabourers += job.assignedLabourers?.length || 0;
    });

    res.status(200).json({
      success: true,
      message: `Found ${jobs.length} jobs created by you`,
      count: jobs.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      stats,
      jobs,
    });

  } catch (error) {
    console.error(`❌ Error in getMyCreatedJobs for user ${userId}:`, error);
    res.status(500).json({
      success: false,
      message: "Error fetching your created jobs",
      error: error.message
    });
  }
});

// Update job details (Inspector only)
const updateJob = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.user;

  // Check if user is inspector or manager
  if (!["service_advisor", "manager", "admin"].includes(role)) {
    return next(createCustomError("Only inspectors can update job details", 403));
  }

  // Prevent updating sensitive fields
  const restrictedFields = ["jobId", "booking", "createdBy", "workLog", "inspectionReport"];
  restrictedFields.forEach(field => delete req.body[field]);

  const job = await Job.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "booking", select: "bookingId" },
    { path: "assignedLabourers.labourer", select: "userId profile.firstName profile.lastName" },
  ]);

  if (!job) {
    return next(createCustomError("Job not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Job updated successfully",
    job,
  });
});

// Delete job (Admin/Manager only)
const deleteJob = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.user;

  if (!["admin", "manager"].includes(role)) {
    return next(createCustomError("Only admin or manager can delete jobs", 403));
  }

  const job = await Job.findById(id);
  if (!job) {
    return next(createCustomError("Job not found", 404));
  }

  // Prevent deletion of jobs that are in progress or completed
  if (["working", "completed"].includes(job.status)) {
    return next(createCustomError("Cannot delete jobs that are in progress or completed", 400));
  }

  await Job.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
    job: {
      id: job._id,
      jobId: job.jobId,
      title: job.title,
    },
  });
});

// Get job statistics (Manager/Admin only)
const getJobStats = asyncWrapper(async (req, res) => {
  const { role } = req.user;

  if (!["admin", "manager", "service_advisor"].includes(role)) {
    return next(createCustomError("Access denied", 403));
  }

  const statusStats = await Job.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const categoryStats = await Job.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        avgHours: { $avg: "$actualHours" },
        avgCost: { $avg: "$totalCost" },
      },
    },
  ]);

  const priorityStats = await Job.aggregate([
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  const completionStats = await Job.aggregate([
    {
      $match: { status: "completed" }
    },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        avgActualHours: { $avg: "$actualHours" },
        avgEstimatedHours: { $avg: "$estimatedHours" },
        totalRevenue: { $sum: "$totalCost" },
      },
    },
  ]);

  const overdueJobs = await Job.countDocuments({
    status: { $nin: ["completed", "cancelled"] },
    $expr: {
      $gt: [
        new Date(),
        {
          $add: [
            "$createdAt",
            { $multiply: ["$estimatedHours", 60 * 60 * 1000] }
          ]
        }
      ]
    }
  });

  const totalJobs = await Job.countDocuments();

  res.status(200).json({
    success: true,
    stats: {
      total: totalJobs,
      overdue: overdueJobs,
      statusBreakdown: statusStats,
      categoryBreakdown: categoryStats,
      priorityBreakdown: priorityStats,
      completion: completionStats[0] || {},
    },
  });
});

export {
  createJob,
  getAllJobs,
  getJobById,
  updateJobStatus,
  assignLabourers,
  addWorkLog,
  addInspectionReport,
  getJobsByBooking,
  getMyJobs,
  getMyCreatedJobs,
  updateJob,
  deleteJob,
  getJobStats,
};