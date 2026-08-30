import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";

export function Home() {
  const { registrarEvento } = useSession();

  useEffect(() => {
    registrarEvento("VIEW_CONTENT", "home");
  }, [registrarEvento]);

  return (
    <section className="page page-home">
      <h1>Seus dados contam uma história. Você deve saber quem está lendo.</h1>
      <p className="lead">
        Todos os dias, sites e aplicativos utilizam informações para oferecer serviços, personalizar
        experiências e manter contato com seus usuários. O problema começa quando esse processo acontece
        sem compreensão.
      </p>
      <p>
        Privacidade não significa deixar de usar tecnologia. Significa entender quais dados são
        coletados, por que são utilizados e quais escolhas estão disponíveis. A LGPD garante direitos
        sobre seus dados pessoais — conhecê-los é o primeiro passo para tomar decisões mais conscientes.
      </p>
      <blockquote>
        "Se um sistema usa seus dados para conhecê-lo, você também deveria poder conhecer o sistema."
      </blockquote>
      <Link to="/what-we-know" className="cta-button">
        Veja o que este site sabe sobre você
      </Link>
    </section>
  );
}
