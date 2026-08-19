const summary = document.querySelector('#summary');
const projects = document.querySelector('#projects');
const detailPanel = document.querySelector('#detail-panel');
const runtimeStatus = document.querySelector('#runtime-status');
const reloadButton = document.querySelector('#reload');
let activeProjectId = null;

const esc = value => String(value ?? '—').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
const statusOf = value => ['PASS', 'BLOCK', 'TODO'].includes(value) ? value : 'TODO';
const metric = (label, value, cls = '') => `<article class="metric ${cls}"><p>${esc(label)}</p><b>${String(value).padStart(2, '0')}</b></article>`;
const formatTime = value => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

function renderSummary(list) {
  const totals = ['PASS', 'BLOCK', 'TODO'].reduce((acc, status) => ({ ...acc, [status]: list.filter(project => statusOf(project.status) === status).length }), {});
  summary.innerHTML = metric('REGISTERED PROJECTS', list.length) + metric('PASS', totals.PASS, 'pass') + metric('BLOCK', totals.BLOCK, 'block') + metric('TODO', totals.TODO);
}

function renderProjectList(list) {
  projects.innerHTML = list.length ? list.map(project => {
    const status = statusOf(project.status);
    return `<button class="project ${activeProjectId === project.id ? 'active' : ''}" data-project-id="${Number(project.id)}" type="button"><span><strong>${esc(project.name)}</strong><small>${esc(project.repository)} / ${esc(project.default_branch)} / baseline ${esc(project.baseline)}</small></span><span class="project-gate">GATE ${esc(project.current_gate)}</span><b class="badge ${status}">${status}</b></button>`;
  }).join('') : '<div class="empty">NO PROJECTS REGISTERED. POST TO <code>/api/projects</code> WITH THE PRIVATE INGESTION TOKEN TO CREATE THE FIRST CONTROLLED PROJECT.</div>';
  projects.querySelectorAll('[data-project-id]').forEach(button => button.addEventListener('click', () => loadProject(Number(button.dataset.projectId))));
}

function renderGate(gate) {
  const status = statusOf(gate.status);
  const requirements = Array.isArray(gate.requirements) ? gate.requirements : [];
  const reasons = Array.isArray(gate.reasons) ? gate.reasons : [];
  return `<article class="gate ${status.toLowerCase()}"><div class="gate-top"><div><div class="gate-number">G${esc(gate.gate_index)}</div><div class="gate-label">BASELINE ${esc(gate.baseline)}</div></div><b class="badge ${status}">${status}</b></div><ul class="requirement-list">${requirements.map(requirement => `<li>REQ / ${esc(requirement)}</li>`).join('') || '<li>NO REQUIREMENTS RECORDED</li>'}</ul>${reasons.length ? `<ul class="reason-list">${reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>` : '<p class="gate-label">NO BLOCK REASONS RECORDED</p>'}</article>`;
}

function renderEvidence(item) {
  const status = statusOf(item.decision);
  const workflow = item.workflow_run_url ? `<a href="${esc(item.workflow_run_url)}" target="_blank" rel="noreferrer">OPEN WORKFLOW RUN</a>` : 'NO WORKFLOW LINK';
  return `<article class="evidence"><div><span class="label">GATE ${esc(item.gate_index)} / ${status}</span><time datetime="${esc(item.created_at)}">${esc(formatTime(item.created_at))}</time></div><div><code>SHA ${esc(item.sha)}</code><p>Branch ${esc(item.branch)} / Run ${esc(item.workflow_run_id)}</p></div><div><b class="badge ${status}">${status}</b><p>${workflow}</p></div></article>`;
}

function renderDetail(data) {
  const project = data.project;
  const status = statusOf(project.status);
  detailPanel.innerHTML = `<div class="detail-heading"><div><p class="eyebrow">PROJECT INSPECTION / ${esc(project.repository)}</p><h3 id="detail-title">${esc(project.name)}</h3></div><b class="badge ${status}">${status}</b></div><div class="project-meta"><div class="meta-cell"><span>BASELINE</span><strong>${esc(project.baseline)}</strong></div><div class="meta-cell"><span>CURRENT GATE</span><strong>GATE ${esc(project.current_gate)}</strong></div><div class="meta-cell"><span>DEFAULT BRANCH</span><strong>${esc(project.default_branch)}</strong></div><div class="meta-cell"><span>GATE ENGINE</span><strong>DETERMINISTIC</strong></div></div><section class="detail-section"><p class="eyebrow">GATE ENGINE SURFACE</p><h4>GATES 0–8</h4><div class="gate-grid">${(data.gates || []).map(renderGate).join('')}</div></section><section class="detail-section"><p class="eyebrow">EVIDENCE LOG</p><h4>RECORDED SHA / WORKFLOW RUNS</h4><div class="evidence-list">${(data.evidence || []).map(renderEvidence).join('') || '<div class="empty">NO EVIDENCE HAS BEEN STORED FOR THIS PROJECT.</div>'}</div></section>`;
}

function showError(message) {
  detailPanel.innerHTML = `<div class="error-note">LIVE API ERROR / ${esc(message)}</div>`;
}

async function loadProject(id) {
  activeProjectId = id;
  detailPanel.innerHTML = '<div class="empty detail-empty"><p class="eyebrow">PROJECT INSPECTION</p><h3 id="detail-title">LOADING EVIDENCE</h3></div>';
  renderProjectList(window.controlCenterProjects || []);
  try {
    const response = await fetch(`/api/projects/${id}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`project request returned ${response.status}`);
    renderDetail(await response.json());
  } catch (error) {
    showError(error.message || 'Project detail is unavailable.');
  }
}

async function load() {
  reloadButton.disabled = true;
  try {
    const [healthResponse, projectsResponse] = await Promise.all([fetch('/api/health', { cache: 'no-store' }), fetch('/api/projects', { cache: 'no-store' })]);
    if (!healthResponse.ok || !projectsResponse.ok) throw new Error('The Control Center API is unavailable.');
    const health = await healthResponse.json();
    const data = await projectsResponse.json();
    runtimeStatus.textContent = health.status === 'ok' ? 'ONLINE' : 'CHECK';
    runtimeStatus.className = health.status === 'ok' ? 'ok' : 'error';
    window.controlCenterProjects = data.projects || [];
    renderSummary(window.controlCenterProjects);
    renderProjectList(window.controlCenterProjects);
    if (activeProjectId && window.controlCenterProjects.some(project => project.id === activeProjectId)) await loadProject(activeProjectId);
  } catch (error) {
    runtimeStatus.textContent = 'OFFLINE';
    runtimeStatus.className = 'error';
    summary.innerHTML = metric('API STATUS', '—');
    projects.innerHTML = '<div class="empty">CONTROL CENTER API IS NOT AVAILABLE.</div>';
    showError(error.message || 'Unable to load the Control Center.');
  } finally {
    reloadButton.disabled = false;
  }
}

reloadButton.addEventListener('click', load);
load();
