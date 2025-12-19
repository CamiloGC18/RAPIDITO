const rideService = require("../services/ride.service");
const { validationResult } = require("express-validator");
const mapService = require("../services/map.service");
const { sendMessageToSocketId } = require("../socket");
const rideModel = require("../models/ride.model");
const userModel = require("../models/user.model");
const { getCaptainLocation } = require("../services/location.service");
const { getOptimalRoute } = require("../services/route.service");
const { calculateInitialETA } = require("../services/eta.service");

module.exports.chatDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const ride = await rideModel
      .findOne({ _id: id })
      .populate("user", "socketId fullname phone")
      .populate("captain", "socketId fullname phone");

    if (!ride) {
      return res.status(400).json({ message: "Ride not found" });
    }

    const response = {
      user: {
        socketId: ride.user?.socketId,
        fullname: ride.user?.fullname,
        phone: ride.user?.phone,
        _id: ride.user?._id,
      },
      captain: {
        socketId: ride.captain?.socketId,
        fullname: ride.captain?.fullname,
        phone: ride.captain?.phone,
        _id: ride.captain?._id,
      },
      messages: ride.messages,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination, vehicleType } = req.body;

  try {
    const ride = await rideService.createRide({
      user: req.user._id,
      pickup,
      destination,
      vehicleType,
    });

    const user = await userModel.findOne({ _id: req.user._id });
    if (user) {
      user.rides.push(ride._id);
      await user.save();
    }

    res.status(201).json(ride);

    Promise.resolve().then(async () => {
      try {
        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
        console.log("Pickup Coordinates", pickupCoordinates);

        const captainsInRadius = await mapService.getCaptainsInTheRadius(
          pickupCoordinates.ltd,
          pickupCoordinates.lng,
          4,
          vehicleType
        );

        ride.otp = "";

        const rideWithUser = await rideModel
          .findOne({ _id: ride._id })
          .populate("user");

        console.log(
          captainsInRadius.map(
            (ride) => `${ride.fullname.firstname} ${ride.fullname.lastname} `
          )
        );
        captainsInRadius.map((captain) => {
          sendMessageToSocketId(captain.socketId, {
            event: "new-ride",
            data: rideWithUser,
          });
        });
      } catch (e) {
        console.error("Background task failed:", e.message);
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination } = req.query;

  try {
    const { fare, distanceTime } = await rideService.getFare(
      pickup,
      destination
    );
    return res.status(200).json({ fare, distanceTime });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const rideDetails = await rideModel.findOne({ _id: rideId });

    if (!rideDetails) {
      return res.status(404).json({ message: "Ride not found." });
    }

    switch (rideDetails.status) {
      case "accepted":
        return res
          .status(400)
          .json({
            message:
              "The ride is accepted by another captain before you. Better luck next time.",
          });

      case "ongoing":
        return res
          .status(400)
          .json({
            message: "The ride is currently ongoing with another captain.",
          });

      case "completed":
        return res
          .status(400)
          .json({ message: "The ride has already been completed." });

      case "cancelled":
        return res
          .status(400)
          .json({ message: "The ride has been cancelled." });

      default:
        break;
    }

    const ride = await rideService.confirmRide({
      rideId,
      captain: req.captain,
    });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-confirmed",
      data: ride,
    });

    // TODO: Remove ride from other captains
    // Implement logic here, maybe emit an event or update captain listings

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, otp } = req.query;

  try {
    const ride = await rideService.startRide({
      rideId,
      otp,
      captain: req.captain,
    });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-started",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.endRide({ rideId, captain: req.captain });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-ended",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.cancelRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.query;

  try {
    const ride = await rideModel.findOneAndUpdate(
      { _id: rideId },
      {
        status: "cancelled",
      },
      { new: true }
    );

    const pickupCoordinates = await mapService.getAddressCoordinate(ride.pickup);
    const captainsInRadius = await mapService.getCaptainsInTheRadius(
      pickupCoordinates.ltd,
      pickupCoordinates.lng,
      4,
      ride.vehicle
    );

    captainsInRadius.map((captain) => {
      sendMessageToSocketId(captain.socketId, {
        event: "ride-cancelled",
        data: ride,
      });
    });
    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get tracking data for a ride
module.exports.getRideTracking = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await rideModel.findById(rideId)
      .populate('captain', 'fullname vehicle location')
      .populate('user', 'fullname');

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Get current captain location if captain assigned
    let captainLocation = null;
    if (ride.captain && ride.captain._id) {
      try {
        const locationData = await getCaptainLocation(ride.captain._id.toString());
        captainLocation = locationData.location;
      } catch (error) {
        console.error("Error getting captain location:", error);
      }
    }

    const trackingData = {
      rideId: ride._id,
      status: ride.status,
      tracking: ride.tracking || {},
      captainLocation,
      captain: ride.captain ? {
        id: ride.captain._id,
        name: ride.captain.fullname,
        vehicle: ride.captain.vehicle
      } : null
    };

    res.status(200).json(trackingData);
  } catch (error) {
    console.error("Error getting ride tracking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get route for a ride
module.exports.getRideRoute = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await rideModel.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Get coordinates for pickup and destination
    const pickupCoords = await mapService.getAddressCoordinate(ride.pickup);
    const destCoords = await mapService.getAddressCoordinate(ride.destination);

    // Get optimal route
    const route = await getOptimalRoute(
      { lat: pickupCoords.ltd, lng: pickupCoords.lng },
      { lat: destCoords.ltd, lng: destCoords.lng }
    );

    res.status(200).json({
      rideId: ride._id,
      route: {
        polyline: route.polyline,
        points: route.points,
        distance: route.distance,
        duration: route.duration
      }
    });
  } catch (error) {
    console.error("Error getting ride route:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get captain's current location for a ride
module.exports.getCaptainLocationForRide = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await rideModel.findById(rideId).populate('captain');

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (!ride.captain) {
      return res.status(404).json({ message: "Captain not assigned yet" });
    }

    const locationData = await getCaptainLocation(ride.captain._id.toString());

    res.status(200).json({
      captainId: ride.captain._id,
      location: locationData.location,
      timestamp: locationData.timestamp,
      vehicle: ride.captain.vehicle
    });
  } catch (error) {
    console.error("Error getting captain location:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update ETA manually (if needed)
module.exports.updateRideETA = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { pickupETA, dropoffETA } = req.body;

    const ride = await rideModel.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (!ride.tracking) {
      ride.tracking = {};
    }

    if (pickupETA !== undefined) {
      ride.tracking.pickupETA = pickupETA;
    }
    if (dropoffETA !== undefined) {
      ride.tracking.dropoffETA = dropoffETA;
    }

    await ride.save();

    res.status(200).json({
      rideId: ride._id,
      pickupETA: ride.tracking.pickupETA,
      dropoffETA: ride.tracking.dropoffETA
    });
  } catch (error) {
    console.error("Error updating ride ETA:", error);
    res.status(500).json({ message: "Server error" });
  }
};
