/**
 * Embeddable Jira Product Discovery Widget
 *
 * Usage: Add the following to any HTML page:
 *
 *   <div id="jira-discovery-widget"></div>
 *   <script src="jira-widget-embed.js"></script>
 *
 * Or with custom options:
 *
 *   <div id="jira-discovery-widget"
 *        data-width="100%"
 *        data-height="700px"
 *        data-refresh-interval="300">
 *   </div>
 *   <script src="jira-widget-embed.js"></script>
 */
(function () {
  const BOARD_URL =
    'https://equityprime.atlassian.net/jira/discovery/share/views/bb08665f-4ef3-47dd-b9a5-12a9613ad0d1';

  const container = document.getElementById('jira-discovery-widget');
  if (!container) return;

  const width = container.dataset.width || '100%';
  const height = container.dataset.height || '700px';
  const refreshInterval = parseInt(container.dataset.refreshInterval || '300', 10);

  const style = document.createElement('style');
  style.textContent = `
    .jpd-embed{position:relative;border:1px solid #dfe1e6;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.08);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
    .jpd-embed__bar{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid #dfe1e6;font-size:13px;font-weight:600;color:#172b4d}
    .jpd-embed__actions{display:flex;align-items:center;gap:8px;font-weight:400;font-size:11px;color:#6b778c}
    .jpd-embed__dot{width:6px;height:6px;border-radius:50%;background:#36b37e;display:inline-block}
    .jpd-embed__btn{padding:3px 8px;font-size:11px;color:#42526e;background:#f4f5f7;border:1px solid #dfe1e6;border-radius:4px;cursor:pointer;text-decoration:none}
    .jpd-embed__btn:hover{background:#ebecf0}
    .jpd-embed iframe{width:100%;border:none;display:block}
  `;
  document.head.appendChild(style);

  container.classList.add('jpd-embed');
  container.style.width = width;

  container.innerHTML = `
    <div class="jpd-embed__bar">
      <span>Jira Product Discovery</span>
      <span class="jpd-embed__actions">
        <span class="jpd-embed__dot"></span> Live
        <button class="jpd-embed__btn" id="jpd-refresh">&#x21bb;</button>
        <a class="jpd-embed__btn" href="${BOARD_URL}" target="_blank" rel="noopener">&#x2197;</a>
      </span>
    </div>
    <iframe
      id="jpd-frame"
      src="${BOARD_URL}"
      style="height:${height}"
      loading="lazy"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>
  `;

  const frame = document.getElementById('jpd-frame');
  const refreshBtn = document.getElementById('jpd-refresh');

  function refresh() {
    frame.src = BOARD_URL + '?t=' + Date.now();
  }

  refreshBtn.addEventListener('click', refresh);

  if (refreshInterval > 0) {
    setInterval(refresh, refreshInterval * 1000);
  }
})();
