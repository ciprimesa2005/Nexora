// Competitors Configuration
const COMPETITORS = [
  {
    id: 'off-white',
    name: 'Off-White',
    url: 'https://www.off---white.com/en-us/',
    screenshot: 'screenshots/off_white.png'
  },
  {
    id: 'nike',
    name: 'Nike Colombia',
    url: 'https://www.nike.com.co/',
    screenshot: 'screenshots/nike.png'
  },
  {
    id: 'audi',
    name: 'Audi Colombia',
    url: 'https://www.audi.com.co/',
    screenshot: 'screenshots/audi.png'
  },
  {
    id: 'ditoene',
    name: 'Ditoene',
    url: 'https://ditoeneo.com/pages/about',
    screenshot: 'screenshots/ditoene.png'
  },
  {
    id: 'onehalf',
    name: 'OneHalf',
    url: 'https://onehalf.com.co',
    screenshot: 'screenshots/onehalf.png'
  }
];

// Predefined negative themes
const DEFAULT_THEMES = [
  "Navegación confusa",
  "Carga lenta",
  "Tipografía ilegible",
  "Bajo contraste",
  "Pop-ups molestos",
  "Diseño saturado",
  "Imágenes deficientes",
  "Poco responsivo",
  "Buscador ineficaz"
];

// Application State
let state = {
  activeCompetitorId: COMPETITORS[0].id,
  currentZoom: 'fit', // 'fit', '50%', '75%', '100%', '150%'
  feedback: {}, // key: competitorId -> { rating, liked, disliked, themes: [] }
  customThemes: [], // array of user-added custom themes
  temporaryScreenshots: {}, // key: competitorId -> DataURL or ObjectURL (for session uploads)
  activeRatingDraft: 0
};

// Chart.js Instances
let ratingsChartInstance = null;
let themesChartInstance = null;

// DOM Elements
const competitorListContainer = document.getElementById('competitor-list-container');
const viewport = document.getElementById('viewport');
const screenshotWrapper = document.getElementById('screenshot-wrapper');
const currentCompetitorLabel = document.getElementById('current-competitor-label');
const pageTitle = document.getElementById('page-title');

// Form elements
const starsContainer = document.getElementById('stars-container');
const ratingLabel = document.getElementById('rating-label');
const likedText = document.getElementById('liked-text');
const dislikedText = document.getElementById('disliked-text');
const likedCount = document.getElementById('liked-count');
const dislikedCount = document.getElementById('disliked-count');
const themeGrid = document.getElementById('theme-grid');
const inputNewTheme = document.getElementById('input-new-theme');
const btnAddCustomTheme = document.getElementById('btn-add-custom-theme');
const btnSaveFeedback = document.getElementById('btn-save-feedback');

// Zoom elements
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomFit = document.getElementById('btn-zoom-fit');
const zoomValueLabel = document.getElementById('zoom-value');

// Actions
const btnExport = document.getElementById('btn-export');
const importFileInput = document.getElementById('import-file-input');
const btnReset = document.getElementById('btn-reset');

// KPI elements
const kpiEvaluatedCount = document.getElementById('kpi-evaluated-count');
const kpiEvaluatedPercent = document.getElementById('kpi-evaluated-percent');
const kpiAvgRating = document.getElementById('kpi-avg-rating');
const kpiBestSite = document.getElementById('kpi-best-site');
const kpiBestSiteScore = document.getElementById('kpi-best-site-score');
const kpiTopIssue = document.getElementById('kpi-top-issue');
const kpiTopIssueCount = document.getElementById('kpi-top-issue-count');
const feedbackTableBody = document.getElementById('feedback-table-body');

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
  loadDataFromLocalStorage();
  renderCompetitorList();
  renderThemePills();
  loadCompetitor(state.activeCompetitorId);
  setupFormEventListeners();
  setupZoomEventListeners();
  setupActionEventListeners();

  // Check for test mode query param
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('test') === 'true') {
    runAutoTest();
  }
});

