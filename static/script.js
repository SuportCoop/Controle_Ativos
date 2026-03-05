// Estado da Aplicação
let assets = [];
let employees = [];
let assignments = [];
let systemUsers = [];
let accessGroups = [];

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initTheme();
    await fetchData();
    await fetchAuthData();

    // Auto-scan a partir de QR Code Externo
    const urlParams = new URLSearchParams(window.location.search);
    const scanId = urlParams.get('scan');
    if (scanId) {
        // Clicar no link de navegação para a tela do Scanner
        const scanTab = document.querySelector('[data-target="scan-section"]');
        if (scanTab) scanTab.click();

        // Simular a busca
        document.getElementById('scan-input').value = scanId;
        scanAsset();
    }
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

async function fetchAuthData() {
    try {
        const [resUsers, resGroups] = await Promise.all([
            fetch('/api/users/'),
            fetch('/api/groups/')
        ]);

        systemUsers = await resUsers.json();
        accessGroups = await resGroups.json();

        renderUsers();
        renderGroups();
        populateGroupSelect();
    } catch (error) {
        console.error("Erro ao carregar dados de autenticação:", error);
    }
}

// Renderizando Usuários
function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    systemUsers.forEach(u => {
        const groupsHtml = u.groups && u.groups.length > 0
            ? u.groups.map(g => `<span class="badge in-use" style="background:var(--primary); color:white; border-color:var(--primary)">${g}</span>`).join(' ')
            : `<span class="badge available">Sem Grupo</span>`;

        tbody.innerHTML += `
            <tr>
                <td><i class="fa-solid fa-user" style="color:var(--primary); margin-right:5px"></i> ${u.username}</td>
                <td>${u.email || '-'}</td>
                <td>${groupsHtml}</td>
                <td>${u.date_joined}</td>
                <td>
                    <button class="icon-btn danger" onclick="deleteUser('${u.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function renderGroups() {
    const tbody = document.getElementById('groups-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    accessGroups.forEach(g => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${g.name}</strong></td>
                <td>${g.user_count} usuários</td>
                <td>
                    <button class="icon-btn danger" onclick="deleteGroup('${g.id}')" title="Excluir Grupo"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function populateGroupSelect() {
    const sel = document.getElementById('user-group');
    if (!sel) return;
    sel.innerHTML = '<option value="">Sem Grupo / Padrão</option>';
    accessGroups.forEach(g => {
        sel.innerHTML += `<option value="${g.name}">${g.name}</option>`;
    });
}

async function saveUser() {
    const username = document.getElementById('user-username').value;
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    const group = document.getElementById('user-group').value;

    if (!username || !password) return alert('Username e Senha são obrigatórios!');

    const res = await fetch('/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, group })
    });

    if (res.ok) {
        document.getElementById('user-username').value = '';
        document.getElementById('user-email').value = '';
        document.getElementById('user-password').value = '';
        closeModal('user-modal');
        await fetchAuthData();
    } else {
        const d = await res.json();
        alert(d.error || 'Erro ao salvar usuário');
    }
}

async function deleteUser(id) {
    if (!confirm('Certeza que deseja excluir este usuário de acesso?')) return;
    const res = await fetch('/api/users/' + id + '/', { method: 'DELETE' });
    if (res.ok) await fetchAuthData();
    else { const d = await res.json(); alert(d.error); }
}

async function saveGroup() {
    const name = document.getElementById('group-name').value;
    if (!name) return alert('Nome do grupo é obrigatório!');

    const res = await fetch('/api/groups/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });

    if (res.ok) {
        document.getElementById('group-name').value = '';
        closeModal('group-modal');
        await fetchAuthData();
    } else {
        const d = await res.json();
        alert(d.error || 'Erro ao criar grupo');
    }
}

async function deleteGroup(id) {
    if (!confirm('Certeza que deseja excluir este grupo de acesso? (Usuários perderão esses privilégios)')) return;
    const res = await fetch('/api/groups/' + id + '/', { method: 'DELETE' });
    if (res.ok) await fetchAuthData();
    else alert('Erro ao excluir matriz de grupo');
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

function toggleAssetFields() {
    const category = document.getElementById('asset-category').value;
    const procFields = document.getElementById('computer-fields');
    const phoneFields = document.getElementById('phone-fields');

    procFields.style.display = 'none';
    phoneFields.style.display = 'none';

    if (category === 'Computador / Notebook') {
        procFields.style.display = 'block';
    } else if (category === 'Celular / Tablet') {
        phoneFields.style.display = 'block';
    }
}

function toggleAssetEntryDate() {
    const condition = document.getElementById('asset-condition').value;
    const dateContainer = document.getElementById('container-entry-date');
    if (condition === 'Novo') {
        dateContainer.style.display = 'block';
    } else {
        dateContainer.style.display = 'none';
        document.getElementById('asset-entry-date').value = '';
    }
}

let currentEditingAssetId = null;

function openAssetModalNew() {
    currentEditingAssetId = null;
    document.querySelector('#asset-modal h2').textContent = 'Cadastrar Ativo';

    document.getElementById('asset-name').value = '';
    document.getElementById('asset-category').value = 'Computador / Notebook';
    document.getElementById('asset-brand').value = '';
    document.getElementById('asset-condition').value = 'Usado';
    document.getElementById('asset-entry-date').value = '';

    document.getElementById('asset-processor').value = '';
    document.getElementById('asset-ram').value = '';
    document.getElementById('asset-storage').value = '';
    document.getElementById('asset-imei').value = '';
    document.getElementById('asset-phone').value = '';
    document.getElementById('asset-observation').value = '';

    toggleAssetFields();
    toggleAssetEntryDate();
    openModal('asset-modal');
}

function editAsset(id) {
    const asset = assets.find(a => a.id === id);
    if (!asset) return;

    currentEditingAssetId = id;
    document.querySelector('#asset-modal h2').textContent = 'Editar Ativo';

    document.getElementById('asset-name').value = asset.name || '';
    document.getElementById('asset-category').value = asset.category || 'Computador / Notebook';
    document.getElementById('asset-brand').value = asset.brand || '';
    document.getElementById('asset-condition').value = asset.condition || 'Usado';

    if (asset.entry_date) {
        document.getElementById('asset-entry-date').value = asset.entry_date;
    } else {
        document.getElementById('asset-entry-date').value = '';
    }

    document.getElementById('asset-processor').value = asset.processor || '';
    document.getElementById('asset-ram').value = asset.ram_memory || '';
    document.getElementById('asset-storage').value = asset.storage || '';
    document.getElementById('asset-imei').value = asset.imei || '';
    document.getElementById('asset-phone').value = asset.phone_number || '';
    document.getElementById('asset-observation').value = asset.observation || '';

    toggleAssetFields();
    toggleAssetEntryDate();
    openModal('asset-modal');
}

async function saveAsset() {
    const name = document.getElementById('asset-name').value;
    const category = document.getElementById('asset-category').value;

    const processor = document.getElementById('asset-processor').value;
    const ram_memory = document.getElementById('asset-ram').value;
    const storage = document.getElementById('asset-storage').value;
    const imei = document.getElementById('asset-imei').value;
    const phone_number = document.getElementById('asset-phone').value;
    const observation = document.getElementById('asset-observation').value;

    // Novidades
    const brand = document.getElementById('asset-brand').value;
    const condition = document.getElementById('asset-condition').value;
    const entry_date = document.getElementById('asset-entry-date').value;

    if (!name) return alert('Preencha o nome do ativo!');

    const url = currentEditingAssetId ? `/api/assets/${currentEditingAssetId}/update/` : '/api/assets/';
    const method = currentEditingAssetId ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name, category, processor, ram_memory, storage, imei, phone_number, observation,
            brand, condition, entry_date
        })
    });

    if (response.ok) {
        currentEditingAssetId = null;
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
                    <button class="icon-btn" onclick="editAsset('${asset.id}')" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="icon-btn danger" onclick="deleteAsset('${asset.id}')" title="Excluir">
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
    const matricula = document.getElementById('employee-matricula').value;
    const department = document.getElementById('employee-department').value;
    const role = document.getElementById('employee-role').value;

    if (!name) return alert('Preencha o nome!');

    const response = await fetch('/api/employees/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            matricula: matricula || '',
            department: department || '',
            role: role || 'Sem Setor'
        })
    });

    if (response.ok) {
        document.getElementById('employee-name').value = '';
        document.getElementById('employee-matricula').value = '';
        document.getElementById('employee-department').value = '';
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
                        <p class="card-subtitle">${emp.department || emp.role} <br> <span style="font-size: 11px; opacity: 0.7">Matrícula: ${emp.matricula || '-'}</span></p>
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
        const info = [e.name, e.department, e.matricula].filter(Boolean).join(' - ');
        empSelect.innerHTML += `<option value="${e.id}">${info}</option>`;
    });
}

async function assignAsset() {
    const assetId = document.getElementById('assign-asset-select').value;
    const empId = document.getElementById('assign-employee-select').value;
    const signedTerm = document.getElementById('assign-signed-term').checked;

    if (!assetId || !empId) return alert('Selecione um ativo e um funcionário!');

    const response = await fetch('/api/assignments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: assetId, employeeId: empId, signedTerm: signedTerm })
    });

    if (response.ok) {
        document.getElementById('assign-signed-term').checked = false;
        alert('Ativo vinculado com sucesso!');
        await fetchData();
    } else {
        alert("Erro ao vincular ativo");
    }
}

function openReturnModal(asgId) {
    document.getElementById('return-asg-id').value = asgId;
    document.getElementById('return-date').value = new Date().toISOString().split('T')[0];
    openModal('return-modal');
}

async function confirmReturnAsset() {
    const asgId = document.getElementById('return-asg-id').value;
    const date = document.getElementById('return-date').value;

    if (!asgId || !date) return alert('Selecione uma data válida.');

    if (!confirm('Confirmar devolução com a data selecionada?')) return;

    const response = await fetch(`/api/assignments/${asgId}/return/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_date: date })
    });

    if (response.ok) {
        closeModal('return-modal');
        await fetchData();
    } else {
        alert('Erro ao realizar a devolução do ativo.');
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

        const termIcon = asg.signed_term
            ? '<i class="fa-solid fa-file-signature" style="color: var(--success); font-size: 12px; margin-left: 5px;" title="Termo Assinado"></i>'
            : '<i class="fa-solid fa-file-circle-xmark" style="color: var(--danger); font-size: 12px; margin-left: 5px;" title="Termo Pendente"></i>';

        const dateObj = new Date(asg.date);
        const dateStr = dateObj.toLocaleDateString('pt-BR');

        tbody.innerHTML += `
            <tr>
                <td style="font-family: monospace; font-size: 11px;">...${asg.asset_id.slice(-6)}</td>
                <td>${asset.name}</td>
                <td>${emp.name} ${termIcon}</td>
                <td>${dateStr}</td>
                <td>
                    <button class="btn secondary" style="padding: 4px 8px; font-size: 12px" onclick="openReturnModal('${asg.id}')">
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
            : `<span class="badge available" title="Devolvido em ${r.return_date ? new Date(r.return_date).toLocaleDateString('pt-BR') : 'Data Indisponível'}">Devolvido</span>`;

        const termIcon = r.signed_term ? '<i class="fa-solid fa-file-signature text-success" style="color:var(--success); font-size: 11px;" title="Termo OK"></i>' : '';

        recentTable.innerHTML += `
            <tr>
                <td>${asset.name}</td>
                <td>${emp.name} ${termIcon}</td>
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

    // Mágica do QR Code: Colocamos a URL completa (window.location.origin) passando o ?scan=
    // Para funcionar em smartphones, o sistema web precisa ser acessado não por localhost, mas pelo IP da rede
    const fullAppUrl = window.location.origin + '/?scan=' + assetId;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullAppUrl)}&margin=10`;

    qrContainer.innerHTML = `<img src="${qrUrl}" alt="QR Code do Ativo">`;

    // Buscar quem está usando o ativo atualmente
    const activeAssignment = assignments.find(a => a.asset_id === assetId && a.status === 'active');

    if (activeAssignment) {
        const emp = employees.find(e => e.id === activeAssignment.employee_id);
        if (emp) {
            idDisplay.innerHTML = `<strong>Em uso por:</strong> ${emp.name} <br> <span style="font-size: 11px; opacity: 0.6; font-family: monospace;">${assetId}</span>`;
        } else {
            idDisplay.textContent = assetId;
        }
    } else {
        idDisplay.innerHTML = `<strong style="color: var(--success);">Disponível no Estoque</strong> <br> <span style="font-size: 11px; opacity: 0.6; font-family: monospace;">${assetId}</span>`;
    }

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

// --- Variável global para o Scanner de Câmera ---
let html5QrCode;

function startCameraScan() {
    const readerContainer = document.getElementById('reader-container');
    const btnStart = document.getElementById('btn-start-camera');
    const btnStop = document.getElementById('btn-stop-camera');

    readerContainer.style.display = 'block';
    btnStart.style.display = 'none';
    btnStop.style.display = 'inline-flex';

    html5QrCode = new Html5Qrcode("reader");

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        // Encontrou um QR Code! Parar a câmera e pesquisar o ID.
        stopCameraScan();

        // Se caso for a URL embutida com o "?scan=", nós extraímos só o código final (asset-...)
        let targetId = decodedText;
        if (decodedText.includes('scan=')) {
            const urlObj = new URL(decodedText);
            targetId = urlObj.searchParams.get('scan');
        }

        document.getElementById('scan-input').value = targetId;
        scanAsset();
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // Tentar acessar diretamente a câmera traseira de celulares
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch((err) => {
            console.error("Erro ao abrir a câmera: ", err);
            alert("Erro ao tentar acessar a câmera. Verifique as permissões de vídeo do seu navegador para este site.");
            stopCameraScan();
        });
}

function stopCameraScan() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader-container').style.display = 'none';
            document.getElementById('btn-start-camera').style.display = 'inline-flex';
            document.getElementById('btn-stop-camera').style.display = 'none';
        }).catch((err) => {
            console.error("Erro ao fechar a câmera.", err);
        });
    }
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

    let specsHtml = '';
    if (asset.category === 'Computador / Notebook') {
        if (asset.processor || asset.ram_memory || asset.storage) {
            specsHtml = `
            <div class="detail-item" style="background: var(--bg-color); padding: 10px; border-radius: 6px; margin-top: 5px;">
                <span class="detail-label"><i class="fa-solid fa-microchip"></i> Especificações Hw</span>
                <span class="detail-value" style="font-size: 13px;">
                    ${asset.processor ? `Proc: <b>${asset.processor}</b><br>` : ''}
                    ${asset.ram_memory ? `RAM: <b>${asset.ram_memory}</b><br>` : ''}
                    ${asset.storage ? `Armazenamento: <b>${asset.storage}</b>` : ''}
                </span>
            </div>`;
        }
    } else if (asset.category === 'Celular / Tablet') {
        if (asset.imei || asset.phone_number) {
            specsHtml = `
            <div class="detail-item" style="background: var(--bg-color); padding: 10px; border-radius: 6px; margin-top: 5px;">
                <span class="detail-label"><i class="fa-solid fa-mobile-screen"></i> Dados Telecom</span>
                <span class="detail-value" style="font-size: 13px;">
                    ${asset.imei ? `IMEI: <b>${asset.imei}</b><br>` : ''}
                    ${asset.phone_number ? `Linha: <b>${asset.phone_number}</b>` : ''}
                </span>
            </div>`;
        }
    }

    if (asset.observation) {
        specsHtml += `
        <div class="detail-item" style="margin-top: 5px;">
            <span class="detail-label"><i class="fa-solid fa-note-sticky"></i> Observações</span>
            <span class="detail-value" style="font-size: 12px; color: var(--text-secondary);">${asset.observation}</span>
        </div>`;
    }

    let contentHtml = `
        <div class="result-card">
            <div class="result-header">
                <h2>${asset.name}</h2>
                <div class="result-details">
                    <div class="detail-item">
                        <span class="detail-label">Categoria</span>
                        <span class="detail-value">${asset.category} ${asset.brand ? `(${asset.brand})` : ''}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Condição</span>
                        <span class="detail-value">${asset.condition || 'Usado'} ${asset.entry_date && asset.condition === 'Novo' ? `<span style="font-size:11px"><br>Comprado em ${new Date(asset.entry_date + "T12:00:00").toLocaleDateString('pt-BR')}</span>` : ''}</span>
                    </div>
                    ${specsHtml}
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

        const termStatus = isActive.signed_term
            ? '<span style="color: var(--success);"><i class="fa-solid fa-check-circle"></i> Termo Assinado</span>'
            : '<span style="color: var(--warning);"><i class="fa-solid fa-triangle-exclamation"></i> Assinatura Pendente</span>';

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
                            <span style="font-size: 13px; color: var(--text-secondary)">${emp.department || emp.role} | Mat: ${emp.matricula || 'N/A'}</span>
                        </div>
                    </div>
                    <div style="margin-top: 15px; font-size: 13px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 5px;">
                        <div><i class="fa-solid fa-calendar"></i> Retirado em: ${dateObj.toLocaleString('pt-BR')}</div>
                        <div style="font-weight: 600;">${termStatus}</div>
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
