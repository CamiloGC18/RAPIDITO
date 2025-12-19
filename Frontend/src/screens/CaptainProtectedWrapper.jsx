import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCaptain } from "../contexts/CaptainContext";
import Loading from "./Loading";

function CaptainProtectedWrapper({ children }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { captain, setCaptain, setProfilePicture, subscriptionStatus, setSubscriptionStatus } = useCaptain();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/captain/login");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/captain/profile`, {
        headers: {
          token: token,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          const captain = response.data.captain;
          setCaptain(captain);
          localStorage.setItem(
            "userData",
            JSON.stringify({ type: "captain", data: captain })
          );
          
          // Set profile picture if available
          if (captain.profilePicture) {
            setProfilePicture(captain.profilePicture);
          }
          
          // Set subscription status
          if (captain.subscriptionStatus) {
            setSubscriptionStatus(captain.subscriptionStatus);
          }
        }
      })
      .catch((err) => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/captain/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, navigate, setCaptain, setProfilePicture, setSubscriptionStatus]);

  if (loading) return <Loading />;

  return (
    <>
      {/* Show subscription banner if inactive or expired */}
      {(subscriptionStatus === "inactive" || subscriptionStatus === "expired") && (
        <div className="sticky top-0 z-50 bg-yellow-400 border-b-2 border-yellow-600 px-4 py-2">
          <p className="text-sm font-semibold text-gray-900 text-center">
            🚫 Suscripción {subscriptionStatus === "inactive" ? "Inactiva" : "Expirada"} - Activa tu suscripción para aceptar viajes
          </p>
        </div>
      )}
      {children}
    </>
  );
}

export default CaptainProtectedWrapper;
