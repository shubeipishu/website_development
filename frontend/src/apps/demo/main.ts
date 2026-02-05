import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app');
}

app.innerHTML = `
  <main class="demo">
    <div class="demo__card">
      <p class="demo__eyebrow">Vite + TypeScript</p>
      <h1>Demo App</h1>
      <p>Multi-page entry example for /apps/demo.</p>
      <div class="demo__actions">
        <a class="demo__link" href="/index.html">Home</a>
        <a class="demo__link" href="/docs.html">Docs</a>
      </div>
    </div>
  </main>
`;
