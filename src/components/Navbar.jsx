import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Link } from "react-router-dom";

export default function Navigation() {
  return (
    <Navbar bg="dark" data-bs-theme="dark" className="mb-2">
      <Container>
        <Nav className="me-auto">
          <Navbar.Brand as={Link} to="/">
            Gestion de inventario
          </Navbar.Brand>
          <Nav.Link as={Link} to="/">
            Agregar
          </Nav.Link>
          <Nav.Link as={Link} to="/Vender">
            Vender
          </Nav.Link>
          <Nav.Link as={Link} to="/Facturar">
            Facturar
          </Nav.Link>
          <Nav.Link as={Link} to="/Editar">
            Editar
          </Nav.Link>
          <Nav.Link as={Link} to="/Reports">
            Reportes
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}
