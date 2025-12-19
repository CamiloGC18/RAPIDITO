import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, Heading, Input, GoogleAuthButton } from "../components";
import axios from "axios";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Console from "../utils/console";

function CaptainSignup() {
  const [responseError, setResponseError] = useState("");
  const [step, setStep] = useState(1); // 1 = Vehicle form, 2 = OAuth redirect
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();

  const submitVehicleData = async (data) => {
    const vehicleData = {
      color: data.color,
      number: data.number,
      capacity: parseInt(data.capacity),
      type: data.type.toLowerCase(),
      phone: data.phone,
    };

    Console.log("Submitting vehicle data:", vehicleData);

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/auth/captain/vehicle-data`,
        vehicleData
      );
      Console.log("Vehicle data stored:", response.data);
      
      // Proceed to OAuth flow
      setStep(2);
    } catch (error) {
      setResponseError(
        error.response?.data?.errors?.[0]?.msg || 
        error.response?.data?.message || 
        "Error al guardar los datos del vehículo"
      );
      Console.log("Vehicle data error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (responseError) {
      const timer = setTimeout(() => {
        setResponseError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [responseError]);

  if (step === 2) {
    return (
      <div className="w-full h-dvh flex flex-col justify-between p-4 pt-6">
        <div>
          <Heading title={"Regístrate como Capitán 🚕"} />
          <p className="text-gray-600 text-center mb-8 text-sm">
            Ahora autentica tu cuenta con Google
          </p>

          <GoogleAuthButton userType="captain" classes="mb-4" />

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              ℹ️ Tu información de vehículo ha sido guardada. Completa el inicio de sesión con Google para crear tu cuenta.
            </p>
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full mt-4 py-3 text-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Volver a editar datos del vehículo
          </button>
        </div>

        <div>
          <Button
            type={"link"}
            path={"/login"}
            title={"Iniciar sesión como Usuario"}
            classes={"bg-green-500"}
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

  return (
    <div className="w-full h-dvh flex flex-col justify-between p-4 pt-6">
      <div>
        <Heading title={"Regístrate como Capitán 🚕"} />
        <p className="text-gray-600 text-center mb-6 text-sm">
          Primero, completa los datos de tu vehículo
        </p>
        
        <form onSubmit={handleSubmit(submitVehicleData)}>
          <Input
            label={"Número de teléfono"}
            type={"number"}
            name={"phone"}
            register={register}
            error={errors.phone}
            placeholder="10 dígitos"
          />
          
          <div className="flex gap-4 -mb-2">
            <Input
              label={"Color del vehículo"}
              name={"color"}
              register={register}
              error={errors.color}
              placeholder="Ej: Blanco"
            />
            <Input
              label={"Capacidad"}
              type={"number"}
              name={"capacity"}
              register={register}
              error={errors.capacity}
              placeholder="Ej: 4"
            />
          </div>
          
          <Input
            label={"Número de placa"}
            name={"number"}
            register={register}
            error={errors.number}
            placeholder="Ej: ABC123"
          />
          
          <Input
            label={"Tipo de vehículo"}
            type={"select"}
            options={["Car", "Bike", "Auto"]}
            name={"type"}
            register={register}
            error={errors.type}
          />

          {responseError && (
            <p className="text-sm text-center mb-4 text-red-500">
              {responseError}
            </p>
          )}

          <Button 
            title={"Continuar con Google"} 
            loading={loading} 
            type="submit" 
          />
        </form>

        <p className="text-sm font-normal text-center mt-4 text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <a href="/captain/login" className="font-semibold text-orange-600 hover:underline">
            Inicia sesión
          </a>
        </p>

        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="text-xs text-yellow-800 text-center">
            ⚠️ Nota: Las cuentas de capitán inician con suscripción inactiva. Deberás activarla para aceptar viajes.
          </p>
        </div>
      </div>

      <div>
        <Button
          type={"link"}
          path={"/login"}
          title={"Registrarse como Usuario"}
          classes={"bg-green-500"}
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

export default CaptainSignup;
