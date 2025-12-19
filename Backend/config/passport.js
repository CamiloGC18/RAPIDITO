const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user.model");
const Captain = require("../models/captain.model");

// Google OAuth Strategy for Users
passport.use(
  "google-user",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL_USER,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract profile data
        const googleId = profile.id;
        const email = profile.emails[0].value;
        const firstname = profile.name.givenName;
        const lastname = profile.name.familyName || "";
        const profilePicture = profile.photos[0]?.value || null;

        // Check if user exists by googleId or email
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
          // Update googleId and profilePicture if missing
          if (!user.googleId) {
            user.googleId = googleId;
          }
          if (!user.profilePicture && profilePicture) {
            user.profilePicture = profilePicture;
          }
          await user.save();
        } else {
          // Create new user with Google data
          user = await User.create({
            fullname: {
              firstname,
              lastname,
            },
            email,
            googleId,
            profilePicture,
            password: null, // OAuth users don't have passwords
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Google OAuth Strategy for Captains
passport.use(
  "google-captain",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL_CAPTAIN,
      passReqToCallback: true, // Access to req for session data
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Extract profile data
        const googleId = profile.id;
        const email = profile.emails[0].value;
        const firstname = profile.name.givenName;
        const lastname = profile.name.familyName || "";
        const profilePicture = profile.photos[0]?.value || null;

        // Check if captain exists by googleId or email
        let captain = await Captain.findOne({ $or: [{ googleId }, { email }] });

        if (captain) {
          // Update googleId and profilePicture if missing
          if (!captain.googleId) {
            captain.googleId = googleId;
          }
          if (!captain.profilePicture && profilePicture) {
            captain.profilePicture = profilePicture;
          }
          await captain.save();
        } else {
          // New captain: require vehicle data from session
          const vehicleData = req.session.vehicleData;

          if (!vehicleData) {
            return done(
              new Error(
                "Vehicle data required for captain registration. Please complete the signup form first."
              ),
              null
            );
          }

          // Create captain with vehicle info
          captain = await Captain.create({
            fullname: {
              firstname,
              lastname,
            },
            email,
            googleId,
            profilePicture,
            password: null, // OAuth users don't have passwords
            phone: vehicleData.phone,
            subscriptionStatus: "inactive",
            vehicle: {
              color: vehicleData.color,
              number: vehicleData.number,
              capacity: vehicleData.capacity,
              type: vehicleData.type,
            },
            location: {
              type: "Point",
              coordinates: [0, 0], // Default coordinates, will be updated when captain goes active
            },
          });

          // Clear vehicle data from session after use
          delete req.session.vehicleData;
        }

        return done(null, captain);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user for session (required for session support)
passport.serializeUser((user, done) => {
  done(null, { id: user._id, type: user.constructor.modelName });
});

// Deserialize user from session
passport.deserializeUser(async (data, done) => {
  try {
    let user;
    if (data.type === "User") {
      user = await User.findById(data.id);
    } else if (data.type === "Captain") {
      user = await Captain.findById(data.id);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
