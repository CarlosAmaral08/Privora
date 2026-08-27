import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Início" },
  { to: "/privacy", label: "Privacidade & LGPD" },
  { to: "/what-we-know", label: "O que sabemos sobre você" },
  { to: "/quiz", label: "Quiz" },
  { to: "/settings", label: "Configurações" },
  { to: "/dashboard", label: "Dashboard" },
];

export function NavBar() {
  return (
    <nav className="navbar">
      <span className="navbar-brand">Portal Privacidade</span>
      <div className="navbar-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? "navbar-link active" : "navbar-link")}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
