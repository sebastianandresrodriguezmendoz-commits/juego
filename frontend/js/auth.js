// GunRun 2D - Módulo de Autenticación, Estadísticas y Leaderboard (Fase 2)
const API_BASE_URL = (window.location.origin && window.location.origin.startsWith('http'))
    ? `${window.location.origin}/api`
    : 'http://127.0.0.1:5000/api';

const state = {
    token: sessionStorage.getItem('gunrun_token') || null,
    user: null,
    stats: null
};

// Elementos del DOM - Conectividad & Alertas
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const alertBox = document.getElementById('alert-box');
const alertMessage = document.getElementById('alert-message');
const btnCheckHealth = document.getElementById('btn-check-health');

// Paneles Principales
const authFormsContainer = document.getElementById('auth-forms-container');
const userDashboard = document.getElementById('user-dashboard');

// Formularios Auth
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');

// Perfil de Usuario
const profileUsername = document.getElementById('profile-username');
const profileEmail = document.getElementById('profile-email');
const profileId = document.getElementById('profile-id');
const profileToken = document.getElementById('profile-token');
const btnLogout = document.getElementById('btn-logout');

// Estadísticas del Jugador (Fase 2)
const statHighScore = document.getElementById('stat-high-score');
const statHighWave = document.getElementById('stat-high-wave');
const statTotalKills = document.getElementById('stat-total-kills');
const statTotalGames = document.getElementById('stat-total-games');
const statTotalPlaytime = document.getElementById('stat-total-playtime');

// Simulador de Partida (Fase 2)
const matchSimForm = document.getElementById('match-sim-form');

// Tabla de Clasificación Global (Leaderboard)
const leaderboardBody = document.getElementById('leaderboard-body');
const btnRefreshLeaderboard = document.getElementById('btn-refresh-leaderboard');
const leaderboardCount = document.getElementById('leaderboard-count');

// Sistema de Notificaciones Toast Retro-Arcade Neón
function showToast(title, message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `arcade-toast toast-${type}`;

    let iconClass = 'bi-info-circle-fill';
    if (type === 'success') iconClass = 'bi-check-circle-fill';
    else if (type === 'danger') iconClass = 'bi-exclamation-triangle-fill';
    else if (type === 'warning') iconClass = 'bi-exclamation-diamond-fill';
    else if (type === 'achievement') iconClass = 'bi-award-fill';

    toast.innerHTML = `
        <div class="toast-icon"><i class="bi ${iconClass}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 350);
    }, duration);
}

// Notificaciones (Compatibilidad con Alertas & Toasts)
function showAlert(message, type = 'danger') {
    const title = type === 'success' ? 'ÉXITO' : (type === 'danger' ? 'ALERTA' : (type === 'warning' ? 'AVISO' : 'INFO'));
    showToast(title, message, type);

    if (alertBox && alertMessage) {
        alertBox.className = `alert alert-${type} alert-dismissible fade show arcade-panel`;
        alertMessage.textContent = message;
        alertBox.classList.remove('d-none');
    }
}

function hideAlert() {
    alertBox.classList.add('d-none');
}

// 1. Health Check
async function checkBackendHealth() {
    statusDot.className = 'status-dot';
    statusText.textContent = 'Verificando...';
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const result = await response.json();
        if (response.ok && result.success) {
            statusDot.className = 'status-dot status-online';
            statusText.textContent = `Online (MySQL: ${result.data.database})`;
        } else {
            throw new Error(result.error || 'Respuesta no exitosa');
        }
    } catch (error) {
        statusDot.className = 'status-dot status-offline';
        statusText.textContent = 'Desconectado';
        showAlert(`No se pudo conectar con el backend en ${API_BASE_URL}. Verifique que run.py esté corriendo.`, 'warning');
    }
}

// 2. Registro de Usuario Real
async function handleRegister(e) {
    e.preventDefault();
    hideAlert();

    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        showAlert('Las contraseñas no coinciden.', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Error al procesar el registro.');
        }

        showAlert('¡Usuario registrado exitosamente en MySQL! Sesión iniciada.', 'success');
        setSession(data.data.token, data.data.user);
        registerForm.reset();
        await fetchUserStats();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// 3. Inicio de Sesión Real
async function handleLogin(e) {
    e.preventDefault();
    hideAlert();

    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Error de autenticación.');
        }

        showAlert('Inicio de sesión verificado. Token JWT emitido.', 'success');
        setSession(data.data.token, data.data.user);
        loginForm.reset();
        await fetchUserStats();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// 4. Validar Perfil Autenticado con Bearer Token
async function fetchUserProfile() {
    if (!state.token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Sesión expirada.');
        }

        setSession(state.token, data.data.user);
        await fetchUserStats();
    } catch (error) {
        console.warn('Token inválido o expirado:', error.message);
        clearSession();
    }
}

// 5. Estadísticas Acumuladas del Jugador (Fase 2)
async function fetchUserStats() {
    if (!state.token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/scores/my-stats`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        const data = await response.json();
        if (response.ok && data.success) {
            const stats = data.data.stats;
            state.stats = stats;
            renderUserStats(stats);
        }
    } catch (error) {
        console.error('Error al obtener estadísticas del jugador:', error);
    }
}

