import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import RegisterAssociation from "../pages/RegisterAssociation";
import Dashboard from "../pages/Dashboard";
import PendingMemberships from "../pages/PendingMemberships";
import CreateResident from "../pages/CreateResident";
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro-associacao" element={<RegisterAssociation />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-resident" element={<CreateResident />} />
        <Route path="/admin/memberships" element={<PendingMemberships />} />
      </Routes>
    </BrowserRouter>
  );
}
