(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=4e4,t=class{async extract(t){if(!t.tabId)throw Error(`A aba atual não está disponível para extração.`);let[r]=await chrome.scripting.executeScript({target:{tabId:t.tabId},func:n,args:[e]});if(!r?.result)throw Error(`A página não retornou conteúdo extraível.`);return r.result}};function n(e){let t=`h1, h2, h3, h4, h5, h6, p, li, dt, dd, blockquote`,n=`script.style.noscript.nav.footer.header.aside.form.button.input.select.textarea.svg.canvas.iframe.dialog.[hidden].[aria-hidden="true"].[role="navigation"].[role="banner"].[role="contentinfo"].[class*="cookie-banner"].[class*="cookieBanner"].[class*="newsletter"].[class*="advertisement"].[class*="modal"]`.split(`.`).join(`,`),r=[`main`,`article`,`[role="main"]`,`[id*="privacy" i]`,`[class*="privacy" i]`,`[id*="privacidade" i]`,`[class*="privacidade" i]`,`[id*="policy" i]`,`[class*="policy" i]`,`[id*="terms" i]`,`[class*="terms" i]`,`[id*="termos" i]`,`[class*="termos" i]`,`[id*="legal" i]`,`[class*="legal" i]`],i=e=>e.replace(/\s+/g,` `).trim(),a=e=>{if(e.closest(n))return!1;let t=window.getComputedStyle(e);return t.display!==`none`&&t.visibility!==`hidden`&&t.opacity!==`0`&&e.getClientRects().length>0},o=[],s=new Set;for(let e of r)for(let t of document.querySelectorAll(e))!s.has(t)&&a(t)&&(o.push(t),s.add(t));document.body&&!s.has(document.body)&&o.push(document.body);let c=[],l=new Set,u=new Set,d=0;extraction:for(let n of o){let r=Array.from(n.querySelectorAll(t));n.matches(t)&&r.unshift(n);for(let t of r){if(l.has(t)||!a(t))continue;l.add(t);let n=i(t.innerText||t.textContent||``),r=/^H[1-6]$/.test(t.tagName)?3:18;if(n.length<r)continue;let o=n.toLocaleLowerCase();if(u.has(o))continue;u.add(o);let s=c.length===0?0:2,f=e-d-s;if(f<=0)break extraction;let p=n.slice(0,f).trim();if(!p||(c.push(p),d+=s+p.length,d>=e))break extraction}}return{sourceUrl:window.location.href,title:i(document.title)||`Página sem título`,relevantText:c.join(`

`).slice(0,e)}}var r=new Set([`http:`,`https:`]),i=[`privacy`,`privacidade`,`policy`,`politica`,`política`,`terms`,`termos`,`legal`,`lgpd`,`cookies`];async function a(){if(typeof chrome>`u`||!chrome.tabs?.query)return{title:`Política de Privacidade — Página de exemplo`,url:`https://exemplo.com/politica-de-privacidade`,supported:!0};let[e]=await chrome.tabs.query({active:!0,currentWindow:!0});if(!e?.url)throw Error(`Não foi possível identificar a aba atual.`);let t=s(e.url);return{tabId:e.id,title:e.title?.trim()||`Página sem título`,url:e.url,supported:t,unsupportedReason:t?void 0:`Esta página é protegida pelo navegador e não pode ser analisada.`}}function o(e){let t=`${e.title} ${e.url}`.normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).toLowerCase();return i.some(e=>t.includes(e.normalize(`NFD`).replace(/[\u0300-\u036f]/g,``)))}function s(e){try{return r.has(new URL(e).protocol)}catch{return!1}}var c=`privora-extension-theme`,l=300,u=720,d=new t,f={idle:`Pronta para analisar esta página`,analyzing:`Extraindo conteúdo visível da página…`,success:`Prévia local concluída`,error:`Não foi possível concluir a análise`,unsupported:`Página sem conteúdo adequado`};function p(e){let t=null,n=`idle`,r=x();e.innerHTML=m();let i=T(e,`[data-theme-toggle]`),s=T(e,`[data-analyze]`),c=T(e,`[data-page-title]`),u=T(e,`[data-page-url]`),p=T(e,`[data-status]`),w=T(e,`[data-result]`);S(r,i),h(w),i.addEventListener(`click`,()=>{r=r===`light`?`dark`:`light`,S(r,i)}),s.addEventListener(`click`,async()=>{if(n!==`analyzing`){if(!t){await E();return}if(t.supported){D(`analyzing`),g(w);try{let e=await d.extract(t);if(e.relevantText.length<l){D(`unsupported`),v(w,`A página não possui texto visível suficiente em títulos, parágrafos ou listas para gerar uma prévia útil.`);return}D(`success`),_(w,e,o(t))}catch{D(`error`),y(w)}}}}),E();async function E(){try{t=await a(),c.textContent=t.title,u.textContent=C(t.url),u.title=t.url,t.supported?D(`idle`):(D(`unsupported`),v(w,t.unsupportedReason??`Esta página não pode ser analisada.`))}catch{c.textContent=`Página não identificada`,u.textContent=`Abra uma página e tente novamente`,D(`error`),y(w)}}function D(e){n=e,p.dataset.state=n,p.querySelector(`[data-status-text]`).textContent=f[n],w.setAttribute(`aria-busy`,String(n===`analyzing`)),s.disabled=n===`analyzing`||n===`unsupported`,s.innerHTML=b(n)}}function m(){return`
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
  `}function h(e){e.innerHTML=`
    <div class="empty-result">
      <span class="empty-mark" aria-hidden="true"><i></i><i></i></span>
      <div><strong>Sua prévia aparecerá aqui</strong><p>Um recorte técnico do texto visível, processado somente neste dispositivo.</p></div>
    </div>
  `}function g(e){e.innerHTML=`
    <div class="processing-state">
      <span class="processing-orbit" aria-hidden="true"><i></i></span>
      <strong>Lendo a página atual</strong>
      <p>O script é executado somente nesta aba e somente após o seu clique.</p>
      <div class="skeleton-lines" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>
  `}function _(e,t,n){let r=new Intl.NumberFormat(`pt-BR`).format(t.relevantText.length),i=t.relevantText.slice(0,u).trim(),a=t.relevantText.length>u?`…`:``;e.innerHTML=`
    <div class="result-heading local-result-heading">
      <span class="local-badge"><i aria-hidden="true"></i> Processamento local</span>
      <h2>Conteúdo pronto para análise</h2>
      <p>${n?`A URL ou o título também apresentam sinais de conteúdo sobre privacidade.`:`O texto útil foi encontrado mesmo sem palavras-chave no título ou na URL.`}</p>
    </div>
    <div class="local-preview">
      <div class="extraction-metric">
        <small>Texto extraído</small>
        <strong>≈ ${r}</strong>
        <span>caracteres úteis</span>
      </div>
      <dl class="preview-metadata">
        <div><dt>Título</dt><dd>${w(t.title)}</dd></div>
        <div><dt>Origem</dt><dd title="${w(t.sourceUrl)}">${w(C(t.sourceUrl))}</dd></div>
      </dl>
      <div class="excerpt-block">
        <div><span>Trecho extraído</span><small>limitado para visualização</small></div>
        <p>${w(i)}${a}</p>
      </div>
      <div class="local-notice"><span aria-hidden="true">✓</span><strong>Prévia local — nenhum conteúdo foi enviado para a Privora.</strong></div>
    </div>
    <a class="source-link" href="${w(t.sourceUrl)}" target="_blank" rel="noreferrer">
      <span><small>Fonte original</small><strong>${w(C(t.sourceUrl))}</strong></span>
      <i aria-hidden="true">↗</i>
    </a>
  `}function v(e,t){e.innerHTML=`
    <div class="message-state warning-state">
      <span aria-hidden="true">◇</span>
      <div><strong>Sem conteúdo adequado</strong><p>${w(t)}</p></div>
    </div>
  `}function y(e){e.innerHTML=`
    <div class="message-state error-state">
      <span aria-hidden="true">!</span>
      <div><strong>Algo não saiu como esperado</strong><p>Não foi possível ler o conteúdo desta página. Verifique se ela permite execução de extensões e tente novamente.</p></div>
    </div>
  `}function b(e){return e===`analyzing`?`<span class="button-spinner" aria-hidden="true"></span><span>Analisando…</span>`:e===`success`?`<span>Extrair novamente</span><span aria-hidden="true">↗</span>`:e===`error`?`<span>Tentar novamente</span><span aria-hidden="true">↗</span>`:e===`unsupported`?`<span>Análise indisponível</span>`:`<span>Analisar política</span><span aria-hidden="true">↗</span>`}function x(){try{return localStorage.getItem(c)===`dark`?`dark`:`light`}catch{return`light`}}function S(e,t){document.documentElement.dataset.theme=e,document.documentElement.style.colorScheme=e,t.setAttribute(`aria-pressed`,String(e===`dark`)),t.setAttribute(`aria-label`,e===`dark`?`Ativar tema claro`:`Ativar tema escuro`),t.querySelector(`[data-theme-label]`).textContent=e===`dark`?`Escuro`:`Claro`,t.querySelector(`.theme-icon`).textContent=e===`dark`?`☾`:`☀`;try{localStorage.setItem(c,e)}catch{}}function C(e){try{let t=new URL(e);return`${t.hostname}${t.pathname===`/`?``:t.pathname}`}catch{return e}}function w(e){return e.replace(/[&<>'"]/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,"'":`&#39;`,'"':`&quot;`})[e])}function T(e,t){let n=e.querySelector(t);if(!n)throw Error(`Elemento obrigatório não encontrado: ${t}`);return n}var E=document.querySelector(`#app`);if(!E)throw Error(`Elemento raiz da extensão não encontrado.`);p(E);