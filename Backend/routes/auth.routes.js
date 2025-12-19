const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ==================== USER ROUTES ====================

// Initiate Google OAuth flow for users
router.get(
  "/google/user",
  passport.authenticate("google-user", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Handle Google OAuth callback for users
router.get(
  "/google/user/callback",
  passport.authenticate("google-user", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed`,
  }),
  (req, res) => {
    try {
      const user = req.user;
      const token = user.generateAuthToken();

      // Redirect to frontend with token
      res.redirect(`${FRONTEND_URL}/login?token=${token}&userType=user`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

// ==================== CAPTAIN ROUTES ====================

// Initiate Google OAuth flow for captains
router.get(
  "/google/captain",
  passport.authenticate("google-captain", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Handle Google OAuth callback for captains
router.get(
  "/google/captain/callback",
  passport.authenticate("google-captain", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/captain/login?error=oauth_failed`,
  }),
  (req, res) => {
    try {
      const captain = req.user;
      const token = captain.generateAuthToken();
      const subscriptionStatus = captain.subscriptionStatus;

      // Redirect to frontend with token and subscription status
      res.redirect(
        `${FRONTEND_URL}/captain/login?token=${token}&userType=captain&subscriptionStatus=${subscriptionStatus}`
      );
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect(`${FRONTEND_URL}/captain/login?error=oauth_failed`);
    }
  }
);

// Store vehicle data in session before OAuth (Captain Signup)
router.post(
  "/captain/vehicle-data",
  [
    body("color")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Color must be at least 3 characters long"),
    body("number")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Plate number must be at least 3 characters long"),
    body("capacity")
      .isInt({ min: 1 })
      .withMessage("Capacity must be at least 1"),
    body("type")
      .isIn(["car", "bike", "auto"])
      .withMessage("Vehicle type must be car, bike, or auto"),
    body("phone")
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone number must be exactly 10 digits"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { color, number, capacity, type, phone } = req.body;

      // Store vehicle data in session
      req.session.vehicleData = {
        color,
        number,
        capacity: parseInt(capacity),
        type,
        phone,
      };

      res.status(200).json({
        success: true,
        message: "Vehicle data stored. Proceed with Google authentication.",
      });
    } catch (error) {
      console.error("Error storing vehicle data:", error);
      res.status(500).json({
        success: false,
        message: "Error storing vehicle data",
      });
    }
  }
);

// ==================== UTILITY ROUTES ====================

// Verify JWT token validity
router.get("/verify", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : req.headers.token || req.cookies.token;

    if (!token) {
      return res.status(401).json({ valid: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json({
      valid: true,
      userType: decoded.userType,
      subscriptionStatus: decoded.subscriptionStatus || null,
      userId: decoded.id,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ valid: false, message: "Token expired" });
    }
    res.status(401).json({ valid: false, message: "Invalid token" });
  }
});

// Handle logout
router.post("/logout", (req, res) => {
  try {
    // Clear session if it exists
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout",
    });
  }
});

module.exports = router;
