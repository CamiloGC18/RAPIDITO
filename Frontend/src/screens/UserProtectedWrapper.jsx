import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import Loading from "./Loading";

function UserProtectedWrapper({ children }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { user, setUser, setProfilePicture } = useUser();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/user/profile`, {
        headers: {
          token: token,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          const user = response.data.user;
          setUser(user);
          localStorage.setItem(
            "userData",
            JSON.stringify({ type: "user", data: user })
          );
          
          // Set profile picture if available
          if (user.profilePicture) {
            setProfilePicture(user.profilePicture);
          }
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, navigate, setUser, setProfilePicture]);

  if (loading) return <Loading />;

  return <>{children}</>;
}

export default UserProtectedWrapper;