function renderUserStats(stats) {
    statHighScore.textContent = (stats.highest_score || 0).toLocaleString();
    statHighWave.textContent = stats.highest_wave || 0;
    statTotalKills.textContent = stats.total_kills || 0;
    statTotalGames.textContent = stats.total_games || 0;
    const minutes = Math.floor((stats.total_playtime_seconds || 0) / 60);
    const seconds = (stats.total_playtime_seconds || 0) % 60;
    statTotalPlaytime.textContent = `${minutes}m ${seconds}s`;
}

// 6. Enviar Partida / Simulación de Combate (Fase 2)
async function handleSaveScore(e) {
    e.preventDefault();
    hideAlert();

    if (!state.token) {
        showAlert('Debes iniciar sesión para registrar puntuaciones.', 'warning');
        return;
    }

    const score = parseInt(document.getElementById('sim-score').value, 10);
    const wave = parseInt(document.getElementById('sim-wave').value, 10);
    const kills = parseInt(document.getElementById('sim-kills').value, 10);
    const survival_time = parseInt(document.getElementById('sim-time').value, 10);
    const accuracy = parseFloat(document.getElementById('sim-accuracy').value);

    try {
        const response = await fetch(`${API_BASE_URL}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ score, wave, kills, survival_time, accuracy })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Error al guardar la partida.');
        }

        showAlert(`¡Partida registrada en MySQL! +${score.toLocaleString()} pts (Oleada ${wave})`, 'success');
        renderUserStats(data.data.stats);
        await fetchLeaderboard();

        // Celebrar nuevos logros desbloqueados
        if (data.data.new_achievements && data.data.new_achievements.length > 0) {
            data.data.new_achievements.forEach(ach => {
                showToast('¡LOGRO DESBLOQUEADO!', `${ach.title}: ${ach.description}`, 'achievement', 6000);
            });
            await fetchAchievements();
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// 7. Consultar Leaderboard Global Top 10 (Fase 2)
async function fetchLeaderboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/scores/leaderboard`);
        const data = await response.json();

        if (response.ok && data.success) {
            renderLeaderboard(data.data.leaderboard);
            if (leaderboardCount) {
                leaderboardCount.textContent = `${data.data.count} Registros`;
            }
        }
    } catch (error) {
        console.error('Error al consultar el ranking:', error);
    }
}

