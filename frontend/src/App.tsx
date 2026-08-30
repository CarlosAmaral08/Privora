import { BrowserRouter, Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { ConsentBanner } from "./components/ConsentBanner";
import { SessionProvider, useSession } from "./context/SessionContext";
import { Home } from "./pages/Home";
import { Privacy } from "./pages/Privacy";
import { WhatWeKnow } from "./pages/WhatWeKnow";
import { Quiz } from "./pages/Quiz";
import { Settings } from "./pages/Settings";
import { Dashboard } from "./pages/Dashboard";
import { Apresentacao } from "./pages/Apresentacao";

function AppShell() {
  const { carregando } = useSession();

  if (carregando) {
    return <div className="loading-screen">Carregando sessão...</div>;
  }

  return (
    <BrowserRouter>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
	  <Route path="/apresentacao" element={<Apresentacao />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/what-we-know" element={<WhatWeKnow />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      <ConsentBanner />
    </BrowserRouter>
  );
}

function App() {
  return (
    <SessionProvider>
      <AppShell />
    </SessionProvider>
  );
}

export default App;
