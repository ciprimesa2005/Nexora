// Aureon — Cuestionario de Madurez Digital
// Storage: localStorage key "aureon_encuestas" (array of response records)

const STORAGE_KEY = 'aureon_encuestas';

const LIKERT_QUESTIONS = [
  { id: 'q6', text: '6. La empresa cuenta con una estrategia clara de transformación digital, en implementación y con seguimiento.' },
  { id: 'q7', text: '7. Los directivos están comprometidos y guían activamente la transformación digital.' },
  { id: 'q8', text: '8. El equipo adopta con facilidad nuevas tecnologías y herramientas digitales.' },
  { id: 'q9', text: '9. La empresa destina presupuesto real y hace seguimiento a la inversión en transformación digital.' },
  { id: 'q10', text: '10. Los procesos clave (ventas, facturación, atención al cliente, inventario) están automatizados o soportados por tecnología.' },
  { id: 'q11', text: '11. La empresa cuenta con la infraestructura y herramientas digitales necesarias para operar y crecer.' },
  { id: 'q12', text: '12. La empresa recopila y analiza datos para tomar decisiones.' },
  { id: 'q13', text: '13. La empresa usa canales digitales para vender, comunicarse y conocer a sus clientes.' },
  { id: 'q14', text: '14. La empresa ofrece productos/servicios digitales o los ha adaptado a formatos digitales.' },
  { id: 'q15', text: '15. En general, la transformación digital ha traído resultados tangibles y exitosos para la empresa.' },
];

const LIKERT_LABELS = ['Nunca', 'Inicial', 'Desarrollo', 'Consolidado', 'Siempre'];

function classifyNivel(total) {
  if (total <= 20) return { key: 'inicial', label: 'Inicial', desc: 'La transformación digital apenas comienza.' };
  if (total <= 33) return { key: 'emergente', label: 'Emergente', desc: 'Hay esfuerzos aislados, sin consolidar.' };
  if (total <= 42) return { key: 'desarrollo', label: 'En desarrollo', desc: 'Avances estructurados, falta integración.' };
  return { key: 'consolidado', label: 'Consolidado', desc: 'Madurez digital avanzada.' };
}

function getResponses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveResponse(record) {
  const all = getResponses();
  all.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// ---------- Encuesta page ----------
function initSurveyForm() {
  const list = document.getElementById('likert-list');
  if (!list) return;

  list.innerHTML = LIKERT_QUESTIONS.map(q => `
    <div class="likert-item">
      <div class="likert-text">${q.text}</div>
      <div class="likert-scale" data-name="${q.id}">
        ${[1,2,3,4,5].map(v => `
          <label class="likert-option">
            <input type="radio" name="${q.id}" value="${v}" required>
            <span class="num">${v}</span>
            <span class="lbl">${LIKERT_LABELS[v-1]}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  const form = document.getElementById('survey-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const empresa = document.getElementById('q1').value.trim();
    const ciudad = document.getElementById('q2').value.trim();
    const sector = document.getElementById('q3').value.trim();
    const empleadosEl = form.querySelector('input[name="q4"]:checked');
    const responsable = document.getElementById('q5').value.trim();

    let total = 0;
    const respuestas = {};
    for (const q of LIKERT_QUESTIONS) {
      const checked = form.querySelector(`input[name="${q.id}"]:checked`);
      if (!checked) { alert('Por favor responde todas las afirmaciones (6 a 15).'); return; }
      respuestas[q.id] = Number(checked.value);
      total += Number(checked.value);
    }

    const obstaculoEl = form.querySelector('input[name="q16"]:checked');
    if (!obstaculoEl) { alert('Selecciona el mayor obstáculo (pregunta 16).'); return; }
    let obstaculo = obstaculoEl.value;
    if (obstaculo === 'Otro') {
      const otro = document.getElementById('q16-otro-texto').value.trim();
      obstaculo = otro ? `Otro: ${otro}` : 'Otro';
    }

    const tecnologias = Array.from(form.querySelectorAll('input[name="q17"]:checked')).map(el => el.value);

    const nivel = classifyNivel(total);

    const record = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      empresa, ciudad, sector,
      empleados: empleadosEl ? empleadosEl.value : '',
      responsable,
      respuestas,
      total,
      nivel: nivel.key,
      nivelLabel: nivel.label,
      obstaculo,
      tecnologias,
    };

    saveResponse(record);
    sessionStorage.setItem('aureon_last_result', String(record.id));
    window.location.href = 'resultados.html';
  });
}

// ---------- Resultados dashboard ----------
function nivelBadgeClass(key) {
  return { inicial: 'badge-inicial', emergente: 'badge-emergente', desarrollo: 'badge-desarrollo', consolidado: 'badge-consolidado' }[key] || '';
}
function nivelBarClass(key) {
  return { inicial: 'nivel-inicial', emergente: 'nivel-emergente', desarrollo: 'nivel-desarrollo', consolidado: 'nivel-consolidado' }[key] || '';
}

function renderLastResultBanner(data) {
  const el = document.getElementById('last-result-banner');
  if (!el) return;
  const lastId = sessionStorage.getItem('aureon_last_result');
  if (!lastId) return;
  const record = data.find(r => String(r.id) === lastId);
  if (!record) return;
  const nivel = classifyNivel(record.total);
  el.innerHTML = `
    <div class="result-banner">
      <div class="kicker">Resultado de ${record.empresa || 'tu empresa'}</div>
      <div class="score">${record.total}/50</div>
      <div class="nivel">${nivel.label}</div>
      <p class="rec">${nivel.desc} Aureon recomienda cruzar este resultado con el obstáculo señalado (“${record.obstaculo}”) para priorizar el plan de acción.</p>
    </div>
  `;
}

