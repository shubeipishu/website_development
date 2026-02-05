import '@/styles/base.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app');
}

app.innerHTML = `
  <main class="page">
    <header class="page__header">
      <h1>Docs (Vite)</h1>
      <p>Placeholder page for the docs migration.</p>
    </header>
    <section class="page__links">
      <a href="/index.html">Back to Home</a>
      <a href="/apps/demo/index.html">Demo App</a>
    </section>
  </main>
`;
