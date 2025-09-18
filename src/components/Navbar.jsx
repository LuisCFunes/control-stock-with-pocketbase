import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Link, NavLink } from "react-router-dom";

export default function Navigation() {
  return (
    <Navbar bg="dark" data-bs-theme="dark" className="mb-2">
      <Container>
        <Nav className="me-auto">
          <Navbar.Brand as={Link} to="/">
            Gestion de inventario
          </Navbar.Brand>
          <Nav.Link as={NavLink} to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            Agregar
          </Nav.Link>
          <Nav.Link as={NavLink} to="/Vender" className={({ isActive }) => (isActive ? "active" : "")}>
            Vender
          </Nav.Link>
          <Nav.Link as={NavLink} to="/Facturar" className={({ isActive }) => (isActive ? "active" : "")}>
            Facturar
          </Nav.Link>
          <Nav.Link as={NavLink} to="/Editar" className={({ isActive }) => (isActive ? "active" : "")}>
            Editar
          </Nav.Link>
          <Nav.Link as={NavLink} to="/Reports" className={({ isActive }) => (isActive ? "active" : "")}>
            Reportes
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}
