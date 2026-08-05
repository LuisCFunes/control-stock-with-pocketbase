import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: "bi-house-door", section: "Principal" },
  { to: "/Vender", label: "Vender", icon: "bi-bag-check", section: "Ventas" },
  { to: "/Editar", label: "Editar", icon: "bi-pencil-square", section: "Inventario" },
  { to: "/Reports", label: "Reportes", icon: "bi-graph-up-arrow", section: "Inventario" },
];

const PAGE_META = {
  "/": { title: "Inventario", subtitle: "Registra y consulta los productos disponibles" },
  "/Vender": { title: "Punto de Venta", subtitle: "Arma la venta y emite la factura" },
  "/Editar": { title: "Editar Producto", subtitle: "Actualiza la información del inventario" },
  "/Reports": { title: "Reporte de Ventas", subtitle: "Consulta y exporta el historial de ventas" },
};

export default function AppLayout() {
  const { cart } = useContext(CartContext);
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] || { title: "Gestión de Inventario", subtitle: "" };
  const cartCount = cart.reduce((acc, prod) => acc + prod.Cantidad, 0);

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
            <div key={item.to}>
              <div className="nav-section">{item.section}</div>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className={`bi ${item.icon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            </div>
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
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-light text-dark border p-2 d-flex align-items-center gap-1">
              <i className="bi bi-cart3"></i>
              {cartCount} en carrito
            </span>
            <span className="badge bg-success p-2 d-flex align-items-center gap-1">
              <i className="bi bi-circle-fill" style={{ fontSize: "8px" }}></i>
              Conectado
            </span>
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
