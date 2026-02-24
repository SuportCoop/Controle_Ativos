// Estado da Aplicação
let assets = [];
let employees = [];
let assignments = [];

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initTheme();
    await fetchData();
});

// Busca os dados da API Django
async function fetchData() {
    try {
        const [resAssets, resEmps, resAsgs] = await Promise.all([
            fetch('/api/assets/'),
            fetch('/api/employees/'),
            fetch('/api/assignments/')
        ]);

        assets = await resAssets.json();
        employees = await resEmps.json();
        assignments = await resAsgs.json();

        updateDashboard();
        renderAssets();
        renderEmployees();
        populateSelects();
        renderAssignments();
    } catch (error) {
        console.error("Erro ao buscar dados da API:", error);
    }
}

// Navegação (SPA simples)
function initNavigation() {
    const links = document.querySelectorAll('.nav-links li');
    const sections = document.querySelectorAll('.page-section');

    links.forEach(link => {
        link.addEventListener('click', () => {
            links.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// Tema Claro/Escuro
function initTheme() {
    const themeBtn = document.getElementById('theme-switch');
    const body = document.body;

    if (localStorage.getItem('coop_theme') === 'light') {
        body.classList.replace('dark-theme', 'light-theme');
        themeBtn.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        themeBtn.querySelector('span').textContent = 'Modo Claro';
    }

    themeBtn.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.classList.replace('dark-theme', 'light-theme');
            themeBtn.querySelector('i').classList.replace('fa-moon', 'fa-sun');
            themeBtn.querySelector('span').textContent = 'Modo Claro';
            localStorage.setItem('coop_theme', 'light');
        } else {
            body.classList.replace('light-theme', 'dark-theme');
            themeBtn.querySelector('i').classList.replace('fa-sun', 'fa-moon');
            themeBtn.querySelector('span').textContent = 'Modo Escuro';
            localStorage.setItem('coop_theme', 'dark');
        }
    });
}

// --- Funções de Ativos ---

function getAssetStatus(assetId) {
    const assign = assignments.find(a => a.asset_id === assetId && a.status === 'active');
    return assign ? 'in-use' : 'available';
}

async function saveAsset() {
    const name = document.getElementById('asset-name').value;
    const category = document.getElementById('asset-category').value;

    if (!name) return alert('Preencha o nome do ativo!');

    const response = await fetch('/api/assets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category })
    });

    if (response.ok) {
        document.getElementById('asset-name').value = '';
        closeModal('asset-modal');
        await fetchData();
    } else {
        alert("Erro ao salvar ativo");
    }
}

function renderAssets() {
    const grid = document.getElementById('assets-grid');
    grid.innerHTML = '';

    assets.forEach(asset => {
        const status = getAssetStatus(asset.id);
        const statusText = status === 'available' ? 'Disponível' : 'Em Uso';
        const cardClass = status === 'available' ? 'available' : 'in-use';
        const badgeClass = status === 'available' ? 'available' : 'in-use';

        grid.innerHTML += `
            <div class="item-card ${cardClass}">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${asset.name}</h3>
                        <p class="card-subtitle">${asset.category}</p>
                    </div>
                    <span class="badge ${badgeClass}">${statusText}</span>
                </div>
                <div class="card-body">
                    <p style="font-family: monospace; font-size: 11px; margin-bottom: 5px;">ID: ${asset.id}</p>
                </div>
                <div class="card-actions">
                    <button class="btn secondary" onclick="showQR('${asset.id}')">
                        <i class="fa-solid fa-qrcode"></i> Ver QR Code
                    </button>
                    <button class="icon-btn" onclick="deleteAsset('${asset.id}')" title="Excluir">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

async function deleteAsset(id) {
    if (!confirm('Tem certeza que deseja excluir este ativo?')) return;

    if (getAssetStatus(id) === 'in-use') {
        return alert('Não é possível excluir um ativo em uso. Devolva-o primeiro.');
    }

    const response = await fetch(`/api/assets/${id}/`, { method: 'DELETE' });
    if (response.ok) {
        await fetchData();
    } else {
        alert("Erro ao excluir. O ativo pode estar em uso.");
    }
}

// --- Funções de Funcionários ---

async function saveEmployee() {
    const name = document.getElementById('employee-name').value;
    const role = document.getElementById('employee-role').value;

    if (!name) return alert('Preencha o nome!');

    const response = await fetch('/api/employees/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role: role || 'Sem Setor' })
    });

    if (response.ok) {
        document.getElementById('employee-name').value = '';
        document.getElementById('employee-role').value = '';
        closeModal('employee-modal');
        await fetchData();
    }
}

function renderEmployees() {
    const grid = document.getElementById('employees-grid');
    grid.innerHTML = '';

    employees.forEach(emp => {
        const inPossession = assignments.filter(a => a.employee_id === emp.id && a.status === 'active').length;

        grid.innerHTML += `
            <div class="item-card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${emp.name}</h3>
                        <p class="card-subtitle">${emp.role}</p>
                    </div>
                </div>
                <div class="card-body">
                    <p>Ativos em posse: <strong>${inPossession}</strong></p>
                </div>
                <div class="card-actions">
                    <button class="icon-btn" onclick="deleteEmployee('${emp.id}')" title="Excluir">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

async function deleteEmployee(id) {
    if (!confirm('Tem certeza que deseja remover este funcionário?')) return;

    const inPossession = assignments.some(a => a.employee_id === id && a.status === 'active');
    if (inPossession) {
        return alert('Funcionário ainda possui ativos vinculados. Resolva os empréstimos antes.');
    }

    const response = await fetch(`/api/employees/${id}/`, { method: 'DELETE' });
    if (response.ok) {
        await fetchData();
    }
}

// --- Empréstimos (Vínculo) ---

function populateSelects() {
    const assetSelect = document.getElementById('assign-asset-select');
    const empSelect = document.getElementById('assign-employee-select');

    assetSelect.innerHTML = '<option value="">-- Escolha um ativo --</option>';
    empSelect.innerHTML = '<option value="">-- Escolha um funcionário --</option>';

    const availableAssets = assets.filter(a => getAssetStatus(a.id) === 'available');

    availableAssets.forEach(a => {
        assetSelect.innerHTML += `<option value="${a.id}">${a.name} (${a.category})</option>`;
    });

    employees.forEach(e => {
        empSelect.innerHTML += `<option value="${e.id}">${e.name} - ${e.role}</option>`;
    });
}

async function assignAsset() {
    const assetId = document.getElementById('assign-asset-select').value;
    const empId = document.getElementById('assign-employee-select').value;

    if (!assetId || !empId) return alert('Selecione um ativo e um funcionário!');

    const response = await fetch('/api/assignments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: assetId, employeeId: empId })
    });

    if (response.ok) {
        alert('Ativo vinculado com sucesso!');
        await fetchData();
    } else {
        alert("Erro ao vincular ativo");
    }
}

async function returnAsset(asgId) {
    if (!confirm('Confirmar devolução do ativo?')) return;

    const response = await fetch(`/api/assignments/${asgId}/return/`, { method: 'POST' });
    if (response.ok) {
        await fetchData();
    }
}

function renderAssignments() {
    const tbody = document.querySelector('#assignments-table tbody');
    tbody.innerHTML = '';

    const activeAssignments = assignments.filter(a => a.status === 'active');

    if (activeAssignments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="align-center">Nenhum ativo em uso no momento.</td></tr>';
        return;
    }

    activeAssignments.forEach(asg => {
        const asset = assets.find(a => a.id === asg.asset_id);
        const emp = employees.find(e => e.id === asg.employee_id);

        if (!asset || !emp) return;

        tbody.innerHTML += `
            <tr>
                <td style="font-family: monospace; font-size: 11px;">...${asg.asset_id.slice(-6)}</td>
                <td>${asset.name}</td>
                <td>${emp.name}</td>
                <td>
                    <button class="btn secondary" style="padding: 4px 8px; font-size: 12px" onclick="returnAsset('${asg.id}')">
                        <i class="fa-solid fa-undo"></i> Devolver
                    </button>
                </td>
            </tr>
        `;
    });
}

// --- Dashboard ---

function updateDashboard() {
    const activeAsg = assignments.filter(a => a.status === 'active');
    const inUseCount = activeAsg.length;
    const availCount = assets.length - inUseCount;

    document.getElementById('total-assets').textContent = assets.length;
    document.getElementById('total-employees').textContent = employees.length;
    document.getElementById('inuse-assets').textContent = inUseCount;
    document.getElementById('available-assets').textContent = availCount;

    const recentTable = document.querySelector('#recent-table tbody');
    recentTable.innerHTML = '';

    const recent = [...assignments].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if (recent.length === 0) {
        recentTable.innerHTML = '<tr><td colspan="4" class="align-center">Nenhuma movimentação registrada.</td></tr>';
        return;
    }

    recent.forEach(r => {
        const asset = assets.find(a => a.id === r.asset_id);
        const emp = employees.find(e => e.id === r.employee_id);
        if (!asset || !emp) return;

        const dateObj = new Date(r.date);
        const dateStr = dateObj.toLocaleDateString('pt-BR');

        const badge = r.status === 'active'
            ? `<span class="badge in-use">Emprestado</span>`
            : `<span class="badge available">Devolvido</span>`;

        recentTable.innerHTML += `
            <tr>
                <td>${asset.name}</td>
                <td>${emp.name}</td>
                <td>${dateStr}</td>
                <td>${badge}</td>
            </tr>
        `;
    });
}

// --- Leitor QR & Resultados ---

function showQR(assetId) {
    const qrContainer = document.getElementById('qr-image-container');
    const idDisplay = document.getElementById('qr-asset-id');

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${assetId}&margin=10`;

    qrContainer.innerHTML = `<img src="${qrUrl}" alt="QR Code do Ativo">`;
    idDisplay.textContent = assetId;

    openModal('qr-modal');
}

function downloadQR() {
    const img = document.querySelector('#qr-image-container img');
    if (!img) return;

    fetch(img.src).then(res => res.blob()).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `qrcode_${document.getElementById('qr-asset-id').textContent}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    }).catch(err => alert('Erro ao baixar QR Code!'));
}

function scanAsset() {
    const input = document.getElementById('scan-input');
    const id = input.value.trim();
    if (!id) return alert('Digite um ID de ativo');

    const resultBox = document.getElementById('scan-result');
    resultBox.classList.remove('hidden');

    const asset = assets.find(a => a.id === id);

    if (!asset) {
        resultBox.innerHTML = `
            <div class="result-card" style="border-color: var(--danger)">
                <div class="align-center">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 40px; color: var(--danger); margin-bottom: 10px;"></i>
                    <h3>Ativo não encontrado</h3>
                    <p>O ID <strong>${id}</strong> não existe na base de dados.</p>
                </div>
            </div>
        `;
        return;
    }

    const isActive = assignments.find(a => a.asset_id === id && a.status === 'active');

    let contentHtml = `
        <div class="result-card">
            <div class="result-header">
                <h2>${asset.name}</h2>
                <div class="result-details">
                    <div class="detail-item">
                        <span class="detail-label">Categoria</span>
                        <span class="detail-value">${asset.category}</span>
                    </div>
                </div>
                ${isActive
            ? '<span class="result-status status-inuse"><i class="fa-solid fa-lock"></i> Em Uso</span>'
            : '<span class="result-status status-available"><i class="fa-solid fa-check"></i> Disponível</span>'
        }
            </div>
    `;

    if (isActive) {
        const emp = employees.find(e => e.id === isActive.employee_id);
        const dateObj = new Date(isActive.date);
        contentHtml += `
            <div class="detail-item">
                <span class="detail-label">Ficha do Responsável</span>
                <div class="user-profile">
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <div style="width: 50px; height: 50px; border-radius: 25px; background: var(--secondary-bg); display:flex; align-items:center; justify-content:center; font-size: 20px;">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div>
                            <span style="font-size: 18px; font-weight: 600; display: block; color: var(--text-primary)">${emp.name}</span>
                            <span style="font-size: 13px; color: var(--text-secondary)">${emp.role}</span>
                        </div>
                    </div>
                    <div style="margin-top: 15px; font-size: 13px; color: var(--text-secondary)">
                        <i class="fa-solid fa-calendar"></i> Retirado em: ${dateObj.toLocaleString('pt-BR')}
                    </div>
                </div>
            </div>
        `;
    } else {
        contentHtml += `
            <div class="detail-item">
                <span class="detail-label">Info</span>
                <span class="detail-value" style="color: var(--text-secondary)">Este ativo está na base e pode ser emprestado a um funcionário.</span>
            </div>
        `;
    }

    contentHtml += `</div>`;
    resultBox.innerHTML = contentHtml;
}

// --- Botões de API Futura no HTML ---
async function handleExportExcel() {
    window.location.href = '/api/export-excel/';
}

function handleImportClick() {
    document.getElementById('excel-file-input').click();
}

async function uploadExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/import-excel/', {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        alert("Importação realizada com sucesso!");
        await fetchData();
    } else {
        alert("Erro na importação.");
    }

    // reset input
    event.target.value = '';
}

// --- Modais ---

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.remove('active');
    }
}
