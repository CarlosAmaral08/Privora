import { useEffect } from "react";
import { Link } from "react-router-dom";

const POLICY_TITLE = "Política de Privacidade da Privora";
const POLICY_DESCRIPTION =
  "Saiba como o portal web e a extensão Chromium da Privora tratam dados, usam o OpenRouter e oferecem controles ao usuário.";

const sections = [
  ["scope", "Escopo"],
  ["portal-data", "Dados do portal"],
  ["extension-data", "Dados da extensão"],
  ["page-access", "Acesso às páginas"],
  ["analysis-use", "Análise por IA"],
  ["third-parties", "Terceiros"],
  ["retention", "Persistência e retenção"],
  ["storage", "Cookies e armazenamento"],
  ["purposes", "Finalidades"],
  ["choices", "Consentimento e controles"],
  ["security", "Segurança"],
  ["children", "Dados de crianças"],
  ["changes", "Alterações"],
  ["contact", "Contato"],
] as const;

export function PrivacyPolicy() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;

    document.title = `${POLICY_TITLE} — Privora`;
    description?.setAttribute("content", POLICY_DESCRIPTION);

    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) {
        description.setAttribute("content", previousDescription);
      }
    };
  }, []);

  return (
    <article className="page page-policy">
      <Link to="/" className="policy-back-link">
        <span aria-hidden="true">←</span> Voltar ao portal
      </Link>

      <header className="policy-hero">
        <div className="policy-hero-copy">
          <span className="page-kicker">Documento público</span>
          <h1>{POLICY_TITLE}</h1>
          <p className="lead">
            Este documento explica, em linguagem direta, como o portal web e a extensão de navegador
            Privora tratam dados no estado atual do projeto.
          </p>
        </div>
        <dl className="policy-meta">
          <div>
            <dt>Última atualização</dt>
            <dd>16 de setembro de 2026</dd>
          </div>
          <div>
            <dt>Versão</dt>
            <dd>MVP acadêmico</dd>
          </div>
          <div>
            <dt>Aplica-se a</dt>
            <dd>Portal web e extensão Chromium</dd>
          </div>
        </dl>
      </header>

      <section className="policy-quick-summary" aria-labelledby="quick-summary-title">
        <div className="policy-section-heading">
          <span className="policy-section-number">Em resumo</span>
          <h2 id="quick-summary-title">O essencial antes de continuar</h2>
        </div>
        <ul className="policy-summary-list">
          <li>A Privora não monitora sua navegação geral.</li>
          <li>A extensão só analisa uma página ou documento após uma ação explícita sua.</li>
          <li>O título, a URL e o texto escolhidos são enviados ao backend da Privora e ao provedor de IA.</li>
          <li>O código atual não mantém histórico persistente do conteúdo ou das respostas das análises.</li>
          <li>A análise organiza o que o documento declara e mantém um link para a fonte original.</li>
        </ul>
      </section>

      <div className="policy-layout">
        <nav className="policy-toc" aria-label="Nesta política">
          <strong>Nesta política</strong>
          <ol>
            {sections.map(([id, label], index) => (
              <li key={id}>
                <a href={`#${id}`}><span>{String(index + 1).padStart(2, "0")}</span>{label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="policy-document">
          <section id="scope" className="policy-section">
            <span className="policy-section-number">01</span>
            <h2>Escopo e estado atual</h2>
            <p>
              A Privora é um MVP acadêmico sobre privacidade, transparência e coleta de dados em sistemas de
              CRM. Seu objetivo é diminuir a distância entre informação disponível e informação compreensível,
              sem tratar CRM como algo inerentemente negativo.
            </p>
            <p>Esta política cobre dois produtos que funcionam de formas diferentes:</p>
            <ul>
              <li><strong>Portal web Privora:</strong> experiência educativa com sessão, consentimentos, quiz, painel de transparência, RFV e indicadores agregados.</li>
              <li><strong>Extensão Privora para Chromium:</strong> descoberta, extração e análise, por solicitação do usuário, de políticas e outros documentos.</li>
            </ul>
            <p>
              A página educativa <Link to="/privacy">Privacidade &amp; LGPD</Link> apresenta conceitos gerais.
              Esta página é o documento específico sobre o tratamento de dados realizado pela Privora.
            </p>
          </section>

          <section id="portal-data" className="policy-section">
            <span className="policy-section-number">02</span>
            <h2>Dados tratados pelo portal web</h2>
            <p>
              Ao abrir o portal, o backend cria ou recupera uma sessão identificada por um UUID aleatório.
              Esse identificador permite relacionar os registros da mesma sessão sem exigir uma conta nominal.
            </p>
            <div className="policy-data-grid">
              <div>
                <h3>Sessão</h3>
                <p>UUID, data da primeira visita e data da visita mais recente.</p>
              </div>
              <div>
                <h3>Consentimentos</h3>
                <p>Categorias necessárias, preferências e métricas, com estado e data da última alteração.</p>
              </div>
              <div>
                <h3>Interações internas</h3>
                <p>Tipo do evento, horário e, em alguns fluxos, contexto curto como página, categoria ou pontuação.</p>
              </div>
              <div>
                <h3>Quiz e RFV</h3>
                <p>Pontuação, total de perguntas, conclusão e o resultado posicional R-F-V calculado a partir de eventos registrados.</p>
              </div>
            </div>
            <p>
              O evento necessário de visualização do conteúdo inicial pode ser registrado para o funcionamento
              da experiência educativa. Os demais eventos do CRM dependem do consentimento de métricas. O
              resultado do quiz é salvo quando o usuário o envia, e o RFV é recalculado a partir dos eventos que
              efetivamente foram registrados.
            </p>
            <p>
              O dashboard público mostra somente contagens, taxas e distribuição agregada de segmentos. Os
              fluxos atuais do portal não solicitam nome, e-mail, CPF, telefone ou localização, e o banco da
              aplicação não possui campos para esses dados. A aplicação também não implementa fingerprinting do
              dispositivo nem histórico de navegação fora da Privora.
            </p>
          </section>

          <section id="extension-data" className="policy-section">
            <span className="policy-section-number">03</span>
            <h2>Dados tratados pela extensão</h2>
            <p>
              Quando o usuário pede uma análise, a extensão envia ao endpoint da Privora somente os seguintes
              campos relacionados à página ou ao documento escolhido:
            </p>
            <ul>
              <li><code>sourceUrl</code>: endereço da fonte, usado como metadado e para manter acesso ao original;</li>
              <li><code>title</code>: título identificado na página ou no documento;</li>
              <li><code>text</code>: texto relevante extraído localmente, limitado a 40.000 caracteres.</li>
            </ul>
            <p>Além disso, a extensão mantém localmente:</p>
            <ul>
              <li>a preferência de tema claro ou escuro no armazenamento local da própria extensão;</li>
              <li>estado temporário de continuação entre abas, incluindo dados do documento e da aba necessários para concluir uma ação iniciada pelo usuário.</li>
            </ul>
            <div className="policy-callout">
              <strong>O que a extensão não coleta</strong>
              <p>
                Ela não mantém histórico geral de navegação, lista de abas abertas, valores de cookies,
                credenciais, conteúdo de páginas que o usuário não escolheu analisar ou chave do OpenRouter.
                A extensão não possui permissão de cookies e chama o endpoint de análise com credenciais omitidas.
              </p>
            </div>
          </section>

          <section id="page-access" className="policy-section">
            <span className="policy-section-number">04</span>
            <h2>Como a extensão acessa páginas</h2>
            <p>
              Ao abrir o popup, a extensão pode inspecionar na aba ativa textos, rótulos e endereços de links
              para localizar políticas de privacidade, termos, documentos de cookies ou páginas legais. A
              extração do texto para análise acontece somente após o usuário escolher a página ou o documento e
              acionar a análise.
            </p>
            <ul>
              <li><strong><code>activeTab</code>:</strong> concede acesso temporário à aba em que o usuário acionou a extensão.</li>
              <li><strong><code>scripting</code>:</strong> permite executar, na aba autorizada, o código local de descoberta e extração.</li>
              <li><strong><code>storage</code>:</strong> mantém o estado temporário necessário à continuação entre abas.</li>
              <li><strong>Permissão do backend:</strong> autoriza comunicação apenas com a origem da Privora configurada no pacote.</li>
              <li><strong>Permissões opcionais de site:</strong> permitem solicitar acesso à origem HTTP ou HTTPS do documento selecionado quando o acesso temporário não basta.</li>
            </ul>
            <p>
              A permissão opcional é pedida depois de uma ação do usuário e para a origem necessária. Em alguns
              sites, o documento precisa ser aberto em uma nova aba; o navegador pode exigir que o usuário clique
              novamente no ícone da Privora. A origem do próprio documento também pode receber uma requisição do
              navegador para carregar a página original.
            </p>
          </section>

          <section id="analysis-use" className="policy-section">
            <span className="policy-section-number">05</span>
            <h2>Uso do conteúdo analisado</h2>
            <p>
              O texto escolhido é usado para executar a análise solicitada. <code>sourceUrl</code> e{" "}
              <code>title</code> fornecem contexto ao modelo, mas o backend não visita nem busca a URL recebida.
              URL, título e texto são tratados como conteúdo não confiável.
            </p>
            <p>
              O backend envia esses dados ao OpenRouter em uma solicitação ao modelo de IA configurado. A resposta
              deve seguir uma estrutura que abrange resumo, categorias de dados, finalidades, compartilhamento,
              retenção, controles, direitos, CRM/personalização/marketing/perfilamento e ressalvas.
            </p>
            <p>
              A IA é instruída a ignorar comandos presentes no documento, não inventar informações ausentes e não
              emitir veredito jurídico. Campos ausentes devem aparecer como “Não informado”, lista vazia ou
              {" "}<code>null</code>, conforme o tipo. A análise é um auxílio de leitura e não substitui a fonte
              original nem aconselhamento jurídico.
            </p>
          </section>

          <section id="third-parties" className="policy-section">
            <span className="policy-section-number">06</span>
            <h2>Compartilhamento com terceiros</h2>
            <h3>OpenRouter e modelo de IA</h3>
            <p>
              O conteúdo analisado — incluindo URL, título e texto — é compartilhado com o OpenRouter, que atua
              como intermediário de acesso ao modelo de IA configurado, somente para executar a funcionalidade
              solicitada pelo usuário. O modelo pode variar conforme a configuração do backend.
            </p>
            <p>
              A Privora não afirma que o OpenRouter ou o provedor do modelo nunca retêm dados. O tratamento feito
              por esses fornecedores está sujeito às configurações disponíveis e às políticas deles. Não envie
              para análise um documento que contenha informações confidenciais que você não deseja encaminhar ao
              provedor de IA.
            </p>
            <h3>Infraestrutura da Privora</h3>
            <p>
              As requisições também transitam pela infraestrutura que hospeda o site e o backend da Privora. O
              repositório não define um fornecedor específico de hospedagem nem implementa, no banco funcional,
              cadastro de endereço IP, geolocalização ou identificação de dispositivo. Eventuais registros
              operacionais do ambiente dependem da configuração da hospedagem.
            </p>
            <div className="policy-callout compact-callout">
              <strong>Sem venda de dados</strong>
              <p>
                A Privora não implementa venda de dados e não usa o conteúdo selecionado para publicidade,
                crédito, empréstimos ou finalidades não relacionadas à análise solicitada.
              </p>
            </div>
          </section>

          <section id="retention" className="policy-section">
            <span className="policy-section-number">07</span>
            <h2>Persistência e retenção</h2>
            <h3>Extensão e análises</h3>
            <p>
              O código atual não grava o texto do documento nem a resposta da IA no H2, em histórico de análises
              ou no armazenamento da extensão. Esses dados permanecem em memória durante o fluxo. O estado de
              continuação em <code>chrome.storage.session</code> não contém o texto extraído e é temporário: ele é
              removido ao ser consumido, ao fechar a aba ou depois de expirar. A preferência de tema permanece
              localmente até ser alterada ou removida pelo usuário/navegador.
            </p>
            <p>
              Esta ausência de persistência pela aplicação não é uma garantia sobre retenção realizada pelo
              OpenRouter, pelo provedor do modelo ou pela infraestrutura de rede, cujas práticas próprias podem se
              aplicar ao processamento.
            </p>
            <h3>Portal web</h3>
            <p>
              Sessão, consentimentos, eventos, resultados do quiz e RFV são persistidos atualmente em banco H2.
              O código não implementa um prazo automático de descarte desses registros. O usuário pode apagá-los
              pela área <Link to="/settings">Configurações de privacidade</Link>; a exclusão remove os registros
              associados ao UUID e apaga o cookie de sessão.
            </p>
          </section>

          <section id="storage" className="policy-section">
            <span className="policy-section-number">08</span>
            <h2>Cookies e armazenamento local</h2>
            <div className="policy-storage-list">
              <div>
                <code>session_id</code>
                <p>
                  Cookie necessário do portal com o UUID da sessão. É marcado como <code>HttpOnly</code>, usa o
                  caminho raiz e o código atual define validade de até um ano. O frontend envia esse cookie apenas
                  nas chamadas do portal que exigem a sessão.
                </p>
              </div>
              <div>
                <code>privora-theme</code>
                <p>Preferência de tema salva em <code>localStorage</code> no portal e, separadamente, no contexto da extensão.</p>
              </div>
              <div>
                <code>privacidade-banner-decidido</code>
                <p>Marcador em <code>sessionStorage</code> que evita repetir o banner depois de uma escolha na sessão atual da aba.</p>
              </div>
              <div>
                <code>chrome.storage.session</code>
                <p>Estado temporário da extensão para abrir um documento e tentar continuar a análise na nova aba.</p>
              </div>
            </div>
          </section>

          <section id="purposes" className="policy-section">
            <span className="policy-section-number">09</span>
            <h2>Finalidades do tratamento</h2>
            <ul>
              <li>operar e reconhecer a sessão do portal;</li>
              <li>mostrar ao usuário o que a Privora sabe sobre essa sessão;</li>
              <li>registrar e permitir a alteração de consentimentos;</li>
              <li>guardar resultados do quiz e calcular o RFV educativo do portal;</li>
              <li>produzir indicadores agregados da experiência acadêmica;</li>
              <li>descobrir e extrair o documento que o usuário escolheu analisar;</li>
              <li>gerar e apresentar a análise estruturada solicitada;</li>
              <li>manter preferências locais de interface, como o tema.</li>
            </ul>
          </section>

          <section id="choices" className="policy-section">
            <span className="policy-section-number">10</span>
            <h2>Interação, consentimento e controles</h2>
            <p>
              O portal apresenta categorias de consentimento. A sessão necessária permanece ativa para operar a
              experiência; eventos opcionais do CRM dependem da permissão de métricas. Esta política descreve o
              comportamento funcional do projeto e não atribui uma base legal específica que não tenha sido
              formalmente definida.
            </p>
            <p>
              Na extensão, a análise depende de solicitação explícita. Quando é preciso acessar outra origem, o
              Chromium apresenta uma solicitação adicional que pode ser recusada.
            </p>
            <p>Os controles disponíveis hoje permitem:</p>
            <ul>
              <li>visualizar os dados da sessão em <Link to="/what-we-know">O que sabemos</Link>;</li>
              <li>baixar em JSON os dados apresentados no painel;</li>
              <li>alterar consentimentos opcionais;</li>
              <li>excluir sessão, consentimentos, eventos, quiz e RFV associados;</li>
              <li>deixar de usar ou desinstalar a extensão;</li>
              <li>revogar permissões de sites nas configurações de extensões do navegador.</li>
            </ul>
          </section>

          <section id="security" className="policy-section">
            <span className="policy-section-number">11</span>
            <h2>Medidas de segurança do projeto</h2>
            <ul>
              <li>a chave do OpenRouter fica no ambiente do backend e não é distribuída com o portal ou a extensão;</li>
              <li>a extensão usa <code>credentials: "omit"</code> ao chamar o endpoint de análise;</li>
              <li>o backend valida o tamanho e o formato de <code>sourceUrl</code>, <code>title</code> e <code>text</code> e não busca a URL;</li>
              <li>o documento é isolado no prompt como conteúdo não confiável;</li>
              <li>a resposta do modelo deve respeitar um JSON Schema e é analisada e validada pelo backend;</li>
              <li>o popup escapa o conteúdo textual antes de inseri-lo no HTML;</li>
              <li>as permissões obrigatórias da extensão são limitadas ao necessário para o fluxo atual.</li>
            </ul>
            <p>
              Essas medidas reduzem riscos, mas nenhum sistema ou transmissão pela internet oferece segurança
              absoluta. O projeto deve continuar sendo revisado quando sua arquitetura ou implantação mudar.
            </p>
          </section>

          <section id="children" className="policy-section">
            <span className="policy-section-number">12</span>
            <h2>Dados de crianças e adolescentes</h2>
            <p>
              A Privora não é destinada especificamente a crianças e não possui mecanismo de verificação de
              idade. Os fluxos atuais não solicitam cadastro nominal. Usuários e responsáveis devem evitar
              selecionar para análise documentos que revelem dados pessoais de crianças ou outras informações
              confidenciais.
            </p>
          </section>

          <section id="changes" className="policy-section">
            <span className="policy-section-number">13</span>
            <h2>Alterações nesta política</h2>
            <p>
              Esta política pode ser atualizada quando o portal, a extensão, os fornecedores ou as práticas de
              tratamento mudarem. A versão publicada nesta URL deve refletir o comportamento atual da Privora; a
              data no início do documento indica a revisão mais recente.
            </p>
          </section>

          <section id="contact" className="policy-section policy-contact-section">
            <span className="policy-section-number">14</span>
            <h2>Contato</h2>
            <p>
              O projeto não publica atualmente um endereço de e-mail específico para privacidade. Dúvidas,
              correções documentais ou relatos sobre o funcionamento podem ser encaminhados pelos canais
              disponíveis no repositório público do projeto.
            </p>
            <a
              href="https://github.com/CarlosAmaral08/Privora"
              target="_blank"
              rel="noopener noreferrer"
              className="policy-contact-link"
            >
              Acessar repositório da Privora no GitHub <span aria-hidden="true">↗</span>
            </a>
          </section>
        </div>
      </div>
    </article>
  );
}
