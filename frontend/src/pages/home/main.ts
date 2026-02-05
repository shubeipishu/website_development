import '@/styles/base.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app');
}

app.innerHTML = `
  <main class="page">
    <header class="page__header">
      <h1>Home (Vite)</h1>
      <p>Placeholder page for the homepage migration.</p>
    </header>
    <section class="page__links">
      <a href="/docs.html">Docs</a>
      <a href="/apps/demo/index.html">Demo App</a>
    </section>
  </main>
`;