// Load data from LocalStorage
function loadDataFromLocalStorage() {
  const savedFeedback = localStorage.getItem('competitor_feedback_data');
  const savedCustomThemes = localStorage.getItem('competitor_feedback_custom_themes');
  
  if (savedFeedback) {
    try {
      state.feedback = JSON.parse(savedFeedback);
    } catch (e) {
      console.error("Error reading saved feedback", e);
      state.feedback = {};
    }
  }

  // Pre-populate empty feedback structures if they don't exist
  COMPETITORS.forEach(comp => {
    if (!state.feedback[comp.id]) {
      state.feedback[comp.id] = {
        rating: 0,
        liked: '',
        disliked: '',
        themes: []
      };
    }
  });

  if (savedCustomThemes) {
    try {
      state.customThemes = JSON.parse(savedCustomThemes);
    } catch (e) {
      console.error("Error reading saved custom themes", e);
      state.customThemes = [];
    }
  }
}

// Save data to LocalStorage
function saveDataToLocalStorage() {
  localStorage.setItem('competitor_feedback_data', JSON.stringify(state.feedback));
  localStorage.setItem('competitor_feedback_custom_themes', JSON.stringify(state.customThemes));
}

// Render the Competitors sidebar list
function renderCompetitorList() {
  competitorListContainer.innerHTML = '';
  
  COMPETITORS.forEach(comp => {
    const data = state.feedback[comp.id] || { rating: 0 };
    const isCompleted = data.rating > 0;
    const isActive = comp.id === state.activeCompetitorId;
    
    const card = document.createElement('div');
    card.className = `competitor-card ${isActive ? 'active' : ''}`;
    card.setAttribute('id', `card-${comp.id}`);
    card.addEventListener('click', () => {
      loadCompetitor(comp.id);
    });

    const ratingStars = isCompleted 
      ? '★ ' + data.rating.toFixed(1)
      : '—';

    card.innerHTML = `
      <div class="competitor-header">
        <span class="competitor-name">${comp.name}</span>
        <span class="status-badge ${isCompleted ? 'completed' : 'pending'}">
          ${isCompleted ? 'Listo' : 'Pendiente'}
        </span>
      </div>
      <div class="competitor-details">
        <span class="competitor-url">${comp.url.replace('https://', '').split('/')[0]}</span>
        <span class="competitor-stars">${ratingStars}</span>
      </div>
    `;
    competitorListContainer.appendChild(card);
  });
}

// Load a specific competitor into the workspace
function loadCompetitor(id) {
  // Save active competitor
  state.activeCompetitorId = id;
  
  // Highlight active card
  document.querySelectorAll('.competitor-card').forEach(card => card.classList.remove('active'));
  const activeCard = document.getElementById(`card-${id}`);
  if (activeCard) activeCard.classList.add('active');

  const competitor = COMPETITORS.find(c => c.id === id);
  pageTitle.innerText = `Análisis de Competidores: ${competitor.name}`;
  currentCompetitorLabel.innerText = competitor.name;

  // Load Feedback Form Data
  const data = state.feedback[id] || { rating: 0, liked: '', disliked: '', themes: [] };
  
  // Set rating stars
  state.activeRatingDraft = data.rating;
  updateStarsUI(data.rating);

  // Set textareas
  likedText.value = data.liked;
  likedCount.innerText = data.liked.length;
  dislikedText.value = data.disliked;
  dislikedCount.innerText = data.disliked.length;

  // Set themes
  renderThemePills();

  // Load Screenshot
  loadScreenshotImage(competitor);
}

