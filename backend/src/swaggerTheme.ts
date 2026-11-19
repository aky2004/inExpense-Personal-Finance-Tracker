/**
 * inExpense Theme Context & Custom Branding for Swagger / OpenAPI Documentation
 * Supports full Dark & Light theme synchronization with the rest of the inExpense app.
 */

export const swaggerCustomJs = `
(function() {
  function getInitialTheme() {
    try {
      var params = new URLSearchParams(window.location.search);
      var pTheme = params.get('theme');
      if (pTheme === 'light' || pTheme === 'dark') {
        localStorage.setItem('finance_theme', pTheme);
        return pTheme;
      }
      var saved = localStorage.getItem('finance_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch(e) {}
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  function updateThemeToggleIcon(theme) {
    var btn = document.getElementById('inexpense-theme-toggle');
    if (!btn) return;
    if (theme === 'dark') {
      // Show Sun icon in amber (clicking switches to light)
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
      btn.setAttribute('title', 'Switch to light theme');
      btn.setAttribute('aria-label', 'Switch to light theme');
    } else {
      // Show Moon icon in slate (clicking switches to dark)
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
      btn.setAttribute('title', 'Switch to dark theme');
      btn.setAttribute('aria-label', 'Switch to dark theme');
    }
  }

  function applyTheme(theme) {
    var html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
      html.setAttribute('data-theme', 'dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      html.setAttribute('data-theme', 'light');
      html.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('finance_theme', theme);
    } catch(e) {}
    updateThemeToggleIcon(theme);
  }

  // Set theme immediately to avoid flash
  var activeTheme = getInitialTheme();
  applyTheme(activeTheme);

  window.toggleInExpenseTheme = function() {
    var isDark = document.documentElement.classList.contains('dark');
    var next = isDark ? 'light' : 'dark';
    applyTheme(next);
  };

  // Cross-tab theme sync listener
  window.addEventListener('storage', function(e) {
    if (e.key === 'finance_theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
      applyTheme(e.newValue);
    }
  });

  function injectInExpenseUI() {
    // 1. Inject Top Navigation Header if missing
    if (!document.getElementById('inexpense-header')) {
      var header = document.createElement('header');
      header.id = 'inexpense-header';
      header.className = 'inexpense-header';
      header.innerHTML = \`
        <div class="inexpense-header-inner">
          <div class="inexpense-brand-group">
            <a href="http://localhost:5173/" class="brand-link">
              <div class="inexpense-logo-box">in</div>
              <div class="inexpense-brand-title">
                <span class="white-text">in</span><span class="blue-text">Expense</span>
              </div>
            </a>
            <span class="inexpense-version-pill">OpenAPI 3.0</span>
          </div>

          <nav class="inexpense-nav-links">
            <a href="http://localhost:5173/" class="nav-item">Landing</a>
            <a href="http://localhost:5173/dashboard" class="nav-item">Dashboard</a>
            <a href="http://localhost:5173/docs" class="nav-item">Docs</a>
            <a href="http://localhost:5173/contact" class="nav-item">Help &amp; Contact</a>
          </nav>

          <div class="inexpense-header-actions">
            <button id="inexpense-theme-toggle" class="theme-toggle-btn" onclick="toggleInExpenseTheme()">
            </button>

            <a href="https://github.com/aky2004/Personal-Finance-Tracker" target="_blank" rel="noopener noreferrer" class="github-action-btn" title="GitHub Repository">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
            </a>

            <a href="http://localhost:5173/dashboard" class="launch-app-btn">
              <span>Go to App</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </div>
        </div>
      \`;
      document.body.insertBefore(header, document.body.firstChild);
      var cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      updateThemeToggleIcon(cur);
    }

    // 2. Inject Hero Showcase Banner before .scheme-container
    var schemeContainer = document.querySelector('.scheme-container');
    if (schemeContainer && !document.getElementById('inexpense-hero')) {
      var hero = document.createElement('section');
      hero.id = 'inexpense-hero';
      hero.className = 'inexpense-hero-section';
      hero.innerHTML = \`
        <div class="inexpense-hero-inner">
          <div class="hero-top-badge">
            <span class="live-dot"></span>
            <span class="badge-text">RESTFUL OPENAPI 3.0 RUNTIME</span>
          </div>

          <h1 class="hero-heading">Interactive API Documentation</h1>
          <p class="hero-subheading">
            Explore and test all inExpense RESTful endpoints in real-time. Features cryptographic JWT Bearer claims, PostgreSQL ACID parameterized queries, sub-millisecond Redis caching with automated cache invalidation, and strict 3-tier Role-Based Access Control.
          </p>

          <div class="hero-cards-grid">
            <div class="hero-feature-card">
              <div class="feature-icon icon-blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <div class="feature-text">
                <div class="feature-title">3-Tier Strict RBAC</div>
                <div class="feature-desc">admin, user, and read-only roles</div>
              </div>
            </div>

            <div class="hero-feature-card">
              <div class="feature-icon icon-emerald">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              </div>
              <div class="feature-text">
                <div class="feature-title">Redis Sub-ms Cache</div>
                <div class="feature-desc">15m analytics TTL &amp; atomic write flush</div>
              </div>
            </div>

            <div class="hero-feature-card">
              <div class="feature-icon icon-cyan">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <div class="feature-text">
                <div class="feature-title">PostgreSQL ACID</div>
                <div class="feature-desc">Parameterized SQL injection guard</div>
              </div>
            </div>

            <div class="hero-feature-card">
              <div class="feature-icon icon-amber">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div class="feature-text">
                <div class="feature-title">Tiered Rate Limiter</div>
                <div class="feature-desc">5 req/15m auth • 100 req/h API</div>
              </div>
            </div>
          </div>
        </div>
      \`;

      schemeContainer.parentNode.insertBefore(hero, schemeContainer);
    }

    // 3. Inject Footer if missing
    if (!document.getElementById('inexpense-footer')) {
      var footer = document.createElement('footer');
      footer.id = 'inexpense-footer';
      footer.className = 'inexpense-footer-section';
      footer.innerHTML = \`
        <div class="inexpense-footer-inner">
          <div class="footer-left">
            <div class="footer-logo">in</div>
            <div>
              <div class="footer-brand">in<span class="blue-text">Expense</span> API Explorer</div>
              <div class="footer-meta">PostgreSQL ACID • Redis Cache • Express.js TypeScript • OpenAPI 3.0</div>
            </div>
          </div>
          <div class="footer-links">
            <a href="http://localhost:5173/">Landing</a>
            <a href="http://localhost:5173/dashboard">Dashboard</a>
            <a href="http://localhost:5173/docs">Docs</a>
            <a href="http://localhost:5173/contact">Help &amp; Contact</a>
            <a href="https://github.com/aky2004/Personal-Finance-Tracker" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      \`;
      document.body.appendChild(footer);
    }
  }

  // Poll until Swagger UI DOM is mounted
  var pollCount = 0;
  var interval = setInterval(function() {
    pollCount++;
    injectInExpenseUI();
    if ((document.getElementById('inexpense-hero') && document.getElementById('inexpense-header')) || pollCount > 60) {
      clearInterval(interval);
    }
  }, 50);
})();
`;

