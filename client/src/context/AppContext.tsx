import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api from "../components/apiIntercepter";
import { toast } from "react-toastify";

export interface User {
  role: 'user' | 'admin';
  _id: string;
  name: string;
  email: string;
}

interface LogoutResponse {
  message: string;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  fetchUser: () => Promise<void>;
  logOutUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  const fetchUser = async () => {
    try {
      const { data } = await api.get<User>("/api/v1/me");
      setUser(data);
      setIsAuth(true);
    } catch {
      setUser(null);
      setIsAuth(false);
    } finally {
      setLoading(false); // 🚨 THIS LINE SAVES YOUR APP
    }
  };

  const logOutUser = async () => {
    try {
      const { data } = await api.post<LogoutResponse>("/api/v1/logout");
      toast.success(data.message);
      setUser(null);
      setIsAuth(false);
    } catch {
      toast.error("Error logging out");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        isAuth,
        fetchUser,
        logOutUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppProvider");
  }
  return context;
};