// Load screenshot image or display uploader placeholder
function loadScreenshotImage(competitor) {
  screenshotWrapper.innerHTML = '';
  
  const imgUrl = state.temporaryScreenshots[competitor.id] || competitor.screenshot;
  
  const img = document.createElement('img');
  img.className = 'screenshot-img';
  img.alt = `Screenshot of ${competitor.name}`;
  img.id = `img-${competitor.id}`;
  
  // Handle image load error
  img.onerror = () => {
    renderScreenshotUploader(competitor);
  };

  img.onload = () => {
    screenshotWrapper.appendChild(img);
    applyZoom();
  };

  img.src = imgUrl;
}

// Render uploader when image is not found (offline/missing file)
function renderScreenshotUploader(competitor) {
  const container = document.createElement('div');
  container.className = 'screenshot-placeholder';
  container.id = `uploader-${competitor.id}`;

  container.innerHTML = `
    <div class="placeholder-icon">
      <svg viewBox="0 0 24 24" style="width: 48px; height: 48px; fill: currentColor;"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
    </div>
    <div class="placeholder-title">Imagen de captura no encontrada</div>
    <div class="placeholder-text">
      No logramos ubicar la captura en <code>${competitor.screenshot}</code>. 
      Sube o arrastra una imagen aquí para visualizarla durante esta sesión.
    </div>
    <button class="btn-sidebar primary btn-upload">
      Seleccionar Archivo
      <input type="file" accept="image/*" class="file-input-screenshot">
    </button>
  `;

  // Add drag and drop listeners
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    container.classList.add('dragover');
  });

  container.addEventListener('dragleave', () => {
    container.classList.remove('dragover');
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    container.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleScreenshotUpload(e.dataTransfer.files[0], competitor);
    }
  });

  const fileInput = container.querySelector('.file-input-screenshot');
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleScreenshotUpload(e.target.files[0], competitor);
    }
  });

  screenshotWrapper.appendChild(container);
  
  // Set zoom styling to default for uploader
  screenshotWrapper.style.width = '100%';
  screenshotWrapper.style.maxWidth = '500px';
}

function handleScreenshotUpload(file, competitor) {
  if (!file.type.startsWith('image/')) {
    showToast("Por favor, sube un archivo de imagen válido.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    state.temporaryScreenshots[competitor.id] = e.target.result;
    loadScreenshotImage(competitor);
    showToast(`Captura de ${competitor.name} cargada para esta sesión.`);
  };
  reader.readAsDataURL(file);
}

// Setup Form Event Listeners
function setupFormEventListeners() {
  // Stars Hover and Click
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('mouseover', () => {
      const rating = parseInt(star.getAttribute('data-rating'));
      highlightStars(rating);
    });

    star.addEventListener('mouseleave', () => {
      highlightStars(state.activeRatingDraft);
    });

    star.addEventListener('click', () => {
      const rating = parseInt(star.getAttribute('data-rating'));
      state.activeRatingDraft = rating;
      updateStarsUI(rating);
    });
  });

  // Character Counters
  likedText.addEventListener('input', () => {
    likedCount.innerText = likedText.value.length;
  });

  dislikedText.addEventListener('input', () => {
    dislikedCount.innerText = dislikedText.value.length;
  });

  // Add custom theme
  btnAddCustomTheme.addEventListener('click', addCustomTheme);
  inputNewTheme.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTheme();
    }
  });

  // Save Feedback Button
  btnSaveFeedback.addEventListener('click', saveActiveFeedback);
}

// Highlight Stars on hover
function highlightStars(rating) {
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    const starVal = parseInt(star.getAttribute('data-rating'));
    if (starVal <= rating) {
      star.classList.add('hover');
    } else {
      star.classList.remove('hover');
    }
  });
}

// Update star UI permanently
function updateStarsUI(rating) {
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    const starVal = parseInt(star.getAttribute('data-rating'));
    if (starVal <= rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });

  const ratingTexts = {
    0: "Puntuar sitio",
    1: "1/5 - Muy Malo",
    2: "2/5 - Regular",
    3: "3/5 - Aceptable",
    4: "4/5 - Bueno",
    5: "5/5 - Excelente"
  };

  ratingLabel.innerText = ratingTexts[rating] || "Puntuar sitio";
}

