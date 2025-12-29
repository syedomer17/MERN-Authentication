import { Button } from "../ui/button"
import { useAppData } from "../../context/AppContext"


const Home = () => {
  const { logOutUser } = useAppData();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <Button className="bg-red-500 text-white p-2 rounded-md" onClick={logOutUser}>Logout</Button>
    </div>
  )
}

export default Home
