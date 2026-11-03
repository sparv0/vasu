
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* =====================================================
   GENERATE UNIQUE EMPLOYEE ID
   ===================================================== */

const generateEmployeeId = async () => {
  // Find the employee with the highest existing employee number
  const lastEmployee = await User.findOne({
    employeeId: { $regex: /^EMP\d+$/ },
  }).sort({ employeeId: -1 });

  // If no employee exists yet
  if (!lastEmployee) {
    return "EMP0001";
  }

  // Extract the number from EMP0008 -> 8
  const lastNumber = parseInt(
    lastEmployee.employeeId.replace("EMP", ""),
    10
  );

  // Generate the next ID
  return `EMP${String(lastNumber + 1).padStart(4, "0")}`;
};

/* =====================================================
   GENERATE JWT TOKEN
   ===================================================== */

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

/* =====================================================
   REGISTER EMPLOYEE
   ===================================================== */

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      department,
      designation,
      phone,
    } = req.body;

    /* ---------------------------------------------
       VALIDATE REQUIRED FIELDS
    --------------------------------------------- */

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    /* ---------------------------------------------
       CHECK IF EMAIL ALREADY EXISTS
    --------------------------------------------- */

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists.",
      });
    }

    /* ---------------------------------------------
       HASH PASSWORD
    --------------------------------------------- */

    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------------------------------------------
       GENERATE UNIQUE EMPLOYEE ID
    --------------------------------------------- */

    const employeeId = await generateEmployeeId();

    /* ---------------------------------------------
       CREATE EMPLOYEE
    --------------------------------------------- */

    const user = await User.create({
      employeeId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      department: department || "General",
      designation: designation || "Employee",
      phone: phone || "",
      role: "employee",
    });

    /* ---------------------------------------------
       GENERATE JWT TOKEN
    --------------------------------------------- */

    const token = generateToken(user);

    /* ---------------------------------------------
       SEND SUCCESS RESPONSE
    --------------------------------------------- */

    res.status(201).json({
      message: "Employee account created successfully.",

      token,

      user: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);

    /* ---------------------------------------------
       HANDLE DUPLICATE KEY ERROR
    --------------------------------------------- */

    if (error.code === 11000) {
      if (error.keyPattern?.employeeId) {
        return res.status(400).json({
          message:
            "Employee ID already exists. Please try registering again.",
        });
      }

      if (error.keyPattern?.email) {
        return res.status(400).json({
          message: "An account with this email already exists.",
        });
      }

      return res.status(400).json({
        message: "Duplicate value already exists.",
      });
    }

    /* ---------------------------------------------
       OTHER SERVER ERRORS
    --------------------------------------------- */

    res.status(500).json({
      message: "Server error during registration.",
    });
  }
};

/* =====================================================
   LOGIN
   ===================================================== */

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    /* ---------------------------------------------
       VALIDATE REQUIRED FIELDS
    --------------------------------------------- */

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    /* ---------------------------------------------
       FIND USER
    --------------------------------------------- */

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    /* ---------------------------------------------
       CHECK PASSWORD
    --------------------------------------------- */

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    /* ---------------------------------------------
       CHECK ACTIVE STATUS
    --------------------------------------------- */

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated.",
      });
    }

    /* ---------------------------------------------
       GENERATE JWT TOKEN
    --------------------------------------------- */

    const token = generateToken(user);

    /* ---------------------------------------------
       SEND LOGIN RESPONSE
    --------------------------------------------- */

    res.json({
      message: "Login successful.",

      token,

      user: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      message: "Server error during login.",
    });
  }
};

/* =====================================================
   EXPORT CONTROLLERS
   ===================================================== */

module.exports = {
  register,
  login,
};