// Render failure theme pills
function renderThemePills() {
  themeGrid.innerHTML = '';
  
  const activeData = state.feedback[state.activeCompetitorId] || { themes: [] };
  const allThemes = [...DEFAULT_THEMES, ...state.customThemes];

  allThemes.forEach(theme => {
    const isActive = activeData.themes.includes(theme);
    const pill = document.createElement('div');
    pill.className = `theme-pill ${isActive ? 'active' : ''}`;
    
    // Warning SVG inside pill
    pill.innerHTML = `
      <svg viewBox="0 0 24 24" style="width:12px; height:12px; margin-right:3px; fill:currentColor;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
      ${theme}
    `;

    pill.addEventListener('click', () => {
      toggleThemeSelection(theme, pill);
    });

    themeGrid.appendChild(pill);
  });
}

// Toggle pill active/inactive
function toggleThemeSelection(theme, pillElement) {
  const activeData = state.feedback[state.activeCompetitorId];
  const idx = activeData.themes.indexOf(theme);

  if (idx > -1) {
    activeData.themes.splice(idx, 1);
    pillElement.classList.remove('active');
  } else {
    activeData.themes.push(theme);
    pillElement.classList.add('active');
  }
}

// Add custom negative theme
function addCustomTheme() {
  const val = inputNewTheme.value.trim();
  if (!val) return;

  const allThemes = [...DEFAULT_THEMES, ...state.customThemes];
  if (allThemes.includes(val)) {
    showToast("Este tema ya existe.", "error");
    return;
  }

  state.customThemes.push(val);
  // Auto-select the newly added theme for the current competitor
  state.feedback[state.activeCompetitorId].themes.push(val);
  
  saveDataToLocalStorage();
  renderThemePills();
  inputNewTheme.value = '';
  showToast(`Tema "${val}" agregado y seleccionado.`);
}

// Save active competitor feedback
function saveActiveFeedback() {
  const data = state.feedback[state.activeCompetitorId];
  
  if (state.activeRatingDraft === 0) {
    showToast("Por favor selecciona una calificación de 1 a 5.", "error");
    return;
  }

  data.rating = state.activeRatingDraft;
  data.liked = likedText.value.trim();
  data.disliked = dislikedText.value.trim();

  saveDataToLocalStorage();
  renderCompetitorList(); // Update sidebar badges
  showToast(`¡Feedback de ${COMPETITORS.find(c => c.id === state.activeCompetitorId).name} guardado correctamente!`);
}

// Setup Zoom Controls
function setupZoomEventListeners() {
  btnZoomIn.addEventListener('click', () => {
    adjustZoom(true);
  });

  btnZoomOut.addEventListener('click', () => {
    adjustZoom(false);
  });

  btnZoomFit.addEventListener('click', () => {
    state.currentZoom = 'fit';
    applyZoom();
  });
}

function adjustZoom(isZoomIn) {
  const zooms = ['50%', '75%', '100%', '150%'];
  let currentIdx = zooms.indexOf(state.currentZoom);

  if (state.currentZoom === 'fit') {
    state.currentZoom = isZoomIn ? '100%' : '50%';
  } else {
    if (isZoomIn) {
      if (currentIdx < zooms.length - 1) state.currentZoom = zooms[currentIdx + 1];
    } else {
      if (currentIdx > 0) state.currentZoom = zooms[currentIdx - 1];
      else state.currentZoom = 'fit';
    }
  }
  applyZoom();
}

