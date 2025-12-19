import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Heading, GoogleAuthButton } from "../components";
import { jwtDecode } from "jwt-decode";
import Console from "../utils/console";

function UserLogin() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      setResponseError("Error al iniciar sesión con Google. Intenta nuevamente.");
      // Clean URL
      window.history.replaceState({}, document.title, "/login");
      return;
    }

    if (token) {
      setLoading(true);
      try {
        const decoded = jwtDecode(token);
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify({
          type: "user",
          data: decoded
        }));
        Console.log("User logged in successfully:", decoded);
        navigate("/home");
      } catch (error) {
        setResponseError("Token inválido. Intenta nuevamente.");
        Console.log("Token decode error:", error);
      } finally {
        setLoading(false);
        // Clean URL
        window.history.replaceState({}, document.title, "/login");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (responseError) {
      const timer = setTimeout(() => {
        setResponseError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [responseError]);

  return (
    <div className="w-full h-dvh flex flex-col justify-between p-4 pt-6">
      <div>
        <Heading title={"Bienvenido a Rapidito 🚕"} />
        <p className="text-gray-600 text-center mb-8 text-sm">
          Inicia sesión con tu cuenta de Google
        </p>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <GoogleAuthButton userType="user" classes="mb-4" />

            {responseError && (
              <p className="text-sm text-center mt-4 text-red-500">
                {responseError}
              </p>
            )}

            <p className="text-sm font-normal text-center mt-6 text-gray-600">
              ¿No tienes cuenta? Al iniciar sesión con Google se creará automáticamente tu cuenta.
            </p>
          </>
        )}
      </div>

      <div>
        <Button
          type={"link"}
          path={"/captain/login"}
          title={"Iniciar sesión como Capitán"}
          classes={"bg-orange-500"}
        />
        <p className="text-xs font-normal text-center self-end mt-6">
          Este sitio está protegido por reCAPTCHA y aplican la{" "}
          <span className="font-semibold underline">Política de Privacidad</span> y los{" "}
          <span className="font-semibold underline">Términos de Servicio</span>{" "}
          de Google.
        </p>
      </div>
    </div>
  );
}

export default UserLogin;
