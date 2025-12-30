import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { server } from "../../main";
import { useAppData } from "../../context/AppContext";

interface VerifyOtpResponse {
  message: string;
}

const OTP_LENGTH = 6;

const VerifyOtp = () => {
  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const {setIsAuth, setUser } = useAppData();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (otp.length !== OTP_LENGTH) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.post<VerifyOtpResponse>(
        `${server}/api/v1/verify`,
        { otp  },
        { withCredentials: true }
      );

      toast.success(data.message);
      setIsAuth(true);
      setUser((data as any).user);
      navigate("/dashboard");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white">
            Verify your email
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="otp"
              className="block text-sm text-slate-300 mb-2 text-center"
            >
              One-Time Password
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\ालन/, ""))
              }
              placeholder="••••••"
              className="w-full text-center tracking-[0.4em] text-xl font-semibold rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed py-2.5 text-sm font-medium text-white transition"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Didn’t receive the code?
          </p>
          <button
            type="button"
            className="mt-1 text-sm font-medium text-indigo-400 hover:text-indigo-300"
            onClick={() => toast.info("Resend OTP logic here")}
          >
            Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