function renderDashboard() {
  const root = document.getElementById('dash-content');
  if (!root) return;

  const data = getResponses();
  renderLastResultBanner(data);

  if (data.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        Aún no hay respuestas registradas.<br>
        <a href="encuesta.html" class="btn btn-primary" style="margin-top:1rem; display:inline-block;">Completar la encuesta</a>
      </div>`;
    return;
  }

  const totalResp = data.length;
  const avgScore = (data.reduce((s, r) => s + r.total, 0) / totalResp).toFixed(1);

  const nivelOrder = ['inicial', 'emergente', 'desarrollo', 'consolidado'];
  const nivelLabels = { inicial: 'Inicial', emergente: 'Emergente', desarrollo: 'En desarrollo', consolidado: 'Consolidado' };
  const nivelCounts = {};
  nivelOrder.forEach(k => nivelCounts[k] = 0);
  data.forEach(r => { nivelCounts[r.nivel] = (nivelCounts[r.nivel] || 0) + 1; });
  const nivelMasComun = nivelOrder.reduce((a, b) => nivelCounts[a] >= nivelCounts[b] ? a : b);

  const obstaculoCounts = {};
  data.forEach(r => { obstaculoCounts[r.obstaculo] = (obstaculoCounts[r.obstaculo] || 0) + 1; });
  const obstaculoTop = Object.entries(obstaculoCounts).sort((a, b) => b[1] - a[1])[0];

  // Summary stat tiles
  let html = `
    <div class="dash-summary">
      <div class="dash-stat"><div class="value">${totalResp}</div><div class="label">Empresas evaluadas</div></div>
      <div class="dash-stat"><div class="value">${avgScore}</div><div class="label">Puntaje promedio /50</div></div>
      <div class="dash-stat"><div class="value">${nivelLabels[nivelMasComun]}</div><div class="label">Nivel más frecuente</div></div>
      <div class="dash-stat"><div class="value">${obstaculoTop ? obstaculoTop[0] : '—'}</div><div class="label">Obstáculo principal</div></div>
    </div>
  `;

  // Chart 1: distribución por nivel de madurez
  const maxNivel = Math.max(1, ...nivelOrder.map(k => nivelCounts[k]));
  html += `
    <div class="chart-card">
      <h3>Distribución por nivel de madurez digital</h3>
      ${nivelOrder.map(k => `
        <div class="bar-row ${nivelBarClass(k)}">
          <span class="bar-label">${nivelLabels[k]}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(nivelCounts[k]/maxNivel*100)}%"></div></div>
          <span class="bar-value">${nivelCounts[k]}</span>
        </div>
      `).join('')}
    </div>
  `;

  // Chart 2: promedio por pregunta (Q6-Q15)
  html += `
    <div class="chart-card">
      <h3>Puntaje promedio por afirmación (escala 1-5)</h3>
      ${LIKERT_QUESTIONS.map(q => {
        const avg = data.reduce((s, r) => s + (r.respuestas[q.id] || 0), 0) / totalResp;
        return `
          <div class="bar-row">
            <span class="bar-label">${q.text.replace(/^\d+\.\s*/, '').slice(0, 42)}${q.text.length > 42 ? '…' : ''}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${avg/5*100}%"></div></div>
            <span class="bar-value">${avg.toFixed(1)}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Chart 3: obstáculos
  const maxObs = Math.max(1, ...Object.values(obstaculoCounts));
  html += `
    <div class="chart-card">
      <h3>Mayor obstáculo declarado</h3>
      ${Object.entries(obstaculoCounts).sort((a,b)=>b[1]-a[1]).map(([label, count]) => `
        <div class="bar-row">
          <span class="bar-label">${label}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${count/maxObs*100}%"></div></div>
          <span class="bar-value">${count}</span>
        </div>
      `).join('')}
    </div>
  `;

  // Chart 4: tecnologías usadas
  const techCounts = {};
  data.forEach(r => (r.tecnologias || []).forEach(t => { techCounts[t] = (techCounts[t] || 0) + 1; }));
  const maxTech = Math.max(1, ...Object.values(techCounts), 1);
  const techEntries = Object.entries(techCounts).sort((a,b)=>b[1]-a[1]);
  html += `
    <div class="chart-card">
      <h3>Tecnologías actualmente en uso</h3>
      ${techEntries.length ? techEntries.map(([label, count]) => `
        <div class="bar-row">
          <span class="bar-label">${label}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${count/maxTech*100}%"></div></div>
          <span class="bar-value">${count}</span>
        </div>
      `).join('') : '<p class="survey-card-desc">Sin datos aún.</p>'}
    </div>
  `;

  // Table
  html += `
    <div class="chart-card dash-table-wrap">
      <h3>Empresas evaluadas</h3>
      <table class="dash-table">
        <thead>
          <tr>
            <th>Empresa</th><th>Sector</th><th>Empleados</th><th>Puntaje</th><th>Nivel</th><th>Obstáculo</th><th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${data.slice().reverse().map(r => `
            <tr>
              <td>${r.empresa}</td>
              <td>${r.sector}</td>
              <td>${r.empleados}</td>
              <td>${r.total}/50</td>
              <td><span class="badge ${nivelBadgeClass(r.nivel)}">${r.nivelLabel}</span></td>
              <td>${r.obstaculo}</td>
              <td>${new Date(r.fecha).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  html += `
    <div class="dash-actions">
      <a href="encuesta.html" class="btn btn-primary">Nueva evaluación</a>
    </div>
  `;

  root.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function () {
  initSurveyForm();
  renderDashboard();
});
