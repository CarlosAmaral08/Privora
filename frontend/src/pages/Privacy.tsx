import { useEffect } from "react";
import { useSession } from "../context/SessionContext";

const cards = [
  {
    titulo: "O que são dados pessoais?",
    texto: "Qualquer informação que possa identificar você, direta ou indiretamente: nome, e-mail, localização, hábitos de navegação e até um identificador anônimo combinado com outros dados.",
  },
  {
    titulo: "Por que privacidade importa?",
    texto: "Seus dados moldam decisões sobre você: o que você vê, o preço que paga, as oportunidades que recebe. Entender a coleta é entender essas decisões.",
  },
  {
    titulo: "Exemplos comuns de coleta",
    texto: "Cookies de rastreamento, pixels de redes sociais, fingerprinting de dispositivo, geolocalização em segundo plano e formulários com mais campos do que o necessário.",
  },
  {
    titulo: "O que é a LGPD?",
    texto: "A Lei Geral de Proteção de Dados (Lei 13.709/2018) regula como empresas e sites podem coletar, usar e armazenar dados pessoais no Brasil, e garante direitos a você sobre essas informações.",
  },
];

const direitos = [
  "Confirmação da existência de tratamento de dados",
  "Acesso aos dados coletados",
  "Correção de dados incompletos ou desatualizados",
  "Portabilidade dos dados a outro fornecedor",
  "Eliminação dos dados tratados com consentimento",
  "Revogação do consentimento a qualquer momento",
];

export function Privacy() {
  const { registrarEvento } = useSession();

  useEffect(() => {
    registrarEvento("VIEW_RIGHTS_SECTION", "privacy-page");
  }, [registrarEvento]);

  return (
    <section className="page page-privacy">
      <h1>Privacidade & LGPD</h1>
      <div className="card-grid">
        {cards.map((card) => (
          <div className="card" key={card.titulo}>
            <h3>{card.titulo}</h3>
            <p>{card.texto}</p>
          </div>
        ))}
      </div>

      <h2>Seus direitos como titular de dados</h2>
      <ul className="rights-list">
        {direitos.map((direito) => (
          <li key={direito}>{direito}</li>
        ))}
      </ul>

      <p className="closing">Entenda seus dados. Conheça seus direitos. Assuma o controle.</p>
    </section>
  );
}
