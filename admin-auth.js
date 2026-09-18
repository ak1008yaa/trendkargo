(function initAdminAuth() {
  const DEFAULT_HASH = 'e03896efeec0a98c9ebe92ed37bafd43ac96900dec57c6af58d1f04787e8ea9b';
  const ADMIN_USER = 'admin';

  async function hash(value) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  function showApp() {
    document.getElementById('admin-login')?.classList.add('hidden');
    document.getElementById('admin-app')?.classList.remove('hidden');
    if (typeof window.renderCMS === 'function') window.renderCMS();
  }

  function bind() {
    const form = document.getElementById('login-form');
    if (!form || form.dataset.authReady === 'true') return;
    form.dataset.authReady = 'true';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const user = document.getElementById('admin-user')?.value.trim() || '';
      const password = document.getElementById('admin-pass')?.value || '';
      const error = document.getElementById('login-err');

      if (user === ADMIN_USER && (await hash(password)) === DEFAULT_HASH) {
        sessionStorage.setItem('tc_auth', 'true');
        showApp();
        return;
      }

      if (error) error.style.display = 'block';
    });

    if (sessionStorage.getItem('tc_auth') === 'true') showApp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
