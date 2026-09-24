import { NavLink, Outlet, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Artículos", icon: "bi-boxes" },
  { to: "/Vender", label: "Emitir Factura", icon: "bi-receipt" },
  { to: "/Editar", label: "Editar Artículos", icon: "bi-pencil-square" },
  { to: "/Clientes", label: "Clientes", icon: "bi-people" },
  { to: "/Creditos", label: "Cuentas por Cobrar", icon: "bi-wallet2" },
  { to: "/Reports", label: "Reportes", icon: "bi-graph-up-arrow" },
];

const PAGE_META = {
  "/": { title: "Inventario", subtitle: "Registra y consulta los productos disponibles" },
  "/Vender": { title: "Emitir Factura", subtitle: "Arma la venta y emite la factura" },
  "/Editar": { title: "Editar Artículos", subtitle: "Actualiza la información del inventario" },
  "/Clientes": { title: "Clientes", subtitle: "Administra el directorio de clientes para facturación" },
  "/Creditos": { title: "Cuentas por Cobrar", subtitle: "Control de facturas al crédito, saldos pendientes y registro de abonos" },
  "/Reports": { title: "Reporte de Ventas", subtitle: "Consulta y exporta el historial de ventas" },
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] || { title: "Gestión de Inventario", subtitle: "" };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <i className="bi bi-box-seam"></i>
          </div>
          <div>
            <div className="brand-name">Insumos E. Y L.</div>
            <div className="brand-sub">Gestión de inventario</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <i className="bi bi-shield-check me-1"></i> Sistema de facturación web
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div>
            <h1 className="page-title">{meta.title}</h1>
            <p className="page-subtitle">{meta.subtitle}</p>
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
