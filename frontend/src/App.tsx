import AuthProvider from "./auth/AuthProvider";
import { Toaster } from "./components/ui";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster />
    </AuthProvider>
  );
}
