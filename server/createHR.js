const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/User");

dotenv.config();

const createHR = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "MongoDB connected."
    );

    const existingHR =
      await User.findOne({
        email: "hr@company.com",
      });

    if (existingHR) {
      console.log(
        "HR account already exists."
      );

      await mongoose.disconnect();

      return;
    }

    const hashedPassword =
      await bcrypt.hash(
        "HR@12345",
        10
      );

    await User.create({
      employeeId: "HR001",
      name: "HR Manager",
      email: "hr@company.com",
      password: hashedPassword,
      role: "hr",
      department:
        "Human Resources",
      designation:
        "HR Manager",
      isActive: true,
    });

    console.log(
      "HR account created successfully."
    );

    console.log(
      "Email: hr@company.com"
    );

    console.log(
      "Password: HR@12345"
    );

    await mongoose.disconnect();
  } catch (error) {
    console.error(
      "Create HR Error:",
      error
    );

    process.exit(1);
  }
};

createHR();
