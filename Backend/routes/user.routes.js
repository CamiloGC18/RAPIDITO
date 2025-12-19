const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { body } = require("express-validator");
const { authUser } = require("../middlewares/auth.middleware");

// DEPRECATED: Email/password authentication removed in favor of Google OAuth
router.post("/register", (req, res) => {
  res.status(410).json({
    message: "Registro con email/password descontinuado. Use autenticación con Google.",
    deprecated: true,
    oauth_url: `${process.env.SERVER_URL}/auth/google/user`
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
    oauth_url: `${process.env.SERVER_URL}/auth/google/user`
  });
});

router.post("/reset-password", (req, res) => {
  res.status(410).json({
    message: "Restablecimiento de contraseña descontinuado. Use autenticación con Google.",
    deprecated: true,
  });
});

// ACTIVE ROUTES - Keep these for OAuth users
router.post("/update", authUser,
    body("fullname.firstname").isLength({min:2}).withMessage("First name must be at least 2 characters long"),
    body("fullname.lastname").isLength({min:2}).withMessage("Last name must be at least 2 characters long"),
    body("phone").isLength({min:10, max:10}).withMessage("Phone number should be of 10 digits only"),
    userController.updateUserProfile
);

router.get("/profile", authUser, userController.userProfile);

router.get("/logout", authUser, userController.logoutUser);

module.exports = router;
