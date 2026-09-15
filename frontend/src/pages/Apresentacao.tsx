export function Apresentacao() {
  return (
    <div className="page presentation-page">
      <section className="presentation-hero">
        <span className="page-kicker">Projeto integrador</span>

        <h1>Privora</h1>

        <p className="lead">
          Privacidade, coleta de dados e comunicação consciente em sistemas de CRM.
        </p>

        <blockquote><span aria-hidden="true">“</span>Se um sistema usa seus dados para conhecê-lo, você também deveria poder conhecer o sistema.</blockquote>
      </section>

      <section className="presentation-section content-panel storybook-section">
        <div className="presentation-section-copy">
          <span className="page-kicker">A história</span>
          <h2>Storybook</h2>
          <p>
          Antes de apresentar a solução, acompanhamos Lucas em uma situação comum:
          utilizar serviços digitais sem compreender completamente o que acontece
          com seus dados.
          </p>
        </div>

        <div className="storybook-container">
          <iframe
            src="/privora-storybook.pdf"
            title="Storybook Privora"
            className="storybook-frame"
          />
        </div>

        <div className="presentation-actions">
          <a
            href="/privora-storybook.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button"
          >
            Abrir storybook em tela cheia
          </a>
        </div>
      </section>

      <section className="presentation-section">
        <span className="page-kicker">Pesquisa exploratória</span>

        <h2>Preocupação existe. Compreensão e ação ainda são limitadas.</h2>

        <p>
          Para compreender melhor o problema, realizamos um questionário exploratório
          com cinco participantes sobre hábitos relacionados à privacidade e à LGPD.
        </p>

        <div className="research-grid">
          <article className="research-card"><span className="card-index">01</span>
            <strong className="research-number">3/5</strong>
            <span>
              nunca verificam cookies antes de aceitar; os outros 2 raramente verificam.
            </span>
          </article>

          <article className="research-card"><span className="card-index">02</span>
            <strong className="research-number">5/5</strong>
            <span>
              nunca ou raramente leem políticas de privacidade.
            </span>
          </article>

          <article className="research-card"><span className="card-index">03</span>
            <strong className="research-number">4/5</strong>
            <span>
              não conhecem a LGPD ou apenas ouviram falar sobre ela.
            </span>
          </article>

          <article className="research-card"><span className="card-index">04</span>
            <strong className="research-number">3/5</strong>
            <span>
              não sabem como solicitar a uma empresa informações sobre seus dados.
            </span>
          </article>

          <article className="research-card"><span className="card-index">05</span>
            <strong className="research-number">5/5</strong>
            <span>
              demonstraram preocupação moderada com sua privacidade.
            </span>
          </article>
        </div>

        <div className="research-conclusion">
          <span>preocupação</span>
          <strong>→</strong>
          <span>pouca compreensão</span>
          <strong>→</strong>
          <span>pouca ação</span>
        </div>

        <p className="research-note">
          Amostra exploratória com cinco respondentes. Os resultados ajudam a
          compreender o problema observado pelo grupo, mas não permitem
          generalização estatística.
        </p>
      </section>

      <section className="presentation-section presentation-transition">
        <span className="page-kicker">A solução</span>

        <h2>E se a transparência pudesse ser experimentada?</h2>

        <p>
          A Privora foi criada para transformar informação abstrata sobre privacidade
          em uma experiência prática de transparência, educação e controle.
        </p>

        <a href="/" className="cta-button">
          Conhecer a Privora
        </a>
      </section>
    </div>
  );
}
