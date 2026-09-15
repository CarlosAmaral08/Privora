import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "privora-theme";

function getInitialTheme(): Theme {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

const links = [
  { to: "/", label: "Início" },
  { to: "/privacy", label: "Privacidade & LGPD" },
  { to: "/what-we-know", label: "O que sabemos" },
  { to: "/quiz", label: "Quiz" },
  { to: "/settings", label: "Configurações" },
  { to: "/dashboard", label: "Painel" },
];

export function NavBar() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // O tema continua funcional durante a sessão mesmo sem armazenamento disponível.
    }

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute("content", isDark ? "#17141d" : "#f4f2ed");
  }, [isDark, theme]);

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Navegação principal">
        <Link to="/" className="navbar-brand" aria-label="Privora — página inicial">
          <span className="brand-mark" aria-hidden="true"><i /><i /></span>
          <span>Privora</span>
        </Link>
        <div className="navbar-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${isActive ? "navbar-link active" : "navbar-link"}${link.to === "/what-we-know" ? " navbar-cta" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <button
          type="button"
          className="theme-toggle"
          aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
          aria-pressed={isDark}
          title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          <span className="theme-toggle-track" aria-hidden="true">
            <span className="theme-toggle-thumb">{isDark ? "☾" : "☀"}</span>
          </span>
          <span className="theme-toggle-label">{isDark ? "Escuro" : "Claro"}</span>
        </button>
      </nav>
    </header>
  );
}
