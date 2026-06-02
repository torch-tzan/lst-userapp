import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { seedDemoNotifications } from "@/lib/notificationStore";
import "./index.css";

function showBootError(message: string) {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f3f1ed;color:#2a2520;font-family:system-ui,sans-serif;text-align:center;max-width:480px;margin:0 auto;">${message}</div>`;
}

try {
  seedDemoNotifications();
  createRoot(document.getElementById("root")!).render(<App />);
} catch (error) {
  console.error(error);
  showBootError("アプリの読み込みに失敗しました。ページを再読み込みしてください。");
}
