const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Captain",
    },
    pickup: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    fare: {
      type: Number,
      required: true,
    },
    vehicle: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "ongoing", "completed", "cancelled"],
      default: "pending",
    },
    duration: {
      type: Number,
    }, // in seconds

    distance: {
      type: Number,
    }, // in meters

    paymentID: {
      type: String,
    },
    orderId: {
      type: String,
    },
    signature: {
      type: String,
    },
    otp: {
      type: String,
      select: false,
      required: true,
    },
    messages: [
      {
        msg: String,
        by: {
          type: String,
          enum: ["user", "captain"],
        },
        time: String,
        date: String,
        timestamp: Date,
        _id: false
      },
    ],
    tracking: {
      route: [{
        latitude: Number,
        longitude: Number,
        timestamp: Date,
        speed: Number,
        heading: Number
      }],
      pickupETA: Number, // minutes
      dropoffETA: Number, // minutes
      currentPhase: {
        type: String,
        enum: ['awaiting-captain', 'captain-arriving', 'in-progress', 'completed'],
        default: 'awaiting-captain'
      },
      actualRoute: [{ // Ruta real tomada
        latitude: Number,
        longitude: Number,
        timestamp: Date
      }],
      totalDistance: Number, // meters
      totalDuration: Number, // seconds
      lastLocationUpdate: Date
    },
    realTimeUpdates: [{
      type: String, // 'location', 'eta', 'status'
      data: mongoose.Schema.Types.Mixed,
      timestamp: Date
    }]
  },
  { timestamps: true }
);

// Create geospatial index for tracking
rideSchema.index({ 'tracking.route': '2dsphere' });

module.exports = mongoose.model("Ride", rideSchema);
