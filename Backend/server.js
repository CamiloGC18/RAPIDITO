require("dotenv").config();
const socket = require("./socket");
const express = require("express");
const { createServer } = require("http");
const app = express();
const server = createServer(app);

socket.initializeSocket(server);

const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("./config/passport");

const userRoutes = require("./routes/user.routes");
const captainRoutes = require("./routes/captain.routes");
const mapsRoutes = require("./routes/maps.routes");
const rideRoutes = require("./routes/ride.routes");
const mailRoutes = require("./routes/mail.routes");
const authRoutes = require("./routes/auth.routes");
const keepServerRunning = require("./services/active.service");
const dbStream = require("./services/logging.service");
require("./config/db");
const PORT = process.env.PORT || 4000;

if (process.env.ENVIRONMENT == "production") {
  app.use(
    morgan(":method :url :status :response-time ms - :res[content-length]", {
      stream: dbStream,
    })
  );
} else {
  app.use(morgan("dev"));
}

// Configure sessions (required for OAuth flow)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "rapidito-secret-key-2025",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.ENVIRONMENT === "production", // HTTPS only in prod
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 minutes (temporary for OAuth flow)
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.ENVIRONMENT == "production") {
  keepServerRunning();
}

app.get("/", (req, res) => {
  res.json("Hello, World!");
});

app.get("/reload", (req, res) => {
  res.json("Server Reloaded");
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/captain", captainRoutes);
app.use("/map", mapsRoutes);
app.use("/ride", rideRoutes);
app.use("/mail", mailRoutes);

server.listen(PORT, () => {
  console.log("Server is listening on port", PORT);
});
