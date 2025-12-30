import { useAppData } from "../../context/AppContext";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
  const { logOutUser, user } = useAppData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOutUser();      
    navigate("/login");   
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <button
        className="bg-red-500 text-white p-2 rounded-md"
        onClick={handleLogout}
      >
        Logout
      </button>
      {
        user && user.role === 'admin' && (
          <div className="mt-4 p-4 border rounded-md bg-gray-100">
            <h2 className="text-lg font-semibold mb-2">Admin Panel</h2>
            <p>Welcome, {user.name}. You have admin privileges.</p>
            <Link to='/dashboard' className="text-blue-500 underline mt-2 block">
             Dashboard
            </Link>
          </div>
        )
      }
    </div>
  );
};

export default Home;