function renderLeaderboard(scores) {
    if (!leaderboardBody) return;

    if (!scores || scores.length === 0) {
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-trophy fs-3 d-block mb-2"></i>
                    Aún no hay puntuaciones registradas. ¡Sé el primero en jugar!
                </td>
            </tr>
        `;
        return;
    }

    leaderboardBody.innerHTML = scores.map(item => {
        let rankClass = 'rank-other';
        if (item.rank === 1) rankClass = 'rank-1';
        else if (item.rank === 2) rankClass = 'rank-2';
        else if (item.rank === 3) rankClass = 'rank-3';

        return `
            <tr>
                <td class="text-center">
                    <span class="rank-badge ${rankClass}">${item.rank}</span>
                </td>
                <td>
                    <span class="fw-bold text-white">${escapeHtml(item.username)}</span>
                    ${state.user && state.user.id === item.user_id ? '<span class="badge bg-info text-dark ms-1">TÚ</span>' : ''}
                </td>
                <td class="text-info fw-bold">${item.score.toLocaleString()}</td>
                <td><span class="badge bg-dark border border-secondary">Oleada ${item.wave}</span></td>
                <td>${item.kills} <span class="text-muted small">bajas</span></td>
                <td>${item.survival_time}s</td>
                <td><span class="text-success small">${item.accuracy}%</span></td>
            </tr>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Gestión del Estado de Sesión en la UI
function setSession(token, user) {
    state.token = token;
    state.user = user;
    sessionStorage.setItem('gunrun_token', token);

    authFormsContainer.classList.add('d-none');
    userDashboard.classList.remove('d-none');

    profileUsername.textContent = user.username;
    profileEmail.textContent = user.email;
    profileId.textContent = `#${user.id}`;
    profileToken.textContent = token;
}

function clearSession() {
    state.token = null;
    state.user = null;
    state.stats = null;
    sessionStorage.removeItem('gunrun_token');

    authFormsContainer.classList.remove('d-none');
    userDashboard.classList.add('d-none');

    // Limpiar métricas
    statHighScore.textContent = '0';
    statHighWave.textContent = '0';
    statTotalKills.textContent = '0';
    statTotalGames.textContent = '0';
    statTotalPlaytime.textContent = '0m 0s';
}

// 5.5 Historial de Partidas del Jugador (MySQL)
const historyTableBody = document.getElementById('history-table-body');
const btnRefreshHistory = document.getElementById('btn-refresh-history');
const btnRefreshStats = document.getElementById('btn-refresh-stats');
const btnOpenHistory = document.getElementById('btn-open-history');

async function fetchUserHistory() {
    if (!state.token || !historyTableBody) return;

    historyTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-muted py-3">
                <div class="spinner-border spinner-border-sm text-info me-2" role="status"></div>
                Consultando partidas en MySQL...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/scores/my-history`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        const data = await response.json();
        if (response.ok && data.success) {
            renderUserHistory(data.data.history);
        } else {
            throw new Error(data.error || 'No se pudo cargar el historial.');
        }
    } catch (error) {
        historyTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-3">
                    <i class="bi bi-exclamation-triangle me-1"></i> ${error.message}
                </td>
            </tr>
        `;
    }
}

function renderUserHistory(history) {
    if (!historyTableBody) return;

    if (!history || history.length === 0) {
        historyTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-controller fs-4 d-block mb-1"></i>
                    Aún no has registrado partidas en esta cuenta. ¡Empieza a jugar en la Arena!
                </td>
            </tr>
        `;
        return;
    }

    historyTableBody.innerHTML = history.map(item => {
        let dateFormatted = item.created_at || 'Reciente';
        if (item.created_at) {
            try {
                const d = new Date(item.created_at);
                dateFormatted = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (e) { }
        }

        return `
            <tr>
                <td class="text-secondary fw-bold">#${item.id}</td>
                <td class="small text-muted">${dateFormatted}</td>
                <td class="text-info fw-bold">${item.score.toLocaleString()} pts</td>
                <td><span class="badge bg-dark border border-secondary">Oleada ${item.wave}</span></td>
                <td><span class="text-warning">${item.kills}</span> bajas</td>
                <td>${item.survival_time}s</td>
                <td><span class="text-success">${item.accuracy}%</span></td>
            </tr>
        `;
    }).join('');
}

// 5.6 Sistema de Logros y Medallas de Combate (MySQL)
const achievementsContainer = document.getElementById('achievements-container');
const achievementsSummaryText = document.getElementById('achievements-summary-text');
const btnRefreshAchievements = document.getElementById('btn-refresh-achievements');
const btnOpenAchievements = document.getElementById('btn-open-achievements');

async function fetchAchievements() {
    if (!state.token || !achievementsContainer) return;

    try {
        const response = await fetch(`${API_BASE_URL}/scores/achievements`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        const data = await response.json();
        if (response.ok && data.success) {
            renderAchievements(data.data);
        }
    } catch (error) {
        console.error('Error al obtener logros:', error);
    }
}

function renderAchievements(data) {
    if (!achievementsContainer) return;

    if (achievementsSummaryText) {
        achievementsSummaryText.textContent = `${data.unlocked_count} de ${data.total_count} Desbloqueados`;
    }

    achievementsContainer.innerHTML = data.achievements.map(item => {
        const isUnlocked = item.unlocked;
        const cardClass = isUnlocked ? 'unlocked' : 'locked';
        const badgeState = isUnlocked
            ? `<span class="badge bg-success bg-opacity-75 text-white brand-font" style="font-size:0.7rem;"><i class="bi bi-check-circle me-1"></i> DESBLOQUEADO</span>`
            : `<span class="badge bg-dark border border-secondary text-secondary brand-font" style="font-size:0.7rem;"><i class="bi bi-lock me-1"></i> BLOQUEADO</span>`;

        let dateStr = '';
        if (isUnlocked && item.unlocked_at) {
            try {
                const d = new Date(item.unlocked_at);
                dateStr = `<div class="text-muted small mt-1" style="font-size:0.75rem;">Obtenido: ${d.toLocaleDateString()}</div>`;
            } catch (e) { }
        }

        return `
            <div class="col-md-6">
                <div class="achievement-card ${cardClass}">
                    <div class="achievement-icon-box" style="color: ${item.color}; border-color: ${isUnlocked ? item.color : 'rgba(255,255,255,0.1)'};">
                        <i class="bi ${item.icon}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="brand-font fw-bold" style="color: ${isUnlocked ? item.color : '#8d99ae'}; font-size: 0.95rem;">${escapeHtml(item.title)}</span>
                            ${badgeState}
                        </div>
                        <div class="small text-secondary">${escapeHtml(item.description)}</div>
                        ${dateStr}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Event Listeners
registerForm.addEventListener('submit', handleRegister);
loginForm.addEventListener('submit', handleLogin);
btnLogout.addEventListener('click', () => {
    clearSession();
    showAlert('Sesión cerrada correctamente.', 'info');
});
btnCheckHealth.addEventListener('click', checkBackendHealth);
btnRefreshLeaderboard.addEventListener('click', fetchLeaderboard);
matchSimForm.addEventListener('submit', handleSaveScore);

if (btnRefreshStats) {
    btnRefreshStats.addEventListener('click', async () => {
        await fetchUserStats();
        showAlert('Estadísticas actualizadas desde MySQL.', 'info');
    });
}

if (btnRefreshHistory) {
    btnRefreshHistory.addEventListener('click', fetchUserHistory);
}

if (btnOpenHistory) {
    btnOpenHistory.addEventListener('click', fetchUserHistory);
}

if (btnRefreshAchievements) {
    btnRefreshAchievements.addEventListener('click', fetchAchievements);
}

if (btnOpenAchievements) {
    btnOpenAchievements.addEventListener('click', fetchAchievements);
}

// Inicialización Automática
document.addEventListener('DOMContentLoaded', () => {
    checkBackendHealth();
    fetchLeaderboard();
    if (state.token) {
        fetchUserProfile();
        fetchAchievements();
    }
});

// Exponer funciones para integración automática con el motor de juego
window.fetchLeaderboard = fetchLeaderboard;
window.fetchUserStats = fetchUserStats;
window.fetchUserHistory = fetchUserHistory;
window.fetchAchievements = fetchAchievements;
window.showToast = showToast;
window.showAlert = showAlert;
