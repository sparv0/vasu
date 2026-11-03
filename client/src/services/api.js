
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

// =====================================================
// GENERIC API REQUEST
// =====================================================

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      "Unable to connect to the server. Make sure your backend is running."
    );
  }

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed with status ${response.status}.`
    );
  }

  return data;
};

// =====================================================
// AUTHENTICATION
// =====================================================

export const loginUser = (email, password) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const registerUser = (
  name,
  email,
  password,
  department
) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      department,
    }),
  });

// =====================================================
// HR DASHBOARD
// =====================================================

export const getHRDashboard = () =>
  apiRequest("/hr/dashboard");

// =====================================================
// EMPLOYEES
// =====================================================

export const getEmployees = () =>
  apiRequest("/hr/employees");

export const getEmployeeDetails = (employeeId) =>
  apiRequest(`/hr/employees/${employeeId}`);

export const updateEmployeeScore = (
  employeeId,
  hrScore
) =>
  apiRequest(`/hr/employees/${employeeId}/score`, {
    method: "PUT",
    body: JSON.stringify({ hrScore }),
  });

// =====================================================
// HR ATTENDANCE
// =====================================================

// Get all attendance records for HR
export const getAllAttendance = () =>
  apiRequest("/attendance/all");

// Verify an attendance record
export const verifyAttendance = (attendanceId) =>
  apiRequest(`/attendance/${attendanceId}/verify`, {
    method: "PATCH",
  });

// Reject an attendance record with a reason
export const rejectAttendance = (
  attendanceId,
  rejectionReason
) => {
  if (!rejectionReason || !rejectionReason.trim()) {
    return Promise.reject(
      new Error("Please provide a reason for rejecting attendance.")
    );
  }

  return apiRequest(`/attendance/${attendanceId}/reject`, {
    method: "PATCH",
    body: JSON.stringify({
      rejectionReason: rejectionReason.trim(),
    }),
  });
};

// Mark attendance as Half Day and verify it
export const markHalfDay = (attendanceId) =>
  apiRequest(`/attendance/${attendanceId}/half-day`, {
    method: "PATCH",
  });

// Manually create an attendance record
export const createAttendance = (attendanceData) =>
  apiRequest("/attendance/create", {
    method: "POST",
    body: JSON.stringify(attendanceData),
  });

// =====================================================
// EMPLOYEE DASHBOARD
// =====================================================

export const getEmployeeDashboard = () =>
  apiRequest("/employee/dashboard");

// =====================================================
// EMPLOYEE ATTENDANCE
// =====================================================

// Employee check-in
export const checkInEmployee = () =>
  apiRequest("/attendance/check-in", {
    method: "POST",
  });

// Employee check-out
export const checkOutEmployee = () =>
  apiRequest("/attendance/check-out", {
    method: "POST",
  });

// Get the logged-in employee's attendance history
export const getMyAttendance = () =>
  apiRequest("/attendance/my");

// =====================================================
// LEAVES
// =====================================================

// Employee views their own leave requests
export const getEmployeeLeaves = () =>
  apiRequest("/leaves/my");

// Employee applies for leave
export const applyLeave = (leaveData) =>
  apiRequest("/leaves/apply", {
    method: "POST",
    body: JSON.stringify(leaveData),
  });

// HR views all leave requests
export const getAllLeaves = () =>
  apiRequest("/leaves/all");

// HR approves or rejects a leave request
export const updateLeaveStatus = (
  leaveId,
  status,
  hrComment = ""
) =>
  apiRequest(`/leaves/${leaveId}/status`, {
    method: "PUT",
    body: JSON.stringify({
      status,
      hrComment,
    }),
  });

// =====================================================
// PERFORMANCE
// =====================================================

export const getPerformance = () =>
  apiRequest("/performance");

export const getEmployeePerformance = (employeeId) =>
  apiRequest(`/performance/employee/${employeeId}`);

export const updateEmployeePerformance = (
  employeeId,
  performanceData
) =>
  apiRequest(`/performance/employee/${employeeId}`, {
    method: "PUT",
    body: JSON.stringify(performanceData),
  });
