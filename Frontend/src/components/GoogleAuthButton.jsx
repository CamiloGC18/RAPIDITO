import React from "react";
import { FcGoogle } from "react-icons/fc";

const GoogleAuthButton = ({ userType = "user", classes = "" }) => {
  const handleGoogleAuth = () => {
    const backendUrl = import.meta.env.VITE_SERVER_URL;
    const authEndpoint = `${backendUrl}/auth/google/${userType}`;
    window.location.href = authEndpoint;
  };

  return (
    <button
      onClick={handleGoogleAuth}
      className={`w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm ${classes}`}
    >
      <FcGoogle className="text-2xl" />
      <span className="font-semibold text-gray-700">
        Continuar con Google
      </span>
    </button>
  );
};

export default GoogleAuthButton;
