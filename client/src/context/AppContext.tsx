import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import api from "../components/apiIntercepter";
import { toast } from "react-toastify";

export interface User {
  _id: string;
  name: string;
  email: string;
}

interface LogoutResponse {
  message: string;
}

interface AppContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  isAuth: boolean;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  fetchUser: () => Promise<void>;
  logOutUser: () => Promise<void>; 
}

interface AppProviderProps {
  children: ReactNode;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuth, setIsAuth] = useState<boolean>(false);

  const fetchUser = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data } = await api.get<User>("/api/v1/me");
      setUser(data);
      setIsAuth(true);
    } catch {
      setUser(null);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  };

  const logOutUser = async (): Promise<void> => {
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
        setUser,
        loading,
        isAuth,
        setIsAuth,
        fetchUser,
        logOutUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }
  return context;
};
