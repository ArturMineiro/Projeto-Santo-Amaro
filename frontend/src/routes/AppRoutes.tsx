import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import RegisterAssociation from "../pages/RegisterAssociation";
import Dashboard from "../pages/Dashboard";
import PendingMemberships from "../pages/PendingMemberships";
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro-associacao" element={<RegisterAssociation />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/memberships" element={<PendingMemberships />} />
      </Routes>
    </BrowserRouter>
  );
}
