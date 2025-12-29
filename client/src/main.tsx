import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppProvider } from "./context/AppContext.tsx";

export const server = "http://localhost:5000";

createRoot(document.getElementById("root")!).render(
  <>
    <AppProvider>
      <App />
    </AppProvider>
  </>
);