function applyZoom() {
  const img = screenshotWrapper.querySelector('.screenshot-img');
  if (!img) return;

  zoomValueLabel.innerText = state.currentZoom === 'fit' ? 'Ajustar' : state.currentZoom;

  if (state.currentZoom === 'fit') {
    screenshotWrapper.style.width = '100%';
    screenshotWrapper.style.maxWidth = '100%';
  } else if (state.currentZoom === '50%') {
    screenshotWrapper.style.width = '640px';
    screenshotWrapper.style.maxWidth = 'none';
  } else if (state.currentZoom === '75%') {
    screenshotWrapper.style.width = '960px';
    screenshotWrapper.style.maxWidth = 'none';
  } else if (state.currentZoom === '100%') {
    screenshotWrapper.style.width = '1280px';
    screenshotWrapper.style.maxWidth = 'none';
  } else if (state.currentZoom === '150%') {
    screenshotWrapper.style.width = '1920px';
    screenshotWrapper.style.maxWidth = 'none';
  }
}

// Setup Top Actions (Export, Import, Reset)
function setupActionEventListeners() {
  btnExport.addEventListener('click', exportDataAsJSON);
  
  importFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      importDataFromJSON(e.target.files[0]);
    }
  });

  btnReset.addEventListener('click', () => {
    if (confirm("¿Estás seguro de que deseas reiniciar todos los datos? Esta acción borrará todo el feedback guardado.")) {
      localStorage.clear();
      state.feedback = {};
      state.customThemes = [];
      state.temporaryScreenshots = {};
      loadDataFromLocalStorage();
      renderCompetitorList();
      loadCompetitor(state.activeCompetitorId);
      showToast("Se han reiniciado todos los datos.");
    }
  });
}

