import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function UserSignup() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login since signup is now handled through OAuth
    navigate("/login");
  }, [navigate]);

  return (
    <div className="w-full h-dvh flex flex-col items-center justify-center p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
      <h2 className="text-2xl font-bold mb-4">Registro con Google</h2>
      <p className="text-gray-600 mb-6">
        Redirigiendo a la página de inicio de sesión...
      </p>
      <p className="text-sm text-gray-500">
        Ahora puedes registrarte e iniciar sesión con tu cuenta de Google
      </p>
    </div>
  );
}

export default UserSignup;
