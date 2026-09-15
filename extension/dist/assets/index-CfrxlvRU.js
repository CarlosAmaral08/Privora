(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=new Set([`http:`,`https:`]),t=[`privacy`,`privacidade`,`policy`,`politica`,`política`,`terms`,`termos`,`legal`,`lgpd`,`cookies`];async function n(){if(typeof chrome>`u`||!chrome.tabs?.query)return{title:`Política de Privacidade — Página de exemplo`,url:`https://exemplo.com/politica-de-privacidade`,supported:!0};let[e]=await chrome.tabs.query({active:!0,currentWindow:!0});if(!e?.url)throw Error(`Não foi possível identificar a aba atual.`);let t=i(e.url);return{tabId:e.id,title:e.title?.trim()||`Página sem título`,url:e.url,supported:t,unsupportedReason:t?void 0:`Esta página é protegida pelo navegador e não pode ser analisada.`}}function r(e){let n=`${e.title} ${e.url}`.normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).toLowerCase();return t.some(e=>n.includes(e.normalize(`NFD`).replace(/[\u0300-\u036f]/g,``)))}function i(t){try{return e.has(new URL(t).protocol)}catch{return!1}}var a=1100,o=[{id:`collectedData`,title:`Dados coletados`,summary:`A política declara coleta de dados cadastrais, técnicos e de uso.`,items:[`Dados informados em formulários`,`Endereço IP e dispositivo`,`Interações com o serviço`]},{id:`purposes`,title:`Finalidades`,summary:`Os dados são usados para operar, proteger e melhorar o serviço.`,items:[`Prestação do serviço`,`Segurança e prevenção a fraudes`,`Personalização da experiência`]},{id:`sharing`,title:`Compartilhamento`,summary:`Pode ocorrer com fornecedores essenciais e mediante obrigação legal.`,items:[`Infraestrutura e hospedagem`,`Processadores contratados`,`Autoridades, quando exigido`]},{id:`retention`,title:`Retenção`,summary:`Os prazos variam conforme finalidade e obrigações aplicáveis.`,items:[`Durante a relação com o serviço`,`Conforme prazo legal`,`Até solicitação válida de exclusão`]},{id:`rights`,title:`Direitos`,summary:`O titular pode solicitar acesso, correção, portabilidade e exclusão.`,items:[`Confirmar e acessar o tratamento`,`Corrigir dados`,`Revogar consentimento`]},{id:`controls`,title:`Controles disponíveis`,summary:`A política indica canais e configurações para exercer escolhas.`,items:[`Preferências de cookies`,`Canal de privacidade`,`Download ou exclusão de dados`]}];async function s(e){return await new Promise(e=>window.setTimeout(e,a)),r(e)?{sourceUrl:e.url,sourceTitle:e.title,summary:`Esta é uma prévia visual de como a Privora poderá organizar uma política extensa em tópicos verificáveis.`,sections:o,generatedBy:`development-mock`}:null}var c=`privora-extension-theme`,l={idle:`Pronta para analisar esta página`,analyzing:`Analisando estrutura da política…`,success:`Resumo demonstrativo concluído`,error:`Não foi possível concluir a análise`,unsupported:`Página sem conteúdo adequado`};function u(e){let t=null,r=`idle`,i=v();e.innerHTML=d();let a=S(e,`[data-theme-toggle]`),o=S(e,`[data-analyze]`),c=S(e,`[data-page-title]`),u=S(e,`[data-page-url]`),x=S(e,`[data-status]`),C=S(e,`[data-result]`);y(i,a),f(C),a.addEventListener(`click`,()=>{i=i===`light`?`dark`:`light`,y(i,a)}),o.addEventListener(`click`,async()=>{if(r!==`analyzing`){if(!t){await w();return}if(t.supported){T(`analyzing`),p(C);try{let e=await s(t);if(!e){T(`unsupported`),h(C,`Não encontramos indícios de uma política, termos ou conteúdo de privacidade nesta página.`);return}T(`success`),m(C,e)}catch{T(`error`),g(C)}}}}),w();async function w(){try{t=await n(),c.textContent=t.title,u.textContent=b(t.url),u.title=t.url,t.supported?T(`idle`):(T(`unsupported`),h(C,t.unsupportedReason??`Esta página não pode ser analisada.`))}catch{c.textContent=`Página não identificada`,u.textContent=`Abra uma página e tente novamente`,T(`error`),g(C)}}function T(e){r=e,x.dataset.state=r,x.querySelector(`[data-status-text]`).textContent=l[r],C.setAttribute(`aria-busy`,String(r===`analyzing`)),o.disabled=r===`analyzing`||r===`unsupported`,o.innerHTML=_(r)}}function d(){return`
    <div class="popup-shell">
      <header class="product-header">
        <div class="brand" aria-label="Privora">
          <span class="brand-mark" aria-hidden="true"><i></i><i></i></span>
          <span>Privora</span>
        </div>
        <button class="theme-toggle" type="button" data-theme-toggle aria-pressed="false">
          <span class="theme-icon" aria-hidden="true">☀</span>
          <span data-theme-label>Claro</span>
        </button>
      </header>

      <main>
        <section class="page-context" aria-labelledby="current-page-label">
          <span class="eyebrow" id="current-page-label">Página atual</span>
          <div class="page-row">
            <span class="page-icon" aria-hidden="true">↗</span>
            <div>
              <h1 data-page-title>Identificando página…</h1>
              <p data-page-url>aguarde</p>
            </div>
          </div>
        </section>

        <section class="analysis-panel">
          <div class="status-row" data-status data-state="idle" role="status">
            <span class="status-dot" aria-hidden="true"></span>
            <span data-status-text>Pronta para analisar esta página</span>
          </div>
          <button class="analyze-button" type="button" data-analyze>
            <span>Analisar política</span><span aria-hidden="true">↗</span>
          </button>
          <p class="action-note">A análise só começa quando você solicitar.</p>
        </section>

        <section class="result-region" data-result aria-live="polite" aria-busy="false"></section>
      </main>

      <footer><span aria-hidden="true"></span>Nenhuma navegação passiva ou histórico.</footer>
    </div>
  `}function f(e){e.innerHTML=`
    <div class="empty-result">
      <span class="empty-mark" aria-hidden="true"><i></i><i></i></span>
      <div><strong>Seu resumo aparecerá aqui</strong><p>Dados, finalidades e controles organizados em uma leitura simples.</p></div>
    </div>
  `}function p(e){e.innerHTML=`
    <div class="processing-state">
      <span class="processing-orbit" aria-hidden="true"><i></i></span>
      <strong>Preparando a estrutura</strong>
      <p>Esta etapa usa uma espera simulada para validar a interface.</p>
      <div class="skeleton-lines" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>
  `}function m(e,t){let n=t.sections.map((e,t)=>`
        <details class="result-section" ${t===0?`open`:``}>
          <summary><span class="section-number">0${t+1}</span><span>${x(e.title)}</span><i aria-hidden="true">+</i></summary>
          <div class="section-content">
            <p>${x(e.summary)}</p>
            <ul>${e.items.map(e=>`<li>${x(e)}</li>`).join(``)}</ul>
          </div>
        </details>
      `).join(``);e.innerHTML=`
    <div class="result-heading">
      <span class="mock-badge"><i aria-hidden="true"></i> Resultado mock</span>
      <h2>Política em perspectiva</h2>
      <p>${x(t.summary)}</p>
      <small>Simulação visual — nenhuma IA ou análise real foi executada.</small>
    </div>
    <div class="result-sections">${n}</div>
    <a class="source-link" href="${x(t.sourceUrl)}" target="_blank" rel="noreferrer">
      <span><small>Fonte original</small><strong>${x(b(t.sourceUrl))}</strong></span>
      <i aria-hidden="true">↗</i>
    </a>
  `}function h(e,t){e.innerHTML=`
    <div class="message-state warning-state">
      <span aria-hidden="true">◇</span>
      <div><strong>Sem conteúdo adequado</strong><p>${x(t)}</p></div>
    </div>
  `}function g(e){e.innerHTML=`
    <div class="message-state error-state">
      <span aria-hidden="true">!</span>
      <div><strong>Algo não saiu como esperado</strong><p>Não foi possível preparar a simulação desta página. Feche o popup e tente novamente.</p></div>
    </div>
  `}function _(e){return e===`analyzing`?`<span class="button-spinner" aria-hidden="true"></span><span>Analisando…</span>`:e===`success`?`<span>Analisar novamente</span><span aria-hidden="true">↗</span>`:e===`error`?`<span>Tentar novamente</span><span aria-hidden="true">↗</span>`:e===`unsupported`?`<span>Análise indisponível</span>`:`<span>Analisar política</span><span aria-hidden="true">↗</span>`}function v(){try{return localStorage.getItem(c)===`dark`?`dark`:`light`}catch{return`light`}}function y(e,t){document.documentElement.dataset.theme=e,document.documentElement.style.colorScheme=e,t.setAttribute(`aria-pressed`,String(e===`dark`)),t.setAttribute(`aria-label`,e===`dark`?`Ativar tema claro`:`Ativar tema escuro`),t.querySelector(`[data-theme-label]`).textContent=e===`dark`?`Escuro`:`Claro`,t.querySelector(`.theme-icon`).textContent=e===`dark`?`☾`:`☀`;try{localStorage.setItem(c,e)}catch{}}function b(e){try{let t=new URL(e);return`${t.hostname}${t.pathname===`/`?``:t.pathname}`}catch{return e}}function x(e){return e.replace(/[&<>'"]/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,"'":`&#39;`,'"':`&quot;`})[e])}function S(e,t){let n=e.querySelector(t);if(!n)throw Error(`Elemento obrigatório não encontrado: ${t}`);return n}var C=document.querySelector(`#app`);if(!C)throw Error(`Elemento raiz da extensão não encontrado.`);u(C);