// Export Feedback data as JSON file
function exportDataAsJSON() {
  const exportPayload = {
    feedback: state.feedback,
    customThemes: state.customThemes
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `competitor_analysis_feedback_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("Datos exportados exitosamente.");
}

// Import Feedback data from JSON file
function importDataFromJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.feedback) {
        state.feedback = parsed.feedback;
        state.customThemes = parsed.customThemes || [];
        
        saveDataToLocalStorage();
        renderCompetitorList();
        loadCompetitor(state.activeCompetitorId);
        showToast("Datos importados y aplicados correctamente.");
      } else {
        showToast("El archivo JSON no tiene un formato válido.", "error");
      }
    } catch (err) {
      showToast("Error al leer el archivo JSON.", "error");
    }
  };
  reader.readAsText(file);
}

// View switching logic
function switchView(viewName) {
  document.querySelectorAll('.page-area').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  if (viewName === 'workspace') {
    document.getElementById('view-workspace').classList.add('active');
    document.getElementById('tab-btn-workspace').classList.add('active');
    loadCompetitor(state.activeCompetitorId); // Refresh workspace view
  } else if (viewName === 'dashboard') {
    document.getElementById('view-dashboard').classList.add('active');
    document.getElementById('tab-btn-dashboard').classList.add('active');
    pageTitle.innerText = "Panel de Analíticas & Resumen";
    renderDashboard();
  }
}

// Update KPI cards and Charts inside the Dashboard
function renderDashboard() {
  // 1. KPI Calculations
  let evaluatedCount = 0;
  let totalRating = 0;
  let bestRating = -1;
  let bestSiteName = 'N/A';
  
  const issueCounts = {};

  COMPETITORS.forEach(comp => {
    const data = state.feedback[comp.id];
    if (data && data.rating > 0) {
      evaluatedCount++;
      totalRating += data.rating;
      
      if (data.rating > bestRating) {
        bestRating = data.rating;
        bestSiteName = comp.name;
      }
    }

    if (data && data.themes) {
      data.themes.forEach(theme => {
        issueCounts[theme] = (issueCounts[theme] || 0) + 1;
      });
    }
  });

  const avgRating = evaluatedCount > 0 ? (totalRating / evaluatedCount).toFixed(1) : '0.0';
  const percentCompleted = Math.round((evaluatedCount / COMPETITORS.length) * 100);

  // Top issue calculation
  let topIssue = 'Ninguno';
  let topIssueCount = 0;
  Object.keys(issueCounts).forEach(issue => {
    if (issueCounts[issue] > topIssueCount) {
      topIssueCount = issueCounts[issue];
      topIssue = issue;
    }
  });

  // Set KPIs text
  kpiEvaluatedCount.innerHTML = `${evaluatedCount} <span style="font-size:1.25rem; color:var(--text-muted);">/ ${COMPETITORS.length}</span>`;
  kpiEvaluatedPercent.innerText = `${percentCompleted}% Evaluado`;
  kpiAvgRating.innerHTML = `${avgRating} <span style="font-size:1.25rem; color:var(--color-star);">★</span>`;
  kpiBestSite.innerText = bestSiteName;
  kpiBestSiteScore.innerText = bestRating > 0 ? `${bestRating.toFixed(1)} / 5.0 estrellas` : 'Sin calificación';
  kpiTopIssue.innerText = topIssue;
  kpiTopIssueCount.innerText = `${topIssueCount} menciones`;

  // 2. Render summary table
  feedbackTableBody.innerHTML = '';
  COMPETITORS.forEach(comp => {
    const data = state.feedback[comp.id] || { rating: 0, liked: '', disliked: '', themes: [] };
    const row = document.createElement('tr');
    
    const starsHtml = data.rating > 0 
      ? `<span class="table-rating">★ ${data.rating.toFixed(1)}</span>`
      : `<span style="color: var(--text-muted);">Sin evaluar</span>`;

    const likedHtml = data.liked 
      ? `<div class="table-text-content">${escapeHTML(data.liked)}</div>`
      : `<div class="table-text-content empty">Sin comentarios</div>`;
      
    const dislikedHtml = data.disliked 
      ? `<div class="table-text-content">${escapeHTML(data.disliked)}</div>`
      : `<div class="table-text-content empty">Sin comentarios</div>`;

    const themesHtml = data.themes && data.themes.length > 0
      ? `<div class="table-pills">${data.themes.map(t => `<span class="table-pill">${escapeHTML(t)}</span>`).join('')}</div>`
      : `<span style="color: var(--text-muted); font-size: 0.75rem;">Ninguno</span>`;

    row.innerHTML = `
      <td>
        <div class="table-comp-info">
          <span class="table-comp-name">${comp.name}</span>
          <span class="table-comp-url">${comp.url.replace('https://', '').split('/')[0]}</span>
        </div>
      </td>
      <td>${starsHtml}</td>
      <td>${likedHtml}</td>
      <td>${dislikedHtml}</td>
      <td>${themesHtml}</td>
    `;
    feedbackTableBody.appendChild(row);
  });

  // 3. Render Chart.js graphs
  renderCharts(evaluatedCount, issueCounts);
}

// Chart Renderings
function renderCharts(evaluatedCount, issueCounts) {
  // Destroy old charts to prevent duplicate drawing glitches
  if (ratingsChartInstance) ratingsChartInstance.destroy();
  if (themesChartInstance) themesChartInstance.destroy();

  if (evaluatedCount === 0) {
    // Render empty chart placeholders if no ratings exist
    renderEmptyCharts();
    return;
  }

  // Chart 1: Scores comparison
  const ratingsCtx = document.getElementById('ratingsChart').getContext('2d');
  const labels = COMPETITORS.map(c => c.name);
  const dataScores = COMPETITORS.map(c => state.feedback[c.id].rating || 0);

  ratingsChartInstance = new Chart(ratingsCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Calificación de Estilo Gráfico',
        data: dataScores,
        backgroundColor: [
          'rgba(139, 92, 246, 0.65)',  // purple
          'rgba(6, 182, 212, 0.65)',   // cyan
          'rgba(16, 185, 129, 0.65)',  // green
          'rgba(245, 158, 11, 0.65)',  // gold
          'rgba(239, 68, 68, 0.65)'    // red
        ],
        borderColor: [
          'rgb(139, 92, 246)',
          'rgb(6, 182, 212)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1.5,
        borderRadius: 8,
        barPercentage: 0.55
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit', size: 13 },
          bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          min: 0,
          max: 5,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: 'rgba(255, 255, 255, 0.6)', stepSize: 1 }
        },
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'Outfit', weight: 'bold' } }
        }
      }
    }
  });

  // Chart 2: Theme issue frequencies
  const themesCtx = document.getElementById('themesChart').getContext('2d');
  
  // Sort issues by count
  const sortedIssues = Object.keys(issueCounts).sort((a,b) => issueCounts[b] - issueCounts[a]);
  const issueLabels = sortedIssues.slice(0, 6); // Top 6 issues
  const issueValues = issueLabels.map(lbl => issueCounts[lbl]);

  if (issueLabels.length === 0) {
    // If no issues selected yet
    issueLabels.push('Ninguno registrado');
    issueValues.push(0);
  }

  themesChartInstance = new Chart(themesCtx, {
    type: 'bar', // Horizontal bar chart
    data: {
      labels: issueLabels,
      datasets: [{
        label: 'Menciones',
        data: issueValues,
        backgroundColor: 'rgba(239, 68, 68, 0.35)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1.5,
        borderRadius: 6,
        barPercentage: 0.6
      }]
    },
    options: {
      indexAxis: 'y', // Makes it horizontal
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit', size: 13 },
          bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: 'rgba(255, 255, 255, 0.6)', stepSize: 1 }
        },
        y: {
          grid: { display: false },
          ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'Plus Jakarta Sans', size: 11 } }
        }
      }
    }
  });
}

function renderEmptyCharts() {
  const c1 = document.getElementById('ratingsChart').getContext('2d');
  const c2 = document.getElementById('themesChart').getContext('2d');
  
  c1.font = '14px Plus Jakarta Sans';
  c1.fillStyle = 'rgba(255,255,255,0.3)';
  c1.textAlign = 'center';
  c1.fillText('Sin datos. Evalúa al menos un sitio para generar gráficos.', 180, 150);

  c2.font = '14px Plus Jakarta Sans';
  c2.fillStyle = 'rgba(255,255,255,0.3)';
  c2.textAlign = 'center';
  c2.fillText('Sin datos. Registra problemas para visualizar fallas comunes.', 150, 150);
}

// Toast System
function showToast(message, type = "success") {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type === "error" ? 'error' : ''}`;
  
  const icon = type === "error" 
    ? `<svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:currentColor;"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`
    : `<svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:currentColor;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;

  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);

  // Fade out and remove
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}

// Helper to escape HTML tags to avoid XSS injections
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Automated Test Mode function
function runAutoTest() {
  console.log("Automated test mode activated");
  
  // Disable Chart.js animations globally for instant rendering in headless mode
  if (typeof Chart !== 'undefined') {
    Chart.defaults.animation = false;
  }
  
  // 1. Select Nike Colombia
  loadCompetitor('nike');
  
  // 2. Set Star Rating to 4
  state.activeRatingDraft = 4;
  updateStarsUI(4);
  
  // 3. Write feedback
  likedText.value = "Diseño de productos muy limpio, con tipografías sans-serif modernas que facilitan la lectura. El buscador de productos es excelente.";
  likedCount.innerText = likedText.value.length;
  
  dislikedText.value = "Las imágenes tardan demasiado en cargar y los banners rotativos iniciales pueden resultar un poco molestos en pantallas medianas.";
  dislikedCount.innerText = dislikedText.value.length;
  
  // 4. Set negative themes
  state.feedback['nike'].themes = ["Carga lenta", "Pop-ups molestos", "Navegación confusa"];
  renderThemePills();

  // 5. Save feedback
  saveActiveFeedback();

  // 6. Navigate to dashboard
  switchView('dashboard');
  console.log("Test execution complete - dashboard view active");
}