export const swaggerCustomCss = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700;800;900&display=swap');

  /* -------------------------------------------------------------
     CSS Variables: Obsidian Dark & High-Contrast Light Palettes
     ------------------------------------------------------------- */
  :root, html.light {
    --app-bg: #f8fafc;
    --card-bg: #ffffff;
    --card-hover: #f1f5f9;
    --soft-bg: #f8fafc;
    --input-bg: #ffffff;
    --border-color: #e2e8f0;
    --border-hover: #cbd5e1;
    --text-main: #0f172a;
    --text-muted: #64748b;
    --primary-blue: #2563eb;
    --primary-hover: #1d4ed8;
    --header-bg: rgba(255, 255, 255, 0.94);
    --footer-bg: #f1f5f9;
    --code-bg: #f1f5f9;
    --dialog-backdrop: rgba(15, 23, 42, 0.45);
    --shadow-card: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05);
  }

  html.dark {
    --app-bg: #0b0908;
    --card-bg: #141210;
    --card-hover: #171512;
    --soft-bg: #100e0c;
    --input-bg: #1a1714;
    --border-color: #24211d;
    --border-hover: #38332c;
    --text-main: #f2efe9;
    --text-muted: #8c857b;
    --primary-blue: #2563eb;
    --primary-hover: #1d4ed8;
    --header-bg: rgba(11, 9, 8, 0.94);
    --footer-bg: #0e0c0a;
    --code-bg: #0b0908;
    --dialog-backdrop: rgba(0, 0, 0, 0.85);
    --shadow-card: none;
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: var(--app-bg);
  }
  ::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--border-hover);
  }

  /* Global Body & Canvas */
  html, body {
    background-color: var(--app-bg) !important;
    color: var(--text-main) !important;
    font-family: 'Manrope', system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
    margin: 0 !important;
    padding: 0 !important;
    min-height: 100vh !important;
    overflow-x: hidden !important;
    transition: background-color 0.2s ease, color 0.2s ease !important;
  }

  /* Custom Top Navbar */
  .inexpense-header {
    position: sticky;
    top: 0;
    z-index: 1000;
    background-color: var(--header-bg);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--border-color);
    height: 64px;
    width: 100%;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }
  .inexpense-header-inner {
    max-width: 1280px;
    margin: 0 auto;
    height: 100%;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .inexpense-brand-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .brand-link {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }
  .inexpense-logo-box {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 13px;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  }
  .inexpense-brand-title {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .white-text { color: var(--text-main); }
  .blue-text { color: #3b82f6; }
  .inexpense-version-pill {
    font-size: 11px;
    font-weight: 700;
    color: #2563eb;
    background: rgba(37, 99, 235, 0.1);
    border: 1px solid rgba(37, 99, 235, 0.25);
    border-radius: 9999px;
    padding: 2px 9px;
    font-family: 'JetBrains Mono', monospace;
  }
  .inexpense-nav-links {
    display: none;
    align-items: center;
    gap: 28px;
  }
  @media (min-width: 768px) {
    .inexpense-nav-links {
      display: flex;
    }
  }
  .inexpense-nav-links .nav-item {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .inexpense-nav-links .nav-item:hover {
    color: var(--primary-blue);
  }
  .inexpense-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .theme-toggle-btn {
    padding: 7px;
    border-radius: 10px;
    color: var(--text-muted);
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  .theme-toggle-btn:hover {
    background-color: var(--card-hover);
    border-color: var(--border-color);
  }
  .github-action-btn {
    padding: 7px;
    border-radius: 10px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    border: 1px solid transparent;
    transition: all 0.15s ease;
  }
  .github-action-btn:hover {
    color: var(--text-main);
    background-color: var(--card-hover);
    border-color: var(--border-color);
  }
  .launch-app-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    background: var(--primary-blue);
    color: #ffffff;
    text-decoration: none;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
    transition: all 0.15s ease;
  }
  .launch-app-btn:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
  }

  /* Custom Hero Showcase Section */
  .inexpense-hero-section {
    max-width: 1280px;
    margin: 0 auto;
    padding: 36px 24px 20px;
    font-family: 'Manrope', system-ui, sans-serif;
    box-sizing: border-box;
  }
  .hero-top-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    background: rgba(37, 99, 235, 0.1);
    border: 1px solid rgba(37, 99, 235, 0.25);
    color: #2563eb;
    margin-bottom: 16px;
  }
  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #2563eb;
    box-shadow: 0 0 8px #2563eb;
    animation: pulseDot 2s infinite ease-in-out;
  }
  @keyframes pulseDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.85); }
  }
  .hero-heading {
    font-size: 38px;
    font-weight: 900;
    color: var(--text-main);
    letter-spacing: -0.03em;
    margin: 0 0 12px;
    line-height: 1.2;
  }
  .hero-subheading {
    font-size: 14.5px;
    color: var(--text-muted);
    max-width: 840px;
    line-height: 1.65;
    margin: 0 0 28px;
  }
  .hero-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  .hero-feature-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 16px 18px;
    box-shadow: var(--shadow-card);
    transition: all 0.2s ease;
  }
  .hero-feature-card:hover {
    border-color: var(--border-hover);
    background-color: var(--card-hover);
    transform: translateY(-2px);
  }
  .feature-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .icon-blue { background: rgba(37, 99, 235, 0.12); color: #2563eb; border: 1px solid rgba(37, 99, 235, 0.25); }
  .icon-emerald { background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25); }
  .icon-cyan { background: rgba(6, 182, 212, 0.12); color: #06b6d4; border: 1px solid rgba(6, 182, 212, 0.25); }
  .icon-amber { background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25); }
  .feature-title {
    font-size: 13.5px;
    font-weight: 800;
    color: var(--text-main);
    margin-bottom: 2px;
  }
  .feature-desc {
    font-size: 11.5px;
    color: var(--text-muted);
    line-height: 1.4;
  }

  /* Swagger UI Core Layout & Overrides */
  .swagger-ui {
    background-color: var(--app-bg) !important;
    color: var(--text-main) !important;
    font-family: 'Manrope', system-ui, sans-serif !important;
    padding-bottom: 40px !important;
  }
  .swagger-ui .wrapper {
    max-width: 1280px !important;
    margin: 0 auto !important;
    padding: 0 24px !important;
    box-sizing: border-box !important;
  }

  /* Hide default Swagger topbar and default info text */
  .swagger-ui .topbar {
    display: none !important;
  }
  .swagger-ui .info {
    display: none !important;
  }

  /* Scheme Container (Servers & Authorize Bar) */
  .swagger-ui .scheme-container {
    background-color: transparent !important;
    box-shadow: none !important;
    padding: 0 24px !important;
    margin: 0 auto 28px !important;
    max-width: 1280px !important;
    box-sizing: border-box !important;
  }
  .swagger-ui .scheme-container > .schemes {
    background-color: var(--card-bg) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 16px !important;
    padding: 16px 20px !important;
    margin: 0 !important;
    max-width: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    box-sizing: border-box !important;
    box-shadow: var(--shadow-card) !important;
  }
  .swagger-ui .schemes-server-container {
    display: flex !important;
    align-items: center !important;
  }
  .swagger-ui .schemes-server-container .servers-title {
    color: var(--text-muted) !important;
    font-size: 11.5px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    margin-right: 12px !important;
  }
  .swagger-ui .schemes-server-container select {
    background-color: var(--input-bg) !important;
    color: var(--text-main) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 10px !important;
    padding: 8px 14px !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 12.5px !important;
    cursor: pointer !important;
    outline: none !important;
  }
  .swagger-ui .auth-wrapper {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    padding: 0 !important;
  }
  .swagger-ui .btn.authorize {
    background: var(--primary-blue) !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 12px !important;
    font-weight: 800 !important;
    font-size: 13px !important;
    padding: 9px 22px !important;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35) !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    transition: all 0.15s ease !important;
  }
  .swagger-ui .btn.authorize:hover {
    background: var(--primary-hover) !important;
    transform: translateY(-1px) !important;
  }
  .swagger-ui .btn.authorize svg {
    fill: #ffffff !important;
  }

  /* Tag Headings (Categories / Route Groups) */
  .swagger-ui .opblock-tag-section {
    margin-bottom: 24px !important;
  }
  .swagger-ui .opblock-tag {
    color: var(--text-main) !important;
    font-family: 'Manrope', system-ui, sans-serif !important;
    font-size: 19px !important;
    font-weight: 800 !important;
    letter-spacing: -0.02em !important;
    border-bottom: 1px solid var(--border-color) !important;
    padding: 18px 0 12px !important;
    margin-bottom: 14px !important;
  }
  .swagger-ui .opblock-tag small {
    color: var(--text-muted) !important;
    font-size: 12.5px !important;
    font-weight: 500 !important;
    margin-left: 12px !important;
  }
  .swagger-ui .opblock-tag svg {
    fill: var(--text-muted) !important;
  }

  /* Operation Block (Card) */
  .swagger-ui .opblock {
    background-color: var(--card-bg) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 14px !important;
    box-shadow: var(--shadow-card) !important;
    margin: 0 0 12px !important;
    overflow: hidden !important;
    transition: all 0.15s ease !important;
  }
  .swagger-ui .opblock:hover {
    border-color: var(--border-hover) !important;
  }
  .swagger-ui .opblock.is-open {
    border-color: rgba(37, 99, 235, 0.4) !important;
    box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.2) !important;
  }
  .swagger-ui .opblock .opblock-summary {
    border-color: var(--border-color) !important;
    padding: 12px 18px !important;
    display: flex !important;
    align-items: center !important;
    cursor: pointer !important;
  }
  .swagger-ui .opblock .opblock-summary-method {
    border-radius: 8px !important;
    font-weight: 800 !important;
    font-size: 12px !important;
    font-family: 'JetBrains Mono', monospace !important;
    padding: 5px 14px !important;
    text-shadow: none !important;
    letter-spacing: 0.04em !important;
    min-width: 74px !important;
    text-align: center !important;
  }

  /* Method Badges */
  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #2563eb !important;
    color: #ffffff !important;
  }
  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #10b981 !important;
    color: #ffffff !important;
  }
  .swagger-ui .opblock.opblock-put .opblock-summary-method {
    background: #f59e0b !important;
    color: #ffffff !important;
  }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background: #ef4444 !important;
    color: #ffffff !important;
  }
  .swagger-ui .opblock.opblock-patch .opblock-summary-method {
    background: #6366f1 !important;
    color: #ffffff !important;
  }

  .swagger-ui .opblock .opblock-summary-path {
    color: var(--text-main) !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 13.5px !important;
    font-weight: 600 !important;
    transition: color 0.15s ease !important;
  }
  .swagger-ui .opblock:hover .opblock-summary-path {
    color: var(--primary-blue) !important;
  }
  .swagger-ui .opblock .opblock-summary-path__deprecated {
    color: var(--text-muted) !important;
  }
  .swagger-ui .opblock .opblock-summary-description {
    color: var(--text-muted) !important;
    font-size: 12.5px !important;
    margin-left: 14px !important;
  }
  .swagger-ui .opblock svg.arrow {
    fill: var(--text-muted) !important;
  }
  .swagger-ui .authorization__btn svg {
    fill: var(--primary-blue) !important;
  }

  /* Operation Details / Body */
  .swagger-ui .opblock-body {
    background-color: var(--soft-bg) !important;
    border-top: 1px solid var(--border-color) !important;
    padding: 20px !important;
  }
  .swagger-ui .opblock-section-header {
    background-color: var(--card-bg) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 10px !important;
    padding: 10px 16px !important;
    margin-bottom: 14px !important;
  }
  .swagger-ui .opblock-section-header h4 {
    color: var(--text-main) !important;
    font-weight: 800 !important;
    font-size: 13px !important;
  }
  .swagger-ui .opblock-title_normal {
    color: var(--text-main) !important;
  }

  /* Parameters Table */
  .swagger-ui table thead tr th, 
  .swagger-ui table thead tr td,
  .swagger-ui table tbody tr td {
    color: var(--text-muted) !important;
    border-color: var(--border-color) !important;
    font-size: 12.5px !important;
  }
  .swagger-ui .parameter__name {
    color: var(--text-main) !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-weight: 700 !important;
    font-size: 13px !important;
  }
  .swagger-ui .parameter__type {
    color: var(--primary-blue) !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 12px !important;
  }
  .swagger-ui .parameter__in {
    color: var(--text-muted) !important;
    font-size: 11px !important;
  }

  /* Form Controls */
  .swagger-ui input[type=text], 
  .swagger-ui select, 
  .swagger-ui textarea {
    background-color: var(--input-bg) !important;
    color: var(--text-main) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 10px !important;
    padding: 8px 12px !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 12.5px !important;
    outline: none !important;
    transition: border-color 0.15s ease !important;
  }
  .swagger-ui input[type=text]:focus, 
  .swagger-ui select:focus, 
  .swagger-ui textarea:focus {
    border-color: var(--primary-blue) !important;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
  }

  /* Buttons */
  .swagger-ui .btn {
    border-radius: 10px !important;
    font-weight: 700 !important;
    border: 1px solid var(--border-color) !important;
    background: var(--card-bg) !important;
    color: var(--text-main) !important;
    box-shadow: none !important;
    padding: 7px 16px !important;
    transition: all 0.15s ease !important;
    cursor: pointer !important;
  }
  .swagger-ui .btn:hover {
    background: var(--card-hover) !important;
    border-color: var(--border-hover) !important;
  }
  .swagger-ui .btn.try-out__btn {
    background: var(--card-bg) !important;
    border-color: var(--border-color) !important;
    color: var(--text-main) !important;
  }
  .swagger-ui .btn.try-out__btn:hover {
    background: var(--card-hover) !important;
    border-color: var(--primary-blue) !important;
  }
  .swagger-ui .btn.execute {
    background: var(--primary-blue) !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 10px !important;
    font-weight: 800 !important;
    padding: 9px 24px !important;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35) !important;
  }
  .swagger-ui .btn.execute:hover {
    background: var(--primary-hover) !important;
  }
  .swagger-ui .btn.btn-clear {
    background: var(--card-bg) !important;
    border-color: var(--border-color) !important;
    color: var(--text-muted) !important;
  }
  .swagger-ui .btn.cancel {
    background: var(--card-bg) !important;
    border-color: var(--border-color) !important;
    color: #ef4444 !important;
  }

  /* Responses Section */
  .swagger-ui .responses-inner {
    background: var(--card-bg) !important;
    padding: 16px !important;
    border-radius: 12px !important;
    border: 1px solid var(--border-color) !important;
  }
  .swagger-ui .response-col_status {
    color: #10b981 !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-weight: 800 !important;
    font-size: 13px !important;
  }
  .swagger-ui .response-col_description {
    color: var(--text-main) !important;
  }
  .swagger-ui .response-col_description__inner div p {
    color: var(--text-muted) !important;
  }

  /* Code Blocks */
  .swagger-ui pre,
  .swagger-ui .highlight-code pre {
    background-color: var(--code-bg) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 10px !important;
    color: var(--text-main) !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 12.5px !important;
    padding: 14px !important;
  }
  .swagger-ui code {
    font-family: 'JetBrains Mono', monospace !important;
    color: var(--primary-blue) !important;
  }

  /* Models / Schemas Section */
  .swagger-ui section.models {
    border: 1px solid var(--border-color) !important;
    border-radius: 16px !important;
    background: var(--card-bg) !important;
    margin: 36px auto 20px !important;
    max-width: 1280px !important;
    padding: 20px 24px !important;
    box-sizing: border-box !important;
    box-shadow: var(--shadow-card) !important;
  }
  .swagger-ui section.models h4 {
    color: var(--text-main) !important;
    font-weight: 800 !important;
    font-size: 18px !important;
    font-family: 'Manrope', system-ui, sans-serif !important;
    border-bottom: 1px solid var(--border-color) !important;
    padding-bottom: 12px !important;
  }
  .swagger-ui section.models svg {
    fill: var(--text-muted) !important;
  }
  .swagger-ui .model-box {
    background: var(--soft-bg) !important;
  }
  .swagger-ui .model-title {
    color: var(--text-main) !important;
    font-family: 'JetBrains Mono', monospace !important;
  }
  .swagger-ui .prop-type {
    color: var(--primary-blue) !important;
    font-family: 'JetBrains Mono', monospace !important;
  }
  .swagger-ui .prop-format {
    color: var(--text-muted) !important;
  }

  /* Authorize Modal Dialog */
  .swagger-ui .dialog-ux .backdrop-ux {
    background: var(--dialog-backdrop) !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
  }
  .swagger-ui .dialog-ux .modal-ux {
    background-color: var(--card-bg) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 20px !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4) !important;
    max-width: 560px !important;
  }
  .swagger-ui .modal-ux-header {
    border-bottom: 1px solid var(--border-color) !important;
    padding: 18px 24px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
  }
  .swagger-ui .modal-ux-header h3 {
    color: var(--text-main) !important;
    font-family: 'Manrope', system-ui, sans-serif !important;
    font-weight: 800 !important;
    font-size: 18px !important;
    margin: 0 !important;
  }
  .swagger-ui .modal-ux-header .close-modal {
    fill: var(--text-muted) !important;
    transition: fill 0.15s ease !important;
  }
  .swagger-ui .modal-ux-header .close-modal:hover {
    fill: var(--text-main) !important;
  }
  .swagger-ui .modal-ux-content {
    padding: 24px !important;
    color: var(--text-main) !important;
  }
  .swagger-ui .modal-ux-content h4 {
    color: var(--text-main) !important;
    font-weight: 700 !important;
    font-size: 15px !important;
  }
  .swagger-ui .modal-ux-content p {
    color: var(--text-muted) !important;
    font-size: 13px !important;
    line-height: 1.5 !important;
  }
  .swagger-ui .auth-btn-wrapper {
    display: flex !important;
    gap: 12px !important;
    justify-content: flex-end !important;
    margin-top: 24px !important;
  }
  .swagger-ui .auth-btn-wrapper .btn-done {
    background: var(--soft-bg) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 12px !important;
    color: var(--text-muted) !important;
    font-weight: 700 !important;
    padding: 9px 20px !important;
  }
  .swagger-ui .auth-btn-wrapper .btn-done:hover {
    background: var(--card-hover) !important;
    color: var(--text-main) !important;
  }
  .swagger-ui .auth-btn-wrapper .modal-btn.auth {
    background: var(--primary-blue) !important;
    border: none !important;
    border-radius: 12px !important;
    color: #ffffff !important;
    font-weight: 800 !important;
    padding: 9px 22px !important;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35) !important;
  }
  .swagger-ui .auth-btn-wrapper .modal-btn.auth:hover {
    background: var(--primary-hover) !important;
  }

  /* Custom Injected Footer */
  .inexpense-footer-section {
    border-top: 1px solid var(--border-color);
    background-color: var(--footer-bg);
    padding: 36px 0;
    margin-top: 40px;
    width: 100%;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }
  .inexpense-footer-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
    justify-content: space-between;
  }
  @media (min-width: 768px) {
    .inexpense-footer-inner {
      flex-direction: row;
    }
  }
  .footer-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .footer-logo {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 12px;
  }
  .footer-brand {
    font-size: 14px;
    font-weight: 800;
    color: var(--text-main);
  }
  .footer-meta {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 2px;
  }
  .footer-links {
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 12px;
  }
  .footer-links a {
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .footer-links a:hover {
    color: var(--text-main);
  }
`;
