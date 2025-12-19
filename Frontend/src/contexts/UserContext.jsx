import { createContext, useContext, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const userDataContext = createContext();

const UserContext = ({ children }) => {
  const userData = JSON.parse(localStorage.getItem("userData"));

  const [user, setUser] = useState(
    userData?.type == "user"
      ? userData.data
      : {
        email: "",
        fullname: {
          firstname: "",
          lastname: "",
        }
      }
  );

  const [profilePicture, setProfilePicture] = useState(null);

  // Function to decode and store OAuth token
  const processOAuthToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      localStorage.setItem("token", token);
      setUser(decoded);
      fetchUserProfile(token);
    } catch (error) {
      console.error("Error processing OAuth token:", error);
    }
  };

  // Function to fetch full user profile (including photo)
  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/user/profile`,
        { headers: { token } }
      );
      if (response.data.user.profilePicture) {
        setProfilePicture(response.data.user.profilePicture);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  return (
    <userDataContext.Provider value={{ 
      user, 
      setUser, 
      profilePicture, 
      setProfilePicture,
      processOAuthToken,
      fetchUserProfile
    }}>
      {children}
    </userDataContext.Provider>
  );
};

export const useUser = () => {
  const { user, setUser, profilePicture, setProfilePicture, processOAuthToken, fetchUserProfile } = useContext(userDataContext);
  return { user, setUser, profilePicture, setProfilePicture, processOAuthToken, fetchUserProfile };
};

export default UserContext;
