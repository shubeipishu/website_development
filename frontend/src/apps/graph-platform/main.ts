import '@fortawesome/fontawesome-free/css/all.min.css';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { all, create } from 'mathjs';
import { GraphApp } from './app.js';
import { GRAPH_CONFIG } from './config.js';
import { computeGraphStats } from './graph-algorithms.js';
import './i18n.js';
import './styles.css';

window.katex = katex;
window.math = create(all, {});
window.GRAPH_CONFIG = GRAPH_CONFIG;
window.computeGraphStats = computeGraphStats;

const app = new GraphApp();
window.app = app;

if (window.GraphI18n?.apply) {
  window.GraphI18n.apply();
}
