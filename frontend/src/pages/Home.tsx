import { useEffect } from "react";
import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";
import { useSession } from "../context/SessionContext";

const researchFindings = [
  { value: "3/5", text: "nunca verificam cookies antes de aceitar; os outros 2 raramente verificam." },
  { value: "5/5", text: "nunca ou raramente leem políticas de privacidade." },
  { value: "4/5", text: "não conhecem a LGPD ou apenas ouviram falar sobre ela." },
  { value: "3/5", text: "não sabem como pedir a uma empresa informações sobre seus dados." },
  { value: "5/5", text: "demonstraram preocupação moderada com sua privacidade." },
];

const journey = [
  {
    number: "01",
    title: "Entender",
    text: "Traduzir conceitos técnicos para uma linguagem que faça sentido no cotidiano.",
  },
  {
    number: "02",
    title: "Visualizar",
    text: "Tornar visíveis os registros e critérios que normalmente ficam escondidos.",
  },
  {
    number: "03",
    title: "Controlar",
    text: "Oferecer escolhas claras para revisar consentimentos, exportar ou apagar dados.",
  },
];

const portalFeatures = [
  "Visualizar o identificador, as datas e os eventos associados à sua sessão",
  "Conhecer direitos e testar seus conhecimentos no conteúdo educativo e no quiz",
  "Revisar consentimentos, exportar os dados exibidos ou excluir a sessão",
];

const extensionFeatures = [
  "Encontrar políticas, termos e documentos de cookies na página escolhida",
  "Organizar categorias de dados, finalidades, compartilhamento e retenção quando informada",
  "Consultar controles, direitos, ressalvas e a fonte original do documento analisado",
];

