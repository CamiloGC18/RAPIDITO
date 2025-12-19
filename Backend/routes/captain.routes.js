const express = require("express");
const router = express.Router();
const captainController = require("../controllers/captain.controller");
const { body } = require("express-validator");
const { authCaptain } = require("../middlewares/auth.middleware");

// DEPRECATED: Email/password authentication removed in favor of Google OAuth
router.post("/register", (req, res) => {
  res.status(410).json({
    message: "Registro con email/password descontinuado. Use autenticación con Google.",
    deprecated: true,
    oauth_url: `${process.env.SERVER_URL}/auth/google/captain`
  });
});

router.post("/verify-email", (req, res) => {
  res.status(410).json({
    message: "Verificación de email descontinuada. OAuth con Google no requiere verificación.",
    deprecated: true,
  });
});

router.post("/login", (req, res) => {
  res.status(410).json({
    message: "Login con email/password descontinuado. Use autenticación con Google.",
    deprecated: true,
    oauth_url: `${process.env.SERVER_URL}/auth/google/captain`
  });
});

router.post("/reset-password", (req, res) => {
  res.status(410).json({
    message: "Restablecimiento de contraseña descontinuado. Use autenticación con Google.",
    deprecated: true,
  });
});

// ACTIVE ROUTES - Keep these for OAuth captains
router.post("/update", 
    body("captainData.phone").isLength({ min: 10, max: 10 }).withMessage("Phone Number should be of 10 characters only"),
    body("captainData.fullname.firstname").isLength({min:2}).withMessage("First name must be at least 2 characters long"),
    authCaptain,
    captainController.updateCaptainProfile
);

router.get("/profile", authCaptain, captainController.captainProfile);

router.get("/logout", authCaptain, captainController.logoutCaptain);

module.exports = router;
