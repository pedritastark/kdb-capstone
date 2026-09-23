import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { NotificacionesProvider } from "./hooks/useNotificaciones";
import { PedidosProvider } from "./hooks/usePedidos";
import { ProductosProvider } from "./hooks/useProductos";
import { InventarioProvider } from "./hooks/useInventario";
import { PagosProvider } from "./hooks/usePagos";
import { ClientesProvider } from "./hooks/useClientes";
import { RutaProtegida } from "./components/Auth/RutaProtegida";
import { MainLayout } from "./components/Layout/MainLayout";
import { LoginPage } from "./pages/LoginPage";
import { PedidosPage } from "./pages/PedidosPage";
import { MenuPage } from "./pages/MenuPage";
import { InventarioPage } from "./pages/InventarioPage";
import { ClientesPage } from "./pages/ClientesPage";
import { PagosPage } from "./pages/PagosPage";
import { NotificacionesPage } from "./pages/NotificacionesPage";
import { TomaOrdenPage } from "./pages/TomaOrdenPage";

function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificacionesProvider>
        <ClientesProvider>
          <ProductosProvider>
            <InventarioProvider>
              <PedidosProvider>
                <PagosProvider>{children}</PagosProvider>
              </PedidosProvider>
            </InventarioProvider>
          </ProductosProvider>
        </ClientesProvider>
      </NotificacionesProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <Providers>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/toma-orden" element={<TomaOrdenPage />} />
        <Route
          element={
            <RutaProtegida>
              <MainLayout />
            </RutaProtegida>
          }
        >
          <Route path="/" element={<Navigate to="/pedidos" replace />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/pagos" element={<PagosPage />} />
          <Route path="/notificaciones" element={<NotificacionesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/pedidos" replace />} />
      </Routes>
    </Providers>
  );
}

export default App;
