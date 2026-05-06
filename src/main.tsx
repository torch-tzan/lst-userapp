import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { seedDemoNotifications } from "@/lib/notificationStore";
import "./index.css";

// Reset demo notifications on every browser reload (for stable demo)
seedDemoNotifications();

createRoot(document.getElementById("root")!).render(<App />);
