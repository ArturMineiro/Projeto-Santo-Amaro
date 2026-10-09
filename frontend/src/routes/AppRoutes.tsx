import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { AdminLayout } from "../components/Layout";
import { FullPageSpinner } from "../components/ui";
import Login from "../pages/Login";
import MyPackagesPage from "../pages/MyPackages";
import Profile from "../pages/Profile";
import RegisterAssociation from "../pages/RegisterAssociation";
import RegisterResident from "../pages/RegisterResident";
import Waiting from "../pages/Waiting";
import AdminHome from "../pages/admin/AdminHome";
import AssociationSettings from "../pages/admin/AssociationSettings";
import NewPackage from "../pages/admin/NewPackage";
import PackagesPage from "../pages/admin/PackagesPage";
import ResidentsPage from "../pages/admin/ResidentsPage";
import { SystemLayout } from "../components/system/common";
import SystemAssociations from "../pages/system/SystemAssociations";
import SystemHome from "../pages/system/SystemHome";
import SystemLogs from "../pages/system/SystemLogs";
import SystemMemberships from "../pages/system/SystemMemberships";

/** Para onde a pessoa vai depois de entrar. */
function useHomePath(): string {
  const { membership, session } = useAuth();
  if (session?.user.is_super_admin) return "/sistema";
  if (!membership || membership.status !== "approved") return "/aguardando";
  return membership.role === "admin" ? "/painel" : "/minhas";
}

/** Só para quem NÃO está logado (entrar, cadastro). */
function GuestOnly() {
  const { session } = useAuth();
  const home = useHomePath();
  if (session === undefined) return <FullPageSpinner />;
  return session ? <Navigate to={home} replace /> : <Outlet />;
}

/** Exige login e, opcionalmente, vínculo aprovado / papel de admin. */
function RequireAuth({ need }: { need: "any" | "member" | "admin" | "super" }) {
  const { session, membership } = useAuth();
  const home = useHomePath();
  if (session === undefined) return <FullPageSpinner />;
  if (!session) return <Navigate to="/" replace />;

  const approved = membership?.status === "approved";
  if (need === "super" && !session.user.is_super_admin) return <Navigate to={home} replace />;
  if (need === "member" && !approved) return <Navigate to={home} replace />;
  if (need === "admin" && !(approved && membership?.role === "admin")) return <Navigate to={home} replace />;

  return <Outlet />;
}

function WaitingRoute() {
  const home = useHomePath();
  return home === "/aguardando" ? <Waiting /> : <Navigate to={home} replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/" element={<Login />} />
          <Route path="/criar-associacao" element={<RegisterAssociation />} />
        </Route>

        {/* Link de convite funciona logado ou não: sem login mostra o cadastro */}
        <Route path="/cadastro" element={<GuestOnly />}>
          <Route index element={<RegisterResident />} />
        </Route>

        <Route element={<RequireAuth need="any" />}>
          <Route path="/aguardando" element={<WaitingRoute />} />
          <Route path="/perfil" element={<Profile />} />
        </Route>

        <Route element={<RequireAuth need="member" />}>
          <Route path="/minhas" element={<MyPackagesPage />} />
        </Route>

        <Route element={<RequireAuth need="admin" />}>
          <Route path="/painel" element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="nova" element={<NewPackage />} />
            <Route path="encomendas" element={<PackagesPage />} />
            <Route path="moradores" element={<ResidentsPage />} />
            <Route path="associacao" element={<AssociationSettings />} />
          </Route>
        </Route>

        <Route element={<RequireAuth need="super" />}>
          <Route path="/sistema" element={<SystemLayout />}>
            <Route index element={<SystemHome />} />
            <Route path="associacoes" element={<SystemAssociations />} />
            <Route path="vinculos" element={<SystemMemberships />} />
            <Route path="logs" element={<SystemLogs />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