export function Home() {
  const { registrarEvento } = useSession();

  useEffect(() => {
    registrarEvento("VIEW_CONTENT", "home");
  }, [registrarEvento]);

  return (
    <div className="page page-home">
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Transparência para escolhas conscientes
          </span>
          <h1 id="hero-title">
            Seus dados. <em>Seus direitos. Suas regras.</em>
          </h1>
          <p>
            Entenda como seus dados são utilizados sem precisar ser especialista em tecnologia ou legislação.
          </p>
          <div className="hero-actions">
            <Link to="/what-we-know" className="button button-primary">
              Ver o que sabemos sobre você <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/privacy" className="button button-secondary">
              Entender privacidade
            </Link>
          </div>
          <div className="hero-trust" aria-label="Princípios da Privora">
            <span>Clareza sem juridiquês</span>
            <span>Escolhas visíveis</span>
            <span>Fonte original preservada</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Dados em camadas: entender, visualizar e controlar">
          <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
          <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
          <span className="hero-label hero-label-top">entender</span>
          <span className="hero-label hero-label-right">visualizar</span>
          <span className="hero-label hero-label-bottom">controlar</span>
          <div className="hero-image-wrap">
            <img src={heroImage} alt="Camadas de informação conectadas" />
          </div>
          <div className="hero-status-card">
            <span className="status-indicator" aria-hidden="true" />
            <div>
              <small>Estado atual</small>
              <strong>Você no controle</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="problem-section home-section" aria-labelledby="problem-title">
        <div className="section-heading section-heading-split">
          <div>
            <span className="section-kicker">01 — O problema</span>
            <h2 id="problem-title">Informação disponível não significa informação acessível.</h2>
          </div>
          <p>
            Políticas extensas, linguagem técnica e informações dispersas dificultam entender quais dados são
            tratados, por que são utilizados, com quem podem ser compartilhados e quais escolhas estão disponíveis.
          </p>
        </div>

        <div className="research-panel">
          <div className="research-intro">
            <span className="research-tag">Pesquisa exploratória · n=5</span>
            <p>
              A pesquisa do grupo ajudou a observar a distância entre preocupação, compreensão e ação.
            </p>
          </div>
          <div className="research-results">
            {researchFindings.map((finding) => (
              <article className="research-result" key={finding.text}>
                <strong>{finding.value}</strong>
                <p>{finding.text}</p>
              </article>
            ))}
          </div>
          <p className="sample-note">
            Estes dados ajudam a explorar o problema observado pelo grupo; a amostra é pequena e não é
            estatisticamente representativa.
          </p>
        </div>
      </section>

      <section className="journey-section home-section" aria-labelledby="journey-title">
        <div className="section-heading centered-heading">
          <span className="section-kicker">02 — A proposta</span>
          <h2 id="journey-title">Privacidade pode ser mais simples.</h2>
          <p>
            A Privora reduz a distância entre a informação que já existe e a capacidade do usuário de
            compreendê-la e agir. Seus dados fazem parte da sua vida. Entender como eles são utilizados também é
            um direito seu. A IA não substitui a política: ela ajuda a reduzir a fricção até a informação.
          </p>
        </div>

        <div className="journey-flow">
          {journey.map((step, index) => (
            <article className="journey-step" key={step.title}>
              <div className="journey-step-top">
                <span>{step.number}</span>
                {index < journey.length - 1 && <span className="journey-line" aria-hidden="true" />}
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="transparency-section home-section" aria-labelledby="transparency-title">
        <div className="transparency-copy">
          <span className="section-kicker light-kicker">03 — Transparência aplicada</span>
          <h2 id="transparency-title">Veja o que esta experiência sabe sobre você.</h2>
          <p>
            Uma área real do produto reúne tudo o que esta experiência registra sobre a sua sessão.
            Você vê o identificador anônimo, datas, eventos, consentimentos, quiz e perfil RFV no mesmo lugar.
          </p>
          <div className="no-tracking-note">
            <span aria-hidden="true">✓</span>
            <p>
              <strong>Nenhuma navegação externa é monitorada.</strong> A versão atual considera somente
              interações realizadas dentro da própria Privora.
            </p>
          </div>
          <Link to="/what-we-know" className="text-link text-link-light">
            Abrir meu painel de transparência <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="data-window" aria-label="Prévia da área O que sabemos sobre você">
          <div className="data-window-bar">
            <div className="window-dots" aria-hidden="true"><span /><span /><span /></div>
            <span>privora / seus dados</span>
            <span className="live-pill">sessão anônima</span>
          </div>
          <div className="data-window-body">
            <div className="data-profile">
              <div className="anonymous-avatar" aria-hidden="true">P</div>
              <div>
                <small>IDENTIFICADOR ANÔNIMO</small>
                <strong>usr_••••••••a42f</strong>
              </div>
              <span className="safe-badge">Não identificável</span>
            </div>
            <div className="data-stats">
              <div><span>Primeira visita</span><strong>Hoje</strong></div>
              <div><span>Eventos internos</span><strong>Visíveis</strong></div>
              <div><span>Consentimentos</span><strong>Editáveis</strong></div>
            </div>
            <div className="event-preview">
              <div className="event-preview-heading">
                <strong>Registros recentes</strong>
                <span>somente neste serviço</span>
              </div>
              <div className="event-row"><span className="event-icon">01</span><span>Visualizou conteúdo</span><time>agora</time></div>
              <div className="event-row"><span className="event-icon">02</span><span>Abriu transparência</span><time>visível</time></div>
              <div className="event-row muted-row"><span className="event-icon">—</span><span>Navegação externa</span><time>não coletada</time></div>
            </div>
          </div>
        </div>
      </section>

      <section className="rfv-section home-section" aria-labelledby="rfv-title">
        <div className="section-heading section-heading-split">
          <div>
            <span className="section-kicker">04 — CRM e responsabilidade</span>
            <h2 id="rfv-title">Conhecer melhor também exige responsabilidade.</h2>
          </div>
          <p>
            CRM ajuda empresas a conhecer clientes e oferecer experiências mais relevantes. Quanto maior o
            tratamento de dados, maior deve ser o compromisso com finalidade, necessidade e transparência.
            Privacidade não precisa ser uma barreira para o relacionamento. Quando o uso de dados é transparente,
            empresas e clientes podem construir relações mais confiáveis.
          </p>
        </div>

        <div className="rfv-visual">
          <div className="rfv-code-panel">
            <div className="code-labels" aria-hidden="true">
              <span>R<small>recência</small></span>
              <span>F<small>frequência</small></span>
              <span>V<small>valor</small></span>
            </div>
            <div className="code-digits" aria-label="Código RFV 155">
              <span>1</span><span>5</span><span>5</span>
            </div>
          </div>

          <div className="not-equal" aria-label="é diferente de">≠</div>

          <div className="rfv-code-panel alternate-code">
            <div className="code-labels" aria-hidden="true">
              <span>R<small>recência</small></span>
              <span>F<small>frequência</small></span>
              <span>V<small>valor</small></span>
            </div>
            <div className="code-digits" aria-label="Código RFV 551">
              <span>5</span><span>5</span><span>1</span>
            </div>
          </div>

          <div className="rfv-explanation">
            <span className="formula-label">RFV com contexto</span>
            <p>
              <strong>155 e 551 contam histórias diferentes.</strong> Na Privora, o RFV organiza apenas
              interações realizadas dentro do portal e preserva o significado de cada dimensão.
            </p>
          </div>
        </div>
      </section>

      <section className="extension-section home-section" aria-labelledby="extension-title">
        <div className="extension-copy">
          <span className="availability-pill"><span aria-hidden="true" /> Disponível na Chrome Web Store</span>
          <span className="section-kicker light-kicker">05 — Extensão Privora</span>
          <h2 id="extension-title">Entenda políticas enquanto navega.</h2>
          <p>
            A extensão Privora transforma políticas extensas em informações estruturadas e mais fáceis de
            compreender, destacando dados, finalidades, compartilhamento, retenção quando informada, controles,
            direitos e sinais de personalização, marketing ou perfilamento.
          </p>
          <p className="extension-disclaimer">
            A análise começa somente após sua ação. A extensão não monitora sua navegação geral, mantém a
            fonte original disponível e não fornece parecer jurídico.
          </p>
          <div className="extension-actions">
            <a
              href="https://chromewebstore.google.com/detail/jfbnopjkjpjjhhmgmeeedgjkkoogleid"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
            >
              Instalar extensão para Chrome <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="extension-demo" aria-label="Fluxo visual da extensão Privora">
          <div className="browser-shell">
            <div className="browser-topbar">
              <div className="window-dots" aria-hidden="true"><span /><span /><span /></div>
              <div className="address-bar">empresa.com/politica-de-privacidade</div>
              <div className="extension-mark" aria-hidden="true">P</div>
            </div>
            <div className="browser-content">
              <div className="policy-document" aria-hidden="true">
                <span className="document-title" />
                {Array.from({ length: 8 }).map((_, index) => <span key={index} />)}
              </div>
              <div className="analysis-bridge">
                <span>Análise</span>
                <i aria-hidden="true">→</i>
              </div>
              <div className="summary-panel">
                <small>RESUMO PRIVORA</small>
                <strong>O essencial, organizado.</strong>
                <div><span>✓</span><p>Dados coletados</p></div>
                <div><span>✓</span><p>Finalidades declaradas</p></div>
                <div><span>✓</span><p>Seus direitos e escolhas</p></div>
                <span className="source-link-preview">Ver política original ↗</span>
              </div>
            </div>
          </div>
          <p className="concept-caption">Documento original → informações estruturadas → escolhas mais claras.</p>
        </div>
      </section>

      <section className="privacy-design-section home-section" aria-labelledby="privacy-design-title">
        <div className="section-heading centered-heading compact-heading">
          <span className="section-kicker">06 — O que você pode fazer</span>
          <h2 id="privacy-design-title">Entender é o primeiro passo para escolher.</h2>
        </div>

        <div className="privacy-columns">
          <article className="privacy-column collected-column">
            <span className="column-icon" aria-hidden="true">P</span>
            <p className="column-label">No portal</p>
            <h3>Informação que você pode ver e controlar.</h3>
            <ul>
              {portalFeatures.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
          <article className="privacy-column excluded-column">
            <span className="column-icon" aria-hidden="true">↗</span>
            <p className="column-label">Na extensão</p>
            <h3>Políticas organizadas para uma leitura mais clara.</h3>
            <ul>
              {extensionFeatures.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </div>
      </section>

      <section className="closing-section home-section" aria-labelledby="closing-title">
        <div className="closing-glow" aria-hidden="true" />
        <span className="section-kicker light-kicker">Transparência fortalece relações</span>
        <h2 id="closing-title">
          Informação gera consciência.<br />
          Transparência gera confiança.<br />
          E confiança fortalece relacionamentos duradouros.
        </h2>
        <p className="campaign-slogan">Seus dados. Seus direitos. Suas regras.</p>
        <div className="closing-actions">
          <Link to="/what-we-know" className="button button-primary">Ver o que sabemos sobre você <span aria-hidden="true">↗</span></Link>
          <Link to="/privacy" className="closing-link">Privacidade &amp; LGPD <span aria-hidden="true">→</span></Link>
          <Link to="/quiz" className="closing-link">Fazer o quiz <span aria-hidden="true">→</span></Link>
          <Link to="/settings" className="closing-link">Revisar configurações <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </div>
  );
}
