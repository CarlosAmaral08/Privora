import { useEffect } from "react";
import { Link } from "react-router-dom";
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
      <header className="page-header">
        <span className="page-kicker">Conhecimento é controle</span>
        <h1>Privacidade &amp; LGPD</h1>
        <p className="lead">
          Conceitos essenciais para entender como seus dados circulam e quais escolhas a lei coloca nas suas mãos.
        </p>
      </header>

      <div className="card-grid knowledge-grid">
        {cards.map((card, index) => (
          <article className="card knowledge-card" key={card.titulo}>
            <span className="card-index">0{index + 1}</span>
            <h3>{card.titulo}</h3>
            <p>{card.texto}</p>
          </article>
        ))}
      </div>

      <section className="content-panel rights-panel">
        <div className="panel-heading">
          <span className="panel-icon" aria-hidden="true">✓</span>
          <div>
            <span className="page-kicker">Direitos do titular</span>
            <h2>Escolhas garantidas pela LGPD</h2>
          </div>
        </div>
        <ul className="rights-list">
          {direitos.map((direito) => (
            <li key={direito}><span aria-hidden="true">→</span>{direito}</li>
          ))}
        </ul>
      </section>

      <section className="content-panel policy-reference-panel" aria-labelledby="policy-reference-title">
        <div>
          <span className="page-kicker">Documento público</span>
          <h2 id="policy-reference-title">Como a própria Privora trata dados</h2>
          <p>
            Consulte o documento formal que descreve o portal, a extensão Chromium, a análise por IA,
            os terceiros envolvidos e os controles disponíveis.
          </p>
        </div>
        <Link to="/privacy-policy" className="button policy-reference-link">
          Ler Política de Privacidade <span aria-hidden="true">→</span>
        </Link>
      </section>

      <p className="page-closing">Entenda seus dados. Conheça seus direitos. Assuma o controle.</p>
    </section>
  );
}
