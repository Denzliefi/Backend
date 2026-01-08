const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper: sign JWT
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { fullName, email, username, studentNumber, password } = req.body;

    // Basic validation
    if (!fullName || !email || !username || !studentNumber || !password) {
      res.status(400);
      throw new Error("Missing required fields");
    }
    if (String(password).length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }

    // Check duplicates
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      res.status(409);
      throw new Error("Email already exists");
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      res.status(409);
      throw new Error("Username already exists");
    }

    const existingStudent = await User.findOne({ studentNumber });
    if (existingStudent) {
      res.status(409);
      throw new Error("Student number already exists");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      username,
      studentNumber,
      passwordHash,
      authProvider: "local",
    });

    const token = signToken(user._id);

    res.status(201).json({
      message: "Registered successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        studentNumber: user.studentNumber,
        authProvider: user.authProvider,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      res.status(400);
      throw new Error("Missing credentials");
    }

    const query =
      emailOrUsername.includes("@")
        ? { email: emailOrUsername.toLowerCase() }
        : { username: emailOrUsername };

    const user = await User.findOne(query);

    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    // If user is google-only, they won't have passwordHash
    const ok = await user.matchPassword(password);
    if (!ok) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const token = signToken(user._id);

    res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        studentNumber: user.studentNumber,
        authProvider: user.authProvider,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
