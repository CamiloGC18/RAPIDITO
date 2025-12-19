import { createContext, useContext, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const captainDataContext = createContext();

function CaptainContext({ children }) {
  const userData = JSON.parse(localStorage.getItem("userData"));

  const [captain, setCaptain] = useState(
    userData?.type == "captain"
      ? userData.data
      : {
        email: "",
        fullname: {
          firstname: "",
          lastname: "",
        },
        vehicle: {
          color: "",
          number: "",
          capacity: 0,
          type: "",
        },
        rides: [],
        status: "inactive",
      }
  );

  const [profilePicture, setProfilePicture] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState(null);

  // Function to decode and store OAuth token
  const processOAuthToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      localStorage.setItem("token", token);
      setCaptain(decoded);
      if (decoded.subscriptionStatus) {
        setSubscriptionStatus(decoded.subscriptionStatus);
      }
      fetchCaptainProfile(token);
    } catch (error) {
      console.error("Error processing OAuth token:", error);
    }
  };

  // Function to fetch full captain profile (including photo and subscription)
  const fetchCaptainProfile = async (token) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/captain/profile`,
        { headers: { token } }
      );
      if (response.data.captain.profilePicture) {
        setProfilePicture(response.data.captain.profilePicture);
      }
      if (response.data.captain.subscriptionStatus) {
        setSubscriptionStatus(response.data.captain.subscriptionStatus);
      }
      if (response.data.captain.subscriptionExpiryDate) {
        setSubscriptionExpiryDate(response.data.captain.subscriptionExpiryDate);
      }
    } catch (error) {
      console.error("Error fetching captain profile:", error);
    }
  };

  return (
    <captainDataContext.Provider value={{ 
      captain, 
      setCaptain, 
      profilePicture, 
      setProfilePicture,
      subscriptionStatus,
      setSubscriptionStatus,
      subscriptionExpiryDate,
      setSubscriptionExpiryDate,
      processOAuthToken,
      fetchCaptainProfile
    }}>
      {children}
    </captainDataContext.Provider>
  );
}

export const useCaptain = () => {
  const { 
    captain, 
    setCaptain, 
    profilePicture, 
    setProfilePicture,
    subscriptionStatus,
    setSubscriptionStatus,
    subscriptionExpiryDate,
    setSubscriptionExpiryDate,
    processOAuthToken,
    fetchCaptainProfile
  } = useContext(captainDataContext);
  return { 
    captain, 
    setCaptain, 
    profilePicture, 
    setProfilePicture,
    subscriptionStatus,
    setSubscriptionStatus,
    subscriptionExpiryDate,
    setSubscriptionExpiryDate,
    processOAuthToken,
    fetchCaptainProfile
  };
};

export default CaptainContext;
