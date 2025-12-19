const moment = require("moment-timezone");
const { Server } = require("socket.io");
const userModel = require("./models/user.model");
const rideModel = require("./models/ride.model");
const captainModel = require("./models/captain.model");
const frontendLogModel = require("./models/frontend-log.model");
const { updateCaptainLocation, validateCoordinates } = require("./services/location.service");
const { updateETADynamic } = require("./services/eta.service");

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    if (process.env.ENVIRONMENT == "production") {
      socket.on("log", async (log) => {
        log.formattedTimestamp = moment().tz("Asia/Kolkata").format("MMM DD hh:mm:ss A");
        try {
          await frontendLogModel.create(log);
        } catch (error) {
          console.log("Error sending logs...");
        }
      });
    }

    socket.on("join", async (data) => {
      const { userId, userType } = data;
      console.log(userType + " connected: " + userId);
      if (userType === "user") {
        await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
      } else if (userType === "captain") {
        await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
      }
    });

    socket.on("update-location-captain", async (data) => {
      const { userId, location } = data;

      if (!location || !location.ltd || !location.lng) {
        return socket.emit("error", { message: "Invalid location data" });
      }
      await captainModel.findByIdAndUpdate(userId, {
        location: {
          type: "Point",
          coordinates: [location.lng, location.ltd],
        },
      });
    });

    // Enhanced captain location update (every 3-5 seconds)
    socket.on("captain:location-update", async (data) => {
      try {
        const { captainId, location, rideId } = data;

        if (!location || !location.latitude || !location.longitude) {
          return socket.emit("error", { message: "Invalid location data" });
        }

        // Validate coordinates
        if (!validateCoordinates(location.latitude, location.longitude)) {
          return socket.emit("error", { message: "Coordinates out of valid region" });
        }

        // Update location in service
        await updateCaptainLocation(captainId, location);

        // If in active ride, update ride tracking and broadcast to user
        if (rideId) {
          const ride = await rideModel.findById(rideId);
          
          if (ride && ride.status !== 'completed' && ride.status !== 'cancelled') {
            // Add to actual route
            if (!ride.tracking) {
              ride.tracking = {
                actualRoute: [],
                currentPhase: 'captain-arriving'
              };
            }

            ride.tracking.actualRoute.push({
              latitude: location.latitude,
              longitude: location.longitude,
              timestamp: new Date()
            });
            ride.tracking.lastLocationUpdate = new Date();

            // Update ETA dynamically if we have destination
            if (ride.destination && location.speed) {
              const destination = ride.pickup; // Assuming captain is heading to pickup first
              // In a real scenario, you'd determine if going to pickup or destination
            }

            await ride.save();

            // Broadcast to user in the ride room
            io.to(rideId).emit("captain:location-updated", {
              captainId,
              location,
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        console.error("Error updating captain location:", error);
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    // Start tracking for a ride
    socket.on("captain:start-tracking", async (data) => {
      try {
        const { captainId, rideId } = data;
        console.log(`Captain ${captainId} started tracking for ride ${rideId}`);

        socket.join(rideId);

        const ride = await rideModel.findById(rideId);
        if (ride) {
          if (!ride.tracking) {
            ride.tracking = {};
          }
          ride.tracking.currentPhase = 'captain-arriving';
          ride.tracking.lastLocationUpdate = new Date();
          await ride.save();

          // Notify user that tracking has started
          io.to(rideId).emit("ride:tracking-started", {
            rideId,
            captainId,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error("Error starting tracking:", error);
      }
    });

    // Stop tracking
    socket.on("captain:stop-tracking", async (data) => {
      try {
        const { captainId, rideId } = data;
        console.log(`Captain ${captainId} stopped tracking for ride ${rideId}`);

        socket.leave(rideId);

        // Notify completion
        io.to(rideId).emit("ride:tracking-stopped", {
          rideId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("Error stopping tracking:", error);
      }
    });

    // User requests captain location
    socket.on("user:request-captain-location", async (data) => {
      try {
        const { userId, rideId } = data;

        const ride = await rideModel.findById(rideId).populate('captain');
        if (ride && ride.captain) {
          const captain = ride.captain;
          if (captain.location && captain.location.coordinates) {
            socket.emit("captain:location-response", {
              captainId: captain._id,
              location: {
                latitude: captain.location.coordinates[1],
                longitude: captain.location.coordinates[0]
              },
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        console.error("Error requesting captain location:", error);
      }
    });

    // User subscribes to captain tracking
    socket.on("user:subscribe-captain-tracking", async (data) => {
      try {
        const { userId, rideId } = data;
        console.log(`User ${userId} subscribed to tracking for ride ${rideId}`);
        
        socket.join(rideId);

        // Send initial captain location
        const ride = await rideModel.findById(rideId).populate('captain');
        if (ride && ride.captain && ride.captain.location) {
          socket.emit("captain:location-updated", {
            captainId: ride.captain._id,
            location: {
              latitude: ride.captain.location.coordinates[1],
              longitude: ride.captain.location.coordinates[0]
            },
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error("Error subscribing to tracking:", error);
      }
    });

    // User unsubscribes from tracking
    socket.on("user:unsubscribe-captain-tracking", (data) => {
      const { userId, rideId } = data;
      console.log(`User ${userId} unsubscribed from tracking for ride ${rideId}`);
      socket.leave(rideId);
    });

    // Ride phase events
    socket.on("ride:started", async (data) => {
      const { rideId } = data;
      io.to(rideId).emit("ride:status-changed", {
        phase: 'captain-arriving',
        timestamp: new Date()
      });
    });

    socket.on("ride:arrived-pickup", async (data) => {
      const { rideId } = data;
      io.to(rideId).emit("ride:status-changed", {
        phase: 'arrived-at-pickup',
        timestamp: new Date()
      });
    });

    socket.on("ride:passenger-picked-up", async (data) => {
      const { rideId } = data;
      io.to(rideId).emit("ride:status-changed", {
        phase: 'in-progress',
        timestamp: new Date()
      });
    });

    socket.on("ride:arrived-destination", async (data) => {
      const { rideId } = data;
      io.to(rideId).emit("ride:status-changed", {
        phase: 'completed',
        timestamp: new Date()
      });
    });

    // ETA updates
    socket.on("ride:eta-update", async (data) => {
      const { rideId, pickupETA, dropoffETA } = data;
      
      try {
        const ride = await rideModel.findById(rideId);
        if (ride && ride.tracking) {
          ride.tracking.pickupETA = pickupETA;
          ride.tracking.dropoffETA = dropoffETA;
          await ride.save();
        }

        io.to(rideId).emit("ride:eta-updated", {
          pickupETA,
          dropoffETA,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("Error updating ETA:", error);
      }
    });

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room: ${roomId}`);
    });

    socket.on("message", async ({ rideId, msg, userType, time }) => {
      const date = moment().tz("Asia/Kolkata").format("MMM DD");
      socket.to(rideId).emit("receiveMessage", { msg, by: userType, time });
      try {
        const ride = await rideModel.findOne({ _id: rideId });
        ride.messages.push({
          msg: msg,
          by: userType,
          time: time,
          date: date,
          timestamp: new Date(),
        });
        await ride.save();
      } catch (error) {
        console.log("Error saving message: ", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

const sendMessageToSocketId = (socketId, messageObject) => {
  if (io) {
    console.log("message sent to: ", socketId);
    io.to(socketId).emit(messageObject.event, messageObject.data);
  } else {
    console.log("Socket.io not initialized.");
  }
};

module.exports = { initializeSocket, sendMessageToSocketId };
