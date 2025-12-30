import { Button } from "../ui/button";
import { useAppData } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { logOutUser } = useAppData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOutUser();      
    navigate("/login");   
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <Button
        className="bg-red-500 text-white p-2 rounded-md"
        onClick={handleLogout}
      >
        Logout
      </Button>
    </div>
  );
};

export default Home;
