import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { server } from "../../main";
import Loading from "../../Loading";

interface VerifyResponse {
  message: string;
}

const Verify = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setErrorMessage("Invalid or missing verification token.");
      setLoading(false);
      return;
    }

    const verifyUser = async (): Promise<void> => {
      try {
        const { data } = await axios.post<VerifyResponse>(
          `${server}/api/v1/verify/${token}`
        );

        setSuccessMessage(data.message);
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        setErrorMessage(
          error.response?.data?.message ||
            "Verification failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [token]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div
          className={`mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full ${
            successMessage
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {successMessage ? "✓" : "✕"}
        </div>

        {/* Message */}
        <h1 className="text-xl font-semibold text-white mb-2">
          {successMessage ? "Verification successful" : "Verification failed"}
        </h1>

        <p className="text-sm text-slate-400 mb-6">
          {successMessage || errorMessage}
        </p>

        {/* Actions */}
        {successMessage ? (
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-medium text-white transition"
          >
            Go to Login
          </button>
        ) : (
          <button
            onClick={() => navigate("/register")}
            className="w-full rounded-lg bg-slate-700 hover:bg-slate-600 py-2.5 text-sm font-medium text-white transition"
          >
            Back to Register
          </button>
        )}
      </div>
    </div>
  );
};

export default Verify;
