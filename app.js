// ==================== SGA v8.0 - APPLICATION COMPLÈTE ====================
// ==================== PARTIE 1 : CONSTANTES ====================
console.log("🚀 SGA v8.0 - Application chargée");
// API 
// Avant (l'ancienne constante à supprimer ou commenter)
// const SHEET_BEST_BASE_URL = "https://api.sheetbest.com/sheets/3c7ae8f7-6b84-4020-8d6a-ff8bc1de1c1b";

// Après (utilisez l'URL de votre projet Vercel)
const SHEET_BEST_BASE_URL = "https://agsmapi.vercel.app/api";

// Pour les congés, nous utiliserons le même base + /tabs/Conges plus tard
const SHEET_LEAVES_API_URL = SHEET_BEST_BASE_URL; // temporaire, mais on utilisera les tabs
// Charger les agents depuis le cloud (TOUT LE MONDE VOIT LES MÊMES DONNÉES)
async function loadSharedAgents() {
    if (!SHEET_BEST_BASE_URL) return false;
    try {
        // Plus de "/tabs" : l'URL de base est déjà "https://agsmapi.vercel.app/api"
        const response = await fetch(`${SHEET_BEST_BASE_URL}/Agents`);
        if (!response.ok) throw new Error("Erreur réseau");
        const cloudAgents = await response.json();

        if (cloudAgents && cloudAgents.length > 0) {
            agents = cloudAgents.map(row => ({
                code: row.Code || '',
                nom: row.Nom || '',
                prenom: row.Prénom || '',
                groupe: row.Groupe || '',
                tel: row.Tel || '',
                matricule: row.Matricule || '',
                cin: row.Cin || '',
                poste: row.Poste || '',
                date_entree: row.DateEntree || '',
                statut: row.Statut ? row.Statut.trim().toLowerCase() : 'actif',
                adresse: row.Adresse || '',
                email: row.Email || '',
                date_naissance: row.Date_Naissance || '',
                date_sortie: row.DateSortie || null
            }));
            localStorage.setItem('sga_agents', JSON.stringify(agents));
            console.log(`✅ ${agents.length} agents chargés`);
            if (typeof showSnackbar === 'function') showSnackbar(`✅ ${agents.length} agents synchronisés`);
            return true;
        }
    } catch (erreur) {
        console.error("❌ Erreur chargement", erreur);
        showSnackbar("Erreur de chargement des agents");
    }
    return false;
}
// Sauvegarder les agents vers le cloud

      
     async function saveSharedAgents() {
    if (!SHEET_BEST_BASE_URL) return;
    try {
        // 1. Supprimer tout l'onglet
        const delRes = await fetch(`${SHEET_BEST_BASE_URL}/Agents/all`, { method: 'DELETE' });
        if (!delRes.ok) throw new Error(`DELETE échoué: ${delRes.status}`);
        
        // 2. Réécrire les nouvelles données
        const dataToSend = agents.map(a => ({ ... }));
        const postRes = await fetch(`${SHEET_BEST_BASE_URL}/Agents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        if (!postRes.ok) throw new Error(`POST échoué: ${postRes.status}`);
        console.log("✅ Agents sauvegardés");
        showSnackbar("✅ Agents synchronisés");
    } catch (err) {
        console.error("❌ Erreur sauvegarde", err);
        showSnackbar("Erreur de synchronisation");
    }
}

const JOURS_FRANCAIS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MOIS_FRANCAIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const SHIFT_LABELS = {'1': 'Matin', '2': 'Après-midi', '3': 'Nuit', 'R': 'Repos', 'C': 'Congé', 'M': 'Maladie', 'A': 'Autre absence', '-': 'Non défini'};
const SHIFT_COLORS = {'1': '#3498db', '2': '#e74c3c', '3': '#9b59b6', 'R': '#2ecc71', 'C': '#f39c12', 'M': '#e67e22', 'A': '#95a5a6', '-': '#7f8c8d'};

let agents = [];
let planningData = {};
let holidays = [];
let panicCodes = [];
let radios = [];
let uniforms = [];
let warnings = [];
let replacementNotifications = [];
let autoSaveInterval = null;
let currentUser = null;
// ==================== PARTIE 1bis : SOLDES CONGES ====================
let soldeConges = [];   // [{ agentCode, annee, mois, pris, commentaire }]
// Utilisateurs par défaut
let users = [
    { id: 1, username: "admin", password: "NABIL1974", role: "ADMIN", nom: "Admin", prenom: "Système", groupe: null, agentCode: null },
    { id: 2, username: "cp_a", password: "CPA123", role: "CP", nom: "OUKHA", prenom: "NABIL", groupe: "A", agentCode: "CPA" },
    { id: 3, username: "cp_b", password: "CPB123", role: "CP", nom: "CHMAREKH", prenom: "Noureddine", groupe: "B", agentCode: "CPB" },
    { id: 4, username: "cp_c", password: "CPC123", role: "CP", nom: "BERRIMA", prenom: "ABDELHAK", groupe: "C", agentCode: "CPC" },
    { id: 5, username: "cp_d", password: "CPD123", role: "CP", nom: "YAGOUB", prenom: "mouhcine", groupe: "D", agentCode: "CPD" },
    { id: 6, username: "agent_a001", password: "AGENT123", role: "AGENT", nom: "Durand", prenom: "Jean", groupe: null, agentCode: "A001" },
];

// Déclaration unique des notifications
let notifications = [];
let soldesConges = [];   // { agentCode, annee, droitAnnuel, reportAnt, totalDispo, pris, reste }
// ==================== PARTIE 2 : FONCTIONS DE BASE ====================
// Ancienne fonction saveData - À REMPLACER
function saveData() {
    localStorage.setItem('sga_users', JSON.stringify(users));
    localStorage.setItem('sga_agents', JSON.stringify(agents));
    localStorage.setItem('sga_planning', JSON.stringify(planningData));
    localStorage.setItem('sga_holidays', JSON.stringify(holidays));
    localStorage.setItem('sga_panic_codes', JSON.stringify(panicCodes));
    localStorage.setItem('sga_radios', JSON.stringify(radios));
    localStorage.setItem('sga_uniforms', JSON.stringify(uniforms));
    localStorage.setItem('sga_warnings', JSON.stringify(warnings));
    localStorage.setItem('sga_notifications', JSON.stringify(replacementNotifications));
    localStorage.setItem('sga_sys_notifications', JSON.stringify(notifications));
    localStorage.setItem('sga_solde_conges', JSON.stringify(soldeConges));
    localStorage.setItem('sga_soldes_conges', JSON.stringify(soldesConges));
    
    // Sauvegarder aussi dans le cloud
    saveSharedAgents();
    
    console.log("💾 Données sauvegardées -", agents.length, "agents");
}

// Ancienne fonction loadData - À REMPLACER
function loadData() {
    const savedUsers = localStorage.getItem('sga_users');
    if (savedUsers) users = JSON.parse(savedUsers);
    
    planningData = JSON.parse(localStorage.getItem('sga_planning') || '{}');
    holidays = JSON.parse(localStorage.getItem('sga_holidays') || '[]');
    panicCodes = JSON.parse(localStorage.getItem('sga_panic_codes') || '[]');
    radios = JSON.parse(localStorage.getItem('sga_radios') || '[]');
    uniforms = JSON.parse(localStorage.getItem('sga_uniforms') || '[]');
    warnings = JSON.parse(localStorage.getItem('sga_warnings') || '[]');
    replacementNotifications = JSON.parse(localStorage.getItem('sga_notifications') || '[]');
    notifications = JSON.parse(localStorage.getItem('sga_sys_notifications') || '[]');
    soldeConges = JSON.parse(localStorage.getItem('sga_solde_conges') || '[]');
    soldesConges = JSON.parse(localStorage.getItem('sga_soldes_conges') || '[]');
    
    if (holidays.length === 0) initializeHolidays();
    
    // Charger les agents depuis le localStorage uniquement (pas de cloud immédiat)
    const savedAgents = localStorage.getItem('sga_agents');
    if (savedAgents && savedAgents.length > 0) {
        agents = JSON.parse(savedAgents);
    } else {
        if (agents.length === 0) initializeDemoAgents();
    }
    
    // Afficher le menu principal sans attendre le cloud
    displayMainMenu();
    
    // Lancer la synchronisation en arrière-plan (une fois après affichage)
    if (currentUser) {
        syncAgentsFromCloud();
    }
    
}
       async function syncAgentsFromCloud() {
    const success = await loadSharedAgents();
    if (!success) {
        console.log("Impossible de synchroniser les agents depuis le cloud");
        // Optionnel : afficher un message à l'utilisateur
        if (typeof showSnackbar === 'function') {
            showSnackbar("⚠️ Synchronisation cloud échouée, données locales affichées");
        }
    } 
// Rafraîchir les données toutes les 5 minutes
setInterval(async () => {
    if (currentUser) {
        await loadSharedAgents();
        await loadSharedLeaves();
        console.log("🔄 Synchronisation automatique");
    }
}, 5 * 60 * 1000); // 5 minutes
        
}
function initializeHolidays() {
    holidays = [
        { date: "01-01", description: "Nouvel An", isRecurring: true, type: "fixe" },
        { date: "01-11", description: "Indépendance", isRecurring: true, type: "fixe" },
        { date: "05-01", description: "Fête du Travail", isRecurring: true, type: "fixe" },
        { date: "07-30", description: "Fête du Trône", isRecurring: true, type: "fixe" },
        { date: "08-14", description: "Oued Eddahab", isRecurring: true, type: "fixe" },
        { date: "08-20", description: "Révolution", isRecurring: true, type: "fixe" },
        { date: "08-21", description: "Fête de la Jeunesse", isRecurring: true, type: "fixe" },
        { date: "11-06", description: "Marche Verte", isRecurring: true, type: "fixe" },
        { date: "11-18", description: "Indépendance", isRecurring: true, type: "fixe" }
    ];
}

function initializeDemoAgents() {
    agents = [
        { code: 'A001', nom: 'Durand', prenom: 'Jean', groupe: 'A', tel: '0612345678', matricule: 'MAT001', cin: 'AA111111', poste: 'Agent', date_entree: '2024-01-01', statut: 'actif', date_sortie: null, adresse: 'Paris', email: 'jean.durand@email.com' },
        { code: 'A002', nom: 'Petit', prenom: 'Marie', groupe: 'A', tel: '0623456789', matricule: 'MAT002', cin: 'BB222222', poste: 'Agent', date_entree: '2024-01-01', statut: 'actif', date_sortie: null, adresse: 'Lyon', email: 'marie.petit@email.com' },
        { code: 'B001', nom: 'Martin', prenom: 'Paul', groupe: 'B', tel: '0634567890', matricule: 'MAT003', cin: 'CC333333', poste: 'Agent', date_entree: '2024-01-01', statut: 'actif', date_sortie: null, adresse: 'Marseille', email: 'paul.martin@email.com' },
        { code: 'J001', nom: 'Joker', prenom: 'Un', groupe: 'J', tel: '0645678901', matricule: 'JOK001', cin: 'JJ444444', poste: 'Joker', date_entree: '2024-01-01', statut: 'actif', date_sortie: null, adresse: 'Casablanca', email: 'joker1@email.com' },
        { code: 'J002', nom: 'Joker', prenom: 'Deux', groupe: 'J', tel: '0656789012', matricule: 'JOK002', cin: 'JJ555555', poste: 'Joker', date_entree: '2024-01-01', statut: 'actif', date_sortie: null, adresse: 'Rabat', email: 'joker2@email.com' },
        { code: 'CPA', nom: 'OUKHA', prenom: 'NABIL', groupe: 'A', tel: '0681564713', adresse: 'sala Al jadida', poste: 'CP', cin: 'A758609', date_naissance: '1974-11-05', matricule: 'S09278C', date_entree: '2025-11-01', statut: 'actif' }
    ];
    saveData();
}

function checkPassword(action) {
    const pwd = prompt(`🔐 Confirmation pour: ${action}\nMot de passe administrateur:`);
    if (pwd !== "NABIL1974") { alert("❌ Mot de passe incorrect!"); return false; }
    return true;
}

function showSnackbar(msg) {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = msg;
    snackbar.className = "show";
    setTimeout(() => { snackbar.className = ""; }, 3000);
}

function getMonthName(month) { return MOIS_FRANCAIS[month - 1] || ''; }

function isHolidayDate(date) {
    const monthDay = `${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
    return holidays.some(h => h.isRecurring && h.date === monthDay);
}

function getHolidayDescription(date) {
    const monthDay = `${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
    const holiday = holidays.find(h => h.date === monthDay);
    return holiday || { description: 'Jour férié' };
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDateToFrench(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}
// ==================== PARTIE 3 : GESTION DES SHIFTS ====================

function getReplacementInfo(agentCode, dateStr) {
    const monthKey = dateStr.substring(0,7);
    const agent = agents.find(a => a.code === agentCode);
    
    // Cas 1: L'agent est un joker - voir qui il remplace
    if (agent && agent.groupe === 'J') {
        for (const otherAgent of agents) {
            if (otherAgent.groupe === 'J') continue;
            const entry = planningData[monthKey]?.[otherAgent.code]?.[dateStr];
            if (entry && ['C', 'M', 'A'].includes(entry.shift)) {
                const notification = replacementNotifications.find(n => 
                    n.agent_absent === otherAgent.code && 
                    n.joker === agentCode &&
                    n.date_debut <= dateStr && 
                    n.date_fin >= dateStr
                );
                if (notification) {
                    return { type: 'remplace', agent: otherAgent.code };
                }
                const jokerEntry = planningData[monthKey]?.[agentCode]?.[dateStr];
                if (jokerEntry && jokerEntry.type === 'remplacement_joker' && jokerEntry.comment && jokerEntry.comment.includes(otherAgent.code)) {
                    return { type: 'remplace', agent: otherAgent.code };
                }
            }
        }
        return null;
    }
    
    // Cas 2: L'agent est remplacé par un joker
    for (const joker of agents.filter(a => a.groupe === 'J')) {
        const jokerEntry = planningData[monthKey]?.[joker.code]?.[dateStr];
        if (jokerEntry && jokerEntry.type === 'remplacement_joker' && jokerEntry.comment && jokerEntry.comment.includes(agentCode)) {
            return { type: 'remplace_par', agent: joker.code };
        }
        const notification = replacementNotifications.find(n => 
            n.agent_absent === agentCode && 
            n.joker === joker.code &&
            n.date_debut <= dateStr && 
            n.date_fin >= dateStr
        );
        if (notification) {
            return { type: 'remplace_par', agent: joker.code };
        }
    }
    return null;
}

function getShiftDisplay(agentCode, dateStr) {
    const shift = getShiftForAgent(agentCode, dateStr);
    const replacement = getReplacementInfo(agentCode, dateStr);
    const agent = agents.find(a => a.code === agentCode);
    
    if (agent && agent.groupe === 'J' && replacement && replacement.type === 'remplace') {
        const replacedAgent = agents.find(a => a.code === replacement.agent);
        const agentName = replacedAgent ? `${replacedAgent.nom} ${replacedAgent.prenom}` : replacement.agent;
        return `${shift} 🔄 Remplace ${agentName}`;
    }
    
    if (replacement && replacement.type === 'remplace_par') {
        const jokerAgent = agents.find(a => a.code === replacement.agent);
        const jokerName = jokerAgent ? `${jokerAgent.nom} ${jokerAgent.prenom}` : replacement.agent;
        return `${shift} 🔄 Remplacé par ${jokerName}`;
    }
    
    return shift;
}

function getTheoreticalShift(agentCode, dateStr) {
    const agent = agents.find(a => a.code === agentCode);
    if (!agent || agent.statut !== 'actif') return '-';
    if (agent.groupe === 'J') return 'R';
    if (agent.groupe === 'E') {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) return 'R';
        return date.getDate() % 2 === 0 ? '1' : '2';
    }
    
    const date = new Date(dateStr);
    const referenceDate = new Date(2025, 10, 1);
    const timeDiff = date - referenceDate;
    const daysSinceStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const groupOffset = { 'A': 0, 'B': 2, 'C': 4, 'D': 6 }[agent.groupe] || 0;
    let cycleDay = (daysSinceStart + groupOffset) % 8;
    if (cycleDay < 0) cycleDay += 8;
    
    if (cycleDay === 0 || cycleDay === 1) return '1';
    if (cycleDay === 2 || cycleDay === 3) return '2';
    if (cycleDay === 4 || cycleDay === 5) return '3';
    return 'R';
}

function findReplacedAgent(jokerCode, dateStr) {
    for (const agent of agents) {
        if (agent.code === jokerCode) continue;
        if (agent.groupe === 'J') continue;
        const shift = getShiftForAgent(agent.code, dateStr);
        if (['C', 'M', 'A'].includes(shift)) {
            const monthKey = dateStr.substring(0,7);
            const jokerAssignment = planningData[monthKey]?.[jokerCode]?.[dateStr];
            if (jokerAssignment?.comment?.includes(agent.code)) return agent;
            const notification = replacementNotifications.find(n => 
                n.joker === jokerCode && n.date_absence === dateStr && n.agent_absent === agent.code
            );
            if (notification) return agent;
        }
    }
    return null;
}

function getTheoreticalShiftWithoutAbsence(agentCode, dateStr) {
    const agent = agents.find(a => a.code === agentCode);
    if (!agent) return '-';
    if (agent.groupe === 'E') {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) return 'R';
        return date.getDate() % 2 === 0 ? '1' : '2';
    }
    const date = new Date(dateStr);
    const referenceDate = new Date(2025, 10, 1);
    const timeDiff = date - referenceDate;
    const daysSinceStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const groupOffset = { 'A': 0, 'B': 2, 'C': 4, 'D': 6 }[agent.groupe] || 0;
    let cycleDay = (daysSinceStart + groupOffset) % 8;
    if (cycleDay < 0) cycleDay += 8;
    if (cycleDay === 0 || cycleDay === 1) return '1';
    if (cycleDay === 2 || cycleDay === 3) return '2';
    if (cycleDay === 4 || cycleDay === 5) return '3';
    return 'R';
}

function getJokerShift(jokerCode, dateStr) {
    const replacedAgent = findReplacedAgent(jokerCode, dateStr);
    if (replacedAgent) return getTheoreticalShiftWithoutAbsence(replacedAgent.code, dateStr);
    return 'R';
}

function getShiftForAgent(agentCode, dateStr) {
    const monthKey = dateStr.substring(0, 7);
    const existing = planningData[monthKey]?.[agentCode]?.[dateStr];
    if (existing && existing.shift) return existing.shift;
    const agent = agents.find(a => a.code === agentCode);
    if (!agent || agent.statut !== 'actif') return '-';
    if (agent.groupe === 'J') return getJokerShift(agentCode, dateStr);
    return getTheoreticalShift(agentCode, dateStr);
}

function getAvailableJokersForDates(dates) {
    const jokers = agents.filter(a => a.groupe === 'J' && a.statut === 'actif');
    return jokers.filter(joker => {
        for (const dateStr of dates) {
            const monthKey = dateStr.substring(0,7);
            const existing = planningData[monthKey]?.[joker.code]?.[dateStr];
            if (existing && existing.type === 'remplacement_joker') return false;
            if (existing && ['C','M','A'].includes(existing.shift)) return false;
            const theoretical = getTheoreticalShift(joker.code, dateStr);
            if (theoretical !== 'R') return false;
        }
        return true;
    });
}

async function saveLeaveWithJoker() {
    const leaveType = document.getElementById('leaveType').value;
    const agentCode = document.getElementById('leaveAgent').value;
    const comment = document.getElementById('leaveComment').value;
    
    if (!agentCode) { alert("⚠️ Sélectionnez un agent"); return; }
    if (!canAccessAgent(agentCode)) { alert("⚠️ Vous n'avez pas accès à cet agent"); return; }

    let dates = [];
    let absenceType = 'C';

    if (leaveType === 'period') {
        const start = document.getElementById('periodStart').value;
        const end = document.getElementById('periodEnd').value;
        if (!start || !end) { alert("⚠️ Dates début et fin requises"); return; }
        let cur = new Date(start);
        while (cur <= new Date(end)) {
            dates.push(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 1);
        }
        absenceType = 'C';
    } else {
        const date = document.getElementById('leaveDate').value;
        if (!date) { alert("⚠️ Date requise"); return; }
        dates = [date];
        absenceType = document.getElementById('absenceType').value;
    }

    const daysToProcess = [];
    for (const dateStr of dates) {
        const date = new Date(dateStr);
        const isSunday = date.getDay() === 0;
        const theoreticalShift = getTheoreticalShift(agentCode, dateStr);

        if (isSunday) {
            daysToProcess.push({
                dateStr,
                agentShift: 'R',
                jokerShift: theoreticalShift,
                isSunday: true
            });
        } else {
            daysToProcess.push({
                dateStr,
                agentShift: absenceType,
                jokerShift: (theoreticalShift !== 'R') ? theoreticalShift : 'R',
                isSunday: false
            });
        }
    }

    if (daysToProcess.length === 0) {
        alert("Aucun jour à traiter.");
        return;
    }

    const datesForJoker = daysToProcess.filter(d => d.jokerShift !== 'R').map(d => d.dateStr);
    let selectedJoker = null;
    
    if (datesForJoker.length > 0) {
        const availableJokers = getAvailableJokersForDates(datesForJoker);
        if (availableJokers.length > 0) {
            const jokerList = availableJokers.map(j => `${j.code} (${j.nom} ${j.prenom})`).join('\n');
            const choice = prompt(`🤖 Jokers disponibles :\n${jokerList}\n\nEntrez le code du joker :`);
            if (choice) {
                selectedJoker = availableJokers.find(j => j.code === choice.toUpperCase());
                if (!selectedJoker) alert("Code joker invalide. Pas de remplacement.");
            }
        } else {
            const confirmNoJoker = confirm("⚠️ Aucun joker disponible.\nContinuer sans remplacement ?");
            if (!confirmNoJoker) return;
        }
    }

    for (const day of daysToProcess) {
        const monthKey = day.dateStr.substring(0,7);
        if (!planningData[monthKey]) planningData[monthKey] = {};
        if (!planningData[monthKey][agentCode]) planningData[monthKey][agentCode] = {};
        planningData[monthKey][agentCode][day.dateStr] = {
            shift: day.agentShift,
            type: leaveType === 'period' ? 'congé_période' : 'absence',
            comment: comment + (day.isSunday ? ' (dimanche non compté)' : '')
        };

        if (selectedJoker && day.jokerShift !== 'R') {
            if (!planningData[monthKey][selectedJoker.code]) planningData[monthKey][selectedJoker.code] = {};
            planningData[monthKey][selectedJoker.code][day.dateStr] = {
                shift: day.jokerShift,
                type: 'remplacement_joker',
                comment: `Remplace ${agentCode} le ${day.dateStr} - ${comment || absenceType}`
            };
        }
    }

    if (selectedJoker) {
        const startDate = daysToProcess[0].dateStr;
        const endDate = daysToProcess[daysToProcess.length-1].dateStr;
        replacementNotifications.unshift({
            id: Date.now(),
            date: new Date().toISOString(),
            agent_absent: agentCode,
            joker: selectedJoker.code,
            date_debut: startDate,
            date_fin: endDate,
            lu: false
        });
        saveNotifications();
        
        addNotification('leave_add', {
            action: 'create',
            agentCode: agentCode,
            agentName: `${agents.find(a => a.code === agentCode)?.nom || agentCode} ${agents.find(a => a.code === agentCode)?.prenom || ''}`,
            startDate: dates[0],
            endDate: dates[dates.length-1],
            absenceType: absenceType,
            joker: selectedJoker ? selectedJoker.code : null,
            comment: comment
        });
    }

    saveData();
    alert(`✅ ${absenceType === 'C' ? 'Congés' : 'Absences'} enregistrés${selectedJoker ? `\n🔄 Joker ${selectedJoker.code} remplace ${agentCode}` : ' (sans remplacement)'}`);
    // Sauvegarder dans le cloud
await saveLeaveToCloud(agentCode, dates[0], dates[dates.length-1], absenceType, comment, selectedJoker ? selectedJoker.code : null);
    displayLeavesMenu();
}
// ==================== PARTIE 4 : STATISTIQUES ====================

function calculateAgentStats(agentCode, month, year) {
    const daysInMonth = new Date(year, month, 0).getDate();
    let travaillesNormaux = 0, feriesTravailles = 0, conges = 0, maladie = 0, autre = 0, repos = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
        const date = new Date(year, month-1, day);
        const shift = getShiftForAgent(agentCode, dateStr);
        const isHoliday = isHolidayDate(date);
        
        if (shift === '1' || shift === '2' || shift === '3') {
            travaillesNormaux++;
            if (isHoliday) feriesTravailles++;
        } else if (shift === 'C') conges++;
        else if (shift === 'M') maladie++;
        else if (shift === 'A') autre++;
        else if (shift === 'R') repos++;
    }
    const totalGeneral = travaillesNormaux + conges + feriesTravailles;
    return { travaillesNormaux, feriesTravailles, conges, maladie, autre, repos, totalGeneral };
}

function calculateWorkedStats(agentCode, startDate, endDate) {
    let travaillesNormaux = 0, feriesTravailles = 0, conges = 0, maladie = 0, autre = 0, repos = 0;
    let cur = new Date(startDate);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);
    
    while (cur <= endDateTime) {
        const dateStr = cur.toISOString().split('T')[0];
        const shift = getShiftForAgent(agentCode, dateStr);
        const isHoliday = isHolidayDate(cur);
        
        if (shift === '1' || shift === '2' || shift === '3') {
            travaillesNormaux++;
            if (isHoliday) feriesTravailles++;
        } else if (shift === 'C') conges++;
        else if (shift === 'M') maladie++;
        else if (shift === 'A') autre++;
        else if (shift === 'R') repos++;
        cur.setDate(cur.getDate() + 1);
    }
    const totalGeneral = travaillesNormaux + conges + feriesTravailles;
    return { travaillesNormaux, feriesTravailles, conges, maladie, autre, repos, totalGeneral };
}

function displayStatsMenu() {
    if (currentUser.role === 'CP') {
        showGroupStatsForm();
        return;
    }
    displaySubMenu("STATISTIQUES", [
        { text: "📈 Statistiques Globales", onclick: "showGlobalStats()" },
        { text: "👤 Statistiques par Agent", onclick: "showAgentStatsForm()" },
        { text: "📊 Jours Travaillés - Classement", onclick: "showWorkedDaysFormWithCustom()" },
        { text: "📋 Rapport Complet", onclick: "showFullReport()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ]);
}

function showGlobalStats() {
    const actifs = getFilteredAgents().length;
    const jokers = agents.filter(a => a.groupe === 'J' && a.statut === 'actif').length;
    let totalTravailles = 0, totalConges = 0, totalMaladies = 0, totalAutres = 0;
    
    Object.keys(planningData).forEach(monthKey => {
        Object.keys(planningData[monthKey]).forEach(agentCode => {
            if (!canAccessAgent(agentCode)) return;
            Object.values(planningData[monthKey][agentCode]).forEach(rec => {
                if (rec.shift === 'C') totalConges++;
                else if (rec.shift === 'M') totalMaladies++;
                else if (rec.shift === 'A') totalAutres++;
                else if (['1','2','3'].includes(rec.shift)) totalTravailles++;
            });
        });
    });
    
    const totalGeneral = totalTravailles + totalConges;
    
    const html = `<div class="info-section"><h3>📈 Statistiques Globales</h3>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-value">${actifs}</div><div>👥 Agents actifs</div></div>
            <div class="stat-card"><div class="stat-value">${jokers}</div><div>🃏 Jokers</div></div>
            <div class="stat-card"><div class="stat-value">${totalTravailles}</div><div>✅ Jours travaillés</div></div>
            <div class="stat-card"><div class="stat-value">${totalConges}</div><div>🏖️ Congés pris</div></div>
            <div class="stat-card"><div class="stat-value">${totalMaladies}</div><div>🤒 Maladies</div></div>
            <div class="stat-card"><div class="stat-value">${totalAutres}</div><div>📝 Autres absences</div></div>
        </div>
        <div style="margin-top:15px; background:#2c3e50; padding:10px; border-radius:8px;">
            <strong>⭐ TOTAL GÉNÉRAL (Travail + Congés) : ${totalGeneral}</strong>
        </div>
        <button class="popup-button gray" onclick="displayStatsMenu()" style="margin-top:15px;">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showAgentStatsForm() {
    let agentsList = getFilteredAgents();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const html = `<div class="info-section"><h3>👤 Statistiques par Agent</h3>
        <div class="form-group"><label>🔍 Rechercher agent</label>
            <input type="text" id="searchStatsAgent" placeholder="Tapez pour rechercher..." class="form-input" onkeyup="filterStatsAgentList()">
        </div>
        <div class="form-group"><label>Agent</label>
            <select id="statsAgent" size="5" class="form-input" style="height:auto">
                ${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom} (Groupe ${a.groupe})</option>`).join('')}
            </select>
        </div>
        <div class="form-group"><label>Mois</label>
            <select id="statsMonth" class="form-input">
                ${Array.from({length:12}, (_,i) => `<option value="${i+1}" ${i+1 === currentMonth ? 'selected' : ''}>${MOIS_FRANCAIS[i]}</option>`).join('')}
            </select>
        </div>
        <div class="form-group"><label>Année</label>
            <input type="number" id="statsYear" class="form-input" value="${currentYear}">
        </div>
        <button class="popup-button green" onclick="showAgentStatsResult()">📊 Afficher</button>
        <button class="popup-button gray" onclick="displayStatsMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function filterStatsAgentList() {
    const term = document.getElementById('searchStatsAgent').value.toLowerCase();
    const select = document.getElementById('statsAgent');
    Array.from(select.options).forEach(opt => {
        opt.style.display = opt.text.toLowerCase().includes(term) ? '' : 'none';
    });
}

function showAgentStatsResult() {
    const code = document.getElementById('statsAgent').value;
    const month = parseInt(document.getElementById('statsMonth').value);
    const year = parseInt(document.getElementById('statsYear').value);
    const agent = agents.find(a => a.code === code);
    
    if (!agent) { alert("⚠️ Agent non trouvé"); return; }
    if (!canAccessAgent(code)) { alert("⚠️ Vous n'avez pas accès à cet agent"); return; }
    
    const stats = calculateAgentStats(code, month, year);
    const daysInMonth = new Date(year, month, 0).getDate();
    let sundays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        if (date.getDay() === 0) sundays++;
    }
    const workingDays = daysInMonth - sundays;
    
    const html = `<div class="info-section"><h3>📊 Statistiques de ${agent.nom} ${agent.prenom}</h3>
        <p><strong>Période:</strong> ${getMonthName(month)} ${year} (${daysInMonth} jours, ${sundays} dimanches = ${workingDays} jours ouvrés)</p>
        <table class="classement-table" style="width:100%; margin-top:15px;">
            <thead><tr style="background-color:#34495e;"><th style="padding:10px;">Type</th><th style="padding:10px;">Nombre</th><th style="padding:10px;">Inclus total ?</th></tr></thead>
            <tbody>
                <tr><td style="padding:8px;">🌅 Matin (1) + ☀️ Après-midi (2) + 🌙 Nuit (3)</td>
                    <td style="text-align:center; font-weight:bold; color:#27ae60;">${stats.travaillesNormaux}</td><td style="color:#27ae60;">✅ Oui</td></tr>
                <tr><td style="padding:8px;">🏖️ Congés (C)</td>
                    <td style="text-align:center; font-weight:bold; color:#f39c12;">${stats.conges}</td><td style="color:#27ae60;">✅ Oui</td></tr>
                <tr><td style="padding:8px;">🎉 Jours fériés travaillés</td>
                    <td style="text-align:center; font-weight:bold; color:#e67e22;">${stats.feriesTravailles}</td><td style="color:#27ae60;">✅ Oui</td></tr>
                <tr><td style="padding:8px;">🤒 Maladie (M)</td>
                    <td style="text-align:center;">${stats.maladie}</td><td style="color:#e74c3c;">❌ Non</td></tr>
                <tr><td style="padding:8px;">📝 Autre absence (A)</td>
                    <td style="text-align:center;">${stats.autre}</td><td style="color:#e74c3c;">❌ Non</td></tr>
                <tr><td style="padding:8px;">😴 Repos (R)</td>
                    <td style="text-align:center;">${stats.repos}</td><td style="color:#e74c3c;">❌ Non</td></tr>
            </tbody>
            <tfoot style="background:#2c3e50;"><tr style="border-top:2px solid #f39c12;">
                <td style="padding:10px;"><strong>⭐ TOTAL GÉNÉRAL</strong></td>
                <td style="text-align:center; font-size:1.5em; font-weight:bold; color:#f1c40f;">${stats.totalGeneral}</td>
                <td style="color:#f1c40f;">= Travail + Congés + Fériés</td>
            </tr></tfoot>
        </table>
        <button class="popup-button gray" onclick="displayStatsMenu()" style="margin-top:15px;">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showWorkedDaysFormWithCustom() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
    
    const html = `<div class="info-section"><h3>📊 Jours Travaillés - Classement</h3>
        <div class="form-group"><label>📅 Date début</label>
            <input type="date" id="customStartDate" class="form-input" value="${firstDayOfMonth}">
        </div>
        <div class="form-group"><label>📅 Date fin</label>
            <input type="date" id="customEndDate" class="form-input" value="${lastDayOfMonth}">
        </div>
        <div class="form-group"><label>👥 Groupe</label>
            <select id="workedGroup" class="form-input">
                <option value="ALL">📋 Tous les groupes</option>
                <option value="A">👥 Groupe A</option><option value="B">👥 Groupe B</option>
                <option value="C">👥 Groupe C</option><option value="D">👥 Groupe D</option>
                <option value="E">👥 Groupe E</option><option value="J">🃏 Jokers</option>
            </select>
        </div>
        <button class="popup-button green" onclick="showWorkedDaysResultWithCustom()">📊 Afficher</button>
        <button class="popup-button gray" onclick="displayStatsMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showWorkedDaysResultWithCustom() {
    const start = new Date(document.getElementById('customStartDate').value);
    const end = new Date(document.getElementById('customEndDate').value);
    const group = document.getElementById('workedGroup').value;
    
    if (isNaN(start) || isNaN(end)) { alert("⚠️ Sélectionnez des dates valides"); return; }
    
    const periodName = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    let filtered = agents.filter(a => a.statut === 'actif');
    if (group !== 'ALL') filtered = filtered.filter(a => a.groupe === group);
    if (currentUser.role === 'CP') filtered = filtered.filter(a => a.groupe === currentUser.groupe);
    
    const results = filtered.map(agent => ({ agent, ...calculateWorkedStats(agent.code, start, end) }))
        .sort((a, b) => b.totalGeneral - a.totalGeneral);
    
    const maxTotal = results[0]?.totalGeneral || 1;
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    let sundaysInPeriod = 0;
    let curDate = new Date(start);
    while (curDate <= end) { if (curDate.getDay() === 0) sundaysInPeriod++; curDate.setDate(curDate.getDate() + 1); }
    
    const html = `<div class="info-section"><h3>📊 Classement - ${periodName}</h3>
        <p style="font-size:0.85em; color:#f39c12;">⭐ Total = Jours travaillés + Congés + Fériés<br>📅 ${totalDays} jours, ${sundaysInPeriod} dimanches</p>
        <div style="overflow-x:auto;"><table class="classement-table"><thead><tr style="background-color:#34495e;">
            <th>Rang</th><th>Agent</th><th>Groupe</th><th>✅ Travail</th><th>🏖️ Congés</th><th>🎉 Fériés</th><th>⭐ Total</th>
        </tr></thead><tbody>
        ${results.map((r, i) => {
            const percent = Math.round((r.totalGeneral / maxTotal) * 100);
            return `<tr><td style="text-align:center; font-weight:bold;">${i+1}${i === 0 ? ' 👑' : ''}</td>
                <td><strong>${escapeHtml(r.agent.nom)} ${escapeHtml(r.agent.prenom)}</strong><br><small>${r.agent.code}</small></td>
                <td style="text-align:center;">${r.agent.groupe}</td>
                <td style="text-align:center; color:#27ae60;">${r.travaillesNormaux}</td>
                <td style="text-align:center; color:#f39c12;">${r.conges}</td>
                <td style="text-align:center; color:#e67e22;">${r.feriesTravailles}</td>
                <td style="text-align:center; font-weight:bold; background:#2c3e50;">${r.totalGeneral}
                    <div style="background:#34495e; border-radius:10px; height:4px; margin-top:5px;"><div style="background:#27ae60; width:${percent}%; height:4px;"></div></div>
                </td></tr>`;
        }).join('')}</tbody>
        <tfoot><tr><td colspan="3" style="text-align:right; font-weight:bold;">TOTAUX :</td>
            <td style="text-align:center; font-weight:bold;">${results.reduce((s, r) => s + r.travaillesNormaux, 0)}</td>
            <td style="text-align:center; font-weight:bold;">${results.reduce((s, r) => s + r.conges, 0)}</td>
            <td style="text-align:center; font-weight:bold;">${results.reduce((s, r) => s + r.feriesTravailles, 0)}</td>
            <td style="text-align:center; font-weight:bold; background:#f1c40f; color:#2c3e50;">${results.reduce((s, r) => s + r.totalGeneral, 0)}</td>
        </tr></tfoot></table></div>
        <button class="popup-button gray" onclick="displayStatsMenu()" style="margin-top:15px;">↩️ Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showFullReport() {
    const actifs = getFilteredAgents().length;
    let totalTravailles = 0, totalConges = 0;
    let totalRadios = radios.length, totalUniforms = uniforms.length, totalWarnings = warnings.length;
    
    Object.keys(planningData).forEach(monthKey => {
        Object.keys(planningData[monthKey]).forEach(agentCode => {
            if (!canAccessAgent(agentCode)) return;
            Object.values(planningData[monthKey][agentCode]).forEach(rec => {
                if (rec.shift === 'C') totalConges++;
                else if (['1', '2', '3'].includes(rec.shift)) totalTravailles++;
            });
        });
    });
    
    const totalGeneral = totalTravailles + totalConges;
    
    const html = `<div class="info-section"><h3>📋 Rapport Complet</h3>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-value">${actifs}</div><div>👥 Agents actifs</div></div>
            <div class="stat-card"><div class="stat-value">${agents.filter(a => a.groupe === 'J').length}</div><div>🃏 Jokers</div></div>
            <div class="stat-card"><div class="stat-value">${totalTravailles}</div><div>✅ Jours travaillés</div></div>
            <div class="stat-card"><div class="stat-value">${totalConges}</div><div>🏖️ Congés</div></div>
            <div class="stat-card"><div class="stat-value">${totalRadios}</div><div>📻 Radios</div></div>
            <div class="stat-card"><div class="stat-value">${totalUniforms}</div><div>👔 Agents équipés</div></div>
            <div class="stat-card"><div class="stat-value">${totalWarnings}</div><div>⚠️ Avertissements</div></div>
            <div class="stat-card"><div class="stat-value">${panicCodes.length}</div><div>🚨 Codes panique</div></div>
        </div>
        <div style="margin-top:15px; background:#2c3e50; padding:10px; border-radius:8px;">
            <strong>⭐ TOTAL GÉNÉRAL : ${totalGeneral}</strong>
        </div>
        <button class="popup-button gray" onclick="displayStatsMenu()" style="margin-top:15px;">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}
// ==================== PARTIE 5 : SYSTÈME DE LOGIN ====================

function showLogin() {
    const html = `
        <div class="login-overlay" id="loginOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); display:flex; justify-content:center; align-items:center; z-index:10000;">
            <div class="login-box" style="background:#2c3e50; padding:30px; border-radius:15px; width:350px; text-align:center; border:1px solid #f39c12;">
                <h2 style="color:#f39c12;">🏢 SGA v8.0</h2>
                <h3 style="color:white;">CleanCo</h3>
                <input type="text" id="loginUsername" placeholder="Nom d'utilisateur" style="width:100%; padding:12px; margin:10px 0; border-radius:5px; border:none; background:#34495e; color:white;">
                <input type="password" id="loginPassword" placeholder="Mot de passe" style="width:100%; padding:12px; margin:10px 0; border-radius:5px; border:none; background:#34495e; color:white;">
                <button class="popup-button green" onclick="doLogin()" style="width:100%;">Se connecter</button>
                <p style="margin-top:15px; font-size:0.7rem; color:#bdc3c7;">Demo: admin/NABIL1974 | cp_a/CPA123 | agent_a001/AGENT123</p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function doLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        alert("❌ Identifiants incorrects!");
        return;
    }
    
    currentUser = user;
    localStorage.setItem('sga_current_user', JSON.stringify({ id: user.id, username: user.username }));
    
    document.getElementById('loginOverlay').remove();
    
    const header = document.querySelector('.app-header');
    const userInfoDiv = document.createElement('div');
    userInfoDiv.className = 'user-info';
    userInfoDiv.style.cssText = 'margin-top:10px; display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;';
    userInfoDiv.innerHTML = `
        <div id="notificationIcon" style="position:relative; cursor:pointer;">
            <span style="font-size:1.5rem;">🔔</span>
            <span id="notificationBadge" style="position:absolute; top:-8px; right:-8px; background:#e74c3c; color:white; border-radius:50%; padding:2px 6px; font-size:0.7rem; font-weight:bold; display:none;">0</span>
        </div>
        <span style="background:#f39c12; padding:4px 12px; border-radius:20px; font-size:0.8rem; color:#2c3e50;">
            ${user.role === 'ADMIN' ? '👑 Admin' : (user.role === 'CP' ? '👥 CP Groupe ' + user.groupe : '👤 Agent')}
        </span>
        <span style="color:white;">${user.nom} ${user.prenom}</span>
        <button class="logout-btn" onclick="logout()" style="background:#e74c3c; border:none; padding:5px 12px; border-radius:20px; color:white; cursor:pointer;">🚪 Déconnexion</button>
    `;
    header.appendChild(userInfoDiv);
    setTimeout(function() {
    attachNotificationClick();
}, 100);
    // === AJOUTEZ CES LIGNES ICI ===
    const notificationIcon = document.getElementById('notificationIcon');
    if (notificationIcon) {
        notificationIcon.onclick = function() {
            console.log("Clic sur notification");
            if (typeof showNotificationsPanel === 'function') {
                showNotificationsPanel();
            } else {
                console.log("showNotificationsPanel non défini");
                alert("Fonction notifications non disponible");
            }
        };
    }
    // ===============================
    // Attacher l'événement notification
setTimeout(function() {
    attachNotificationClick();
}, 200);
    updateNotificationBadge();
    displayMainMenu();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('sga_current_user');
    const userInfoDiv = document.querySelector('.user-info');
    if (userInfoDiv) userInfoDiv.remove();
    showLogin();
}

function changeMyPassword() {
    const oldPwd = prompt("🔐 Mot de passe actuel :");
    if (oldPwd !== currentUser.password) {
        alert("❌ Mot de passe incorrect!");
        return;
    }
    const newPwd = prompt("Nouveau mot de passe (minimum 4 caractères) :");
    if (!newPwd || newPwd.length < 4) {
        alert("❌ Le mot de passe doit contenir au moins 4 caractères");
        return;
    }
    const confirmPwd = prompt("Confirmez le nouveau mot de passe :");
    if (newPwd !== confirmPwd) {
        alert("❌ Les mots de passe ne correspondent pas!");
        return;
    }
    currentUser.password = newPwd;
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) users[userIndex].password = newPwd;
    saveData();
    alert("✅ Mot de passe modifié avec succès!");
}

// ==================== PARTIE 6 : FONCTIONS DE FILTRAGE ====================

function getFilteredAgents() {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN') return agents.filter(a => a.statut === 'actif');
    if (currentUser.role === 'CP') return agents.filter(a => a.statut === 'actif' && a.groupe === currentUser.groupe);
    if (currentUser.role === 'AGENT') {
        const agent = agents.find(a => a.code === currentUser.agentCode);
        return agent ? [agent] : [];
    }
    return [];
}

function canAccessAgent(agentCode) {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'CP') {
        const agent = agents.find(a => a.code === agentCode);
        return agent && agent.groupe === currentUser.groupe;
    }
    if (currentUser.role === 'AGENT') return currentUser.agentCode === agentCode;
    return false;
}

function canAccessGroup(group) {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'CP') return currentUser.groupe === group;
    return false;
}
// ==================== PARTIE 7 : MENU PRINCIPAL ====================


function displayMainMenu() {
  
    const main = document.getElementById('main-content');
    
    document.getElementById('sub-title').textContent = "Menu Principal";
    
    if (!currentUser) return;
    
    if (currentUser.role === 'AGENT') {
        displayAgentMenu();
        return;
    }
    
    const actifs = getFilteredAgents().length;
    let buttons = [];
    
    if (currentUser.role === 'ADMIN') {
        buttons = [
            { text: "👥 GESTION DES AGENTS", onclick: "displayAgentsMenu()" },
            { text: "📅 GESTION DU PLANNING", onclick: "displayPlanningMenu()" },
            { text: "📆 GESTION SOLDES CONGÉS", onclick: "showSoldeMenu()" },
            { text: "🔄 Rafraîchir les données", onclick: "refreshAllData()", className: "menu-section" },
            { text: "📊 STATISTIQUES", onclick: "displayStatsMenu()" },
         
            { text: "🏖️ CONGÉS & ABSENCES", onclick: "displayLeavesMenu()" },
            { text: "🚨 CODES PANIQUE", onclick: "displayPanicMenu()" },
            { text: "📻 RADIOS", onclick: "displayRadiosMenu()" },
            { text: "👔 HABILLEMENT", onclick: "displayUniformMenu()" },
            { text: "⚠️ AVERTISSEMENTS", onclick: "displayWarningsMenu()" },
            { text: "🎉 JOURS FÉRIÉS", onclick: "displayHolidaysMenu()" },
            { text: "💾 EXPORTATIONS", onclick: "displayExportMenu()" },
            { text: "⚙️ CONFIGURATION", onclick: "displayConfigMenu()" },
            { text: "👥 GESTION UTILISATEURS", onclick: "showUsersManagement()" },
            { text: "🔑 CHANGER MOT DE PASSE", onclick: "changeMyPassword()" }
        ];
    } else if (currentUser.role === 'CP') {
        buttons = [
            { text: "📅 MON PLANNING", onclick: "viewMyPlanning()" },
            { text: "👥 PLANNING GROUPE", onclick: "showGroupPlanningForm()" },
            { text: "🔄 MODIFIER SHIFTS", onclick: "showShiftModificationForm()" },
            { text: "🏖️ GÉRER CONGÉS", onclick: "showAddLeaveForm()" },
            { text: "📆 SOLDES CONGÉS", onclick: "showSoldeMenu()" },
            { text: "📆 SOLDES CONGÉS", onclick: "showSoldeMenu()" },
            { text: "🔄 ÉCHANGER SHIFTS", onclick: "showShiftExchangeForm()" },
            { text: "👔 GÉRER HABILLEMENT", onclick: "showAddUniformForm()" },
            { text: "⚠️ GÉRER AVERTISSEMENTS", onclick: "showAddWarningForm()" },
            { text: "🚨 GÉRER CODES PANIQUE", onclick: "showAddPanicForm()" },
            { text: "📻 GÉRER RADIOS", onclick: "displayRadiosMenu()" },
            { text: "🎉 JOURS FÉRIÉS", onclick: "displayHolidaysMenu()" },
            { text: "📊 STATISTIQUES GROUPE", onclick: "showGroupStatsForm()" },
            { text: "📊 JOURS TRAVAILLÉS - CLASSEMENT", onclick: "showWorkedDaysFormForCP()" },
            { text: "👤 MES INFORMATIONS", onclick: "showMyInfo()" },
            { text: "🔑 CHANGER MOT DE PASSE", onclick: "changeMyPassword()" }
            
        ];
        
    }
    async function refreshAllData() {
    showSnackbar("🔄 Synchronisation en cours...");
    await loadSharedAgents();
    await loadSharedLeaves();
    showSnackbar("✅ Données mises à jour");
    displayMainMenu(); // ou recharger la page courante
}
    
    
    main.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-cards">
                <div class="card"><h3>👥 Agents accessibles</h3><div class="card-value">${actifs}</div></div>
                <div class="card"><h3>📋 Total agents</h3><div class="card-value">${agents.length}</div></div>
                <div class="card"><h3>📅 Planning</h3><div class="card-value">${Object.keys(planningData).length}</div></div>
            </div>
            <div class="menu-button-container">
                ${buttons.map(b => `<button class="menu-button ${b.className || ''}" onclick="${b.onclick}">${b.text}</button>`).join('')}
                <button class="menu-button quit-button" onclick="logout()">🚪 DÉCONNEXION</button>
            </div>
        </div>
    `;
}

function displaySubMenu(title, buttons) {
    const main = document.getElementById('main-content');
    document.getElementById('sub-title').textContent = title;
    main.innerHTML = `<div class="menu-button-container">${buttons.map(b => `<button class="menu-button ${b.className || ''}" onclick="${b.onclick}">${b.text}</button>`).join('')}</div>`;
}

// ==================== PARTIE 8 : MENU AGENT ====================

function displayAgentMenu() {
    const main = document.getElementById('main-content');
    document.getElementById('sub-title').textContent = "Menu Agent";
    const agent = agents.find(a => a.code === currentUser.agentCode);
    
    main.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-cards">
                <div class="card"><h3>👤 ${agent ? agent.nom + ' ' + agent.prenom : currentUser.nom}</h3><div class="card-value">${agent ? agent.code : '-'}</div></div>
                <div class="card"><h3>👥 Groupe</h3><div class="card-value">${agent ? agent.groupe : '-'}</div></div>
            </div>
            <div class="menu-button-container">
                <button class="menu-button menu-section" onclick="viewAgentPlanning()">📅 MON PLANNING</button>
                <button class="menu-button menu-section" onclick="showAgentPersonalInfo()">👤 MES INFORMATIONS</button>
                <button class="menu-button menu-section" onclick="showAgentUniform()">👔 MON HABILLEMENT</button>
                <button class="menu-button menu-section" onclick="showAgentWarnings()">⚠️ MES AVERTISSEMENTS</button>
                <button class="menu-button menu-section" onclick="showAgentPanicCode()">🚨 MON CODE PANIQUE</button>
                <button class="menu-button menu-section" onclick="showAgentRadio()">📻 MA RADIO</button>
                <button class="menu-button menu-section" onclick="showHolidaysCalendar()">🎉 JOURS FÉRIÉS</button>
                <button class="menu-button menu-section" onclick="showSoldeMenu()">📆 MON SOLDE DE CONGÉS</button>
              
                <button class="menu-button menu-section" onclick="changeMyPassword()">🔑 CHANGER MOT DE PASSE</button>
                <button class="menu-button quit-button" onclick="logout()">🚪 DÉCONNEXION</button>
            </div>
        </div>
    `;
}

// ==================== PARTIE 9 : FONCTIONS AGENT ====================

function viewAgentPlanning() {
    const agentCode = currentUser.agentCode;
    if (!agentCode) { alert("⚠️ Code agent non trouvé"); return; }
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    showAgentPlanningSimple(agentCode, currentMonth, currentYear);
}

function showAgentPlanningSimple(agentCode, month, year) {
    const agent = agents.find(a => a.code === agentCode);
    if (!agent) { alert("⚠️ Agent non trouvé"); return; }
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthHolidays = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month-1, day);
        if (isHolidayDate(date)) monthHolidays.push({ day, description: getHolidayDescription(date).description });
    }
    const stats = calculateAgentStats(agentCode, month, year);
    let rows = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${month.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
        const date = new Date(year, month-1, d);
        const dayName = JOURS_FRANCAIS[date.getDay()];
        const shift = getShiftForAgent(agentCode, dateStr);
        const shiftDisplay = getShiftDisplay(agentCode, dateStr);
        const color = SHIFT_COLORS[shift] || '#7f8c8d';
        const isHoliday = isHolidayDate(date);
        const holidayInfo = monthHolidays.find(h => h.day === d);
        
        let shiftIcon = '';
        if (shift === '1') shiftIcon = '🌅 ';
        else if (shift === '2') shiftIcon = '☀️ ';
        else if (shift === '3') shiftIcon = '🌙 ';
        else if (shift === 'R') shiftIcon = '😴 ';
        else if (shift === 'C') shiftIcon = '🏖️ ';
        else if (shift === 'M') shiftIcon = '🤒 ';
        else if (shift === 'A') shiftIcon = '📝 ';
        
        let holidayBadge = '';
        if (isHoliday && holidayInfo) {
            if (shift === '1' || shift === '2' || shift === '3') {
                holidayBadge = `<span style="background:#e67e22; color:white; padding:2px 6px; border-radius:10px; font-size:0.7em;">🎉 Férié travaillé: ${holidayInfo.description}</span>`;
            } else {
                holidayBadge = `<span style="background:#f39c12; color:#2c3e50; padding:2px 6px; border-radius:10px; font-size:0.7em;">🎉 ${holidayInfo.description}</span>`;
            }
        }
        
        rows.push(`<tr style="border-bottom:1px solid #34495e;">
            <td style="padding:8px; text-align:center; width:60px;"><strong>${d}</strong><br><span style="font-size:0.7em;">${dayName}</span></td>
            <td style="background-color:${color}; color:white; text-align:center; padding:8px; font-weight:bold;">${shiftIcon}${shiftDisplay}</td>
            <td style="padding:8px; text-align:center;">${holidayBadge || '-'}</td>
         </td>`);
    }
    
    let html = `<div class="info-section">
        <h3>📅 Mon Planning - ${getMonthName(month)} ${year}</h3>
        <p><strong>${agent.nom} ${agent.prenom}</strong> (${agent.code}) - Groupe ${agent.groupe}</p>
        ${monthHolidays.length > 0 ? `<div style="background:#2c3e50; padding:10px; border-radius:8px; margin-bottom:15px;">
            <strong>📅 Jours fériés ce mois-ci :</strong>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:5px;">${monthHolidays.map(h => `<span style="background:#f39c12; color:#2c3e50; padding:3px 10px; border-radius:15px; font-size:0.8em;">🎉 ${h.day} ${getMonthName(month)}: ${h.description}</span>`).join('')}</div>
        </div>` : '<p style="color:#7f8c8d; margin-bottom:15px;">📅 Aucun jour férié ce mois-ci</p>'}
        <div style="overflow-x:auto;"><table class="planning-table" style="width:100%; border-collapse:collapse;">
            <thead><tr style="background-color:#34495e;"><th style="padding:10px;">Date</th><th style="padding:10px;">Shift</th><th style="padding:10px;">Jours fériés</th></tr></thead>
            <tbody>${rows.join('')}</tbody>
            <tfoot style="background-color:#2c3e50;"><tr><td colspan="3" style="padding:15px;">
                <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:15px; text-align:center;">
                    <div style="background:#27ae60; padding:10px; border-radius:8px;">✅ Jours travaillés<br><span style="font-size:1.5em; font-weight:bold;">${stats.travaillesNormaux}</span></div>
                    <div style="background:#f39c12; padding:10px; border-radius:8px;">🏖️ Congés (C)<br><span style="font-size:1.5em; font-weight:bold;">${stats.conges}</span></div>
                    <div style="background:#e67e22; padding:10px; border-radius:8px;">🎉 Fériés travaillés<br><span style="font-size:1.5em; font-weight:bold;">${stats.feriesTravailles}</span></div>
                    <div style="background:#f1c40f; color:#2c3e50; padding:10px; border-radius:8px;">⭐ TOTAL<br><span style="font-size:1.8em; font-weight:bold;">${stats.totalGeneral}</span></div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; text-align:center; margin-top:10px; font-size:0.85em;">
                    <div>🤒 Maladie (M): ${stats.maladie} <span style="color:#e74c3c">(non compté)</span></div>
                    <div>📝 Autre absence (A): ${stats.autre} <span style="color:#e74c3c">(non compté)</span></div>
                    <div>😴 Repos (R): ${stats.repos}</div>
                </div>
            </td></tr></tfoot>
        </table></div>
        <button class="popup-button gray" onclick="displayMainMenu()" style="margin-top:15px;">↩️ Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showAgentPersonalInfo() {
    const agent = agents.find(a => a.code === currentUser.agentCode);
    if (!agent) { alert("⚠️ Agent non trouvé"); return; }
    
    const html = `<div class="info-section"><h3>👤 Mes Informations Personnelles</h3>
        <div class="info-item"><span class="info-label">📋 Code:</span> ${agent.code}</div>
        <div class="info-item"><span class="info-label">👤 Nom:</span> ${agent.nom}</div>
        <div class="info-item"><span class="info-label">👤 Prénom:</span> ${agent.prenom}</div>
        <div class="info-item"><span class="info-label">👥 Groupe:</span> ${agent.groupe}</div>
        <div class="info-item"><span class="info-label">🎫 Matricule:</span> ${agent.matricule || 'N/A'}</div>
        <div class="info-item"><span class="info-label">🆔 CIN:</span> ${agent.cin || 'N/A'}</div>
        <div class="info-item"><span class="info-label">💼 Poste:</span> ${agent.poste || 'N/A'}</div>
        <div class="info-item"><span class="info-label">📅 Date naissance:</span> ${agent.date_naissance || 'N/A'}</div>
        <div class="info-item"><span class="info-label">📅 Date entrée:</span> ${agent.date_entree || 'N/A'}</div>
        <div class="form-group" style="margin-top:20px;"><label>📞 Téléphone</label><input type="tel" id="editAgentTel" value="${agent.tel || ''}" class="form-input"></div>
        <div class="form-group"><label>📧 Email</label><input type="email" id="editAgentEmail" value="${agent.email || ''}" class="form-input"></div>
        <div class="form-group"><label>🏠 Adresse</label><textarea id="editAgentAdresse" class="form-input" rows="2">${agent.adresse || ''}</textarea></div>
        <button class="popup-button green" onclick="updateAgentPersonalInfo('${agent.code}')">💾 Enregistrer modifications</button>
        <button class="popup-button gray" onclick="displayMainMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function updateAgentPersonalInfo(agentCode) {
    const agent = agents.find(a => a.code === agentCode);
    if (agent) {
        agent.tel = document.getElementById('editAgentTel').value;
        agent.email = document.getElementById('editAgentEmail').value;
        agent.adresse = document.getElementById('editAgentAdresse').value;
        saveData();
        alert("✅ Vos informations ont été mises à jour !");
        displayMainMenu();
    }
}

function showAgentUniform() {
    const agent = agents.find(a => a.code === currentUser.agentCode);
    if (!agent) { alert("⚠️ Agent non trouvé"); return; }
    const uniform = uniforms.find(u => u.agentCode === agent.code);
    
    const html = `<div class="info-section"><h3>👔 Mon Habillement</h3>
        ${uniform ? `
            <div class="info-item"><span class="info-label">📅 Date de fourniture:</span> ${uniform.date}</div>
            <div class="info-item"><span class="info-label">👕 Articles fournis:</span> 
                <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:5px;">${uniform.articles ? uniform.articles.map(a => `<span style="background:#2c3e50; padding:4px 12px; border-radius:20px;">${a}</span>`).join('') : '-'}</div>
            </div>
            <div class="info-item"><span class="info-label">💬 Commentaire:</span> ${uniform.comment || '-'}</div>
        ` : '<p style="text-align:center; padding:20px;">Aucun enregistrement d\'habillement trouvé.</p>'}
        <button class="popup-button gray" onclick="displayMainMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showAgentWarnings() {
    const agent = agents.find(a => a.code === currentUser.agentCode);
    if (!agent) { alert("⚠️ Agent non trouvé"); return; }
    const agentWarnings = warnings.filter(w => w.agent_code === agent.code);
    
    const html = `<div class="info-section"><h3>⚠️ Mes Avertissements</h3>
        ${agentWarnings.length ? `<table class="classement-table"><thead><tr style="background-color:#34495e;"><th>Date</th><th>Type</th><th>Description</th><th>Statut</th></tr></thead>
        <tbody>${agentWarnings.map(w => `<tr><td>${w.date}</td><td><span class="status-badge ${w.type === 'ORAL' ? 'active' : 'inactive'}">${w.type}</span></td><td>${w.description}</td><td>${w.status === 'active' ? '🟢 Actif' : '🔵 Archivé'}</td></tr>`).join('')}</tbody></table>` : '<p style="text-align:center; padding:20px;">Aucun avertissement.</p>'}
        <button class="popup-button gray" onclick="displayMainMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showAgentPanicCode() {
    const agent = agents.find(a => a.code === currentUser.agentCode);
    if (!agent) { alert("⚠️ Agent non trouvé"); return; }
    const panic = panicCodes.find(p => p.agent_code === agent.code);
    
    const html = `<div class="info-section"><h3>🚨 Mon Code Panique</h3>
        ${panic ? `<div style="text-align:center; padding:20px;"><div style="font-size:0.9rem; color:#bdc3c7;">Votre code d'urgence :</div>
        <div style="font-size:3rem; font-weight:bold; color:#e74c3c; letter-spacing:5px; margin:10px 0; background:#2c3e50; padding:15px; border-radius:10px;">${panic.code}</div>
        <div class="info-item"><span class="info-label">📍 Poste/Secteur:</span> ${panic.poste || '-'}</div>
        <div class="info-item"><span class="info-label">💬 Commentaire:</span> ${panic.comment || '-'}</div></div>` : '<p style="text-align:center; padding:20px;">Aucun code panique enregistré.</p>'}
        <button class="popup-button gray" onclick="displayMainMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showAgentRadio() {
    const agent = agents.find(a => a.code === currentUser.agentCode);
    if (!agent) { alert("⚠️ Agent non trouvé"); return; }
    const radio = radios.find(r => r.attributed_to === agent.code);
    
    const html = `<div class="info-section"><h3>📻 Ma Radio</h3>
        ${radio ? `<div style="text-align:center; padding:20px;"><div style="font-size:3rem;">📻</div>
        <div class="info-item"><span class="info-label">🆔 ID:</span> <strong>${radio.id}</strong></div>
        <div class="info-item"><span class="info-label">📟 Modèle:</span> ${radio.model}</div>
        <div class="info-item"><span class="info-label">🔢 Série:</span> ${radio.serial || '-'}</div>
        <div class="info-item"><span class="info-label">📅 Date attribution:</span> ${radio.attribution_date || '-'}</div>
        <div class="info-item"><span class="info-label">💰 Valeur:</span> ${radio.price ? radio.price + ' DH' : '-'}</div>
        <div style="margin-top:15px; background:#2c3e50; padding:10px; border-radius:8px;">⚠️ En cas de perte ou casse, veuillez contacter votre administrateur immédiatement.</div></div>` : '<p style="text-align:center; padding:20px;">Aucune radio attribuée.</p>'}
        <button class="popup-button gray" onclick="displayMainMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showHolidaysCalendar() {
    const year = new Date().getFullYear();
    let html = `<div class="info-section"><h3>📅 Calendrier des Jours Fériés ${year}</h3>
        <div class="form-group"><label>Année</label><input type="number" id="calendarYear" class="form-input" value="${year}" onchange="refreshCalendarAgent()"></div>
        <div id="calendarContainerAgent">${generateCalendarHTMLAgent(year)}</div>
        <button class="popup-button gray" onclick="displayMainMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function refreshCalendarAgent() {
    const year = parseInt(document.getElementById('calendarYear').value);
    document.getElementById('calendarContainerAgent').innerHTML = generateCalendarHTMLAgent(year);
}

function generateCalendarHTMLAgent(year) {
    let html = '<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">';
    for (let month = 1; month <= 12; month++) {
        const firstDay = new Date(year, month - 1, 1);
        const daysInMonth = new Date(year, month, 0).getDate();
        const startWeekday = firstDay.getDay();
        const monthHolidays = holidays.filter(h => parseInt(h.date.split('-')[0]) === month);
        html += `<div style="background:#34495e; border-radius:8px; padding:10px;">
            <h4 style="margin:0 0 10px 0; text-align:center; background:#2c3e50; padding:5px; border-radius:5px;">${MOIS_FRANCAIS[month-1]}</h4>
            <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:3px; font-size:0.7em; text-align:center;">
                <div style="color:#e74c3c;">Dim</div><div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div style="color:#e74c3c;">Sam</div>`;
        for (let i = 0; i < startWeekday; i++) html += '<div style="opacity:0.3;">-</div>';
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHoliday = monthHolidays.some(h => parseInt(h.date.split('-')[1]) === day);
            const holidayInfo = monthHolidays.find(h => parseInt(h.date.split('-')[1]) === day);
            let dayStyle = isHoliday ? 'background:#f39c12; color:#2c3e50; font-weight:bold;' : (isWeekend ? 'background:#e74c3c; color:white;' : 'background:#2c3e50;');
            html += `<div style="${dayStyle} padding:5px; border-radius:3px;" title="${holidayInfo ? holidayInfo.description : ''}">${isHoliday ? '🎉' : ''}${day}</div>`;
        }
        html += `</div>`;
        if (monthHolidays.length > 0) html += `<div style="margin-top:8px; font-size:0.65em; color:#f39c12;">${monthHolidays.map(h => `📅 ${h.date.split('-')[1]}: ${h.description}`).join(' | ')}</div>`;
        html += `</div>`;
    }
    html += '</div>';
    return html;
}
// ==================== SYNC CONGÉS CLOUD ====================

// Charger les congés depuis le cloud
async function loadSharedLeaves() {
    if (!SHEET_LEAVES_API_URL) return false;
    
    try {
        console.log("🌍 Chargement des congés depuis le cloud...");
        const reponse = await fetch(`${SHEET_LEAVES_API_URL}/sheet`);
        const cloudLeaves = await reponse.json();
        
        if (cloudLeaves && cloudLeaves.length > 0) {
            // Compter combien de congés on charge
            let count = 0;
            
            cloudLeaves.forEach(leave => {
                // Vérifier que les données sont valides
                if (!leave.Agent || !leave.DateDebut) return;
                
                const start = new Date(leave.DateDebut);
                const end = new Date(leave.DateFin);
                let current = new Date(start);
                
                while (current <= end) {
                    const dateStr = current.toISOString().split('T')[0];
                    const monthKey = dateStr.substring(0, 7);
                    
                    if (!planningData[monthKey]) planningData[monthKey] = {};
                    if (!planningData[monthKey][leave.Agent]) planningData[monthKey][leave.Agent] = {};
                    
                    planningData[monthKey][leave.Agent][dateStr] = {
                        shift: leave.Type || 'C',
                        type: 'congé_cloud',
                        comment: leave.Commentaire || ''
                    };
                    
                    current.setDate(current.getDate() + 1);
                    count++;
                }
            });
            
            localStorage.setItem('sga_planning', JSON.stringify(planningData));
            console.log(`✅ ${cloudLeaves.length} congés chargés du cloud (${count} jours)`);
            return true;
        }
    } catch (erreur) {
        console.log("⚠️ Cloud congés indisponible", erreur);
    }
    return false;
}

// Sauvegarder un congé vers le cloud
async function saveLeaveToCloud(agentCode, startDate, endDate, type, comment, joker) {
    if (!SHEET_LEAVES_API_URL) return;
    
    try {
        const newLeave = {
            Agent: agentCode,
            DateDebut: startDate,
            DateFin: endDate,
            Type: type,
            Commentaire: comment || '',
            RemplacePar: joker || '',
            DateCreation: new Date().toISOString().split('T')[0]
        };
        
        await fetch(SHEET_LEAVES_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLeave)
        });
        console.log("✅ Congé sauvegardé dans le cloud");
    } catch (erreur) {
        console.error("❌ Erreur sauvegarde congé", erreur);
    }
}

// Supprimer un congé du cloud
async function deleteLeaveFromCloud(agentCode, startDate, endDate) {
    if (!SHEET_LEAVES_API_URL) return;
    
    try {
        // Récupérer tous les congés
        const reponse = await fetch(SHEET_LEAVES_API_URL);
        const allLeaves = await reponse.json();
        
        // Trouver le congé correspondant
        const toDelete = allLeaves.find(l => 
            l.Agent === agentCode && 
            l.DateDebut === startDate && 
            l.DateFin === endDate
        );
        
        if (toDelete && toDelete.id) {
            await fetch(`${SHEET_LEAVES_API_URL}/${toDelete.id}`, { method: 'DELETE' });
            console.log("✅ Congé supprimé du cloud");
        }
    } catch (erreur) {
        console.error("❌ Erreur suppression congé", erreur);
    }
}
// ==================== PARTIE 10 : GESTION DES AGENTS ====================

function displayAgentsMenu() {
    if (currentUser.role === 'CP') {
        displaySubMenu("GESTION DES AGENTS", [
            { text: "📋 Liste des Agents", onclick: "showAgentsList()" },
            { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
        ]);
        return;
    }
    
    if (currentUser.role !== 'ADMIN') {
        alert("⚠️ Accès réservé à l'administrateur");
        displayMainMenu();
        return;
    }
    
    displaySubMenu("GESTION DES AGENTS", [
        { text: "📋 Liste des Agents", onclick: "showAgentsList()" },
        { text: "📥 Importer Agents (CSV)", onclick: "showImportCSVForm()" },
        { text: "📤 Exporter Agents", onclick: "exportAgentsCSV()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ]);
}

function showAgentsList() {
    let filteredAgents = getFilteredAgents();
    const groupLabel = currentUser.role === 'CP' ? ` - Groupe ${currentUser.groupe} uniquement` : '';
    
    let html = `<div class="info-section"><h3>📋 Liste des Agents (${filteredAgents.length})${groupLabel}</h3>
        <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">
            <input type="text" id="searchAgent" placeholder="🔍 Rechercher par nom, prénom ou code..." style="flex:1; padding:10px;" onkeyup="filterAgentsList()">`;
    
    if (currentUser.role !== 'CP') {
        html += `<select id="filterGroup" onchange="filterAgentsList()" style="padding:10px;">
            <option value="ALL">Tous les groupes</option>
            <option value="A">👥 Groupe A</option><option value="B">👥 Groupe B</option>
            <option value="C">👥 Groupe C</option><option value="D">👥 Groupe D</option>
            <option value="E">👥 Groupe E</option><option value="J">🃏 Jokers</option>
        </select>`;
    }
    
    html += `<select id="filterStatus" onchange="filterAgentsList()" style="padding:10px;">
            <option value="ALL">Tous statuts</option>
            <option value="actif">🟢 Actifs</option>
            <option value="inactif">🔴 Inactifs</option>
        </select>
        </div>
        <div id="agentsListContainer">${generateAgentsTable(filteredAgents)}</div>`;
    
    if (currentUser.role === 'ADMIN') {
        html += `<div style="margin-top:15px; text-align:center;"><button class="popup-button green" onclick="showAddAgentForm()">➕ Ajouter un agent</button></div>`;
    }
    
    html += `<button class="popup-button gray" onclick="displayAgentsMenu()" style="margin-top:15px;">Retour</button></div>`;
    document.getElementById('main-content').innerHTML = html;
}

function generateAgentsTable(data) {
    if (!data.length) return '<p style="text-align:center; padding:20px;">Aucun agent trouvé</p>';
    
    return `<div style="overflow-x:auto; margin-top:10px;">
        <table class="classement-table" style="width:100%; border-collapse:collapse; border:1px solid #34495e;">
            <thead><tr style="background-color:#2c3e50; border-bottom:2px solid #f39c12;">
                <th style="padding:12px 8px; text-align:left;">Code</th><th style="padding:12px 8px; text-align:left;">Nom</th>
                <th style="padding:12px 8px; text-align:left;">Prénom</th><th style="padding:12px 8px; text-align:center;">Groupe</th>
                <th style="padding:12px 8px; text-align:left;">Téléphone</th><th style="padding:12px 8px; text-align:center;">Statut</th>
                <th style="padding:12px 8px; text-align:center;">Actions</th>
            </tr></thead>
            <tbody>
                ${data.map(a => {
                    let actions = '';
                    if (currentUser.role === 'ADMIN') {
                        actions = `<button class="action-btn small blue" onclick="showEditAgent('${a.code}')" title="Modifier">✏️</button>
                                  <button class="action-btn small red" onclick="deleteAgent('${a.code}')" title="Supprimer">🗑️</button>
                                  <button class="action-btn small orange" onclick="showAgentDetails('${a.code}')" title="Détails">👁️</button>`;
                    } else if (currentUser.role === 'CP') {
                        actions = `<button class="action-btn small blue" onclick="showEditAgent('${a.code}')" title="Modifier">✏️</button>
                                  <button class="action-btn small red" onclick="deleteAgent('${a.code}')" title="Supprimer">🗑️</button>
                                  <button class="action-btn small orange" onclick="showAgentDetails('${a.code}')" title="Détails">👁️</button>`;
                    } else if (currentUser.role === 'AGENT' && currentUser.agentCode === a.code) {
                        actions = `<button class="action-btn small orange" onclick="showAgentDetails('${a.code}')" title="Détails">👁️</button>`;
                    }
                    return `<tr style="border-bottom:1px solid #34495e;">
                        <td style="padding:10px 8px;"><strong>${escapeHtml(a.code)}</strong></td>
                        <td style="padding:10px 8px;">${escapeHtml(a.nom)}</th><td style="padding:10px 8px;">${escapeHtml(a.prenom)}</th>
                        <td style="padding:10px 8px; text-align:center;">${a.groupe}</th>
                        <td style="padding:10px 8px;">${a.tel || '-'}</th>
                        <td style="padding:10px 8px; text-align:center;"><span class="status-badge ${a.statut === 'actif' ? 'active' : 'inactive'}">${a.statut === 'actif' ? '🟢 Actif' : '🔴 Inactif'}</span></th>
                        <td style="padding:10px 8px; text-align:center; white-space:nowrap;">${actions}</th>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>`;
}

function filterAgentsList() {
    const term = document.getElementById('searchAgent')?.value.toLowerCase() || '';
    const status = document.getElementById('filterStatus')?.value || 'ALL';
    
    let filtered;
    if (currentUser.role === 'CP') {
        filtered = agents.filter(a => a.groupe === currentUser.groupe && (a.nom.toLowerCase().includes(term) || a.prenom.toLowerCase().includes(term) || a.code.toLowerCase().includes(term)) && (status === 'ALL' || a.statut === status));
    } else {
        const group = document.getElementById('filterGroup')?.value || 'ALL';
        filtered = agents.filter(a => (a.nom.toLowerCase().includes(term) || a.prenom.toLowerCase().includes(term) || a.code.toLowerCase().includes(term)) && (group === 'ALL' || a.groupe === group) && (status === 'ALL' || a.statut === status));
    }
    document.getElementById('agentsListContainer').innerHTML = generateAgentsTable(filtered);
}

function showAddAgentForm() {
    const html = `<div class="info-section"><h3>➕ Ajouter un Agent</h3>
        <div class="form-group"><label>Code *</label><input type="text" id="newCode" class="form-input" placeholder="Ex: A100"></div>
        <div class="form-group"><label>Nom *</label><input type="text" id="newNom" class="form-input"></div>
        <div class="form-group"><label>Prénom *</label><input type="text" id="newPrenom" class="form-input"></div>
        <div class="form-group"><label>Groupe *</label><select id="newGroupe" class="form-input"><option value="A">👥 Groupe A</option><option value="B">👥 Groupe B</option><option value="C">👥 Groupe C</option><option value="D">👥 Groupe D</option><option value="E">👥 Groupe E</option><option value="J">🃏 Joker</option></select></div>
        <div class="form-group"><label>Téléphone</label><input type="tel" id="newTel" class="form-input"></div>
        <div class="form-group"><label>Matricule</label><input type="text" id="newMatricule" class="form-input"></div>
        <div class="form-group"><label>CIN</label><input type="text" id="newCin" class="form-input"></div>
        <div class="form-group"><label>Poste</label><input type="text" id="newPoste" class="form-input"></div>
        <div class="form-group"><label>Date entrée</label><input type="date" id="newDateEntree" class="form-input" value="${new Date().toISOString().split('T')[0]}"></div>
        <div class="form-group"><label>Adresse</label><input type="text" id="newAdresse" class="form-input"></div>
        <div class="form-group"><label>Email</label><input type="email" id="newEmail" class="form-input"></div>
        <button class="popup-button green" onclick="addNewAgent()">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="showAgentsList()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function addNewAgent() {
    const code = document.getElementById('newCode').value.toUpperCase();
    const nom = document.getElementById('newNom').value;
    const prenom = document.getElementById('newPrenom').value;
    const groupe = document.getElementById('newGroupe').value;
    const tel = document.getElementById('newTel').value;
    const matricule = document.getElementById('newMatricule').value;
    const cin = document.getElementById('newCin').value;
    const poste = document.getElementById('newPoste').value;
    const date_entree = document.getElementById('newDateEntree').value;
    const adresse = document.getElementById('newAdresse').value;
    const email = document.getElementById('newEmail').value;
    
    if (!code || !nom || !prenom) { alert("⚠️ Code, Nom et Prénom requis!"); return; }
    if (agents.find(a => a.code === code)) { alert(`⚠️ Le code ${code} existe déjà!`); return; }
    
    agents.push({ code, nom, prenom, groupe, tel, matricule, cin, poste, date_entree, adresse, email, statut: 'actif', date_sortie: null });
    saveData();
    addNotification('agent_add', { action: 'create', agentCode: code, agentName: `${nom} ${prenom}`, groupe: groupe });
    alert(`✅ Agent ${code} ajouté avec succès!`);
    showAgentsList();
}

function showEditAgent(code) {
    const agent = agents.find(a => a.code === code);
    if (!agent) return;
    
    const html = `<div class="info-section"><h3>✏️ Modifier ${code}</h3>
        <div class="form-group"><label>Nom</label><input type="text" id="editNom" value="${agent.nom}" class="form-input"></div>
        <div class="form-group"><label>Prénom</label><input type="text" id="editPrenom" value="${agent.prenom}" class="form-input"></div>
        <div class="form-group"><label>Groupe</label><select id="editGroupe" class="form-input">${['A','B','C','D','E','J'].map(g => `<option value="${g}" ${agent.groupe === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
        <div class="form-group"><label>Téléphone</label><input type="text" id="editTel" value="${agent.tel || ''}" class="form-input"></div>
        <div class="form-group"><label>Matricule</label><input type="text" id="editMatricule" value="${agent.matricule || ''}" class="form-input"></div>
        <div class="form-group"><label>CIN</label><input type="text" id="editCin" value="${agent.cin || ''}" class="form-input"></div>
        <div class="form-group"><label>Poste</label><input type="text" id="editPoste" value="${agent.poste || ''}" class="form-input"></div>
        <div class="form-group"><label>Date entrée</label><input type="date" id="editDateEntree" value="${agent.date_entree || ''}" class="form-input"></div>
        <div class="form-group"><label>Adresse</label><input type="text" id="editAdresse" value="${agent.adresse || ''}" class="form-input"></div>
        <div class="form-group"><label>Email</label><input type="email" id="editEmail" value="${agent.email || ''}" class="form-input"></div>
        <div class="form-group"><label>Statut</label><select id="editStatut" class="form-input"><option value="actif" ${agent.statut === 'actif' ? 'selected' : ''}>🟢 Actif</option><option value="inactif" ${agent.statut === 'inactif' ? 'selected' : ''}>🔴 Inactif</option></select></div>
        <button class="popup-button green" onclick="updateAgent('${code}')">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="showAgentsList()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function updateAgent(code) {
    const idx = agents.findIndex(a => a.code === code);
    if (idx !== -1) {
        const oldAgent = { ...agents[idx] };
        
        agents[idx].nom = document.getElementById('editNom').value;
        agents[idx].prenom = document.getElementById('editPrenom').value;
        agents[idx].groupe = document.getElementById('editGroupe').value;
        agents[idx].tel = document.getElementById('editTel').value;
        agents[idx].matricule = document.getElementById('editMatricule').value;
        agents[idx].cin = document.getElementById('editCin').value;
        agents[idx].poste = document.getElementById('editPoste').value;
        agents[idx].date_entree = document.getElementById('editDateEntree').value;
        agents[idx].adresse = document.getElementById('editAdresse').value;
        agents[idx].email = document.getElementById('editEmail').value;
        agents[idx].statut = document.getElementById('editStatut').value;
        
        if (agents[idx].statut === 'inactif' && !agents[idx].date_sortie) {
            agents[idx].date_sortie = new Date().toISOString().split('T')[0];
        }
        
        if (oldAgent.nom !== agents[idx].nom) addNotification('agent_update', { action: 'update', agentCode: code, agentName: `${agents[idx].nom} ${agents[idx].prenom}`, field: 'Nom', oldValue: oldAgent.nom, newValue: agents[idx].nom });
        if (oldAgent.prenom !== agents[idx].prenom) addNotification('agent_update', { action: 'update', agentCode: code, agentName: `${agents[idx].nom} ${agents[idx].prenom}`, field: 'Prénom', oldValue: oldAgent.prenom, newValue: agents[idx].prenom });
        if (oldAgent.groupe !== agents[idx].groupe) addNotification('agent_update', { action: 'update', agentCode: code, agentName: `${agents[idx].nom} ${agents[idx].prenom}`, field: 'Groupe', oldValue: oldAgent.groupe, newValue: agents[idx].groupe });
        if (oldAgent.tel !== agents[idx].tel) addNotification('agent_update', { action: 'update', agentCode: code, agentName: `${agents[idx].nom} ${agents[idx].prenom}`, field: 'Téléphone', oldValue: oldAgent.tel || 'vide', newValue: agents[idx].tel || 'vide' });
        if (oldAgent.statut !== agents[idx].statut) addNotification('agent_update', { action: 'update', agentCode: code, agentName: `${agents[idx].nom} ${agents[idx].prenom}`, field: 'Statut', oldValue: oldAgent.statut, newValue: agents[idx].statut });
        
        saveData();
        alert(`✅ Agent ${code} modifié!`);
        showAgentsList();
    }
}

function deleteAgent(code) {
    if (!checkPassword("Suppression d'agent")) return;
    const agent = agents.find(a => a.code === code);
    if (confirm(`Supprimer définitivement l'agent ${code} ?`)) {
        agents = agents.filter(a => a.code !== code);
        saveData();
        addNotification('agent_delete', { action: 'delete', agentCode: code, agentName: `${agent.nom} ${agent.prenom}` });
        alert(`✅ Agent ${code} supprimé!`);
        showAgentsList();
    }
}

function showAgentDetails(code) {
    const a = agents.find(ag => ag.code === code);
    if (!a) return;
    const html = `<div class="info-section"><h3>👤 Fiche Agent: ${a.nom} ${a.prenom}</h3>
        <div class="info-item"><span class="info-label">📋 Code:</span> ${a.code}</div>
        <div class="info-item"><span class="info-label">👥 Groupe:</span> ${a.groupe}</div>
        <div class="info-item"><span class="info-label">📞 Téléphone:</span> ${a.tel || 'N/A'}</div>
        <div class="info-item"><span class="info-label">📧 Email:</span> ${a.email || 'N/A'}</div>
        <div class="info-item"><span class="info-label">📍 Adresse:</span> ${a.adresse || 'N/A'}</div>
        <div class="info-item"><span class="info-label">🎫 Matricule:</span> ${a.matricule || 'N/A'}</div>
        <div class="info-item"><span class="info-label">🆔 CIN:</span> ${a.cin || 'N/A'}</div>
        <div class="info-item"><span class="info-label">💼 Poste:</span> ${a.poste || 'N/A'}</div>
        <div class="info-item"><span class="info-label">📅 Date entrée:</span> ${a.date_entree || 'N/A'}</div>
        <div class="info-item"><span class="info-label">📅 Date sortie:</span> ${a.date_sortie || 'En activité'}</div>
        <div class="info-item"><span class="info-label">⚡ Statut:</span> ${a.statut === 'actif' ? '🟢 Actif' : '🔴 Inactif'}</div>
        <button class="popup-button gray" onclick="showAgentsList()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showImportCSVForm() {
    const html = `<div class="info-section"><h3>📥 Importer CSV</h3>
        <div class="form-group"><label>Fichier CSV (format: code;nom;prenom;groupe;tel)</label><input type="file" id="csvFile" accept=".csv"></div>
        <button class="popup-button green" onclick="importCSVFile()">📥 Importer</button>
        <button class="popup-button gray" onclick="displayAgentsMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function importCSVFile() {
    const file = document.getElementById('csvFile').files[0];
    if (!file) { alert("⚠️ Sélectionnez un fichier"); return; }
    const reader = new FileReader();
    reader.onload = e => {
        const lines = e.target.result.split(/\r?\n/);
        let count = 0;
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const cols = lines[i].split(';');
            if (cols.length >= 4 && cols[0] && cols[1] && cols[2]) {
                if (!agents.find(a => a.code === cols[0].toUpperCase())) {
                    agents.push({ code: cols[0].toUpperCase(), nom: cols[1], prenom: cols[2], groupe: cols[3] || 'A', tel: cols[4] || '', statut: 'actif', date_entree: new Date().toISOString().split('T')[0] });
                    count++;
                }
            }
        }
        saveData();
        alert(`✅ ${count} agents importés`);
        showAgentsList();
    };
    reader.readAsText(file, 'UTF-8');
}

function exportAgentsCSV() {
    let csv = "Code;Nom;Prénom;Groupe;Téléphone;Matricule;CIN;Poste;Adresse;Email;Statut;Date entrée;Date sortie\n";
    agents.forEach(a => csv += `${a.code};${a.nom};${a.prenom};${a.groupe};${a.tel || ''};${a.matricule || ''};${a.cin || ''};${a.poste || ''};${a.adresse || ''};${a.email || ''};${a.statut};${a.date_entree || ''};${a.date_sortie || ''}\n`);
    downloadCSV(csv, `agents_${new Date().toISOString().split('T')[0]}.csv`);
}

function downloadCSV(content, filename) {
    const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    showSnackbar(`✅ ${filename} exporté`);
}
// ==================== PARTIE 11 : GESTION DU PLANNING ====================

function displayPlanningMenu() {
    if (currentUser.role === 'AGENT') {
        viewAgentPlanning();
        return;
    }
    displaySubMenu("GESTION DU PLANNING", [
        { text: "📅 Planning Mensuel", onclick: "showMonthlyPlanningForm()" },
        { text: "👥 Planning par Groupe", onclick: "showGroupPlanningForm()" },
        { text: "👤 Planning par Agent", onclick: "showAgentPlanningForm()" },
        { text: "✏️ Modifier Shift", onclick: "showShiftModificationForm()" },
        { text: "🔄 Échanger Shifts", onclick: "showShiftExchangeForm()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ]);
}

function generatePlanningHeader(daysInMonth, month, year) {
    let header = '<thead><tr style="background-color:#34495e;">';
    header += '<th style="padding:8px;">Agent</th><th style="padding:8px;">Groupe</th>';
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month-1, d);
        const dayName = JOURS_FRANCAIS[date.getDay()];
        const isHoliday = isHolidayDate(date);
        const holidayIcon = isHoliday ? '🎉 ' : '';
        header += `<th style="padding:4px; ${isHoliday ? 'background:#f39c12; color:#2c3e50;' : ''}">${holidayIcon}${d}<br><span style="font-size:0.65em;">${dayName}</span></th>`;
    }
    header += '<th style="padding:8px;">✅ Travail</th><th style="padding:8px;">🏖️ Congés</th><th style="padding:8px;">🎉 Fériés</th><th style="padding:8px;">⭐ Total</th></tr></thead>';
    return header;
}

function showMonthlyPlanningForm() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    let html = `<div class="info-section"><h3>📅 Planning Mensuel</h3>
        <div class="form-group"><label>Mois</label><select id="planMonth" class="form-input">${Array.from({length:12}, (_,i) => `<option value="${i+1}" ${i+1 === currentMonth ? 'selected' : ''}>${MOIS_FRANCAIS[i]}</option>`).join('')}</select></div>
        <div class="form-group"><label>Année</label><input type="number" id="planYear" class="form-input" value="${currentYear}"></div>`;
    
    if (currentUser.role === 'CP') {
        html += `<input type="hidden" id="planGroupFilter" value="${currentUser.groupe}"><p style="color:#f39c12; margin-bottom:10px;">📌 Groupe ${currentUser.groupe} (votre groupe uniquement)</p>`;
    } else {
        html += `<div class="form-group"><label>Groupe</label><select id="planGroupFilter" class="form-input">
            <option value="ALL">📋 Tous les groupes</option><option value="A">👥 Groupe A</option><option value="B">👥 Groupe B</option>
            <option value="C">👥 Groupe C</option><option value="D">👥 Groupe D</option><option value="E">👥 Groupe E</option><option value="J">🃏 Jokers</option>
        </select></div>`;
    }
    html += `<button class="popup-button green" onclick="generateGlobalPlanning()">📋 Générer</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Annuler</button></div>`;
    document.getElementById('main-content').innerHTML = html;
}

function generateGlobalPlanning() {
    const month = parseInt(document.getElementById('planMonth').value);
    const year = parseInt(document.getElementById('planYear').value);
    let groupFilter = currentUser.role === 'CP' ? currentUser.groupe : document.getElementById('planGroupFilter').value;
    showGlobalPlanningWithTotals(month, year, groupFilter);
}

function showGlobalPlanningWithTotals(month, year, groupFilter = 'ALL') {
    let actifs = agents.filter(a => a.statut === 'actif');
    if (currentUser.role === 'CP') {
        actifs = actifs.filter(a => a.groupe === currentUser.groupe);
    } else if (groupFilter !== 'ALL') {
        actifs = actifs.filter(a => a.groupe === groupFilter);
    }
    if (!actifs.length) { alert("⚠️ Aucun agent trouvé"); return; }
    
    const daysInMonth = new Date(year, month, 0).getDate();
    let title = `📅 Planning Global - ${getMonthName(month)} ${year}`;
    if (currentUser.role === 'CP') title += ` (Groupe ${currentUser.groupe})`;
    else if (groupFilter !== 'ALL') title += ` (Groupe ${groupFilter})`;
    
    let html = `<div class="info-section"><h3>${title}</h3><div style="overflow-x:auto;"><table class="planning-table" style="width:100%; border-collapse:collapse;">
        ${generatePlanningHeader(daysInMonth, month, year)}<tbody>`;
    
    for (const agent of actifs) {
        const stats = calculateAgentStats(agent.code, month, year);
        html += `<tr><td style="padding:6px;"><strong>${agent.code}</strong><br>${agent.nom} ${agent.prenom}</td>
            <td style="text-align:center; padding:6px;">${agent.groupe}</td>`;
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${month.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
            const date = new Date(year, month-1, d);
            const shiftDisplay = getShiftDisplay(agent.code, dateStr);
            const shift = getShiftForAgent(agent.code, dateStr);
            const color = SHIFT_COLORS[shift] || '#7f8c8d';
            const isHoliday = isHolidayDate(date);
            let additionalStyle = isHoliday && (shift === '1' || shift === '2' || shift === '3') ? 'border: 2px solid #f39c12;' : '';
            html += `<td style="background-color:${color}; color:white; text-align:center; padding:4px; ${additionalStyle}" title="${shiftDisplay}">${shiftDisplay}</td>`;
        }
        html += `<td style="text-align:center; font-weight:bold; color:#27ae60;">${stats.travaillesNormaux}</td>
            <td style="text-align:center; font-weight:bold; color:#f39c12;">${stats.conges}</td>
            <td style="text-align:center; font-weight:bold; color:#e67e22;">${stats.feriesTravailles}</td>
            <td style="text-align:center; font-weight:bold; background:#2c3e50; color:#f1c40f;">${stats.totalGeneral}</td></tr>`;
    }
    html += `</tbody></table></div><button class="popup-button gray" onclick="displayPlanningMenu()" style="margin-top:15px;">↩️ Retour</button></div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showGroupPlanningForm() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    let groups = ['A', 'B', 'C', 'D', 'E', 'J'];
    if (currentUser.role === 'CP') groups = [currentUser.groupe, 'J'];
    
    const html = `<div class="info-section"><h3>👥 Planning par Groupe</h3>
        <div class="form-group"><label>Groupe</label><select id="groupPlanGroup" class="form-input">${groups.map(g => `<option value="${g}">${g === 'J' ? '🃏 Jokers' : '👥 Groupe ' + g}</option>`).join('')}</select></div>
        <div class="form-group"><label>Mois</label><select id="groupPlanMonth" class="form-input">${Array.from({length:12}, (_,i) => `<option value="${i+1}" ${i+1 === currentMonth ? 'selected' : ''}>${MOIS_FRANCAIS[i]}</option>`).join('')}</select></div>
        <div class="form-group"><label>Année</label><input type="number" id="groupPlanYear" class="form-input" value="${currentYear}"></div>
        <button class="popup-button green" onclick="executeGroupPlanning()">📋 Voir</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function executeGroupPlanning() {
    const group = document.getElementById('groupPlanGroup').value;
    const month = parseInt(document.getElementById('groupPlanMonth').value);
    const year = parseInt(document.getElementById('groupPlanYear').value);
    showGroupPlanningWithTotals(group, month, year);
}

function showGroupPlanningWithTotals(group, month, year) {
    let groupAgents;
    if (group === 'J') {
        groupAgents = agents.filter(a => a.groupe === 'J' && a.statut === 'actif');
    } else {
        groupAgents = agents.filter(a => a.groupe === group && a.statut === 'actif');
    }
    if (!groupAgents.length) { alert(`⚠️ Aucun agent dans ${group === 'J' ? 'les jokers' : 'le groupe ' + group}`); return; }
    
    const daysInMonth = new Date(year, month, 0).getDate();
    let title = `📅 Planning ${group === 'J' ? 'des Jokers' : 'Groupe ' + group} - ${getMonthName(month)} ${year}`;
    
    let html = `<div class="info-section"><h3>${title}</h3><div style="overflow-x:auto;"><table class="planning-table" style="width:100%; border-collapse:collapse;">
        ${generatePlanningHeader(daysInMonth, month, year)}<tbody>`;
    
    for (const agent of groupAgents) {
        const stats = calculateAgentStats(agent.code, month, year);
        html += `<tr><td style="padding:6px;"><strong>${agent.code}</strong><br>${agent.nom} ${agent.prenom}</td>
            <td style="text-align:center; padding:6px;">${agent.groupe}</td>`;
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${month.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
            const date = new Date(year, month-1, d);
            const shiftDisplay = getShiftDisplay(agent.code, dateStr);
            const shift = getShiftForAgent(agent.code, dateStr);
            const color = SHIFT_COLORS[shift] || '#7f8c8d';
            const isHoliday = isHolidayDate(date);
            let additionalStyle = isHoliday && (shift === '1' || shift === '2' || shift === '3') ? 'border: 2px solid #f39c12;' : '';
            html += `<td style="background-color:${color}; color:white; text-align:center; padding:4px; ${additionalStyle}" title="${shiftDisplay}">${shiftDisplay}</td>`;
        }
        html += `<td style="text-align:center; font-weight:bold; color:#27ae60;">${stats.travaillesNormaux}</td>
            <td style="text-align:center; font-weight:bold; color:#f39c12;">${stats.conges}</td>
            <td style="text-align:center; font-weight:bold; color:#e67e22;">${stats.feriesTravailles}</td>
            <td style="text-align:center; font-weight:bold; background:#2c3e50; color:#f1c40f;">${stats.totalGeneral}</td></tr>`;
    }
    html += `</tbody></table></div><button class="popup-button gray" onclick="displayPlanningMenu()" style="margin-top:15px;">↩️ Retour</button></div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showAgentPlanningForm() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    let agentsList = getFilteredAgents();
    
    const html = `<div class="info-section"><h3>👤 Planning par Agent</h3>
        <div class="form-group"><label>🔍 Rechercher agent</label><input type="text" id="searchAgentPlan" placeholder="Tapez pour rechercher..." class="form-input" onkeyup="filterAgentPlanList()"></div>
        <div class="form-group"><label>Agent</label><select id="agentPlanAgent" size="5" class="form-input" style="height:auto">${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom}</option>`).join('')}</select></div>
        <div class="form-group"><label>Mois</label><select id="agentPlanMonth" class="form-input">${Array.from({length:12}, (_,i) => `<option value="${i+1}" ${i+1 === currentMonth ? 'selected' : ''}>${MOIS_FRANCAIS[i]}</option>`).join('')}</select></div>
        <div class="form-group"><label>Année</label><input type="number" id="agentPlanYear" class="form-input" value="${currentYear}"></div>
        <button class="popup-button green" onclick="executeAgentPlanning()">📋 Voir</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function filterAgentPlanList() {
    const term = document.getElementById('searchAgentPlan').value.toLowerCase();
    const select = document.getElementById('agentPlanAgent');
    Array.from(select.options).forEach(opt => opt.style.display = opt.text.toLowerCase().includes(term) ? '' : 'none');
}

function executeAgentPlanning() {
    const agentCode = document.getElementById('agentPlanAgent').value;
    const month = parseInt(document.getElementById('agentPlanMonth').value);
    const year = parseInt(document.getElementById('agentPlanYear').value);
    if (!canAccessAgent(agentCode)) { alert("⚠️ Vous n'avez pas accès à cet agent"); return; }
    showAgentPlanningWithTotals(agentCode, month, year);
}

function showAgentPlanningWithTotals(agentCode, month, year) {
    const agent = agents.find(a => a.code === agentCode);
    if (!agent) { alert("⚠️ Agent non trouvé"); return; }
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthHolidays = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month-1, day);
        if (isHolidayDate(date)) monthHolidays.push({ day, description: getHolidayDescription(date).description });
    }
    const stats = calculateAgentStats(agentCode, month, year);
    let rows = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${month.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
        const date = new Date(year, month-1, d);
        const dayName = JOURS_FRANCAIS[date.getDay()];
        const shift = getShiftForAgent(agentCode, dateStr);
        const shiftDisplay = getShiftDisplay(agentCode, dateStr);
        const color = SHIFT_COLORS[shift] || '#7f8c8d';
        const isHoliday = isHolidayDate(date);
        const holidayInfo = monthHolidays.find(h => h.day === d);
        let shiftIcon = '';
        if (shift === '1') shiftIcon = '🌅 '; else if (shift === '2') shiftIcon = '☀️ '; else if (shift === '3') shiftIcon = '🌙 ';
        else if (shift === 'R') shiftIcon = '😴 '; else if (shift === 'C') shiftIcon = '🏖️ '; else if (shift === 'M') shiftIcon = '🤒 '; else if (shift === 'A') shiftIcon = '📝 ';
        
        let holidayBadge = '';
        if (isHoliday && holidayInfo) {
            if (shift === '1' || shift === '2' || shift === '3') holidayBadge = `<span style="background:#e67e22; color:white; padding:2px 6px; border-radius:10px; font-size:0.7em;">🎉 Férié travaillé: ${holidayInfo.description}</span>`;
            else holidayBadge = `<span style="background:#f39c12; color:#2c3e50; padding:2px 6px; border-radius:10px; font-size:0.7em;">🎉 ${holidayInfo.description}</span>`;
        }
        
        const replacement = getReplacementInfo(agentCode, dateStr);
        let replacementHtml = '';
        if (replacement) {
            if (replacement.type === 'remplace_par') replacementHtml = `<br><span style="font-size:0.7em; color:#f1c40f;">🔄 Remplacé par ${replacement.agent}</span>`;
            else if (replacement.type === 'remplace') replacementHtml = `<br><span style="font-size:0.7em; color:#2ecc71;">🔄 Remplace ${replacement.agent}</span>`;
        }
        
        rows.push(`<tr style="border-bottom:1px solid #34495e;">
            <td style="padding:8px; text-align:center; width:60px;"><strong>${d}</strong><br><span style="font-size:0.7em;">${dayName}</span></td>
            <td style="background-color:${color}; color:white; text-align:center; padding:8px; font-weight:bold;">${shiftIcon}${shiftDisplay}${replacementHtml}</td>
            <td style="padding:8px; text-align:center;">${holidayBadge || '-'}</td>
            ${currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'CP') ? `<td style="padding:8px; text-align:center;"><button class="action-btn small red" onclick="deleteShift('${agentCode}','${dateStr}')" title="Supprimer">🗑️</button></td>` : ''}
        </tr>`);
    }
    
    let html = `<div class="info-section"><h3>📅 Planning de ${agent.nom} ${agent.prenom} (${agent.code})</h3>
        <p><strong>Période:</strong> ${getMonthName(month)} ${year}</p>
        ${monthHolidays.length > 0 ? `<div style="background:#2c3e50; padding:10px; border-radius:8px; margin-bottom:15px;"><strong>📅 Jours fériés ce mois-ci :</strong><br><div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:5px;">${monthHolidays.map(h => `<span style="background:#f39c12; color:#2c3e50; padding:3px 10px; border-radius:15px; font-size:0.8em;">🎉 ${h.day} ${getMonthName(month)}: ${h.description}</span>`).join('')}</div></div>` : '<p style="color:#7f8c8d; margin-bottom:15px;">📅 Aucun jour férié ce mois-ci</p>'}
        <div style="overflow-x:auto;"><table class="planning-table" style="width:100%; border-collapse:collapse;"><thead><tr style="background-color:#34495e;"><th>Date</th><th>Shift</th><th>Jours fériés</th>${currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'CP') ? '<th>Action</th>' : ''}</tr></thead>
        <tbody>${rows.join('')}</tbody>
        <tfoot style="background-color:#2c3e50;"><tr><td colspan="3" style="padding:15px;"><div style="display:grid; grid-template-columns:repeat(4,1fr); gap:15px; text-align:center;">
        <div style="background:#27ae60; padding:10px; border-radius:8px;">✅ Jours travaillés<br><span style="font-size:1.5em; font-weight:bold;">${stats.travaillesNormaux}</span></div>
        <div style="background:#f39c12; padding:10px; border-radius:8px;">🏖️ Congés (C)<br><span style="font-size:1.5em; font-weight:bold;">${stats.conges}</span></div>
        <div style="background:#e67e22; padding:10px; border-radius:8px;">🎉 Fériés travaillés<br><span style="font-size:1.5em; font-weight:bold;">${stats.feriesTravailles}</span></div>
        <div style="background:#f1c40f; color:#2c3e50; padding:10px; border-radius:8px;">⭐ TOTAL GÉNÉRAL<br><span style="font-size:1.8em; font-weight:bold;">${stats.totalGeneral}</span></div></div>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; text-align:center; margin-top:10px; font-size:0.85em;"><div>🤒 Maladie (M): ${stats.maladie} <span style="color:#e74c3c">(non compté)</span></div><div>📝 Autre absence (A): ${stats.autre} <span style="color:#e74c3c">(non compté)</span></div><div>😴 Repos (R): ${stats.repos}</div></div></td></tr></tfoot>
        </table></div>
        <button class="popup-button gray" onclick="displayPlanningMenu()" style="margin-top:15px;">↩️ Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showShiftModificationForm() {
    let agentsList = getFilteredAgents();
    const html = `<div class="info-section"><h3>✏️ Modifier un Shift</h3>
        <div class="form-group"><label>🔍 Rechercher agent</label><input type="text" id="searchShiftAgent" placeholder="Tapez pour rechercher..." class="form-input" onkeyup="filterShiftAgentList()"></div>
        <div class="form-group"><label>Agent</label><select id="shiftAgent" size="5" class="form-input" style="height:auto">${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom}</option>`).join('')}</select></div>
        <div class="form-group"><label>Date</label><input type="date" id="shiftDate" class="form-input"></div>
        <div class="form-group"><label>Nouveau shift</label><select id="newShift" class="form-input">${Object.entries(SHIFT_LABELS).map(([c, l]) => `<option value="${c}">${c} - ${l}</option>`).join('')}</select></div>
        <div class="form-group"><label>Commentaire</label><textarea id="shiftComment" class="form-input" rows="2"></textarea></div>
        <button class="popup-button green" onclick="applyShiftModification()">💾 Appliquer</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function filterShiftAgentList() {
    const term = document.getElementById('searchShiftAgent').value.toLowerCase();
    const select = document.getElementById('shiftAgent');
    Array.from(select.options).forEach(opt => opt.style.display = opt.text.toLowerCase().includes(term) ? '' : 'none');
}

function applyShiftModification() {
    const agentCode = document.getElementById('shiftAgent').value;
    const dateStr = document.getElementById('shiftDate').value;
    const newShift = document.getElementById('newShift').value;
    const comment = document.getElementById('shiftComment').value;
    if (!agentCode || !dateStr) { alert("⚠️ Agent et date requis"); return; }
    if (!canAccessAgent(agentCode)) { alert("⚠️ Vous n'avez pas accès à cet agent"); return; }
    
    const oldShift = getShiftForAgent(agentCode, dateStr);
    const monthKey = dateStr.substring(0,7);
    if (!planningData[monthKey]) planningData[monthKey] = {};
    if (!planningData[monthKey][agentCode]) planningData[monthKey][agentCode] = {};
    planningData[monthKey][agentCode][dateStr] = { shift: newShift, type: 'modification', comment };
    saveData();
    
    addNotification('shift_modification', {
        action: 'update', agentCode: agentCode,
        agentName: `${agents.find(a => a.code === agentCode)?.nom || agentCode} ${agents.find(a => a.code === agentCode)?.prenom || ''}`,
        date: dateStr, oldValue: oldShift, newValue: newShift, comment: comment
    });
    alert(`✅ Shift modifié pour ${agentCode} le ${dateStr}`);
    displayPlanningMenu();
}

function showShiftExchangeForm() {
    let agentsList = getFilteredAgents();
    const html = `<div class="info-section"><h3>🔄 Échanger Shifts</h3>
        <div class="form-group"><label>Agent 1</label><select id="exchangeAgent1" class="form-input">${agentsList.map(a => `<option value="${a.code}">${a.nom} ${a.prenom}</option>`).join('')}</select></div>
        <div class="form-group"><label>Date 1</label><input type="date" id="exchangeDate1" class="form-input"></div>
        <div class="form-group"><label>Agent 2</label><select id="exchangeAgent2" class="form-input">${agentsList.map(a => `<option value="${a.code}">${a.nom} ${a.prenom}</option>`).join('')}</select></div>
        <div class="form-group"><label>Date 2</label><input type="date" id="exchangeDate2" class="form-input"></div>
        <div class="form-group"><label>Motif</label><textarea id="exchangeReason" class="form-input" rows="2"></textarea></div>
        <button class="popup-button green" onclick="executeShiftExchange()">🔄 Échanger</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function executeShiftExchange() {
    const a1 = document.getElementById('exchangeAgent1').value;
    const d1 = document.getElementById('exchangeDate1').value;
    const a2 = document.getElementById('exchangeAgent2').value;
    const d2 = document.getElementById('exchangeDate2').value;
    const reason = document.getElementById('exchangeReason').value;
    if (!a1 || !d1 || !a2 || !d2) { alert("⚠️ Tous les champs requis"); return; }
    if (!canAccessAgent(a1) || !canAccessAgent(a2)) { alert("⚠️ Vous n'avez pas accès à ces agents"); return; }
    
    const s1 = getShiftForAgent(a1, d1);
    const s2 = getShiftForAgent(a2, d2);
    const m1 = d1.substring(0,7), m2 = d2.substring(0,7);
    if (!planningData[m1]) planningData[m1] = {};
    if (!planningData[m1][a1]) planningData[m1][a1] = {};
    if (!planningData[m2]) planningData[m2] = {};
    if (!planningData[m2][a2]) planningData[m2][a2] = {};
    planningData[m1][a1][d1] = { shift: s2, type: 'echange', comment: `Échangé avec ${a2} - ${reason}` };
    planningData[m2][a2][d2] = { shift: s1, type: 'echange', comment: `Échangé avec ${a1} - ${reason}` };
    saveData();
    
    addNotification('shift_exchange', {
        action: 'exchange', agent1Code: a1, agent1Name: `${agents.find(a => a.code === a1)?.nom || a1} ${agents.find(a => a.code === a1)?.prenom || ''}`,
        agent2Code: a2, agent2Name: `${agents.find(a => a.code === a2)?.nom || a2} ${agents.find(a => a.code === a2)?.prenom || ''}`,
        date1: d1, date2: d2, reason: reason
    });
    alert(`✅ Échange effectué entre ${a1} et ${a2}`);
    displayPlanningMenu();
}

function deleteShift(agentCode, dateStr) {
    if (!checkPassword("Suppression de shift")) return;
    if (confirm(`Supprimer le shift du ${dateStr} pour ${agentCode} ?`)) {
        const monthKey = dateStr.substring(0,7);
        if (planningData[monthKey]?.[agentCode]?.[dateStr]) {
            delete planningData[monthKey][agentCode][dateStr];
            saveData();
            alert("✅ Shift supprimé");
            const [year, month] = dateStr.split('-');
            showAgentPlanningWithTotals(agentCode, parseInt(month), parseInt(year));
        }
    }
}
// ==================== PARTIE 12 : CONGÉS & ABSENCES ====================

function displayLeavesMenu() {
    if (currentUser.role === 'AGENT') {
        alert("⚠️ Les agents ne peuvent pas gérer les congés collectifs");
        displayMainMenu();
        return;
    }
    displaySubMenu("CONGÉS & ABSENCES", [
        { text: "➕ Ajouter Congé", onclick: "showAddLeaveForm()" },
        { text: "📋 Liste des Congés", onclick: "showLeavesList()" },
        { text: "📅 Congés par Agent", onclick: "showLeavesByAgentForm()" },
        { text: "📊 Congés par Groupe", onclick: "showLeavesByGroupForm()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ]);
}

function showAddLeaveForm() {
    let agentsList = getFilteredAgents().filter(a => a.groupe !== 'J');
    const html = `<div class="info-section"><h3>🏖️ Ajouter Congé/Absence</h3>
        <div class="form-group"><label>Type</label><select id="leaveType" class="form-input" onchange="toggleLeavePeriod()">
            <option value="single">Ponctuel</option><option value="period">Période</option></select></div>
        <div class="form-group"><label>🔍 Rechercher agent</label><input type="text" id="searchLeaveAgent" placeholder="Tapez pour rechercher..." class="form-input" onkeyup="filterLeaveAgentList()"></div>
        <div class="form-group"><label>Agent</label><select id="leaveAgent" size="5" class="form-input" style="height:auto">${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom} (Groupe ${a.groupe})</option>`).join('')}</select></div>
        <div id="singleLeaveSection"><div class="form-group"><label>Date</label><input type="date" id="leaveDate" class="form-input"></div>
        <div class="form-group"><label>Type absence</label><select id="absenceType" class="form-input"><option value="C">🏖️ Congé</option><option value="M">🤒 Maladie</option><option value="A">📝 Autre absence</option></select></div></div>
        <div id="periodLeaveSection" style="display:none"><div class="form-group"><label>Date début</label><input type="date" id="periodStart" class="form-input"></div>
        <div class="form-group"><label>Date fin</label><input type="date" id="periodEnd" class="form-input"></div></div>
        <div class="form-group"><label>Commentaire</label><textarea id="leaveComment" class="form-input" rows="2" placeholder="Motif du congé..."></textarea></div>
        <button class="popup-button green" onclick="saveLeaveWithJoker()">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="displayLeavesMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function toggleLeavePeriod() {
    const type = document.getElementById('leaveType').value;
    document.getElementById('singleLeaveSection').style.display = type === 'single' ? 'block' : 'none';
    document.getElementById('periodLeaveSection').style.display = type === 'period' ? 'block' : 'none';
}

function filterLeaveAgentList() {
    const term = document.getElementById('searchLeaveAgent').value.toLowerCase();
    const select = document.getElementById('leaveAgent');
    Array.from(select.options).forEach(opt => opt.style.display = opt.text.toLowerCase().includes(term) ? '' : 'none');
}

function groupConsecutiveLeaves(leavesList) {
    leavesList.sort((a, b) => new Date(a.date) - new Date(b.date));
    const grouped = [];
    let currentGroup = null;
    for (const leave of leavesList) {
        if (!currentGroup) {
            currentGroup = { agentCode: leave.agentCode, startDate: leave.date, endDate: leave.date, type: leave.type, comment: leave.comment };
        } else {
            const currentDate = new Date(leave.date);
            const lastDate = new Date(currentGroup.endDate);
            const diffDays = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
            if (diffDays === 1 && currentGroup.agentCode === leave.agentCode && currentGroup.type === leave.type) {
                currentGroup.endDate = leave.date;
            } else {
                grouped.push(currentGroup);
                currentGroup = { agentCode: leave.agentCode, startDate: leave.date, endDate: leave.date, type: leave.type, comment: leave.comment };
            }
        }
    }
    if (currentGroup) grouped.push(currentGroup);
    return grouped;
}

function showLeavesList() {
    let leavesList = [];
    Object.keys(planningData).forEach(monthKey => {
        Object.keys(planningData[monthKey]).forEach(agentCode => {
            if (!canAccessAgent(agentCode)) return;
            Object.keys(planningData[monthKey][agentCode]).forEach(dateStr => {
                const rec = planningData[monthKey][agentCode][dateStr];
                if (rec && ['C', 'M', 'A'].includes(rec.shift)) {
                    leavesList.push({ agentCode, date: dateStr, type: rec.shift, comment: rec.comment });
                }
            });
        });
    });
    const groupedLeaves = groupConsecutiveLeaves(leavesList);
    const html = `<div class="info-section"><h3>📋 Liste des Congés</h3>
        <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;"><input type="text" id="searchLeaveList" placeholder="🔍 Rechercher par agent..." style="flex:1; padding:8px;" onkeyup="filterLeavesListGrouped()">
        <select id="filterLeaveType" onchange="filterLeavesListGrouped()" style="padding:8px;"><option value="ALL">Tous types</option><option value="C">🏖️ Congés</option><option value="M">🤒 Maladies</option><option value="A">📝 Autres</option></select></div>
        <div id="leavesListContainer">${generateLeavesListGrouped(groupedLeaves)}</div>
        <button class="popup-button gray" onclick="displayLeavesMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function generateLeavesListGrouped(data) {
    if (!data.length) return '<p>Aucun congé enregistré</p>';
    const typeColors = { C: '#27ae60', M: '#e74c3c', A: '#f39c12' };
    const typeLabels = { C: '🏖️ Congé', M: '🤒 Maladie', A: '📝 Autre' };
    return `<table class="classement-table"><thead><tr style="background-color:#34495e;"><th>Agent</th><th>Période</th><th>Type</th><th>Commentaire</th><th>Actions</th></tr></thead>
        <tbody>${data.map(l => {
            const agent = agents.find(a => a.code === l.agentCode);
            const periodDisplay = l.startDate === l.endDate ? formatDateToFrench(l.startDate) : `du ${formatDateToFrench(l.startDate)} au ${formatDateToFrench(l.endDate)}`;
            return `<tr><td><strong>${agent ? agent.nom + ' ' + agent.prenom : l.agentCode}</strong><br><small>${l.agentCode}</small></th>
                <td>${periodDisplay}</th><td><span style="background:${typeColors[l.type]}; padding:2px 8px; border-radius:12px;">${typeLabels[l.type]}</span></th>
                <td>${l.comment || '-'}</th><td><button class="action-btn small red" onclick="deleteLeavePeriod('${l.agentCode}','${l.startDate}','${l.endDate}')">🗑️ Supprimer</button></th>
            </td>`}).join('')}</tbody></table>`;
}

function filterLeavesListGrouped() {
    const term = document.getElementById('searchLeaveList').value.toLowerCase();
    const type = document.getElementById('filterLeaveType').value;
    let leavesList = [];
    Object.keys(planningData).forEach(monthKey => {
        Object.keys(planningData[monthKey]).forEach(agentCode => {
            if (!canAccessAgent(agentCode)) return;
            Object.keys(planningData[monthKey][agentCode]).forEach(dateStr => {
                const rec = planningData[monthKey][agentCode][dateStr];
                if (rec && ['C', 'M', 'A'].includes(rec.shift)) leavesList.push({ agentCode, date: dateStr, type: rec.shift, comment: rec.comment });
            });
        });
    });
    let filtered = leavesList.filter(l => {
        const agent = agents.find(a => a.code === l.agentCode);
        const matchTerm = (agent && (agent.nom.toLowerCase().includes(term) || agent.prenom.toLowerCase().includes(term))) || l.agentCode.toLowerCase().includes(term);
        const matchType = type === 'ALL' || l.type === type;
        return matchTerm && matchType;
    });
    const groupedFiltered = groupConsecutiveLeaves(filtered);
    document.getElementById('leavesListContainer').innerHTML = generateLeavesListGrouped(groupedFiltered);
}

async function deleteLeavePeriod(agentCode, startDate, endDate) {
    if (!checkPassword("Suppression de congé")) return;
    if (confirm(`Supprimer les congés du ${formatDateToFrench(startDate)} au ${formatDateToFrench(endDate)} pour ${agentCode} ?`)) {
        let current = new Date(startDate);
        const end = new Date(endDate);
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            const monthKey = dateStr.substring(0,7);
            if (planningData[monthKey]?.[agentCode]?.[dateStr]) delete planningData[monthKey][agentCode][dateStr];
            for (const joker of agents.filter(a => a.groupe === 'J')) {
                const jokerEntry = planningData[monthKey]?.[joker.code]?.[dateStr];
                if (jokerEntry && jokerEntry.type === 'remplacement_joker' && jokerEntry.comment && jokerEntry.comment.includes(agentCode)) {
                    delete planningData[monthKey][joker.code][dateStr];
                    break;
                }
            }
            current.setDate(current.getDate() + 1);
        }
        replacementNotifications = replacementNotifications.filter(notif => !(notif.agent_absent === agentCode && ((notif.date_debut && startDate >= notif.date_debut && endDate <= notif.date_fin) || (notif.date_absence && startDate <= notif.date_absence && endDate >= notif.date_absence))));
        saveData();
        addNotification('leave_delete', { action: 'delete', agentCode: agentCode, agentName: `${agents.find(a => a.code === agentCode)?.nom || agentCode} ${agents.find(a => a.code === agentCode)?.prenom || ''}`, startDate: startDate, endDate: endDate });
        alert("✅ Congés et remplacements supprimés !");
        // Supprimer du cloud
await deleteLeaveFromCloud(agentCode, startDate, endDate);
        
        showLeavesList();
    }
}

function showLeavesByAgentForm() {
    let agentsList = getFilteredAgents();
    const html = `<div class="info-section"><h3>📅 Congés par Agent</h3>
        <div class="form-group"><label>🔍 Rechercher agent</label><input type="text" id="searchLeavesByAgent" placeholder="Tapez pour rechercher..." class="form-input" onkeyup="filterLeavesByAgentSelect()"></div>
        <div class="form-group"><label>Agent</label><select id="leavesByAgentSelect" size="5" class="form-input" style="height:auto">${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom}</option>`).join('')}</select></div>
        <div class="form-group"><label>Année</label><input type="number" id="leavesYear" class="form-input" value="${new Date().getFullYear()}"></div>
        <button class="popup-button green" onclick="showLeavesByAgentResult()">📋 Voir</button>
        <button class="popup-button gray" onclick="displayLeavesMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function filterLeavesByAgentSelect() {
    const term = document.getElementById('searchLeavesByAgent').value.toLowerCase();
    const select = document.getElementById('leavesByAgentSelect');
    Array.from(select.options).forEach(opt => opt.style.display = opt.text.toLowerCase().includes(term) ? '' : 'none');
}

function showLeavesByAgentResult() {
    const agentCode = document.getElementById('leavesByAgentSelect').value;
    const year = parseInt(document.getElementById('leavesYear').value);
    const agent = agents.find(a => a.code === agentCode);
    if (!canAccessAgent(agentCode)) { alert("⚠️ Vous n'avez pas accès à cet agent"); return; }
    let agentLeaves = [];
    Object.keys(planningData).forEach(monthKey => {
        if (monthKey.startsWith(year.toString()) && planningData[monthKey][agentCode]) {
            Object.keys(planningData[monthKey][agentCode]).forEach(dateStr => {
                const rec = planningData[monthKey][agentCode][dateStr];
                if (rec && ['C', 'M', 'A'].includes(rec.shift)) agentLeaves.push({ date: dateStr, type: rec.shift, comment: rec.comment });
            });
        }
    });
    const groupedLeaves = groupConsecutiveLeaves(agentLeaves.map(l => ({ ...l, agentCode })));
    const typeLabels = { C: '🏖️ Congé', M: '🤒 Maladie', A: '📝 Autre' };
    const html = `<div class="info-section"><h3>📅 Congés de ${agent.nom} ${agent.prenom} (${year})</h3>
        <div class="stats-grid"><div class="stat-card"><div class="stat-value">${agentLeaves.filter(l => l.type === 'C').length}</div><div>🏖️ Congés</div></div>
        <div class="stat-card"><div class="stat-value">${agentLeaves.filter(l => l.type === 'M').length}</div><div>🤒 Maladies</div></div>
        <div class="stat-card"><div class="stat-value">${agentLeaves.filter(l => l.type === 'A').length}</div><div>📝 Autres</div></div>
        <div class="stat-card"><div class="stat-value">${agentLeaves.length}</div><div>📊 Total absences</div></div></div>
        ${agentLeaves.length ? `<table class="classement-table"><thead><tr><th>Période</th><th>Type</th><th>Commentaire</th></tr></thead>
        <tbody>${groupedLeaves.map(l => `<tr><td>${l.startDate === l.endDate ? formatDateToFrench(l.startDate) : `du ${formatDateToFrench(l.startDate)} au ${formatDateToFrench(l.endDate)}`}</th><td>${typeLabels[l.type]}</th><td>${l.comment || '-'}</th><tr>`).join('')}</tbody></table>` : '<p>Aucun congé cette année</p>'}
        <button class="popup-button gray" onclick="showLeavesByAgentForm()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showLeavesByGroupForm() {
    let groups = ['A', 'B', 'C', 'D', 'E', 'J'];
    if (currentUser.role === 'CP') groups = [currentUser.groupe];
    const html = `<div class="info-section"><h3>📊 Congés par Groupe</h3>
        <div class="form-group"><label>Groupe</label><select id="leavesByGroupSelect" class="form-input">${groups.map(g => `<option value="${g}">Groupe ${g}</option>`).join('')}</select></div>
        <div class="form-group"><label>Année</label><input type="number" id="leavesGroupYear" class="form-input" value="${new Date().getFullYear()}"></div>
        <button class="popup-button green" onclick="showLeavesByGroupResult()">📊 Afficher</button>
        <button class="popup-button gray" onclick="displayLeavesMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showLeavesByGroupResult() {
    const group = document.getElementById('leavesByGroupSelect').value;
    const year = parseInt(document.getElementById('leavesGroupYear').value);
    if (!canAccessGroup(group)) { alert("⚠️ Vous n'avez pas accès à ce groupe"); return; }
    const groupAgents = agents.filter(a => a.groupe === group && a.statut === 'actif');
    let stats = groupAgents.map(agent => {
        let conges = 0, maladies = 0, autres = 0;
        Object.keys(planningData).forEach(monthKey => {
            if (monthKey.startsWith(year.toString()) && planningData[monthKey][agent.code]) {
                Object.values(planningData[monthKey][agent.code]).forEach(rec => {
                    if (rec.shift === 'C') conges++;
                    else if (rec.shift === 'M') maladies++;
                    else if (rec.shift === 'A') autres++;
                });
            }
        });
        return { agent, conges, maladies, autres, total: conges + maladies + autres };
    });
    const totals = stats.reduce((acc, s) => { acc.conges += s.conges; acc.maladies += s.maladies; acc.autres += s.autres; acc.total += s.total; return acc; }, { conges: 0, maladies: 0, autres: 0, total: 0 });
    const html = `<div class="info-section"><h3>📊 Congés Groupe ${group} - ${year}</h3>
        <div class="stats-grid"><div class="stat-card"><div class="stat-value">${totals.conges}</div><div>🏖️ Congés</div></div>
        <div class="stat-card"><div class="stat-value">${totals.maladies}</div><div>🤒 Maladies</div></div>
        <div class="stat-card"><div class="stat-value">${totals.autres}</div><div>📝 Autres</div></div>
        <div class="stat-card"><div class="stat-value">${totals.total}</div><div>📊 Total absences</div></div></div>
        <table class="classement-table"><thead><tr><th>Agent</th><th>🏖️ Congés</th><th>🤒 Maladies</th><th>📝 Autres</th><th>📊 Total</th></tr></thead>
        <tbody>${stats.map(s => `<tr><td><strong>${s.agent.nom} ${s.agent.prenom}</strong><br><small>${s.agent.code}</small></th><td style="text-align:center">${s.conges}</th><td style="text-align:center">${s.maladies}</th><td style="text-align:center">${s.autres}</th><td style="text-align:center; font-weight:bold">${s.total}</th></tr>`).join('')}</tbody></table>
        <button class="popup-button gray" onclick="showLeavesByGroupForm()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}
// ==================== PARTIE 13 : CODES PANIQUE ====================

function displayPanicMenu() {
    if (currentUser.role === 'AGENT') {
        showAgentPanicCode();
        return;
    }
    displaySubMenu("CODES PANIQUE", [
        { text: "➕ Ajouter Code", onclick: "showAddPanicForm()" },
        { text: "📋 Liste des Codes", onclick: "showPanicList()" },
        { text: "🔍 Rechercher Code", onclick: "showSearchPanicForm()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ]);
}

function showAddPanicForm() {
    let agentsList = getFilteredAgents();
    const html = `<div class="info-section"><h3>➕ Ajouter Code Panique</h3>
        <div class="form-group"><label>🔍 Rechercher agent</label><input type="text" id="searchPanicAgent" placeholder="Tapez pour rechercher..." class="form-input" onkeyup="filterPanicAgentList()"></div>
        <div class="form-group"><label>Agent</label><select id="panicAgent" size="5" class="form-input" style="height:auto">${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom} (Groupe ${a.groupe})</option>`).join('')}</select></div>
        <div class="form-group"><label>Code *</label><input type="text" id="panicCode" class="form-input" placeholder="Ex: 1234"></div>
        <div class="form-group"><label>Poste/Secteur</label><input type="text" id="panicPoste" class="form-input"></div>
        <div class="form-group"><label>Commentaire</label><textarea id="panicComment" class="form-input" rows="2"></textarea></div>
        <button class="popup-button green" onclick="savePanic()">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="displayPanicMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function filterPanicAgentList() {
    const term = document.getElementById('searchPanicAgent').value.toLowerCase();
    const select = document.getElementById('panicAgent');
    Array.from(select.options).forEach(opt => opt.style.display = opt.text.toLowerCase().includes(term) ? '' : 'none');
}

function savePanic() {
    const agentCode = document.getElementById('panicAgent').value;
    const code = document.getElementById('panicCode').value.toUpperCase();
    const poste = document.getElementById('panicPoste').value;
    const comment = document.getElementById('panicComment').value;
    if (!agentCode || !code) { alert("⚠️ Agent et code requis!"); return; }
    if (!canAccessAgent(agentCode)) { alert("⚠️ Vous n'avez pas accès à cet agent"); return; }
    
    const existing = panicCodes.find(p => p.agent_code === agentCode);
    if (existing) {
        existing.code = code;
        existing.poste = poste;
        existing.comment = comment;
        existing.updated_at = new Date().toISOString();
    } else {
        panicCodes.push({ agent_code: agentCode, code, poste, comment, created_at: new Date().toISOString() });
    }
    saveData();
    addNotification('panic_add', { action: existing ? 'update' : 'create', agentCode: agentCode, agentName: `${agents.find(a => a.code === agentCode)?.nom || agentCode} ${agents.find(a => a.code === agentCode)?.prenom || ''}`, code: code });
    alert(`✅ Code panique enregistré pour ${agentCode}`);
    showPanicList();
}

function showPanicList() {
    let filteredCodes = panicCodes.filter(p => canAccessAgent(p.agent_code));
    let html = `<div class="info-section"><h3>📋 Codes Panique</h3>
        <div style="display:flex; gap:10px; margin-bottom:15px;"><input type="text" id="searchPanicList" placeholder="🔍 Rechercher par code ou agent..." style="flex:1; padding:8px;" onkeyup="filterPanicList()"></div>
        <div id="panicListContainer">${generatePanicList(filteredCodes)}</div>
        <button class="popup-button gray" onclick="displayPanicMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function generatePanicList(data) {
    if (!data.length) return '<p style="text-align:center; padding:20px;">Aucun code panique enregistré</p>';
    return `<table class="classement-table"><thead><tr style="background-color:#34495e;"><th>Agent</th><th>Code</th><th>Poste/Secteur</th><th>Commentaire</th><th>Actions</th></tr></thead>
        <tbody>${data.map(p => {
            const agent = agents.find(a => a.code === p.agent_code);
            return `<tr style="border-bottom:1px solid #34495e;">
                <td><strong>${agent ? agent.nom + ' ' + agent.prenom : p.agent_code}</strong><br><small>${p.agent_code}</small></th>
                <td style="text-align:center;"><span style="background:#e74c3c; color:white; padding:4px 12px; border-radius:20px; font-weight:bold;">${p.code}</span></th>
                <td>${p.poste || '-'}</th><td>${p.comment || '-'}</th>
                <td><button class="action-btn small orange" onclick="modifyPanic('${p.agent_code}')" title="Modifier">✏️</button>
                <button class="action-btn small red" onclick="deletePanic('${p.agent_code}')" title="Supprimer">🗑️</button></th>
            </tr>`}).join('')}</tbody>}</div>`;
}

function filterPanicList() {
    const term = document.getElementById('searchPanicList').value.toLowerCase();
    const filtered = panicCodes.filter(p => {
        if (!canAccessAgent(p.agent_code)) return false;
        const agent = agents.find(a => a.code === p.agent_code);
        return p.code.toLowerCase().includes(term) || (agent && (agent.nom.toLowerCase().includes(term) || agent.prenom.toLowerCase().includes(term)));
    });
    document.getElementById('panicListContainer').innerHTML = generatePanicList(filtered);
}

function showSearchPanicForm() {
    const html = `<div class="info-section"><h3>🔍 Rechercher Code Panique</h3>
        <div class="form-group"><label>Code ou nom agent</label><input type="text" id="searchPanicInput" class="form-input" placeholder="Entrez le code ou le nom..." onkeyup="searchPanicCode()"></div>
        <div id="searchPanicResult" style="margin-top:15px;"></div>
        <button class="popup-button gray" onclick="displayPanicMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function searchPanicCode() {
    const term = document.getElementById('searchPanicInput').value.toLowerCase();
    if (!term) { document.getElementById('searchPanicResult').innerHTML = ''; return; }
    const results = panicCodes.filter(p => {
        if (!canAccessAgent(p.agent_code)) return false;
        const agent = agents.find(a => a.code === p.agent_code);
        return p.code.toLowerCase().includes(term) || (agent && (agent.nom.toLowerCase().includes(term) || agent.prenom.toLowerCase().includes(term)));
    });
    document.getElementById('searchPanicResult').innerHTML = results.length ? generatePanicList(results) : '<p style="text-align:center; padding:20px;">Aucun code panique trouvé</p>';
}

function deletePanic(agentCode) {
    if (!checkPassword("Suppression code panique")) return;
    if (confirm(`Supprimer le code panique de ${agentCode} ?`)) {
        panicCodes = panicCodes.filter(p => p.agent_code !== agentCode);
        saveData();
        alert("✅ Code panique supprimé!");
        showPanicList();
    }
}

function modifyPanic(agentCode) {
    const panic = panicCodes.find(p => p.agent_code === agentCode);
    if (!panic) return;
    const newCode = prompt("Nouveau code (ex: 1234) :", panic.code);
    if (newCode && newCode.trim()) panic.code = newCode.toUpperCase();
    const newPoste = prompt("Nouveau poste/secteur :", panic.poste || "");
    if (newPoste !== null) panic.poste = newPoste;
    const newComment = prompt("Nouveau commentaire :", panic.comment || "");
    if (newComment !== null) panic.comment = newComment;
    panic.updated_at = new Date().toISOString();
    saveData();
    alert("✅ Code panique modifié");
    showPanicList();
}
// ==================== PARTIE 14 : RADIOS ====================

function displayRadiosMenu() {
    displaySubMenu("GESTION RADIOS", [
        { text: "➕ Ajouter Radio", onclick: "showAddRadioForm()" },
        { text: "📋 Liste des Radios", onclick: "showRadiosList()" },
        { text: "📲 Attribuer Radio", onclick: "showAssignRadioForm()" },
        { text: "🔄 Retour Radio", onclick: "showReturnRadioForm()" },
        { text: "📊 Statut Radios", onclick: "showRadiosStatus()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ]);
}

function showAddRadioForm() {
    const html = `<div class="info-section"><h3>➕ Ajouter Radio</h3>
        <div class="form-group"><label>ID *</label><input type="text" id="radioId" class="form-input" placeholder="Ex: RAD-001"></div>
        <div class="form-group"><label>Modèle *</label><input type="text" id="radioModel" class="form-input" placeholder="Ex: Motorola GP340"></div>
        <div class="form-group"><label>Numéro série</label><input type="text" id="radioSerial" class="form-input"></div>
        <div class="form-group"><label>Statut</label><select id="radioStatus" class="form-input"><option value="DISPONIBLE">✅ Disponible</option><option value="ATTRIBUEE">📲 Attribuée</option><option value="HS">🔴 HS</option><option value="REPARATION">🔧 Réparation</option></select></div>
        <div class="form-group"><label>Prix (DH)</label><input type="number" id="radioPrice" class="form-input" step="0.01" placeholder="0.00"></div>
        <button class="popup-button green" onclick="saveRadio()">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="displayRadiosMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function saveRadio() {
    const id = document.getElementById('radioId').value.toUpperCase();
    const model = document.getElementById('radioModel').value;
    const serial = document.getElementById('radioSerial').value;
    const status = document.getElementById('radioStatus').value;
    const price = document.getElementById('radioPrice').value;
    if (!id || !model) { alert("⚠️ ID et Modèle requis!"); return; }
    if (radios.find(r => r.id === id)) { alert(`⚠️ Radio ${id} existe déjà!`); return; }
    radios.push({ id, model, serial, status, price: price ? parseFloat(price) : null, created_at: new Date().toISOString() });
    saveData();
    alert(`✅ Radio ${id} ajoutée!`);
    showRadiosList();
}

function showRadiosList() {
    let filteredRadios = radios;
    if (currentUser.role === 'CP') {
        const groupAgents = agents.filter(a => a.groupe === currentUser.groupe && a.statut === 'actif').map(a => a.code);
        filteredRadios = radios.filter(r => !r.attributed_to || groupAgents.includes(r.attributed_to));
    }
    let html = `<div class="info-section"><h3>📋 Inventaire Radios</h3>
        <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;"><input type="text" id="searchRadio" placeholder="🔍 Rechercher par ID ou modèle..." style="flex:1; padding:8px;" onkeyup="filterRadioList()">
        <select id="filterRadioStatus" onchange="filterRadioList()" style="padding:8px;"><option value="ALL">Tous statuts</option><option value="DISPONIBLE">✅ Disponible</option><option value="ATTRIBUEE">📲 Attribuée</option><option value="HS">🔴 HS</option><option value="REPARATION">🔧 Réparation</option></select></div>
        <div id="radiosListContainer">${generateRadiosList(filteredRadios)}</div>
        <button class="popup-button gray" onclick="displayRadiosMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function generateRadiosList(data) {
    if (!data.length) return '<p style="text-align:center; padding:20px;">Aucune radio trouvée</p>';
    const statusColors = { DISPONIBLE: '#27ae60', ATTRIBUEE: '#f39c12', HS: '#e74c3c', REPARATION: '#e67e22' };
    const statusLabels = { DISPONIBLE: '✅ Disponible', ATTRIBUEE: '📲 Attribuée', HS: '🔴 HS', REPARATION: '🔧 Réparation' };
    return `<table class="classement-table"><thead><tr style="background-color:#34495e;"><th>ID</th><th>Modèle</th><th>Série</th><th>Statut</th><th>Prix</th><th>Attribuée à</th><th>Actions</th></tr></thead>
        <tbody>${data.map(r => {
            const agent = r.attributed_to ? agents.find(a => a.code === r.attributed_to) : null;
            return `<tr style="border-bottom:1px solid #34495e;">
                <td><strong>${r.id}</strong></th><td>${r.model}</th><td>${r.serial || '-'}</th>
                <td><span style="background:${statusColors[r.status]}; color:white; padding:4px 10px; border-radius:20px;">${statusLabels[r.status]}</span></th>
                <td>${r.price ? r.price + ' DH' : '-'}</th><td>${agent ? agent.nom + ' ' + agent.prenom + ' (' + agent.code + ')' : '-'}</th>
                <td><button class="action-btn small blue" onclick="showEditRadio('${r.id}')">✏️</button>
                <button class="action-btn small red" onclick="deleteRadio('${r.id}')">🗑️</button>
                ${r.status === 'DISPONIBLE' ? `<button class="action-btn small green" onclick="showAssignRadioForm('${r.id}')">📲</button>` : ''}
                ${r.status === 'ATTRIBUEE' ? `<button class="action-btn small orange" onclick="showReturnRadioForm('${r.id}')">🔄</button>` : ''}</th>
            </tr>`}).join('')}</tbody>}</div>`;
}

function filterRadioList() {
    let filteredRadios = radios;
    if (currentUser.role === 'CP') {
        const groupAgents = agents.filter(a => a.groupe === currentUser.groupe && a.statut === 'actif').map(a => a.code);
        filteredRadios = radios.filter(r => !r.attributed_to || groupAgents.includes(r.attributed_to));
    }
    const term = document.getElementById('searchRadio').value.toLowerCase();
    const status = document.getElementById('filterRadioStatus').value;
    filteredRadios = filteredRadios.filter(r => r.id.toLowerCase().includes(term) || r.model.toLowerCase().includes(term));
    if (status !== 'ALL') filteredRadios = filteredRadios.filter(r => r.status === status);
    document.getElementById('radiosListContainer').innerHTML = generateRadiosList(filteredRadios);
}

function showEditRadio(id) {
    const radio = radios.find(r => r.id === id);
    if (!radio) return;
    const html = `<div class="info-section"><h3>✏️ Modifier Radio ${id}</h3>
        <div class="form-group"><label>Modèle</label><input type="text" id="editRadioModel" value="${radio.model}" class="form-input"></div>
        <div class="form-group"><label>Série</label><input type="text" id="editRadioSerial" value="${radio.serial || ''}" class="form-input"></div>
        <div class="form-group"><label>Statut</label><select id="editRadioStatus" class="form-input">
            <option value="DISPONIBLE" ${radio.status === 'DISPONIBLE' ? 'selected' : ''}>✅ Disponible</option>
            <option value="ATTRIBUEE" ${radio.status === 'ATTRIBUEE' ? 'selected' : ''}>📲 Attribuée</option>
            <option value="HS" ${radio.status === 'HS' ? 'selected' : ''}>🔴 HS</option>
            <option value="REPARATION" ${radio.status === 'REPARATION' ? 'selected' : ''}>🔧 Réparation</option></select></div>
        <div class="form-group"><label>Prix (DH)</label><input type="number" id="editRadioPrice" value="${radio.price || ''}" class="form-input" step="0.01"></div>
        <button class="popup-button green" onclick="updateRadio('${id}')">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="showRadiosList()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function updateRadio(id) {
    const idx = radios.findIndex(r => r.id === id);
    if (idx !== -1) {
        radios[idx].model = document.getElementById('editRadioModel').value;
        radios[idx].serial = document.getElementById('editRadioSerial').value;
        radios[idx].status = document.getElementById('editRadioStatus').value;
        radios[idx].price = parseFloat(document.getElementById('editRadioPrice').value) || null;
        radios[idx].updated_at = new Date().toISOString();
        saveData();
        alert(`✅ Radio ${id} modifiée!`);
        showRadiosList();
    }
}

function deleteRadio(id) {
    if (!checkPassword("Suppression radio")) return;
    if (confirm(`Supprimer définitivement la radio ${id} ?`)) {
        radios = radios.filter(r => r.id !== id);
        saveData();
        alert("✅ Radio supprimée!");
        showRadiosList();
    }
}

function showAssignRadioForm(radioId = null) {
    let availableRadios = radios.filter(r => r.status === 'DISPONIBLE');
    if (currentUser.role === 'CP') {
        const groupAgents = agents.filter(a => a.groupe === currentUser.groupe).map(a => a.code);
        availableRadios = availableRadios.filter(r => !r.attributed_to || groupAgents.includes(r.attributed_to));
    }
    const radioSelect = radioId ? `<input type="text" value="${radioId}" readonly class="form-input">` : `<select id="assignRadioId" class="form-input">${availableRadios.map(r => `<option value="${r.id}">${r.id} - ${r.model}</option>`).join('')}</select>`;
    let agentsList = getFilteredAgents();
    const html = `<div class="info-section"><h3>📲 Attribuer une Radio</h3>
        <div class="form-group"><label>Radio</label>${radioSelect}</div>
        <div class="form-group"><label>🔍 Rechercher agent</label><input type="text" id="searchAssignAgent" placeholder="Tapez pour rechercher..." class="form-input" onkeyup="filterAssignAgentList()"></div>
        <div class="form-group"><label>Agent</label><select id="assignAgent" size="5" class="form-input" style="height:auto">${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom}</option>`).join('')}</select></div>
        <div class="form-group"><label>Date attribution</label><input type="date" id="assignDate" class="form-input" value="${new Date().toISOString().split('T')[0]}"></div>
        <button class="popup-button green" onclick="executeAssignRadio()">✅ Attribuer</button>
        <button class="popup-button gray" onclick="displayRadiosMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function filterAssignAgentList() {
    const term = document.getElementById('searchAssignAgent').value.toLowerCase();
    const select = document.getElementById('assignAgent');
    Array.from(select.options).forEach(opt => opt.style.display = opt.text.toLowerCase().includes(term) ? '' : 'none');
}

function executeAssignRadio() {
    const radioId = document.getElementById('assignRadioId')?.value || document.querySelector('input[readonly]')?.value;
    const agentCode = document.getElementById('assignAgent').value;
    const assignDate = document.getElementById('assignDate').value;
    if (!radioId || !agentCode) { alert("⚠️ Radio et agent requis"); return; }
    if (!canAccessAgent(agentCode)) { alert("⚠️ Vous n'avez pas accès à cet agent"); return; }
    const radio = radios.find(r => r.id === radioId);
    if (!radio || radio.status !== 'DISPONIBLE') { alert("⚠️ Radio non disponible"); return; }
    radio.status = 'ATTRIBUEE';
    radio.attributed_to = agentCode;
    radio.attribution_date = assignDate;
    radio.updated_at = new Date().toISOString();
    saveData();
    alert(`✅ Radio ${radioId} attribuée à ${agentCode}`);
    showRadiosList();
}

function showReturnRadioForm(radioId = null) {
    let attribuees = radios.filter(r => r.status === 'ATTRIBUEE');
    if (currentUser.role === 'CP') {
        const groupAgents = agents.filter(a => a.groupe === currentUser.groupe && a.statut === 'actif').map(a => a.code);
        attribuees = attribuees.filter(r => r.attributed_to && groupAgents.includes(r.attributed_to));
    }
    const html = `<div class="info-section"><h3>🔄 Retour de Radio</h3>
        <div class="form-group"><label>Radio</label><select id="returnRadioId" class="form-input">${attribuees.map(r => { const agent = agents.find(a => a.code === r.attributed_to); return `<option value="${r.id}">${r.id} - ${r.model} (${agent ? agent.nom + ' ' + agent.prenom : r.attributed_to})</option>`; }).join('')}</select></div>
        <div class="form-group"><label>État retour</label><select id="returnCondition" class="form-input"><option value="BON">✅ Bon état</option><option value="USURE">⚠️ Légère usure</option><option value="DOMMAGE">🔧 Dommage</option><option value="HS">🔴 HS</option></select></div>
        <div class="form-group"><label>Nouveau statut</label><select id="returnNewStatus" class="form-input"><option value="DISPONIBLE">✅ Disponible</option><option value="REPARATION">🔧 Réparation</option><option value="HS">🔴 HS</option></select></div>
        <button class="popup-button green" onclick="executeReturnRadio()">🔄 Enregistrer retour</button>
        <button class="popup-button gray" onclick="displayRadiosMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function executeReturnRadio() {
    const radioId = document.getElementById('returnRadioId').value;
    const condition = document.getElementById('returnCondition').value;
    const newStatus = document.getElementById('returnNewStatus').value;
    const radio = radios.find(r => r.id === radioId);
    if (!radio) { alert("⚠️ Radio non trouvée"); return; }
    radio.status = newStatus;
    radio.return_date = new Date().toISOString().split('T')[0];
    radio.return_condition = condition;
    radio.attributed_to = null;
    radio.updated_at = new Date().toISOString();
    saveData();
    alert(`✅ Radio ${radioId} retournée - Statut: ${newStatus === 'DISPONIBLE' ? 'Disponible' : (newStatus === 'REPARATION' ? 'En réparation' : 'HS')}`);
    showRadiosList();
}

function showRadiosStatus() {
    let filteredRadios = radios;
    if (currentUser.role === 'CP') {
        const groupAgents = agents.filter(a => a.groupe === currentUser.groupe && a.statut === 'actif').map(a => a.code);
        filteredRadios = radios.filter(r => !r.attributed_to || groupAgents.includes(r.attributed_to));
    }
    const total = filteredRadios.length;
    const disponible = filteredRadios.filter(r => r.status === 'DISPONIBLE').length;
    const attribuee = filteredRadios.filter(r => r.status === 'ATTRIBUEE').length;
    const hs = filteredRadios.filter(r => r.status === 'HS').length;
    const reparation = filteredRadios.filter(r => r.status === 'REPARATION').length;
    const totalValue = filteredRadios.reduce((s, r) => s + (r.price || 0), 0);
    const html = `<div class="info-section"><h3>📊 Statut des Radios</h3>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-value">${total}</div><div>📻 Total radios</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#27ae60">${disponible}</div><div>✅ Disponibles</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#f39c12">${attribuee}</div><div>📲 Attribuées</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#e74c3c">${hs}</div><div>🔴 HS</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#e67e22">${reparation}</div><div>🔧 Réparation</div></div>
            <div class="stat-card"><div class="stat-value">${totalValue.toLocaleString()} DH</div><div>💰 Valeur totale</div></div>
        </div>
        <button class="popup-button gray" onclick="displayRadiosMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}
// ==================== PARTIE 15 : HABILLEMENT ====================

function displayUniformMenu() {
    if (currentUser.role === 'AGENT') {
        showAgentUniform();
        return;
    }
    displaySubMenu("HABILLEMENT", [
        { text: "➕ Enregistrer Habillement", onclick: "showAddUniformForm()" },
        { text: "📋 Rapport Habillement", onclick: "showUniformReport()" },
        { text: "📊 Statistiques", onclick: "showUniformStats()" },
        { text: "📅 Échéances", onclick: "showUniformDeadlines()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ]);
}

function showAddUniformForm() {
    let agentsList = getFilteredAgents();
    const articlesList = ['Chemise', 'Pantalon', 'Tricot', 'Ceinture', 'Chaussures', 'Cravate', 'Veste', 'Parka'];
    const html = `<div class="info-section"><h3>👔 Enregistrer Habillement</h3>
        <div class="form-group"><label>🔍 Rechercher agent</label><input type="text" id="searchUniformAgent" placeholder="Tapez pour rechercher..." class="form-input" onkeyup="filterUniformAgentList()"></div>
        <div class="form-group"><label>Agent</label><select id="uniformAgent" size="5" class="form-input" style="height:auto">${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom} (Groupe ${a.groupe})</option>`).join('')}</select></div>
        <div class="form-group"><label>Articles fournis</label><div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px;">${articlesList.map(item => `<label><input type="checkbox" id="uniform_${item.toLowerCase()}" value="${item}"> ${item}</label>`).join('')}</div></div>
        <div class="form-group"><label>Date fourniture</label><input type="date" id="uniformDate" class="form-input" value="${new Date().toISOString().split('T')[0]}"></div>
        <div class="form-group"><label>Commentaires</label><textarea id="uniformComment" class="form-input" rows="2" placeholder="Observations, tailles, etc..."></textarea></div>
        <button class="popup-button green" onclick="saveUniform()">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="displayUniformMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function filterUniformAgentList() {
    const term = document.getElementById('searchUniformAgent').value.toLowerCase();
    const select = document.getElementById('uniformAgent');
    Array.from(select.options).forEach(opt => opt.style.display = opt.text.toLowerCase().includes(term) ? '' : 'none');
}

function saveUniform() {
    const agentCode = document.getElementById('uniformAgent').value;
    const date = document.getElementById('uniformDate').value;
    const comment = document.getElementById('uniformComment').value;
    const articles = ['chemise', 'pantalon', 'tricot', 'ceinture', 'chaussures', 'cravate', 'veste', 'parka'].filter(a => document.getElementById(`uniform_${a}`).checked).map(a => a.charAt(0).toUpperCase() + a.slice(1));
    if (!agentCode) { alert("⚠️ Sélectionnez un agent"); return; }
    if (!canAccessAgent(agentCode)) { alert("⚠️ Vous n'avez pas accès à cet agent"); return; }
    if (articles.length === 0) { alert("⚠️ Sélectionnez au moins un article"); return; }
    
    const existing = uniforms.find(u => u.agentCode === agentCode);
    if (existing) {
        existing.date = date;
        existing.comment = comment;
        existing.articles = articles;
        existing.lastUpdated = new Date().toISOString();
    } else {
        uniforms.push({ agentCode, date, comment, articles, lastUpdated: new Date().toISOString() });
    }
    saveData();
    addNotification('uniform_add', { action: existing ? 'update' : 'create', agentCode: agentCode, agentName: `${agents.find(a => a.code === agentCode)?.nom || agentCode} ${agents.find(a => a.code === agentCode)?.prenom || ''}`, articles: articles.join(', ') });
    alert(`✅ Habillement enregistré pour ${agentCode} (${articles.length} articles)`);
    showUniformReport();
}

function showUniformReport() {
    let filteredUniforms = uniforms.filter(u => canAccessAgent(u.agentCode));
    let html = `<div class="info-section"><h3>👔 Rapport Habillement</h3>
        <div style="display:flex; gap:10px; margin-bottom:15px;"><input type="text" id="searchUniformReport" placeholder="🔍 Rechercher par agent..." style="flex:1; padding:8px;" onkeyup="filterUniformReport()"></div>
        <div id="uniformReportContainer">${generateUniformReport(filteredUniforms)}</div>
        <button class="popup-button gray" onclick="displayUniformMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function generateUniformReport(data) {
    if (!data.length) return '<p style="text-align:center; padding:20px;">Aucun enregistrement d\'habillement</p>';
    return `<table class="classement-table"><thead><tr style="background-color:#34495e;"><th>Agent</th><th>Date</th><th>Articles</th><th>Commentaire</th><th>Actions</th></tr></thead>
        <tbody>${data.map(u => {
            const agent = agents.find(a => a.code === u.agentCode);
            return `<tr style="border-bottom:1px solid #34495e;">
                <td><strong>${agent ? agent.nom + ' ' + agent.prenom : u.agentCode}</strong><br><small>${u.agentCode}</small></th>
                <td>${u.date}</th><td>${u.articles ? u.articles.map(a => `<span style="background:#2c3e50; padding:2px 6px; border-radius:12px; margin:2px; display:inline-block;">${a}</span>`).join('') : '-'}</th>
                <td>${u.comment || '-'}</th>
                <td><button class="action-btn small orange" onclick="modifyUniform('${u.agentCode}')" title="Modifier">✏️</button>
                <button class="action-btn small red" onclick="deleteUniform('${u.agentCode}')" title="Supprimer">🗑️</button></th>
            </tr>`}).join('')}</tbody>}</div>`;
}

function filterUniformReport() {
    const term = document.getElementById('searchUniformReport').value.toLowerCase();
    let filtered = uniforms.filter(u => canAccessAgent(u.agentCode));
    filtered = filtered.filter(u => {
        const agent = agents.find(a => a.code === u.agentCode);
        return (agent && (agent.nom.toLowerCase().includes(term) || agent.prenom.toLowerCase().includes(term))) || u.agentCode.toLowerCase().includes(term);
    });
    document.getElementById('uniformReportContainer').innerHTML = generateUniformReport(filtered);
}

function deleteUniform(agentCode) {
    if (!checkPassword("Suppression habillement")) return;
    if (confirm(`Supprimer l'enregistrement d'habillement de ${agentCode} ?`)) {
        uniforms = uniforms.filter(u => u.agentCode !== agentCode);
        saveData();
        alert("✅ Habillement supprimé!");
        showUniformReport();
    }
}

function modifyUniform(agentCode) {
    const uniform = uniforms.find(u => u.agentCode === agentCode);
    if (!uniform) return;
    const newDate = prompt("Nouvelle date (AAAA-MM-JJ) :", uniform.date);
    if (newDate && newDate.match(/^\d{4}-\d{2}-\d{2}$/)) uniform.date = newDate;
    const newComment = prompt("Nouveau commentaire :", uniform.comment || "");
    if (newComment !== null) uniform.comment = newComment;
    uniform.lastUpdated = new Date().toISOString();
    saveData();
    alert("✅ Habillement modifié");
    showUniformReport();
}

function showUniformStats() {
    let filteredUniforms = uniforms.filter(u => canAccessAgent(u.agentCode));
    const totalEquipes = filteredUniforms.length;
    const articlesCount = {};
    filteredUniforms.forEach(u => { if (u.articles) u.articles.forEach(a => articlesCount[a] = (articlesCount[a] || 0) + 1); });
    let html = `<div class="info-section"><h3>📊 Statistiques Habillement</h3><div class="stats-grid"><div class="stat-card"><div class="stat-value">${totalEquipes}</div><div>👔 Agents équipés</div></div>`;
    Object.entries(articlesCount).forEach(([article, count]) => { html += `<div class="stat-card"><div class="stat-value">${count}</div><div>${article}s</div></div>`; });
    html += `</div><button class="popup-button gray" onclick="displayUniformMenu()">Retour</button></div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showUniformDeadlines() {
    let filteredUniforms = uniforms.filter(u => canAccessAgent(u.agentCode));
    const twoYearsAgo = new Date(); twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const toRenew = filteredUniforms.filter(u => new Date(u.date) < twoYearsAgo);
    const html = `<div class="info-section"><h3>📅 Échéances Habillement (à renouveler)</h3>
        ${toRenew.length ? `<table class="classement-table"><thead><tr style="background-color:#34495e;"><th>Agent</th><th>Dernière fourniture</th><th>Retard</th></tr></thead>
        <tbody>${toRenew.map(u => {
            const agent = agents.find(a => a.code === u.agentCode);
            const delay = Math.floor((new Date() - new Date(u.date)) / (1000 * 60 * 60 * 24));
            return `<tr style="border-bottom:1px solid #34495e;"><td><strong>${agent ? agent.nom + ' ' + agent.prenom : u.agentCode}</strong><br><small>${u.agentCode}</small></th><td>${u.date}</th><td style="color:#e74c3c;">${delay} jours</th></tr>`}).join('')}</tbody>}</div>` : '<p style="text-align:center; padding:20px;">✅ Aucune échéance dans les 2 ans</p>'}
        <button class="popup-button gray" onclick="displayUniformMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}
// ==================== PARTIE 16 : AVERTISSEMENTS ====================

function displayWarningsMenu() {
    if (currentUser.role === 'AGENT') {
        showAgentWarnings();
        return;
    }
    displaySubMenu("AVERTISSEMENTS", [
        { text: "⚠️ Ajouter Avertissement", onclick: "showAddWarningForm()" },
        { text: "📋 Liste Avertissements", onclick: "showWarningsList()" },
        { text: "👤 Par Agent", onclick: "showAgentWarningsForm()" },
        { text: "📊 Statistiques", onclick: "showWarningsStats()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ]);
}

function showAddWarningForm() {
    let agentsList = getFilteredAgents();
    const html = `<div class="info-section"><h3>⚠️ Ajouter Avertissement</h3>
        <div class="form-group"><label>🔍 Rechercher agent</label><input type="text" id="searchWarningAgent" placeholder="Tapez pour rechercher..." class="form-input" onkeyup="filterWarningAgentList()"></div>
        <div class="form-group"><label>Agent</label><select id="warningAgent" size="5" class="form-input" style="height:auto">${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom} (Groupe ${a.groupe})</option>`).join('')}</select></div>
        <div class="form-group"><label>Type</label><select id="warningType" class="form-input"><option value="ORAL">🗣️ Oral</option><option value="ECRIT">📝 Écrit</option><option value="MISE_A_PIED">⛔ Mise à pied</option></select></div>
        <div class="form-group"><label>Date</label><input type="date" id="warningDate" class="form-input" value="${new Date().toISOString().split('T')[0]}"></div>
        <div class="form-group"><label>Description</label><textarea id="warningDesc" class="form-input" rows="3" placeholder="Décrivez l'avertissement..."></textarea></div>
        <button class="popup-button green" onclick="saveWarning()">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="displayWarningsMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function filterWarningAgentList() {
    const term = document.getElementById('searchWarningAgent').value.toLowerCase();
    const select = document.getElementById('warningAgent');
    Array.from(select.options).forEach(opt => opt.style.display = opt.text.toLowerCase().includes(term) ? '' : 'none');
}

function saveWarning() {
    const agentCode = document.getElementById('warningAgent').value;
    const type = document.getElementById('warningType').value;
    const date = document.getElementById('warningDate').value;
    const description = document.getElementById('warningDesc').value;
    if (!agentCode || !description) { alert("⚠️ Agent et description requis!"); return; }
    if (!canAccessAgent(agentCode)) { alert("⚠️ Vous n'avez pas accès à cet agent"); return; }
    
    warnings.push({ id: Date.now(), agent_code: agentCode, type, date, description, status: 'active', created_at: new Date().toISOString() });
    saveData();
    addNotification('warning_add', { action: 'create', agentCode: agentCode, agentName: `${agents.find(a => a.code === agentCode)?.nom || agentCode} ${agents.find(a => a.code === agentCode)?.prenom || ''}`, warningType: type, description: description });
    alert(`✅ Avertissement enregistré pour ${agentCode}`);
    showWarningsList();
}

function showWarningsList() {
    let filteredWarnings = warnings.filter(w => canAccessAgent(w.agent_code));
    let html = `<div class="info-section"><h3>📋 Liste des Avertissements</h3>
        <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;"><input type="text" id="searchWarning" placeholder="🔍 Rechercher par agent..." style="flex:1; padding:8px;" onkeyup="filterWarningsList()">
        <select id="filterWarningType" onchange="filterWarningsList()" style="padding:8px;"><option value="ALL">Tous types</option><option value="ORAL">🗣️ Oral</option><option value="ECRIT">📝 Écrit</option><option value="MISE_A_PIED">⛔ Mise à pied</option></select>
        <select id="filterWarningStatus" onchange="filterWarningsList()" style="padding:8px;"><option value="ALL">Tous statuts</option><option value="active">🟢 Actifs</option><option value="archived">🔵 Archivés</option></select></div>
        <div id="warningsListContainer">${generateWarningsList(filteredWarnings)}</div>
        <button class="popup-button gray" onclick="displayWarningsMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function generateWarningsList(data) {
    if (!data.length) return '<p style="text-align:center; padding:20px;">Aucun avertissement</p>';
    const typeColors = { ORAL: '#f39c12', ECRIT: '#e74c3c', MISE_A_PIED: '#c0392b' };
    const typeLabels = { ORAL: '🗣️ Oral', ECRIT: '📝 Écrit', MISE_A_PIED: '⛔ Mise à pied' };
    return `<table class="classement-table"><thead><tr style="background-color:#34495e;"><th>Agent</th><th>Type</th><th>Date</th><th>Description</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>${data.sort((a, b) => new Date(b.date) - new Date(a.date)).map(w => {
            const agent = agents.find(a => a.code === w.agent_code);
            return `<tr style="border-bottom:1px solid #34495e;">
                <td><strong>${agent ? agent.nom + ' ' + agent.prenom : w.agent_code}</strong><br><small>${w.agent_code}</small></th>
                <td><span style="background:${typeColors[w.type]}; color:white; padding:4px 10px; border-radius:20px;">${typeLabels[w.type]}</span></th>
                <td>${w.date}</th><td>${w.description}</th>
                <td><span class="status-badge ${w.status === 'active' ? 'active' : 'inactive'}">${w.status === 'active' ? '🟢 Actif' : '🔵 Archivé'}</span></th>
                <td><button class="action-btn small orange" onclick="toggleWarningStatus(${w.id})" title="${w.status === 'active' ? 'Archiver' : 'Réactiver'}">${w.status === 'active' ? '📁' : '📂'}</button>
                <button class="action-btn small blue" onclick="modifyWarning(${w.id})" title="Modifier">✏️</button>
                <button class="action-btn small red" onclick="deleteWarning(${w.id})" title="Supprimer">🗑️</button></th>
            </tr>`}).join('')}</tbody>}</div>`;
}

function filterWarningsList() {
    const term = document.getElementById('searchWarning').value.toLowerCase();
    const type = document.getElementById('filterWarningType').value;
    const status = document.getElementById('filterWarningStatus').value;
    let filtered = warnings.filter(w => canAccessAgent(w.agent_code));
    filtered = filtered.filter(w => {
        const agent = agents.find(a => a.code === w.agent_code);
        const matchTerm = (agent && (agent.nom.toLowerCase().includes(term) || agent.prenom.toLowerCase().includes(term))) || w.agent_code.toLowerCase().includes(term);
        const matchType = type === 'ALL' || w.type === type;
        const matchStatus = status === 'ALL' || w.status === status;
        return matchTerm && matchType && matchStatus;
    });
    document.getElementById('warningsListContainer').innerHTML = generateWarningsList(filtered);
}

function showAgentWarningsForm() {
    let agentsList = getFilteredAgents();
    const html = `<div class="info-section"><h3>👤 Avertissements par Agent</h3>
        <div class="form-group"><label>🔍 Rechercher agent</label><input type="text" id="searchAgentWarnings" placeholder="Tapez pour rechercher..." class="form-input" onkeyup="filterAgentWarningsSelect()"></div>
        <div class="form-group"><label>Agent</label><select id="agentWarningsSelect" size="5" class="form-input" style="height:auto"><option value="">📋 Tous les agents</option>${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom}</option>`).join('')}</select></div>
        <button class="popup-button green" onclick="showAgentWarningsResult()">📋 Voir</button>
        <button class="popup-button gray" onclick="displayWarningsMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function filterAgentWarningsSelect() {
    const term = document.getElementById('searchAgentWarnings').value.toLowerCase();
    const select = document.getElementById('agentWarningsSelect');
    Array.from(select.options).forEach(opt => { if (opt.value === '') opt.style.display = ''; else opt.style.display = opt.text.toLowerCase().includes(term) ? '' : 'none'; });
}

function showAgentWarningsResult() {
    const agentCode = document.getElementById('agentWarningsSelect').value;
    let filtered = warnings.filter(w => canAccessAgent(w.agent_code));
    if (agentCode) filtered = filtered.filter(w => w.agent_code === agentCode);
    const html = `<div class="info-section"><h3>📋 Avertissements ${agentCode ? `pour ${agentCode}` : 'tous les agents'}</h3>${generateWarningsList(filtered)}<button class="popup-button gray" onclick="showAgentWarningsForm()">Retour</button></div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showWarningsStats() {
    let filteredWarnings = warnings.filter(w => canAccessAgent(w.agent_code));
    const byType = { ORAL: 0, ECRIT: 0, MISE_A_PIED: 0 };
    const byStatus = { active: 0, archived: 0 };
    const byAgent = {};
    filteredWarnings.forEach(w => { byType[w.type]++; byStatus[w.status]++; byAgent[w.agent_code] = (byAgent[w.agent_code] || 0) + 1; });
    const topAgent = Object.entries(byAgent).sort((a, b) => b[1] - a[1])[0];
    const topAgentName = topAgent ? (agents.find(a => a.code === topAgent[0])?.nom || topAgent[0]) : 'Aucun';
    const typeLabels = { ORAL: '🗣️ Oral', ECRIT: '📝 Écrit', MISE_A_PIED: '⛔ Mise à pied' };
    const html = `<div class="info-section"><h3>📊 Statistiques Avertissements</h3>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-value">${byType.ORAL}</div><div>${typeLabels.ORAL}</div></div>
            <div class="stat-card"><div class="stat-value">${byType.ECRIT}</div><div>${typeLabels.ECRIT}</div></div>
            <div class="stat-card"><div class="stat-value">${byType.MISE_A_PIED}</div><div>${typeLabels.MISE_A_PIED}</div></div>
            <div class="stat-card"><div class="stat-value">${byStatus.active}</div><div>🟢 Actifs</div></div>
            <div class="stat-card"><div class="stat-value">${byStatus.archived}</div><div>🔵 Archivés</div></div>
            <div class="stat-card"><div class="stat-value">${filteredWarnings.length}</div><div>📊 Total</div></div>
        </div>
        <div class="info-item" style="margin-top:15px;"><span class="info-label">🏆 Agent le plus averti:</span> <strong>${topAgentName}</strong> (${topAgent?.[1] || 0} avertissements)</div>
        <button class="popup-button gray" onclick="displayWarningsMenu()" style="margin-top:15px;">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function toggleWarningStatus(id) {
    const idx = warnings.findIndex(w => w.id === id);
    if (idx !== -1) {
        warnings[idx].status = warnings[idx].status === 'active' ? 'archived' : 'active';
        warnings[idx].updated_at = new Date().toISOString();
        saveData();
        showSnackbar(warnings[idx].status === 'active' ? "✅ Avertissement réactivé" : "📁 Avertissement archivé");
        showWarningsList();
    }
}

function deleteWarning(id) {
    if (!checkPassword("Suppression avertissement")) return;
    if (confirm("Supprimer définitivement cet avertissement ?")) {
        warnings = warnings.filter(w => w.id !== id);
        saveData();
        alert("✅ Avertissement supprimé!");
        showWarningsList();
    }
}

function modifyWarning(id) {
    const warning = warnings.find(w => w.id === id);
    if (!warning) return;
    const newType = prompt("Nouveau type (ORAL, ECRIT, MISE_A_PIED) :", warning.type);
    if (newType && ['ORAL', 'ECRIT', 'MISE_A_PIED'].includes(newType)) warning.type = newType;
    const newDesc = prompt("Nouvelle description :", warning.description);
    if (newDesc !== null) warning.description = newDesc;
    const newDate = prompt("Nouvelle date (AAAA-MM-JJ) :", warning.date);
    if (newDate && newDate.match(/^\d{4}-\d{2}-\d{2}$/)) warning.date = newDate;
    warning.updated_at = new Date().toISOString();
    saveData();
    alert("✅ Avertissement modifié");
    showWarningsList();
}
// ==================== PARTIE 17 : JOURS FÉRIÉS ====================

function displayHolidaysMenu() {
    displaySubMenu("JOURS FÉRIÉS", [
        { text: "➕ Ajouter Jour Férié", onclick: "showAddHolidayForm()" },
        { text: "📋 Liste Jours Fériés", onclick: "showHolidaysList()" },
        { text: "📅 Calendrier Annuel", onclick: "showHolidaysCalendar()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ]);
}

function showAddHolidayForm() {
    const currentYear = new Date().getFullYear();
    const html = `<div class="info-section"><h3>🎉 Ajouter Jour Férié</h3>
        <div class="form-group"><label>Date</label><input type="date" id="holidayDate" class="form-input" value="${currentYear}-01-01"></div>
        <div class="form-group"><label>Description</label><input type="text" id="holidayDesc" class="form-input" placeholder="Ex: Aïd Al-Fitr, Fête du Trône..."></div>
        <div class="form-group"><label>Type</label><select id="holidayType" class="form-input"><option value="fixe">📅 Fixe</option><option value="religieux">🕌 Religieux</option><option value="national">🇲🇦 National</option></select></div>
        <button class="popup-button green" onclick="saveHoliday()">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="displayHolidaysMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function saveHoliday() {
    const fullDate = document.getElementById('holidayDate').value;
    const description = document.getElementById('holidayDesc').value;
    const type = document.getElementById('holidayType').value;
    if (!fullDate || !description) { alert("⚠️ Date et description requises!"); return; }
    const monthDay = fullDate.substring(5);
    if (holidays.find(h => h.date === monthDay)) { alert("⚠️ Ce jour férié existe déjà!"); return; }
    holidays.push({ date: monthDay, description, type, isRecurring: true });
    saveData();
    alert(`✅ Jour férié ajouté: ${description} (${fullDate})`);
    showHolidaysList();
}

function showHolidaysList() {
    if (!holidays.length) {
        const html = `<div class="info-section"><h3>📋 Liste des Jours Fériés</h3><p style="text-align:center; padding:20px; color:#e74c3c;">Aucun jour férié enregistré</p>
            <button class="popup-button green" onclick="showAddHolidayForm()">➕ Ajouter</button>
            <button class="popup-button gray" onclick="displayHolidaysMenu()">Retour</button></div>`;
        document.getElementById('main-content').innerHTML = html;
        return;
    }
    const sortedHolidays = [...holidays].sort((a, b) => { const [mA, dA] = a.date.split('-').map(Number); const [mB, dB] = b.date.split('-').map(Number); if (mA !== mB) return mA - mB; return dA - dB; });
    const holidaysByMonth = {};
    sortedHolidays.forEach(h => { const [month, day] = h.date.split('-'); const monthName = MOIS_FRANCAIS[parseInt(month) - 1]; if (!holidaysByMonth[monthName]) holidaysByMonth[monthName] = []; holidaysByMonth[monthName].push({ day: parseInt(day), ...h }); });
    const typeLabels = { fixe: '📅 Fixe', religieux: '🕌 Religieux', national: '🇲🇦 National' };
    const typeColors = { fixe: '#27ae60', religieux: '#f39c12', national: '#3498db' };
    let html = `<div class="info-section"><h3>📋 Liste des Jours Fériés (${holidays.length} jours)</h3>
        <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;"><input type="text" id="searchHoliday" placeholder="🔍 Rechercher par description..." style="flex:1; padding:8px;" onkeyup="filterHolidaysList()">
        <button class="action-btn small green" onclick="showAddHolidayForm()">➕ Ajouter</button>
        <button class="action-btn small blue" onclick="generateYearlyHolidays()">🔄 Réinitialiser</button></div>
        <div id="holidaysListContainer"><div style="display:grid; gap:15px;">${Object.entries(holidaysByMonth).map(([monthName, days]) => `
            <div style="background:#2c3e50; border-radius:8px; overflow:hidden;"><div style="background:#34495e; padding:10px; font-weight:bold; border-bottom:1px solid #f39c12;">📅 ${monthName}</div>
            <table class="classement-table" style="width:100%; margin:0;"><thead><tr style="background-color:#2c3e50;"><th style="padding:8px; width:80px;">Date</th><th style="padding:8px;">Description</th><th style="padding:8px; width:100px;">Type</th><th style="padding:8px; width:80px;">Actions</th></tr></thead>
            <tbody>${days.sort((a, b) => a.day - b.day).map(h => `<tr style="border-bottom:1px solid #34495e;"><td style="padding:8px; text-align:center;"><strong>${h.day}</strong></th><td style="padding:8px;">🎉 ${h.description}</th>
            <td style="padding:8px; text-align:center;"><span style="background:${typeColors[h.type]}; color:white; padding:4px 8px; border-radius:12px;">${typeLabels[h.type]}</span></th>
            <td style="padding:8px; text-align:center;"><button class="action-btn small orange" onclick="modifyHoliday('${h.date}')">✏️</button><button class="action-btn small red" onclick="deleteHoliday('${h.date}')">🗑️</button></th></tr>`).join('')}</tbody></div>`).join('')}</div></div>
        <button class="popup-button gray" onclick="displayHolidaysMenu()" style="margin-top:15px;">↩️ Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function filterHolidaysList() {
    const term = document.getElementById('searchHoliday')?.value.toLowerCase() || '';
    if (!term) { showHolidaysList(); return; }
    const filtered = holidays.filter(h => h.description.toLowerCase().includes(term) || h.date.includes(term));
    if (filtered.length === 0) { document.getElementById('holidaysListContainer').innerHTML = `<div style="text-align:center; padding:20px; background:#2c3e50; border-radius:8px;"><p>🔍 Aucun jour férié trouvé pour "${term}"</p></div>`; return; }
    const filteredByMonth = {};
    filtered.forEach(h => { const [month, day] = h.date.split('-'); const monthName = MOIS_FRANCAIS[parseInt(month) - 1]; if (!filteredByMonth[monthName]) filteredByMonth[monthName] = []; filteredByMonth[monthName].push({ day: parseInt(day), ...h }); });
    const typeLabels = { fixe: '📅 Fixe', religieux: '🕌 Religieux', national: '🇲🇦 National' };
    const typeColors = { fixe: '#27ae60', religieux: '#f39c12', national: '#3498db' };
    let html = `<div style="display:grid; gap:15px;">`;
    for (const [monthName, days] of Object.entries(filteredByMonth)) {
        html += `<div style="background:#2c3e50; border-radius:8px; overflow:hidden;"><div style="background:#34495e; padding:10px; font-weight:bold;">📅 ${monthName}</div>
            <table class="classement-table" style="width:100%; margin:0;"><thead><tr style="background-color:#2c3e50;"><th>Date</th><th>Description</th><th>Type</th><th>Action</th></tr></thead>
            <tbody>${days.sort((a, b) => a.day - b.day).map(h => `<tr style="border-bottom:1px solid #34495e;"><td style="padding:8px;"><strong>${h.day}</strong></th><td style="padding:8px;">🎉 ${h.description}</th>
            <td style="padding:8px;"><span style="background:${typeColors[h.type]}; padding:2px 8px; border-radius:12px;">${typeLabels[h.type]}</span></th>
            <td style="padding:8px;"><button class="action-btn small orange" onclick="modifyHoliday('${h.date}')">✏️</button><button class="action-btn small red" onclick="deleteHoliday('${h.date}')">🗑️</button></th></tr>`).join('')}</tbody></div>`;
    }
    html += `</div>`;
    document.getElementById('holidaysListContainer').innerHTML = html;
}

function generateYearlyHolidays() {
    if (!checkPassword("Réinitialisation des jours fériés")) return;
    if (confirm("⚠️ Réinitialiser les jours fériés aux valeurs par défaut ?")) {
        initializeHolidays();
        saveData();
        showSnackbar("✅ Jours fériés réinitialisés");
        showHolidaysList();
    }
}

function showHolidaysCalendar() {
    const year = new Date().getFullYear();
    let html = `<div class="info-section"><h3>📅 Calendrier des Jours Fériés ${year}</h3>
        <div class="form-group"><label>Année</label><input type="number" id="calendarYear" class="form-input" value="${year}" onchange="refreshCalendar()"></div>
        <div id="calendarContainer">${generateCalendarHTML(year)}</div>
        <button class="popup-button gray" onclick="displayHolidaysMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function refreshCalendar() {
    const year = parseInt(document.getElementById('calendarYear').value);
    document.getElementById('calendarContainer').innerHTML = generateCalendarHTML(year);
}

function generateCalendarHTML(year) {
    let html = '<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">';
    for (let month = 1; month <= 12; month++) {
        const firstDay = new Date(year, month - 1, 1);
        const daysInMonth = new Date(year, month, 0).getDate();
        const startWeekday = firstDay.getDay();
        const monthHolidays = holidays.filter(h => parseInt(h.date.split('-')[0]) === month);
        html += `<div style="background:#34495e; border-radius:8px; padding:10px;">
            <h4 style="margin:0 0 10px 0; text-align:center; background:#2c3e50; padding:5px; border-radius:5px;">${MOIS_FRANCAIS[month-1]}</h4>
            <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:3px; font-size:0.7em; text-align:center;">
                <div style="color:#e74c3c;">Dim</div><div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div style="color:#e74c3c;">Sam</div>`;
        for (let i = 0; i < startWeekday; i++) html += '<div style="opacity:0.3;">-</div>';
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHoliday = monthHolidays.some(h => parseInt(h.date.split('-')[1]) === day);
            const holidayInfo = monthHolidays.find(h => parseInt(h.date.split('-')[1]) === day);
            let dayStyle = isHoliday ? 'background:#f39c12; color:#2c3e50; font-weight:bold;' : (isWeekend ? 'background:#e74c3c; color:white;' : 'background:#2c3e50;');
            html += `<div style="${dayStyle} padding:5px; border-radius:3px;" title="${holidayInfo ? holidayInfo.description : ''}">${isHoliday ? '🎉' : ''}${day}</div>`;
        }
        html += `</div>`;
        if (monthHolidays.length > 0) html += `<div style="margin-top:8px; font-size:0.65em; color:#f39c12;">${monthHolidays.map(h => `📅 ${h.date.split('-')[1]}: ${h.description}`).join(' | ')}</div>`;
        html += `</div>`;
    }
    html += '</div>';
    return html;
}

function deleteHoliday(dateStr) {
    if (!checkPassword("Suppression jour férié")) return;
    if (confirm(`Supprimer le jour férié du ${dateStr} ?`)) {
        holidays = holidays.filter(h => h.date !== dateStr);
        saveData();
        alert("✅ Jour férié supprimé!");
        showHolidaysList();
    }
}

function modifyHoliday(dateStr) {
    const holiday = holidays.find(h => h.date === dateStr);
    if (!holiday) return;
    const newDesc = prompt("Nouvelle description :", holiday.description);
    if (newDesc !== null && newDesc.trim()) holiday.description = newDesc;
    const newType = prompt("Nouveau type (fixe, religieux, national) :", holiday.type || "fixe");
    if (newType && ['fixe', 'religieux', 'national'].includes(newType)) holiday.type = newType;
    saveData();
    alert("✅ Jour férié modifié");
    showHolidaysList();
}
// ==================== PARTIE 18 : EXPORTATIONS ====================

function displayExportMenu() {
    displaySubMenu("EXPORTATIONS", [
        { text: "📤 Exporter Agents (CSV)", onclick: "exportAgentsCSV()" },
        { text: "📤 Exporter Planning (CSV)", onclick: "exportPlanningCSVForm()" },
        { text: "📄 Exporter Planning (PDF)", onclick: "exportPlanningPDF()" },
        { text: "📊 Exporter Planning (Excel)", onclick: "exportPlanningExcel()" },
        { text: "📤 Exporter Congés (CSV)", onclick: "exportLeavesCSV()" },
        { text: "💾 Sauvegarde Complète", onclick: "showBackupRestoreMenu()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ]);
}

function exportPlanningCSVForm() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const html = `<div class="info-section"><h3>📤 Export Planning CSV</h3>
        <div class="form-group"><label>Mois</label><select id="exportMonth" class="form-input">${Array.from({length:12}, (_,i) => `<option value="${i+1}" ${i+1 === currentMonth ? 'selected' : ''}>${MOIS_FRANCAIS[i]}</option>`).join('')}</select></div>
        <div class="form-group"><label>Année</label><input type="number" id="exportYear" class="form-input" value="${currentYear}"></div>
        <div class="form-group"><label>Groupe</label><select id="exportGroup" class="form-input"><option value="ALL">📋 Tous les groupes</option><option value="A">👥 Groupe A</option><option value="B">👥 Groupe B</option><option value="C">👥 Groupe C</option><option value="D">👥 Groupe D</option><option value="E">👥 Groupe E</option><option value="J">🃏 Jokers</option></select></div>
        <button class="popup-button green" onclick="exportPlanningCSV()">📥 Exporter</button>
        <button class="popup-button gray" onclick="displayExportMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function exportPlanningCSV() {
    const month = parseInt(document.getElementById('exportMonth').value);
    const year = parseInt(document.getElementById('exportYear').value);
    const group = document.getElementById('exportGroup').value;
    let actifs = agents.filter(a => a.statut === 'actif');
    if (group !== 'ALL') actifs = actifs.filter(a => a.groupe === group);
    const daysInMonth = new Date(year, month, 0).getDate();
    let csv = "Code;Nom;Prénom;Groupe";
    for (let d = 1; d <= daysInMonth; d++) csv += `;${d}`;
    csv += "\n";
    for (const agent of actifs) {
        csv += `${agent.code};${agent.nom};${agent.prenom};${agent.groupe}`;
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${month.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
            csv += `;${getShiftForAgent(agent.code, dateStr)}`;
        }
        csv += "\n";
    }
    downloadCSV(csv, `planning_${getMonthName(month)}_${year}${group !== 'ALL' ? `_groupe${group}` : ''}.csv`);
}

function exportLeavesCSV() {
    let csv = "Agent;Code;Date début;Date fin;Type;Commentaire\n";
    Object.keys(planningData).forEach(monthKey => {
        Object.keys(planningData[monthKey]).forEach(agentCode => {
            if (!canAccessAgent(agentCode)) return;
            const leavesList = [];
            Object.keys(planningData[monthKey][agentCode]).forEach(dateStr => {
                const rec = planningData[monthKey][agentCode][dateStr];
                if (rec && ['C', 'M', 'A'].includes(rec.shift)) leavesList.push({ date: dateStr, type: rec.shift, comment: rec.comment });
            });
            const grouped = groupConsecutiveLeaves(leavesList.map(l => ({ ...l, agentCode })));
            const agent = agents.find(a => a.code === agentCode);
            grouped.forEach(g => {
                csv += `${agent ? agent.nom + ' ' + agent.prenom : agentCode};${agentCode};${g.startDate};${g.endDate};${g.type};${g.comment || ''}\n`;
            });
        });
    });
    downloadCSV(csv, `conges_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportPlanningPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const actifs = getFilteredAgents();
    const daysInMonth = new Date(year, month, 0).getDate();
    doc.setFontSize(16);
    doc.text(`Planning - ${getMonthName(month)} ${year}`, 14, 10);
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleString()}`, 14, 18);
    const headers = ['Agent', 'Groupe', ...Array.from({length: daysInMonth}, (_, i) => i + 1)];
    const body = actifs.map(agent => {
        const row = [`${agent.nom} ${agent.prenom}`, agent.groupe];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            row.push(getShiftForAgent(agent.code, dateStr));
        }
        return row;
    });
    doc.autoTable({ head: [headers], body: body, startY: 25, theme: 'striped', styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [52, 73, 94], textColor: [255, 255, 255] }, alternateRowStyles: { fillColor: [44, 62, 80] } });
    doc.save(`planning_${getMonthName(month)}_${year}.pdf`);
    showSnackbar("✅ PDF exporté");
}

function exportPlanningExcel() {
    if (typeof XLSX === 'undefined') { alert("⚠️ La bibliothèque SheetJS n'est pas chargée."); return; }
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const actifs = getFilteredAgents();
    const daysInMonth = new Date(year, month, 0).getDate();
    const data = [['Code', 'Nom', 'Prénom', 'Groupe', ...Array.from({length: daysInMonth}, (_, i) => i + 1)]];
    for (const agent of actifs) {
        const row = [agent.code, agent.nom, agent.prenom, agent.groupe];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            row.push(getShiftForAgent(agent.code, dateStr));
        }
        data.push(row);
    }
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Planning ${getMonthName(month)} ${year}`);
    XLSX.writeFile(wb, `planning_${getMonthName(month)}_${year}.xlsx`);
    showSnackbar("✅ Excel exporté");
}
// ==================== PARTIE 19 : CONFIGURATION ====================

function displayConfigMenu() {
    if (currentUser.role !== 'ADMIN') {
        alert("⚠️ Accès réservé à l'administrateur");
        displayMainMenu();
        return;
    }
    displaySubMenu("CONFIGURATION", [
        { text: "⚙️ Paramètres", onclick: "showSettings()" },
        { text: "🗃️ Gestion Base de Données", onclick: "showBackupRestoreMenu()" },
        { text: "📥 Importer Base CleanCo", onclick: "showImportCleanCoDatabase()" },
        { text: "ℹ️ À propos", onclick: "showAbout()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ]);
}

function showSettings() {
    const html = `<div class="info-section"><h3>⚙️ Paramètres</h3>
        <div class="form-group"><label>🎨 Thème</label><select id="themeSelect" class="form-input" onchange="changeTheme()"><option value="dark" ${localStorage.getItem('theme') !== 'light' ? 'selected' : ''}>🌙 Sombre</option><option value="light" ${localStorage.getItem('theme') === 'light' ? 'selected' : ''}>☀️ Clair</option></select></div>
        <div class="form-group"><label>💾 Auto-sauvegarde</label><select id="autoSaveSelect" class="form-input"><option value="0">❌ Désactivée</option><option value="5">⏱️ Toutes les 5 minutes</option><option value="15">⏱️ Toutes les 15 minutes</option><option value="30">⏱️ Toutes les 30 minutes</option></select></div>
        <button class="popup-button green" onclick="saveSettings()">💾 Sauvegarder</button>
        <button class="popup-button gray" onclick="displayConfigMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
    const autoSaveValue = localStorage.getItem('autoSaveInterval') || '5';
    document.getElementById('autoSaveSelect').value = autoSaveValue;
}

function changeTheme() {
    const theme = document.getElementById('themeSelect').value;
    if (theme === 'light') {
        document.body.style.backgroundColor = '#ecf0f1';
        document.body.style.color = '#2c3e50';
        document.querySelectorAll('.card, .info-section, .stat-card, .planning-table, .classement-table').forEach(el => { if (el) el.style.backgroundColor = '#fff'; });
        document.querySelectorAll('.menu-button').forEach(el => { if (el) el.style.backgroundColor = '#3498db'; });
    } else {
        document.body.style.backgroundColor = '#2c3e50';
        document.body.style.color = '#ecf0f1';
        document.querySelectorAll('.card, .info-section, .stat-card, .planning-table, .classement-table').forEach(el => { if (el) el.style.backgroundColor = '#34495e'; });
        document.querySelectorAll('.menu-button').forEach(el => { if (el) el.style.backgroundColor = '#34495e'; });
    }
    localStorage.setItem('theme', theme);
}

function saveSettings() {
    const theme = document.getElementById('themeSelect').value;
    const autoSaveMinutes = parseInt(document.getElementById('autoSaveSelect').value);
    localStorage.setItem('theme', theme);
    localStorage.setItem('autoSaveInterval', autoSaveMinutes);
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    if (autoSaveMinutes > 0) {
        autoSaveInterval = setInterval(() => { saveData(); console.log("💾 Auto-save à", new Date().toLocaleTimeString()); }, autoSaveMinutes * 60 * 1000);
        showSnackbar(`✅ Auto-sauvegarde activée (toutes les ${autoSaveMinutes} min)`);
    } else { showSnackbar("⚠️ Auto-sauvegarde désactivée"); }
    changeTheme();
    displayConfigMenu();
}

function showBackupRestoreMenu() {
    const html = `<div class="info-section"><h3>💾 Sauvegarde & Restauration</h3>
        <div style="display:grid; gap:15px;">
            <div class="stat-card"><h4>📤 Exporter</h4><button class="popup-button blue" onclick="exportFullBackup()">📥 Sauvegarde JSON</button><button class="popup-button green" onclick="exportAgentsCSV()">📊 Agents CSV</button></div>
            <div class="stat-card"><h4>📥 Importer</h4><input type="file" id="restoreFile" accept=".json" style="margin-bottom:10px;"><button class="popup-button green" onclick="importFullBackup()">📥 Restaurer</button></div>
            <div class="stat-card"><h4>🔄 Réinitialisation</h4><button class="popup-button orange" onclick="resetToDemoData()">🎮 Données démo</button><button class="popup-button red" onclick="clearAllDataPrompt()">🗑️ Effacer tout</button></div>
            <div class="stat-card"><h4>🔧 Utilitaires</h4><button class="popup-button blue" onclick="createCPAccountsFromAgents()">🔧 Créer comptes CP</button></div>
        </div>
        <div style="margin-top:15px; background:#2c3e50; padding:10px; border-radius:8px;"><h4>📊 État actuel</h4><div>👥 Agents: ${agents.length}</div><div>📅 Planning: ${Object.keys(planningData).length} mois</div><div>📻 Radios: ${radios.length}</div><div>⚠️ Avertissements: ${warnings.length}</div><div>🎉 Jours fériés: ${holidays.length}</div></div>
        <button class="popup-button gray" onclick="displayConfigMenu()" style="margin-top:15px;">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function exportFullBackup() {
    const backup = { exportDate: new Date().toISOString(), version: "8.0", agents, planningData, holidays, panicCodes, radios, uniforms, warnings, replacementNotifications, users, notifications };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sga_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showSnackbar("✅ Sauvegarde complète exportée");
}

function importFullBackup() {
    const fileInput = document.getElementById('restoreFile');
    if (!fileInput || !fileInput.files.length) { alert("⚠️ Sélectionnez un fichier JSON"); return; }
    if (!checkPassword("Restauration")) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm("⚠️ Remplacer toutes les données actuelles ?")) {
                if (data.agents) agents = data.agents;
                if (data.planningData) planningData = data.planningData;
                if (data.holidays) holidays = data.holidays;
                if (data.panicCodes) panicCodes = data.panicCodes;
                if (data.radios) radios = data.radios;
                if (data.uniforms) uniforms = data.uniforms;
                if (data.warnings) warnings = data.warnings;
                if (data.replacementNotifications) replacementNotifications = data.replacementNotifications;
                if (data.users) users = data.users;
                if (data.notifications) notifications = data.notifications;
                saveData();
                alert("✅ Données restaurées avec succès !");
                displayMainMenu();
            }
        } catch (err) { alert("❌ Fichier invalide ou corrompu"); }
    };
    reader.readAsText(fileInput.files[0]);
}

function showImportCleanCoDatabase() {
    const html = `<div class="info-section"><h3>📥 Importer Base CleanCo 2026</h3>
        <p>Cette option permet d'importer la base de données complète des agents CleanCo.</p>
        <div class="form-group"><label>Fichier data.js (base CleanCo)</label><input type="file" id="cleancoDataFile" accept=".js" class="form-input"><small style="color:#bdc3c7;">Sélectionnez le fichier "b-d Cleanco 2026.js"</small></div>
        <div class="form-group"><label>Mode d'import</label><select id="importCleanCoMode" class="form-input"><option value="replace">🔄 Remplacer tous les agents</option><option value="merge">➕ Fusionner (ajouter les nouveaux codes)</option></select></div>
        <button class="popup-button green" onclick="importCleanCoData()">📥 Importer CleanCo</button>
        <button class="popup-button gray" onclick="displayConfigMenu()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function importCleanCoData() {
    const fileInput = document.getElementById('cleancoDataFile');
    if (!fileInput || !fileInput.files.length) { alert("⚠️ Sélectionnez le fichier data.js de CleanCo"); return; }
    if (!checkPassword("Import base CleanCo")) return;
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        let importedAgents = null;
        try {
            const match = content.match(/const\s+agents\s*=\s*(\[[\s\S]*?\]);/);
            if (match) { importedAgents = eval(match[1]); } 
            else { const match2 = content.match(/var\s+agents\s*=\s*(\[[\s\S]*?\]);/); if (match2) importedAgents = eval(match2[1]); else throw new Error('Format non reconnu'); }
            if (!importedAgents || !Array.isArray(importedAgents)) throw new Error('Le fichier ne contient pas un tableau agents valide');
            const mode = document.getElementById('importCleanCoMode').value;
            let count = 0;
            if (mode === 'replace') { agents = importedAgents; count = agents.length; showSnackbar(`✅ ${count} agents importés (remplacement)`); } 
            else { const existingCodes = new Set(agents.map(a => a.code)); importedAgents.forEach(agent => { if (!existingCodes.has(agent.code)) { agents.push(agent); count++; } }); showSnackbar(`✅ ${count} nouveaux agents ajoutés (fusion)`); }
            createCPAccountsFromAgents();
            saveData();
            alert(`✅ Import terminé ! ${agents.length} agents au total.`);
            displayConfigMenu();
        } catch (err) { console.error(err); alert("❌ Erreur: fichier data.js invalide ou variable 'agents' non trouvée\n" + err.message); }
    };
    reader.onerror = () => alert("❌ Erreur de lecture du fichier");
    reader.readAsText(file, 'UTF-8');
}

function createCPAccountsFromAgents() {
    const cpAgents = agents.filter(a => a.code && (a.code === 'CPA' || a.code === 'CPB' || a.code === 'CPC' || a.code === 'CPD'));
    let created = 0;
    cpAgents.forEach(agent => {
        const existingUser = users.find(u => u.agentCode === agent.code);
        if (!existingUser) {
            const username = agent.code.toLowerCase();
            const newUser = { id: Date.now() + Math.random(), username: username, password: agent.code.toUpperCase() + "123", role: "CP", nom: agent.nom, prenom: agent.prenom, groupe: agent.groupe, agentCode: agent.code };
            users.push(newUser);
            created++;
            console.log(`✅ Compte CP créé: ${username} / mot de passe: ${agent.code.toUpperCase()}123`);
        }
    });
    if (created > 0) { saveData(); showSnackbar(`✅ ${created} comptes CP créés automatiquement`); }
}

function resetToDemoData() {
    if (!checkPassword("Réinitialisation")) return;
    if (confirm("🔄 Charger les données de démo ?\n⚠️ Toutes les données actuelles seront perdues !")) {
        agents = [
            { code: 'DEMO01', nom: 'Admin', prenom: 'Test', groupe: 'A', tel: '0612345678', statut: 'actif', date_entree: new Date().toISOString().split('T')[0] },
            { code: 'DEMO02', nom: 'Joker', prenom: 'Un', groupe: 'J', tel: '0645678901', statut: 'actif', date_entree: new Date().toISOString().split('T')[0] },
            { code: 'DEMO03', nom: 'Agent', prenom: 'Test', groupe: 'B', tel: '0634567890', statut: 'actif', date_entree: new Date().toISOString().split('T')[0] }
        ];
        planningData = {}; holidays = []; panicCodes = []; radios = []; uniforms = []; warnings = []; replacementNotifications = []; notifications = [];
        initializeHolidays();
        saveData();
        alert("✅ Données de démo chargées !");
        displayMainMenu();
    }
}

function clearAllDataPrompt() {
    if (!checkPassword("Effacement total")) return;
    if (confirm("⚠️⚠️⚠️ EFFACEMENT TOTAL ⚠️⚠️⚠️\n\nToutes les données seront définitivement supprimées !")) {
        if (confirm("DERNIER AVERTISSEMENT - Êtes-vous absolument sûr ?")) {
            localStorage.clear();
            agents = []; planningData = {}; holidays = []; panicCodes = []; radios = []; uniforms = []; warnings = []; replacementNotifications = []; notifications = [];
            users = [
                { id: 1, username: "admin", password: "NABIL1974", role: "ADMIN", nom: "Admin", prenom: "Système", groupe: null, agentCode: null },
                { id: 2, username: "cp_a", password: "CPA123", role: "CP", nom: "OUKHA", prenom: "NABIL", groupe: "A", agentCode: "CPA" },
            ];
            initializeHolidays();
            saveData();
            alert("✅ Toutes les données ont été effacées");
            displayMainMenu();
        }
    }
}

function showAbout() {
    const html = `<div class="info-section"><h3>ℹ️ À propos</h3>
        <div style="text-align:center"><h2>🏢 SGA - Système de Gestion des Agents</h2><p><strong>Version 8.0 - CleanCo</strong></p>
        <hr style="margin:15px 0;"><p>👑 <strong>Administrateur:</strong> admin / NABIL1974</p>
        <p>👥 <strong>Chef Patrouille A:</strong> cp_a / CPA123</p><p>👤 <strong>Agent exemple:</strong> agent_a001 / AGENT123</p>
        <hr style="margin:15px 0;"><p>📥 Import base CleanCo disponible dans Configuration</p><p>🔄 Gestion des congés avec remplacement automatique par joker</p>
        <p>📅 Planning avec jours fériés et numéros de semaine</p><hr style="margin:15px 0;"><p>© 2026 - CleanCo | Tous droits réservés</p>
        <p style="font-size:0.8rem; color:#bdc3c7;">Développé par Oukha Nabil</p></div>
        <button class="popup-button gray" onclick="displayConfigMenu()" style="margin-top:15px;">Fermer</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}
// ==================== PARTIE 20 : SYSTÈME DE NOTIFICATIONS ====================


function loadNotifications() {
    const saved = localStorage.getItem('sga_sys_notifications');
    if (saved) { notifications = JSON.parse(saved); } 
    else { notifications = []; }
}

function saveNotifications() {
    localStorage.setItem('sga_sys_notifications', JSON.stringify(notifications));
}

function addNotification(type, details) {
    if (!currentUser) return;
    const notification = {
        id: Date.now(),
        type: type,
        action: details.action || 'create',
        createdBy: currentUser.username,
        createdByName: `${currentUser.nom} ${currentUser.prenom}`,
        createdByRole: currentUser.role,
        createdAt: new Date().toISOString(),
        details: details,
        readBy: []
    };
    notifications.unshift(notification);
    if (notifications.length > 100) { notifications = notifications.slice(0, 100); }
    saveNotifications();
    updateNotificationBadge();
    showNotificationToast(type, details);
}

function showNotificationToast(type, details) {
    let message = '';
    switch(type) {
        case 'shift_modification': message = `✏️ Shift modifié pour ${details.agentName} le ${details.date}`; break;
        case 'leave_add': message = `🏖️ Congé ajouté pour ${details.agentName}`; break;
        case 'leave_delete': message = `🗑️ Congé supprimé pour ${details.agentName}`; break;
        case 'shift_exchange': message = `🔄 Échange de shifts entre ${details.agent1Name} et ${details.agent2Name}`; break;
        case 'agent_add': message = `➕ Nouvel agent ajouté: ${details.agentName}`; break;
        case 'agent_update': message = `✏️ Agent modifié: ${details.agentName}`; break;
        case 'agent_delete': message = `🗑️ Agent supprimé: ${details.agentName}`; break;
        case 'panic_add': message = `🚨 Code panique ajouté pour ${details.agentName}`; break;
        case 'uniform_add': message = `👔 Habillement enregistré pour ${details.agentName}`; break;
        case 'warning_add': message = `⚠️ Avertissement ajouté pour ${details.agentName}`; break;
        default: message = `🔔 Nouvelle notification`;
    }
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed; bottom:20px; right:20px; background:#34495e; color:white; padding:12px 20px; border-radius:8px; border-left:4px solid #f39c12; z-index:10000; animation:slideIn 0.3s ease; box-shadow:0 4px 12px rgba(0,0,0,0.3); cursor:pointer;`;
    toast.innerHTML = `<div style="display:flex; align-items:center; gap:10px;"><span>🔔</span><span>${message}</span></div>`;
    toast.onclick = () => { toast.remove(); showNotificationsPage(); };
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5000);
}


function showNotificationsPage() {
    const main = document.getElementById('main-content');
    document.getElementById('sub-title').textContent = "Centre de Notifications";
    let html = `<div class="info-section"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
        <h3 style="margin:0;">🔔 Centre de Notifications</h3><div><button class="popup-button blue" onclick="markAllNotificationsAsRead()">✅ Tout marquer lu</button>
        <button class="popup-button red" onclick="clearAllNotifications()">🗑️ Tout effacer</button></div></div><div id="notificationsListContainer">`;
    if (notifications.length === 0) { html += `<div style="text-align:center; padding:40px; color:#bdc3c7;">📭 Aucune notification</div>`; } 
    else {
        const grouped = {};
        notifications.forEach(n => { const date = new Date(n.createdAt).toLocaleDateString(); if (!grouped[date]) grouped[date] = []; grouped[date].push(n); });
        for (const [date, notifs] of Object.entries(grouped)) {
            html += `<h4 style="margin:15px 0 10px 0; color:#f39c12;">📅 ${date}</h4>`;
            notifs.forEach(n => { const isUnread = !n.readBy.includes(currentUser.username); html += getNotificationHtml(n, isUnread, true); });
        }
    }
    html += `</div><button class="popup-button gray" onclick="displayMainMenu()" style="margin-top:20px;">↩️ Retour</button></div>`;
    main.innerHTML = html;
}

function getNotificationHtml(notification, isUnread, showFull = false) {
    const date = new Date(notification.createdAt).toLocaleTimeString();
    const unreadStyle = isUnread ? 'border-left: 3px solid #e74c3c; background-color: rgba(231, 76, 60, 0.1);' : 'border-left: 3px solid #2ecc71;';
    let icon = '🔔', title = '', details = '';
    switch(notification.type) {
        case 'shift_modification':
            icon = '✏️'; title = 'Modification de shift';
            details = `<div><strong>Par:</strong> ${notification.createdByName} (${notification.createdByRole})</div><div><strong>Agent:</strong> ${notification.details.agentName} (${notification.details.agentCode})</div><div><strong>Date:</strong> ${notification.details.date}</div><div><strong>Ancien:</strong> ${notification.details.oldValue} → <strong>Nouveau:</strong> ${notification.details.newValue}</div>${notification.details.comment ? `<div><strong>Motif:</strong> ${notification.details.comment}</div>` : ''}`;
            break;
        case 'leave_add':
            icon = '🏖️'; title = 'Ajout de congé';
            details = `<div><strong>Par:</strong> ${notification.createdByName} (${notification.createdByRole})</div><div><strong>Agent:</strong> ${notification.details.agentName} (${notification.details.agentCode})</div><div><strong>Période:</strong> ${notification.details.startDate} → ${notification.details.endDate}</div><div><strong>Type:</strong> ${notification.details.absenceType === 'C' ? 'Congé' : (notification.details.absenceType === 'M' ? 'Maladie' : 'Autre')}</div>${notification.details.joker ? `<div><strong>Remplacé par:</strong> ${notification.details.joker}</div>` : ''}`;
            break;
        case 'leave_delete':
            icon = '🗑️'; title = 'Suppression de congé';
            details = `<div><strong>Par:</strong> ${notification.createdByName} (${notification.createdByRole})</div><div><strong>Agent:</strong> ${notification.details.agentName} (${notification.details.agentCode})</div><div><strong>Période:</strong> ${notification.details.startDate} → ${notification.details.endDate}</div>`;
            break;
        case 'shift_exchange':
            icon = '🔄'; title = 'Échange de shifts';
            details = `<div><strong>Par:</strong> ${notification.createdByName} (${notification.createdByRole})</div><div><strong>Agent 1:</strong> ${notification.details.agent1Name} (${notification.details.agent1Code})</div><div><strong>Agent 2:</strong> ${notification.details.agent2Name} (${notification.details.agent2Code})</div><div><strong>Date 1:</strong> ${notification.details.date1}</div><div><strong>Date 2:</strong> ${notification.details.date2}</div>`;
            break;
        case 'agent_add':
            icon = '➕'; title = 'Ajout d\'agent';
            details = `<div><strong>Par:</strong> ${notification.createdByName} (${notification.createdByRole})</div><div><strong>Agent:</strong> ${notification.details.agentName} (${notification.details.agentCode})</div><div><strong>Groupe:</strong> ${notification.details.groupe}</div>`;
            break;
        case 'agent_update':
            icon = '✏️'; title = 'Modification d\'agent';
            details = `<div><strong>Par:</strong> ${notification.createdByName} (${notification.createdByRole})</div><div><strong>Agent:</strong> ${notification.details.agentName} (${notification.details.agentCode})</div><div><strong>Champ modifié:</strong> ${notification.details.field}</div><div><strong>Ancienne valeur:</strong> ${notification.details.oldValue || 'vide'}</div><div><strong>Nouvelle valeur:</strong> ${notification.details.newValue || 'vide'}</div>`;
            break;
        case 'agent_delete':
            icon = '🗑️'; title = 'Suppression d\'agent';
            details = `<div><strong>Par:</strong> ${notification.createdByName} (${notification.createdByRole})</div><div><strong>Agent:</strong> ${notification.details.agentName} (${notification.details.agentCode})</div>`;
            break;
        case 'panic_add':
            icon = '🚨'; title = 'Code panique';
            details = `<div><strong>Par:</strong> ${notification.createdByName} (${notification.createdByRole})</div><div><strong>Agent:</strong> ${notification.details.agentName} (${notification.details.agentCode})</div><div><strong>Code:</strong> ${notification.details.code}</div>`;
            break;
        case 'uniform_add':
            icon = '👔'; title = 'Habillement';
            details = `<div><strong>Par:</strong> ${notification.createdByName} (${notification.createdByRole})</div><div><strong>Agent:</strong> ${notification.details.agentName} (${notification.details.agentCode})</div><div><strong>Articles:</strong> ${notification.details.articles}</div>`;
            break;
        case 'warning_add':
            icon = '⚠️'; title = 'Avertissement';
            details = `<div><strong>Par:</strong> ${notification.createdByName} (${notification.createdByRole})</div><div><strong>Agent:</strong> ${notification.details.agentName} (${notification.details.agentCode})</div><div><strong>Type:</strong> ${notification.details.warningType}</div><div><strong>Description:</strong> ${notification.details.description}</div>`;
            break;
        default: icon = '🔔'; title = 'Notification'; details = `<div>${JSON.stringify(notification.details)}</div>`;
    }
    if (showFull) {
        return `<div style="background:#34495e; border-radius:8px; padding:12px; margin-bottom:10px; ${unreadStyle}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><div><span style="font-size:1.2rem;">${icon}</span> <strong>${title}</strong></div><span style="font-size:0.8rem; color:#bdc3c7;">${date}</span></div>
            <div style="font-size:0.85rem; margin-bottom:10px;">${details}</div>
            ${isUnread ? `<button class="action-btn small green" onclick="markNotificationAsRead(${notification.id}); return false;">✓ Marquer comme lu</button>` : '<span style="font-size:0.7rem; color:#27ae60;">✓ Lu</span>'}
        </div>`;
    } else {
        return `<div style="padding:12px; border-bottom:1px solid #34495e; cursor:pointer; ${unreadStyle}" onclick="markNotificationAsRead(${notification.id}); showNotificationsPage();">
            <div style="display:flex; justify-content:space-between; align-items:center;"><div><span>${icon}</span> <strong>${title}</strong></div><span style="font-size:0.7rem; color:#bdc3c7;">${date}</span></div>
            <div style="font-size:0.8rem; margin-top:5px; color:#bdc3c7;">${notification.details.agentName || notification.details.agent1Name || ''}</div>
        </div>`;
    }
}
// ==================== PARTIE 21 : GESTION UTILISATEURS ====================

function showUsersManagement() {
    if (currentUser.role !== 'ADMIN') {
        alert("⚠️ Accès réservé à l'administrateur");
        displayMainMenu();
        return;
    }
    let html = `<div class="info-section"><h3>👥 Gestion des Utilisateurs</h3>
        <div style="margin-bottom:20px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="popup-button green" onclick="showAddUserForm()">➕ Ajouter un utilisateur</button>
            <button class="popup-button blue" onclick="createCPAccountsFromAgents()">🔧 Créer comptes CP</button>
        </div>
        <div style="overflow-x:auto;"><table class="classement-table"><thead><tr style="background-color:#34495e;"><th>Utilisateur</th><th>Nom</th><th>Prénom</th><th>Rôle</th><th>Groupe</th><th>Agent lié</th><th>Actions</th></tr></thead>
        <tbody>${users.map(u => {
            const agent = u.agentCode ? agents.find(a => a.code === u.agentCode) : null;
            const roleLabels = { 'ADMIN': '👑 Administrateur', 'CP': '👥 Chef Patrouille', 'AGENT': '👤 Agent' };
            return `<tr style="border-bottom:1px solid #34495e;"><td><strong>${u.username}</strong></td><td>${u.nom}</td><td>${u.prenom}</td>
            <td>${roleLabels[u.role] || u.role}</td><td style="text-align:center;">${u.groupe || '-'}</td>
            <td>${u.agentCode ? `${u.agentCode} (${agent ? agent.nom : '?'})` : '-'}</td>
            <td style="white-space:nowrap;"><button class="action-btn small blue" onclick="editUser(${u.id})" title="Modifier">✏️</button>
            <button class="action-btn small orange" onclick="resetUserPassword(${u.id})" title="Réinitialiser mot de passe">🔑</button>
            ${u.username !== 'admin' ? `<button class="action-btn small red" onclick="deleteUser(${u.id})" title="Supprimer">🗑️</button>` : ''}</td></tr>`;
        }).join('')}</tbody></table></div>
        <button class="popup-button gray" onclick="displayMainMenu()" style="margin-top:15px;">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showAddUserForm() {
    const agentsList = agents.filter(a => a.statut === 'actif');
    const html = `<div class="info-section"><h3>➕ Ajouter un utilisateur</h3>
        <div class="form-group"><label>Nom d'utilisateur *</label><input type="text" id="newUsername" class="form-input" placeholder="ex: agent_a001"></div>
        <div class="form-group"><label>Mot de passe *</label><input type="password" id="newPassword" class="form-input" placeholder="Minimum 4 caractères"></div>
        <div class="form-group"><label>Nom</label><input type="text" id="newUserNom" class="form-input"></div>
        <div class="form-group"><label>Prénom</label><input type="text" id="newUserPrenom" class="form-input"></div>
        <div class="form-group"><label>Rôle *</label><select id="newUserRole" class="form-input" onchange="toggleUserRoleFields()">
            <option value="ADMIN">👑 Administrateur</option><option value="CP">👥 Chef de Patrouille</option><option value="AGENT">👤 Agent</option></select></div>
        <div id="userGroupField" style="display:none;"><div class="form-group"><label>Groupe</label><select id="newUserGroup" class="form-input"><option value="A">Groupe A</option><option value="B">Groupe B</option><option value="C">Groupe C</option><option value="D">Groupe D</option><option value="E">Groupe E</option></select></div></div>
        <div id="userAgentField" style="display:none;"><div class="form-group"><label>Agent lié</label><select id="newUserAgent" class="form-input"><option value="">-- Sélectionner un agent --</option>${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom} (Groupe ${a.groupe})</option>`).join('')}</select></div></div>
        <button class="popup-button green" onclick="addUser()">💾 Créer</button>
        <button class="popup-button gray" onclick="showUsersManagement()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function toggleUserRoleFields() {
    const role = document.getElementById('newUserRole').value;
    document.getElementById('userGroupField').style.display = role === 'CP' ? 'block' : 'none';
    document.getElementById('userAgentField').style.display = role === 'AGENT' ? 'block' : 'none';
}

function addUser() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const nom = document.getElementById('newUserNom').value;
    const prenom = document.getElementById('newUserPrenom').value;
    const role = document.getElementById('newUserRole').value;
    if (!username || !password) { alert("⚠️ Nom d'utilisateur et mot de passe requis"); return; }
    if (password.length < 4) { alert("⚠️ Le mot de passe doit contenir au moins 4 caractères"); return; }
    if (users.find(u => u.username === username)) { alert("⚠️ Ce nom d'utilisateur existe déjà"); return; }
    const newUser = { id: Date.now(), username, password, role, nom: nom || username, prenom: prenom || '', groupe: null, agentCode: null };
    if (role === 'CP') { newUser.groupe = document.getElementById('newUserGroup').value; } 
    else if (role === 'AGENT') {
        newUser.agentCode = document.getElementById('newUserAgent').value;
        const agent = agents.find(a => a.code === newUser.agentCode);
        if (agent) { newUser.nom = agent.nom; newUser.prenom = agent.prenom; }
    }
    users.push(newUser);
    saveData();
    alert(`✅ Utilisateur ${username} créé avec succès`);
    showUsersManagement();
}

function editUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const agentsList = agents.filter(a => a.statut === 'actif');
    const html = `<div class="info-section"><h3>✏️ Modifier l'utilisateur ${user.username}</h3>
        <div class="form-group"><label>Nom</label><input type="text" id="editUserNom" value="${user.nom}" class="form-input"></div>
        <div class="form-group"><label>Prénom</label><input type="text" id="editUserPrenom" value="${user.prenom}" class="form-input"></div>
        <div class="form-group"><label>Rôle</label><select id="editUserRole" class="form-input" onchange="toggleEditUserRoleFields()">
            <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>👑 Administrateur</option>
            <option value="CP" ${user.role === 'CP' ? 'selected' : ''}>👥 Chef de Patrouille</option>
            <option value="AGENT" ${user.role === 'AGENT' ? 'selected' : ''}>👤 Agent</option></select></div>
        <div id="editUserGroupField" style="display:${user.role === 'CP' ? 'block' : 'none'};"><div class="form-group"><label>Groupe</label><select id="editUserGroup" class="form-input"><option value="A" ${user.groupe === 'A' ? 'selected' : ''}>Groupe A</option><option value="B" ${user.groupe === 'B' ? 'selected' : ''}>Groupe B</option><option value="C" ${user.groupe === 'C' ? 'selected' : ''}>Groupe C</option><option value="D" ${user.groupe === 'D' ? 'selected' : ''}>Groupe D</option><option value="E" ${user.groupe === 'E' ? 'selected' : ''}>Groupe E</option></select></div></div>
        <div id="editUserAgentField" style="display:${user.role === 'AGENT' ? 'block' : 'none'};"><div class="form-group"><label>Agent lié</label><select id="editUserAgent" class="form-input"><option value="">-- Aucun --</option>${agentsList.map(a => `<option value="${a.code}" ${user.agentCode === a.code ? 'selected' : ''}>${a.code} - ${a.nom} ${a.prenom}</option>`).join('')}</select></div></div>
        <button class="popup-button green" onclick="updateUser(${id})">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="showUsersManagement()">Annuler</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function toggleEditUserRoleFields() {
    const role = document.getElementById('editUserRole').value;
    document.getElementById('editUserGroupField').style.display = role === 'CP' ? 'block' : 'none';
    document.getElementById('editUserAgentField').style.display = role === 'AGENT' ? 'block' : 'none';
}

function updateUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    user.nom = document.getElementById('editUserNom').value;
    user.prenom = document.getElementById('editUserPrenom').value;
    user.role = document.getElementById('editUserRole').value;
    if (user.role === 'CP') { user.groupe = document.getElementById('editUserGroup').value; user.agentCode = null; } 
    else if (user.role === 'AGENT') {
        user.agentCode = document.getElementById('editUserAgent').value;
        user.groupe = null;
        const agent = agents.find(a => a.code === user.agentCode);
        if (agent && (!user.nom || user.nom === user.username)) { user.nom = agent.nom; user.prenom = agent.prenom; }
    } else { user.groupe = null; user.agentCode = null; }
    saveData();
    alert(`✅ Utilisateur ${user.username} modifié`);
    showUsersManagement();
}

function deleteUser(id) {
    if (!checkPassword("Suppression d'utilisateur")) return;
    const user = users.find(u => u.id === id);
    if (!user) return;
    if (user.username === 'admin') { alert("⚠️ Impossible de supprimer l'administrateur principal"); return; }
    if (user.id === currentUser.id) { alert("⚠️ Vous ne pouvez pas supprimer votre propre compte"); return; }
    if (confirm(`Supprimer définitivement l'utilisateur ${user.username} ?`)) {
        users = users.filter(u => u.id !== id);
        saveData();
        alert("✅ Utilisateur supprimé");
        showUsersManagement();
    }
}

function resetUserPassword(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newPassword = prompt(`Nouveau mot de passe pour ${user.username} :\n(minimum 4 caractères)`);
    if (newPassword && newPassword.length >= 4) {
        user.password = newPassword;
        if (currentUser.id === id) currentUser.password = newPassword;
        saveData();
        alert(`✅ Mot de passe de ${user.username} modifié avec succès`);
        showUsersManagement();
    } else if (newPassword) { alert("❌ Le mot de passe doit contenir au moins 4 caractères"); }
}
// ==================== PARTIE 23 : GESTION DES SOLDES DE CONGÉS ====================

/**
 * Calcule l'ancienneté en années (décimale) à partir de la date d'entrée
 */
function calculerAnciennete(agent, dateRef = new Date()) {
    if (!agent || !agent.date_entree) return 0;
    const entry = new Date(agent.date_entree);
    const diff = dateRef - entry;
    return diff / (1000 * 3600 * 24 * 365.25);
}


/**
 * Acquis mensuel = droit annuel / 12, arrondi à 0.5 près
 */
function getAcquisMensuel(agent) {
    let acquis = getDroitAnnuel(agent) / 12;
    // Arrondi à 0.5 (ex: 1.583 -> 1.5, 1.625 -> 2)
    return Math.round(acquis * 2) / 2;
}

/**
 * Récupère le nombre de jours de congés (C) déjà saisis dans le planning pour un agent, un mois et une année donnés.
 * (Seuls les "C" sont comptés ; les M/A ne sont pas des congés)
 */
function getJoursPrisDepuisPlanning(agentCode, annee, mois) {
    let jours = 0;
    const daysInMonth = new Date(annee, mois, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${annee}-${mois.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
        const shift = getShiftForAgent(agentCode, dateStr);
        if (shift === 'C') jours++;
    }
    return jours;
}

/**
 * Initialise ou met à jour les soldes d'un agent pour une année donnée.
 * Calcule les acquis, cumule les congés pris (planning + saisie manuelle).
 */
function mettreAJourSoldeAgent(agentCode, annee) {
    const agent = agents.find(a => a.code === agentCode);
    if (!agent) return;

    for (let mois = 1; mois <= 12; mois++) {
        const acquisMensuel = getAcquisMensuel(agent);
        // Congés pris via le planning (uniquement les 'C')
        let prisPlanning = getJoursPrisDepuisPlanning(agentCode, annee, mois);
        
        // Vérifier s'il existe une saisie manuelle dans soldeConges
        let existant = soldeConges.find(s => s.agentCode === agentCode && s.annee === annee && s.mois === mois);
        let prisManuel = existant ? existant.pris : 0;
        
        // Total pris = max entre planning et manuel (l'utilisateur peut surcharger via l'interface)
        let totalPris = Math.max(prisPlanning, prisManuel);
        
        if (!existant) {
            soldeConges.push({
                agentCode,
                annee,
                mois,
                acquis: acquisMensuel,
                pris: totalPris,
                commentaire: ''
            });
        } else {
            existant.acquis = acquisMensuel;
            existant.pris = totalPris;
        }
    }
    
    // Recalculer les cumuls (cumul = somme (acquis - pris) depuis janvier)
    let cumul = 0;
    for (let mois = 1; mois <= 12; mois++) {
        let item = soldeConges.find(s => s.agentCode === agentCode && s.annee === annee && s.mois === mois);
        if (item) {
            cumul += (item.acquis - item.pris);
            item.cumul = parseFloat(cumul.toFixed(2));
            item.reste = item.cumul;
        }
    }
    saveData();
}

/**
 * Affiche le menu principal des soldes de congés
 */
function showSoldeMenu() {
    if (currentUser.role === 'AGENT') {
        // Un agent voit directement son propre solde
        const agent = agents.find(a => a.code === currentUser.agentCode);
        if (agent) afficherSoldeAgent(agent.code, new Date().getFullYear());
        else alert("Agent non trouvé");
        return;
    }
    
    let buttons = [
        { text: "👤 Par agent", onclick: "showSoldeAgentForm()" },
        { text: "📊 Par groupe", onclick: "showSoldeGroupeForm()" },
        { text: "📈 Statistiques globales", onclick: "showSoldeStats()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ];
    displaySubMenu("📆 GESTION DES SOLDES DE CONGÉS", buttons);
}

/**
 * Formulaire de sélection d'un agent
 */
function showSoldeAgentForm() {
    let agentsList = getFilteredAgents();
    const currentYear = new Date().getFullYear();
    const html = `<div class="info-section"><h3>👤 Solde de congés par agent</h3>
        <div class="form-group"><label>🔍 Rechercher agent</label><input type="text" id="searchSoldeAgent" placeholder="Tapez pour rechercher..." class="form-input" onkeyup="filterSoldeAgentList()"></div>
        <div class="form-group"><label>Agent</label><select id="soldeAgentSelect" size="5" class="form-input" style="height:auto">${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom}</option>`).join('')}</select></div>
        <div class="form-group"><label>Année</label><input type="number" id="soldeAnnee" class="form-input" value="${currentYear}"></div>
        <button class="popup-button green" onclick="afficherSoldeAgent(document.getElementById('soldeAgentSelect').value, parseInt(document.getElementById('soldeAnnee').value))">📋 Afficher</button>
        <button class="popup-button gray" onclick="showSoldeMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function filterSoldeAgentList() {
    const term = document.getElementById('searchSoldeAgent').value.toLowerCase();
    const select = document.getElementById('soldeAgentSelect');
    Array.from(select.options).forEach(opt => {
        opt.style.display = opt.text.toLowerCase().includes(term) ? '' : 'none';
    });
}

/**
 * Affiche le tableau mois par mois du solde pour un agent
 */
function afficherSoldeAgent(agentCode, annee) {
    if (!agentCode) { alert("Sélectionnez un agent"); return; }
    if (!canAccessAgent(agentCode)) { alert("Accès non autorisé"); return; }
    
    const agent = agents.find(a => a.code === agentCode);
    if (!agent) { alert("Agent introuvable"); return; }
    
    // S'assurer que les données sont à jour
    mettreAJourSoldeAgent(agentCode, annee);
    
    const droits = getDroitAnnuel(agent);
    const acquisMensuel = getAcquisMensuel(agent);
    
    let rows = '';
    let totalAcquis = 0, totalPris = 0, totalCumul = 0;
    
    for (let mois = 1; mois <= 12; mois++) {
        const solde = soldeConges.find(s => s.agentCode === agentCode && s.annee === annee && s.mois === mois);
        if (solde) {
            totalAcquis += solde.acquis;
            totalPris += solde.pris;
            totalCumul = solde.cumul;
            rows += `<tr>
                <td>${MOIS_FRANCAIS[mois-1]}</td>
                <td style="text-align:center">${solde.acquis.toFixed(2)}</td>
                <td style="text-align:center"><input type="number" step="0.5" value="${solde.pris}" id="pris_${mois}" style="width:70px; text-align:center" class="form-input" onchange="mettreAJourPrisManuel('${agentCode}', ${annee}, ${mois}, this.value)"></td>
                <td style="text-align:center; font-weight:bold">${solde.cumul.toFixed(2)}</td>
                <td style="text-align:center; font-weight:bold; color:#f39c12">${solde.reste.toFixed(2)}</td>
            </tr>`;
        } else {
            rows += `<tr><td>${MOIS_FRANCAIS[mois-1]}</td><td colspan="4" style="text-align:center">Données non disponibles</td></tr>`;
        }
    }
    function getJoursPrisDansAnnee(agentCode, annee) {
    let total = 0;
    const anneeActuelle = new Date().getFullYear();
    const moisActuel = new Date().getMonth() + 1;
    const moisMax = (annee === anneeActuelle) ? moisActuel : 12;
    
    for (let mois = 1; mois <= moisMax; mois++) {
        const daysInMonth = new Date(annee, mois, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${annee}-${mois.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
            const shift = getShiftForAgent(agentCode, dateStr);
            if (shift === 'C') total++;
        }
    }
    return total;
}
    // Annuel récapitulatif
    const totalReste = totalCumul; // dernier cumul = reste à fin d'année
    
    const html = `<div class="info-section">
        <h3>📆 Solde des congés - ${agent.nom} ${agent.prenom} (${agent.code})</h3>
        <p><strong>Ancienneté :</strong> ${calculerAnciennete(agent).toFixed(1)} ans → <strong>Droit annuel : ${droits} jours</strong> (${acquisMensuel.toFixed(2)} jours/mois)</p>
        <div style="overflow-x:auto">
            <table class="classement-table" style="width:100%">
                <thead><tr style="background-color:#34495e">
                    <th>Mois</th><th>Acquis</th><th>Pris (modifiable)</th><th>Cumul</th><th>Reste</th>
                </tr></thead>
                <tbody>${rows}</tbody>
                <tfoot style="background:#2c3e50">
                    <tr><td><strong>Annuel</strong></td>
                        <td style="text-align:center"><strong>${totalAcquis.toFixed(2)}</strong></td>
                        <td style="text-align:center"><strong>${totalPris.toFixed(2)}</strong></td>
                        <td style="text-align:center"><strong>${totalCumul.toFixed(2)}</strong></td>
                        <td style="text-align:center"><strong style="color:#f1c40f">${totalReste.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <button class="popup-button gray" onclick="showSoldeMenu()" style="margin-top:15px;">↩️ Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

/**
 * Sauvegarde la valeur saisie manuellement pour un mois donné
 */
function mettreAJourPrisManuel(agentCode, annee, mois, valeur) {
    let pris = parseFloat(valeur);
    if (isNaN(pris)) pris = 0;
    
    let existant = soldeConges.find(s => s.agentCode === agentCode && s.annee === annee && s.mois === mois);
    if (existant) {
        existant.pris = pris;
    } else {
        soldeConges.push({ agentCode, annee, mois, acquis: getAcquisMensuel(agents.find(a => a.code === agentCode)), pris, commentaire: '' });
    }
    
    // Recalcul des cumuls pour l'année
    let cumul = 0;
    for (let m = 1; m <= 12; m++) {
        let item = soldeConges.find(s => s.agentCode === agentCode && s.annee === annee && s.mois === m);
        if (item) {
            cumul += (item.acquis - item.pris);
            item.cumul = parseFloat(cumul.toFixed(2));
            item.reste = item.cumul;
        }
    }
    saveData();
    // Rafraîchir l'affichage
    afficherSoldeAgent(agentCode, annee);
}

/**
 * Affichage par groupe (CP ou Admin)
 */
function showSoldeGroupeForm() {
    let groupes = ['A','B','C','D','E','J'];
    if (currentUser.role === 'CP') groupes = [currentUser.groupe];
    const currentYear = new Date().getFullYear();
    const html = `<div class="info-section"><h3>📊 Soldes de congés par groupe</h3>
        <div class="form-group"><label>Groupe</label><select id="groupeSoldeSelect" class="form-input">${groupes.map(g => `<option value="${g}">Groupe ${g}</option>`).join('')}</select></div>
        <div class="form-group"><label>Année</label><input type="number" id="groupeSoldeAnnee" class="form-input" value="${currentYear}"></div>
        <button class="popup-button green" onclick="afficherSoldeGroupe()">📋 Afficher</button>
        <button class="popup-button gray" onclick="showSoldeMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function afficherSoldeGroupe() {
    const groupe = document.getElementById('groupeSoldeSelect').value;
    const annee = parseInt(document.getElementById('groupeSoldeAnnee').value);
    if (!canAccessGroup(groupe)) { alert("Accès non autorisé à ce groupe"); return; }
    
    const agentsGroupe = agents.filter(a => a.groupe === groupe && a.statut === 'actif');
    if (!agentsGroupe.length) { alert("Aucun agent actif dans ce groupe"); return; }
    
    // Mettre à jour tous les soldes
    agentsGroupe.forEach(agent => mettreAJourSoldeAgent(agent.code, annee));
    
    let rows = '';
    agentsGroupe.forEach(agent => {
        const dernierSolde = soldeConges.filter(s => s.agentCode === agent.code && s.annee === annee).sort((a,b) => b.mois - a.mois)[0];
        const reste = dernierSolde ? dernierSolde.reste : 0;
        rows += `<tr>
            <td>${agent.code}</td>
            <td>${agent.nom} ${agent.prenom}</td>
            <td style="text-align:center">${getDroitAnnuel(agent)}</td>
            <td style="text-align:center; font-weight:bold; color:#f39c12">${reste.toFixed(2)}</td>
         </tr>`;
    });
    
    const html = `<div class="info-section"><h3>📊 Soldes de congés - Groupe ${groupe} (année ${annee})</h3>
        <div style="overflow-x:auto"><table class="classement-table"><thead><tr style="background-color:#34495e"><th>Code</th><th>Agent</th><th>Droit annuel <span style="font-size:0.7rem;">(prorata pour année en cours)</span></th></thead>
        <tbody>${rows}</tbody></table></div>
        <button class="popup-button gray" onclick="showSoldeMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

/**
 * Statistiques globales
 */
function showSoldeStats() {
    const annee = new Date().getFullYear();
    const agentsActifs = getFilteredAgents();
    let totalDroits = 0, totalRestes = 0;
    agentsActifs.forEach(agent => {
        mettreAJourSoldeAgent(agent.code, annee);
        const dernier = soldeConges.filter(s => s.agentCode === agent.code && s.annee === annee).sort((a,b) => b.mois - a.mois)[0];
        if (dernier) {
            totalDroits += getDroitAnnuel(agent);
            totalRestes += dernier.reste;
        }
    });
    const html = `<div class="info-section"><h3>📈 Statistiques globales des soldes (${annee})</h3>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-value">${agentsActifs.length}</div><div>Agents actifs</div></div>
            <div class="stat-card"><div class="stat-value">${totalDroits.toFixed(1)}</div><div>Droits totaux (jours)</div></div>
            <div class="stat-card"><div class="stat-value">${totalRestes.toFixed(1)}</div><div>Jours restants cumulés</div></div>
        </div>
        <button class="popup-button gray" onclick="showSoldeMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}
// ==================== PARTIE 24 : SOLDES CONGÉS AVEC REPORT ANNUEL ====================

/**
 * Retourne le droit annuel selon l'ancienneté au 1er janvier d'une année donnée
 * @param {object} agent - l'agent
 * @param {number} annee - année considérée (ex: 2021)
 * @returns {number} droit en jours (18, 19.5, 21, 22.5)
 */
function getDroitAnnuelPourAnnee(agent, annee) {
    if (!agent || !agent.date_entree) return 18;
    const dateEntree = new Date(agent.date_entree);
    const premierJanvier = new Date(annee, 0, 1);
    const ancienneteAnnees = (premierJanvier - dateEntree) / (365.25 * 24 * 3600 * 1000);
    
    let droitComplet = 18;
    if (ancienneteAnnees >= 0.5 && ancienneteAnnees < 5) droitComplet = 18;
    else if (ancienneteAnnees >= 5 && ancienneteAnnees < 10) droitComplet = 19.5;
    else if (ancienneteAnnees >= 10 && ancienneteAnnees < 15) droitComplet = 21;
    else if (ancienneteAnnees >= 15 && ancienneteAnnees < 20) droitComplet = 22.5;
    
    const anneeActuelle = new Date().getFullYear();
    const moisActuel = new Date().getMonth() + 1; // 1-12
    
    if (annee === anneeActuelle) {
        // Prorata : (droitComplet / 12) * moisActuel
        const prorata = (droitComplet / 12) * moisActuel;
        return Math.round(prorata * 2) / 2; // arrondi à 0.5
    }
    return droitComplet;
}

/**
 * Compte les jours de congés (shift === 'C') pris par un agent pendant une année donnée
 */


/**
 * Recalcule les soldes d’un agent depuis son année d’entrée (ou depuis 2010) jusqu’à l’année courante.
 * Met à jour ou crée les entrées dans soldesConges.
 * Le report antérieur = reste de l’année précédente.
 */
function recalculerSoldesAgent(agentCode) {
    const agent = agents.find(a => a.code === agentCode);
    if (!agent || !agent.date_entree) return;
    
    const anneeEntree = new Date(agent.date_entree).getFullYear();
    const anneeActuelle = new Date().getFullYear();
    let reportPrecedent = 0;
    
    for (let annee = anneeEntree; annee <= anneeActuelle; annee++) {
        const droit = getDroitAnnuelPourAnnee(agent, annee);
        const prisPlanning = getJoursPrisDansAnnee(agentCode, annee);
        
        // Chercher si une saisie manuelle existe déjà (pour conserver un éventuel ajustement)
        let existant = soldesConges.find(s => s.agentCode === agentCode && s.annee === annee);
        let pris = existant ? existant.pris : prisPlanning;
        
        const totalDispo = droit + reportPrecedent;
        const reste = Math.max(0, totalDispo - pris);  // pas de solde négatif
        
        if (!existant) {
            soldesConges.push({
                agentCode,
                annee,
                droitAnnuel: droit,
                reportAnt: reportPrecedent,
                totalDispo: totalDispo,
                pris: pris,
                reste: reste
            });
        } else {
            existant.droitAnnuel = droit;
            existant.reportAnt = reportPrecedent;
            existant.totalDispo = totalDispo;
            existant.pris = pris;
            existant.reste = reste;
        }
        
        reportPrecedent = reste; // pour l’année suivante
    }
    saveData();
}

/**
 * Met à jour manuellement le nombre de jours pris pour une année donnée
 * et relance le recalcule pour les années suivantes.
 */
function setPrisManuel(agentCode, annee, nouvelleValeur) {
    let pris = parseFloat(nouvelleValeur);
    if (isNaN(pris)) pris = 0;
    
    let existant = soldesConges.find(s => s.agentCode === agentCode && s.annee === annee);
    if (existant) {
        existant.pris = pris;
    } else {
        // Cas improbable car recalculerSoldesAgent aura créé l’entrée
        recalculerSoldesAgent(agentCode);
        existant = soldesConges.find(s => s.agentCode === agentCode && s.annee === annee);
        if (existant) existant.pris = pris;
    }
    
    // Recalculer toutes les années à partir de celle-ci
    const agent = agents.find(a => a.code === agentCode);
    if (!agent) return;
    const anneeEntree = new Date(agent.date_entree).getFullYear();
    const anneeActuelle = new Date().getFullYear();
    let reportPrecedent = 0;
    
    for (let y = anneeEntree; y <= anneeActuelle; y++) {
        let s = soldesConges.find(s => s.agentCode === agentCode && s.annee === y);
        if (!s) continue;
        const droit = getDroitAnnuelPourAnnee(agent, y);
        const totalDispo = droit + reportPrecedent;
        const reste = Math.max(0, totalDispo - s.pris);
        s.droitAnnuel = droit;
        s.reportAnt = reportPrecedent;
        s.totalDispo = totalDispo;
        s.reste = reste;
        reportPrecedent = reste;
    }
    saveData();
}

/**
 * Affiche le tableau des soldes pour un agent (interface)
 */
function afficherSoldesAgent(agentCode, anneeDebut = null, anneeFin = null) {
    if (!agentCode) return;
    const agent = agents.find(a => a.code === agentCode);
    if (!agent) { alert("Agent introuvable"); return; }
    if (!canAccessAgent(agentCode)) { alert("Accès non autorisé"); return; }
    
    recalculerSoldesAgent(agentCode);
    
    let annees = [...new Set(soldesConges.filter(s => s.agentCode === agentCode).map(s => s.annee))].sort();
    if (anneeDebut) annees = annees.filter(a => a >= anneeDebut);
    if (anneeFin) annees = annees.filter(a => a <= anneeFin);
    
    let rows = '';
    let totalDroits = 0, totalReports = 0, totalDispo = 0, totalPris = 0, totalRestes = 0;
    
    for (const annee of annees) {
        const solde = soldesConges.find(s => s.agentCode === agentCode && s.annee === annee);
        if (!solde) continue;
        
        totalDroits += solde.droitAnnuel;
        totalReports += solde.reportAnt;
        totalDispo += solde.totalDispo;
        totalPris += solde.pris;
        totalRestes += solde.reste;
        
        rows += `
            <tr style="border-bottom:1px solid #34495e">
                <td style="text-align:center; padding:8px;"><strong>${annee}</strong></td>
                <td style="text-align:center; padding:8px;">${solde.droitAnnuel.toFixed(2)}</td>
                <td style="text-align:center; padding:8px;">${solde.reportAnt.toFixed(2)}</td>
                <td style="text-align:center; padding:8px;">${solde.totalDispo.toFixed(2)}</td>
                <td style="text-align:center; padding:8px;">
                    <input type="number" step="0.5" value="${solde.pris}" style="width:80px; text-align:center" class="form-input"
                           onchange="setPrisManuel('${agentCode}', ${annee}, this.value); afficherSoldesAgent('${agentCode}')">
                </td>
                <td style="text-align:center; padding:8px; font-weight:bold; color:#f39c12;">${solde.reste.toFixed(2)}</td>
                <td style="text-align:center; padding:8px;">
                    <button class="action-btn small blue" onclick="afficherDetailMensuelConges('${agentCode}', ${annee})">📅 Détail mensuel</button>
                </td>
            </tr>
        `;
    }
    
    const html = `
        <div class="info-section">
            <h3>📆 Solde des congés - ${agent.nom} ${agent.prenom} (${agent.code})</h3>
            <p><strong>Date d’entrée :</strong> ${agent.date_entree || "non renseignée"} – Ancienneté : ${calculerAnciennete(agent).toFixed(1)} ans</p>
            <div style="overflow-x:auto">
                <table class="classement-table" style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background-color:#34495e;">
                            <th>Année</th>
                            <th>Droit annuel</th>
                            <th>Report antérieur</th>
                            <th>Total dispo</th>
                            <th>Pris (modifiable)</th>
                            <th>Reste (report)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                    <tfoot style="background:#2c3e50;">
                        <tr>
                            <td style="text-align:center; font-weight:bold;">TOTAL</td>
                            <td style="text-align:center; font-weight:bold;">${totalDroits.toFixed(2)}</td>
                            <td style="text-align:center; font-weight:bold;">${totalReports.toFixed(2)}</td>
                            <td style="text-align:center; font-weight:bold;">${totalDispo.toFixed(2)}</td>
                            <td style="text-align:center; font-weight:bold;">${totalPris.toFixed(2)}</td>
                            <td style="text-align:center; font-weight:bold; color:#f1c40f;">${totalRestes.toFixed(2)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <button class="popup-button gray" onclick="showSoldeMenu()" style="margin-top:15px;">↩️ Retour</button>
        </div>
    `;
    document.getElementById('main-content').innerHTML = html;
}
// ==================== DÉTAIL MENSUEL DES CONGÉS ====================

/**
 * Affiche pour chaque mois d’une année la liste des dates où l’agent a posé un congé (C)
 * @param {string} agentCode - Code de l’agent
 * @param {number} annee - Année à afficher
 */
function afficherDetailMensuelConges(agentCode, annee) {
    const agent = agents.find(a => a.code === agentCode);
    if (!agent) { alert("Agent introuvable"); return; }
    if (!canAccessAgent(agentCode)) { alert("Accès non autorisé"); return; }
    
    const anneeActuelle = new Date().getFullYear();
    const moisActuel = new Date().getMonth() + 1;
    const moisMax = (annee === anneeActuelle) ? moisActuel : 12;
    
    // Tableau des mois (pour garantir l'ordre)
    const moisListe = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    
    let rows = '';
    let totalAnnees = 0;
    
    for (let mois = 1; mois <= moisMax; mois++) {
        const joursConges = [];
        const daysInMonth = new Date(annee, mois, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${annee}-${mois.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
            const shift = getShiftForAgent(agentCode, dateStr);
            if (shift === 'C') {
                joursConges.push(d);
                totalAnnees++;
            }
        }
        const affichageJours = joursConges.length ? joursConges.join(', ') : 'Aucun';
        rows += `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #34495e; font-weight: bold;">${moisListe[mois-1]}</td>
                <td style="padding: 8px; border-bottom: 1px solid #34495e;">${affichageJours}</td>
                <td style="padding: 8px; border-bottom: 1px solid #34495e; text-align: center;">
                    <button class="action-btn small green" onclick="ajouterJourConge('${agentCode}', ${annee}, ${mois})" style="margin-right: 5px;">➕</button>
                    <button class="action-btn small red" onclick="supprimerUnJourConge('${agentCode}', ${annee}, ${mois})">🗑️</button>
                </td>
            </tr>
        `;
    }
    
    const html = `
        <div class="info-section">
            <h3>📅 Détail mensuel des congés - ${agent.nom} ${agent.prenom} (${agent.code}) - Année ${annee}</h3>
            <p><strong>Total des jours de congés en ${annee} :</strong> ${totalAnnees}</p>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; background-color: #2c3e50; color: #ecf0f1;">
                    <thead>
                        <tr style="background-color: #34495e;">
                            <th style="padding: 10px; text-align: left;">Mois</th>
                            <th style="padding: 10px; text-align: left;">Dates des congés (C)</th>
                            <th style="padding: 10px; text-align: center;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 15px;">
                <button class="popup-button gray" onclick="afficherSoldesAgent('${agentCode}')">↩️ Retour au tableau annuel</button>
                <button class="popup-button gray" onclick="showSoldeMenu()">↩️ Retour menu soldes</button>
            </div>
        </div>
    `;
    document.getElementById('main-content').innerHTML = html;
}

/**
 * Ouvre une boîte de dialogue pour ajouter un jour de congé dans un mois donné
 * (modifie le planning et recalcule les soldes)
 */
function ajouterJourConge(agentCode, annee, mois) {
    const joursDansMois = new Date(annee, mois, 0).getDate();
    const jour = prompt(`Ajouter un jour de congé pour ${MOIS_FRANCAIS[mois-1]} ${annee}\nEntrez le numéro du jour (1-${joursDansMois}) :`);
    if (!jour) return;
    const jourNum = parseInt(jour);
    if (isNaN(jourNum) || jourNum < 1 || jourNum > joursDansMois) {
        alert("Jour invalide");
        return;
    }
    const dateStr = `${annee}-${mois.toString().padStart(2,'0')}-${jourNum.toString().padStart(2,'0')}`;
    const monthKey = dateStr.substring(0,7);
    if (!planningData[monthKey]) planningData[monthKey] = {};
    if (!planningData[monthKey][agentCode]) planningData[monthKey][agentCode] = {};
    planningData[monthKey][agentCode][dateStr] = { shift: 'C', type: 'congé', comment: 'Ajout manuel' };
    saveData();
    recalculerSoldesAgent(agentCode);
    alert(`✅ Congé ajouté le ${dateStr}`);
    afficherDetailMensuelConges(agentCode, annee);
}

/**
 * Permet de supprimer un jour de congé (enlève l’entrée du planning)
 */
function supprimerUnJourConge(agentCode, annee, mois) {
    const joursDansMois = new Date(annee, mois, 0).getDate();
    const jour = prompt(`Supprimer un jour de congé pour ${MOIS_FRANCAIS[mois-1]} ${annee}\nEntrez le numéro du jour (1-${joursDansMois}) :`);
    if (!jour) return;
    const jourNum = parseInt(jour);
    if (isNaN(jourNum) || jourNum < 1 || jourNum > joursDansMois) {
        alert("Jour invalide");
        return;
    }
    const dateStr = `${annee}-${mois.toString().padStart(2,'0')}-${jourNum.toString().padStart(2,'0')}`;
    const monthKey = dateStr.substring(0,7);
    if (planningData[monthKey]?.[agentCode]?.[dateStr]) {
        const shiftActuel = planningData[monthKey][agentCode][dateStr].shift;
        if (shiftActuel === 'C') {
            delete planningData[monthKey][agentCode][dateStr];
            saveData();
            recalculerSoldesAgent(agentCode);
            alert(`✅ Congé supprimé le ${dateStr}`);
            afficherDetailMensuelConges(agentCode, annee);
        } else {
            alert(`Ce jour n'est pas un congé (shift ${shiftActuel}). Suppression annulée.`);
        }
    } else {
        alert("Aucun congé trouvé pour cette date.");
    }
}

// Helper ancienneté (déjà utilisé)
function calculerAnciennete(agent, dateRef = new Date()) {
    if (!agent || !agent.date_entree) return 0;
    const entry = new Date(agent.date_entree);
    return (dateRef - entry) / (365.25 * 24 * 3600 * 1000);
}

/**
 * Menu général des soldes
 */
function showSoldeMenu() {
    if (currentUser.role === 'AGENT') {
        const agent = agents.find(a => a.code === currentUser.agentCode);
        if (agent) afficherSoldesAgent(agent.code);
        else alert("Agent non trouvé");
        return;
    }
    
    let buttons = [
        { text: "👤 Par agent", onclick: "showSoldeAgentForm()" },
        { text: "📊 Par groupe", onclick: "showSoldeGroupeForm()" },
        { text: "📈 Statistiques globales", onclick: "showSoldeStats()" },
        { text: "↩️ Retour", onclick: "displayMainMenu()", className: "back-button" }
    ];
    displaySubMenu("📆 GESTION DES SOLDES DE CONGÉS", buttons);
}

function showSoldeAgentForm() {
    let agentsList = getFilteredAgents();
    const html = `<div class="info-section"><h3>👤 Soldes de congés par agent</h3>
        <div class="form-group"><label>🔍 Rechercher agent</label><input type="text" id="searchSoldeAgent" placeholder="Tapez pour rechercher..." class="form-input" onkeyup="filterSoldeAgentList()"></div>
        <div class="form-group"><label>Agent</label><select id="soldeAgentSelect" size="5" class="form-input" style="height:auto">${agentsList.map(a => `<option value="${a.code}">${a.code} - ${a.nom} ${a.prenom}</option>`).join('')}</select></div>
        <button class="popup-button green" onclick="afficherSoldesAgent(document.getElementById('soldeAgentSelect').value)">📋 Afficher</button>
        <button class="popup-button gray" onclick="showSoldeMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function filterSoldeAgentList() {
    const term = document.getElementById('searchSoldeAgent')?.value.toLowerCase() || '';
    const select = document.getElementById('soldeAgentSelect');
    if (!select) return;
    Array.from(select.options).forEach(opt => {
        opt.style.display = opt.text.toLowerCase().includes(term) ? '' : 'none';
    });
}

function showSoldeGroupeForm() {
    let groupes = ['A','B','C','D','E','J'];
    if (currentUser.role === 'CP') groupes = [currentUser.groupe];
    const html = `<div class="info-section"><h3>📊 Soldes de congés par groupe</h3>
        <div class="form-group"><label>Groupe</label><select id="groupeSoldeSelect" class="form-input">${groupes.map(g => `<option value="${g}">Groupe ${g}</option>`).join('')}</select></div>
        <div class="form-group"><label>Année (optionnelle)</label><input type="number" id="groupeSoldeAnnee" placeholder="Toutes les années" class="form-input"></div>
        <button class="popup-button green" onclick="afficherSoldesGroupe()">📋 Afficher</button>
        <button class="popup-button gray" onclick="showSoldeMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function afficherSoldesGroupe() {
    const groupe = document.getElementById('groupeSoldeSelect').value;
    const annee = document.getElementById('groupeSoldeAnnee').value;
    if (!canAccessGroup(groupe)) { alert("Accès non autorisé"); return; }
    const agentsGroupe = agents.filter(a => a.groupe === groupe && a.statut === 'actif');
    if (!agentsGroupe.length) { alert("Aucun agent actif dans ce groupe"); return; }
    
    agentsGroupe.forEach(a => recalculerSoldesAgent(a.code));
    
    let html = `<div class="info-section"><h3>📊 Soldes de congés - Groupe ${groupe}</h3><div style="overflow-x:auto"><table class="classement-table"><thead><tr><th>Agent</th><th>Dernière année</th><th>Reste (jours)</th></tr></thead><tbody>`;
    for (const agent of agentsGroupe) {
        const dernierSolde = soldesConges.filter(s => s.agentCode === agent.code).sort((a,b) => b.annee - a.annee)[0];
        if (dernierSolde && (!annee || dernierSolde.annee == annee)) {
            html += `<tr><td>${agent.code} - ${agent.nom} ${agent.prenom}</td><td>${dernierSolde.annee}</td><td style="font-weight:bold; color:#f39c12">${dernierSolde.reste}</td></tr>`;
        }
    }
    html += `</tbody></table></div><button class="popup-button gray" onclick="showSoldeMenu()">Retour</button></div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showSoldeStats() {
    const agentsActifs = getFilteredAgents();
    agentsActifs.forEach(a => recalculerSoldesAgent(a.code));
    let totalDroits = 0, totalRestes = 0;
    for (const agent of agentsActifs) {
        const dernier = soldesConges.filter(s => s.agentCode === agent.code).sort((a,b) => b.annee - a.annee)[0];
        if (dernier) {
            totalDroits += dernier.droitAnnuel;
            totalRestes += dernier.reste;
        }
    }
    const html = `<div class="info-section"><h3>📈 Statistiques globales des soldes</h3>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-value">${agentsActifs.length}</div><div>Agents actifs</div></div>
            <div class="stat-card"><div class="stat-value">${totalDroits.toFixed(1)}</div><div>Droits totaux (dernière année)</div></div>
            <div class="stat-card"><div class="stat-value">${totalRestes.toFixed(1)}</div><div>Jours restants cumulés</div></div>
        </div>
        <button class="popup-button gray" onclick="showSoldeMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}
// ==================== PARTIE 22 : INITIALISATION ====================

function viewMyPlanning() {
    let agentCode = currentUser.agentCode;
    if (!agentCode) {
        alert("⚠️ Code agent non configuré pour cet utilisateur");
        return;
    }
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    showAgentPlanningWithTotals(agentCode, currentMonth, currentYear);
}

function showMyInfo() {
    let agent = agents.find(a => a.code === currentUser.agentCode);
    if (!agent) {
        alert("⚠️ Agent non trouvé pour cet utilisateur");
        return;
    }
    const html = `<div class="info-section"><h3>👤 Mes Informations</h3>
        <div class="info-item"><span class="info-label">📋 Code:</span> ${agent.code}</div>
        <div class="info-item"><span class="info-label">👤 Nom:</span> ${agent.nom}</div>
        <div class="info-item"><span class="info-label">👤 Prénom:</span> ${agent.prenom}</div>
        <div class="info-item"><span class="info-label">👥 Groupe:</span> ${agent.groupe}</div>
        <div class="info-item"><span class="info-label">📞 Téléphone:</span> ${agent.tel || 'N/A'}</div>
        <div class="info-item"><span class="info-label">📍 Adresse:</span> ${agent.adresse || 'N/A'}</div>
        <div class="info-item"><span class="info-label">🎫 Matricule:</span> ${agent.matricule || 'N/A'}</div>
        <div class="info-item"><span class="info-label">📅 Date entrée:</span> ${agent.date_entree || 'N/A'}</div>
        <button class="popup-button gray" onclick="displayMainMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showWorkedDaysFormForCP() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
    const html = `<div class="info-section"><h3>📊 Jours Travaillés - Classement (Groupe ${currentUser.groupe})</h3>
        <div class="form-group"><label>📅 Date début</label><input type="date" id="cpStartDate" class="form-input" value="${firstDayOfMonth}"></div>
        <div class="form-group"><label>📅 Date fin</label><input type="date" id="cpEndDate" class="form-input" value="${lastDayOfMonth}"></div>
        <button class="popup-button green" onclick="showWorkedDaysResultForCP()">📊 Afficher</button>
        <button class="popup-button gray" onclick="displayMainMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showWorkedDaysResultForCP() {
    const start = new Date(document.getElementById('cpStartDate').value);
    const end = new Date(document.getElementById('cpEndDate').value);
    const group = currentUser.groupe;
    if (isNaN(start) || isNaN(end)) { alert("⚠️ Sélectionnez des dates valides"); return; }
    const periodName = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    let filtered = agents.filter(a => a.statut === 'actif' && a.groupe === group);
    const results = filtered.map(agent => ({ agent, ...calculateWorkedStats(agent.code, start, end) })).sort((a, b) => b.totalGeneral - a.totalGeneral);
    const maxTotal = results[0]?.totalGeneral || 1;
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const html = `<div class="info-section"><h3>📊 Classement Groupe ${group} - ${periodName}</h3>
        <p style="font-size:0.85em; color:#f39c12;">📐 Total général = Jours travaillés + Congés + Jours fériés travaillés<br>📅 Période du ${start.toLocaleDateString()} au ${end.toLocaleDateString()} (${totalDays} jours)</p>
        <div style="overflow-x:auto;"><table class="classement-table"><thead><tr style="background-color:#34495e;"><th>Rang</th><th>Agent</th><th>✅ Travail</th><th>🏖️ Congés</th><th>🎉 Fériés</th><th>⭐ Total</th></tr></thead>
        <tbody>${results.map((r, i) => { const percent = Math.round((r.totalGeneral / maxTotal) * 100);
            return `<tr style="border-bottom:1px solid #34495e;"><td style="text-align:center; font-weight:bold;">${i+1}${i === 0 ? ' 👑' : ''}</th>
            <td style="padding:8px;"><strong>${escapeHtml(r.agent.nom)} ${escapeHtml(r.agent.prenom)}</strong><br><small>${r.agent.code}</small></th>
            <td style="text-align:center; color:#27ae60;">${r.travaillesNormaux}</th><td style="text-align:center; color:#f39c12;">${r.conges}</th>
            <td style="text-align:center; color:#e67e22;">${r.feriesTravailles}</th>
            <td style="text-align:center; font-weight:bold; background:#2c3e50;">${r.totalGeneral}<div style="background:#34495e; border-radius:10px; height:4px; margin-top:5px;"><div style="background:#27ae60; width:${percent}%; height:4px;"></div></div></th></tr>`}).join('')}</tbody>
        <tfoot><td colspan="2" style="text-align:right; font-weight:bold;">TOTAUX :</th><td style="text-align:center; font-weight:bold;">${results.reduce((s, r) => s + r.travaillesNormaux, 0)}</th>
        <td style="text-align:center; font-weight:bold;">${results.reduce((s, r) => s + r.conges, 0)}</th><td style="text-align:center; font-weight:bold;">${results.reduce((s, r) => s + r.feriesTravailles, 0)}</th>
        <td style="text-align:center; font-weight:bold; background:#f1c40f; color:#2c3e50;">${results.reduce((s, r) => s + r.totalGeneral, 0)}</th></tfoot>
        </table></div><button class="popup-button gray" onclick="displayMainMenu()">Retour</button></div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showGroupStatsForm() {
    let groups = ['A', 'B', 'C', 'D', 'E', 'J'];
    if (currentUser.role === 'CP') groups = [currentUser.groupe];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const html = `<div class="info-section"><h3>📉 Statistiques par Groupe</h3>
        <div class="form-group"><label>Groupe</label><select id="groupStatsSelect" class="form-input" ${currentUser.role === 'CP' ? 'disabled' : ''}>${groups.map(g => `<option value="${g}">👥 Groupe ${g}</option>`).join('')}</select></div>
        <div class="form-group"><label>Mois</label><select id="groupStatsMonth" class="form-input">${Array.from({length:12}, (_,i) => `<option value="${i+1}" ${i+1 === currentMonth ? 'selected' : ''}>${MOIS_FRANCAIS[i]}</option>`).join('')}</select></div>
        <div class="form-group"><label>Année</label><input type="number" id="groupStatsYear" class="form-input" value="${currentYear}"></div>
        <button class="popup-button green" onclick="showGroupStatsResult()">📊 Afficher</button>
        <button class="popup-button gray" onclick="displayMainMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

function showGroupStatsResult() {
    let group = currentUser.role === 'CP' ? currentUser.groupe : document.getElementById('groupStatsSelect').value;
    const month = parseInt(document.getElementById('groupStatsMonth').value);
    const year = parseInt(document.getElementById('groupStatsYear').value);
    if (!canAccessGroup(group)) { alert("⚠️ Vous n'avez pas accès à ce groupe"); displayMainMenu(); return; }
    const groupAgents = agents.filter(a => a.groupe === group && a.statut === 'actif');
    if (!groupAgents.length) { alert(`⚠️ Aucun agent dans le groupe ${group}`); displayMainMenu(); return; }
    const daysInMonth = new Date(year, month, 0).getDate();
    let sundays = 0;
    for (let d = 1; d <= daysInMonth; d++) { const date = new Date(year, month - 1, d); if (date.getDay() === 0) sundays++; }
    const workingDays = daysInMonth - sundays;
    const stats = groupAgents.map(agent => calculateAgentStats(agent.code, month, year));
    const totals = stats.reduce((acc, s) => {
        acc.travaillesNormaux += s.travaillesNormaux; acc.conges += s.conges; acc.feriesTravailles += s.feriesTravailles;
        acc.maladie += s.maladie; acc.autre += s.autre; acc.repos += s.repos; acc.totalGeneral += s.totalGeneral;
        return acc;
    }, { travaillesNormaux: 0, conges: 0, feriesTravailles: 0, maladie: 0, autre: 0, repos: 0, totalGeneral: 0 });
    const avgWorked = Math.round(totals.travaillesNormaux / groupAgents.length);
    const html = `<div class="info-section"><h3>📉 Statistiques Groupe ${group} - ${getMonthName(month)} ${year}</h3>
        <p style="font-size:0.85em; color:#bdc3c7;">📅 ${daysInMonth} jours, ${sundays} dimanches = ${workingDays} jours ouvrés</p>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-value">${totals.travaillesNormaux}</div><div>✅ Jours travaillés</div></div>
            <div class="stat-card"><div class="stat-value">${totals.conges}</div><div>🏖️ Congés</div></div>
            <div class="stat-card"><div class="stat-value">${totals.feriesTravailles}</div><div>🎉 Fériés travaillés</div></div>
            <div class="stat-card"><div class="stat-value">${totals.maladie}</div><div>🤒 Maladie</div></div>
            <div class="stat-card"><div class="stat-value">${totals.autre}</div><div>📝 Autre absence</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#f1c40f;">${totals.totalGeneral}</div><div>⭐ TOTAL GÉNÉRAL</div></div>
        </div>
        <div style="margin-top:15px; background:#2c3e50; padding:10px; border-radius:8px;">📊 <strong>Moyenne par agent :</strong> ${avgWorked} jours travaillés</div>
        <button class="popup-button gray" onclick="displayMainMenu()">Retour</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
}

// ==================== INITIALISATION AU CHARGEMENT ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 SGA v8.0 - CleanCo - Démarrage...");
    loadData();
    loadNotifications();
    const savedUser = localStorage.getItem('sga_current_user');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        currentUser = users.find(u => u.id === userData.id);
    }
    if (currentUser) {
        const header = document.querySelector('.app-header');
        if (header && !document.querySelector('.user-info')) {
            const userInfoDiv = document.createElement('div');
            userInfoDiv.className = 'user-info';
            userInfoDiv.style.cssText = 'margin-top:10px; display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;';
            userInfoDiv.innerHTML = `
                <div id="notificationIcon" style="position:relative; cursor:pointer;"><span style="font-size:1.5rem;">🔔</span><span id="notificationBadge" style="position:absolute; top:-8px; right:-8px; background:#e74c3c; color:white; border-radius:50%; padding:2px 6px; font-size:0.7rem; font-weight:bold; display:none;">0</span></div>
                <span style="background:#f39c12; padding:4px 12px; border-radius:20px; font-size:0.8rem; color:#2c3e50;">${currentUser.role === 'ADMIN' ? '👑 Admin' : (currentUser.role === 'CP' ? '👥 CP Groupe ' + currentUser.groupe : '👤 Agent')}</span>
                <span style="color:white;">${currentUser.nom} ${currentUser.prenom}</span>
                <button class="logout-btn" onclick="logout()" style="background:#e74c3c; border:none; padding:5px 12px; border-radius:20px; color:white; cursor:pointer;">🚪 Déconnexion</button>
            `;
            header.appendChild(userInfoDiv);
            document.getElementById('notificationIcon').onclick = () => showNotificationsPanel();
        }
        updateNotificationBadge();
        displayMainMenu();
    } else {
        showLogin();
    }
});

// ==================== NOTIFICATIONS - VERSION FINALE ====================
// La variable 'notifications' est déjà déclarée ailleurs dans le code

function showNotificationsPanel() {
    console.log("🔔 showNotificationsPanel exécutée - NOUVELLE VERSION");
    
    if (!currentUser) {
        console.log("Pas d'utilisateur connecté");
        return;
    }
    
    const unreadNotifications = notifications.filter(n => !n.readBy.includes(currentUser.username));
    const allNotifications = [...notifications].reverse();
    
    const panel = document.createElement('div');
    panel.id = 'notifPanelOverlay';
    panel.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); display:flex; justify-content:center; align-items:center; z-index:10001;';
    
    let notificationsHtml = '';
    
    if (allNotifications.length === 0) {
        notificationsHtml = '<div style="text-align:center; padding:40px; color:#bdc3c7;">📭 Aucune notification</div>';
    } else {
        notificationsHtml = allNotifications.map(n => {
            const isUnread = !n.readBy.includes(currentUser.username);
            const date = new Date(n.createdAt).toLocaleString();
            let icon = '🔔';
            let title = 'Notification';
            let details = `<div>${JSON.stringify(n.details)}</div>`;
            
            if (n.type === 'shift_modification') {
                icon = '✏️'; title = 'Modification de shift';
                details = `<div><strong>Agent:</strong> ${n.details.agentName}</div><div><strong>Date:</strong> ${n.details.date}</div><div><strong>${n.details.oldValue} → ${n.details.newValue}</strong></div>`;
            } else if (n.type === 'leave_add') {
                icon = '🏖️'; title = 'Ajout de congé';
                details = `<div><strong>Agent:</strong> ${n.details.agentName}</div><div><strong>Période:</strong> ${n.details.startDate} → ${n.details.endDate}</div>`;
            } else if (n.type === 'agent_add') {
                icon = '➕'; title = 'Ajout d\'agent';
                details = `<div><strong>Agent:</strong> ${n.details.agentName}</div><div><strong>Groupe:</strong> ${n.details.groupe}</div>`;
            } else if (n.type === 'agent_update') {
                icon = '✏️'; title = 'Modification d\'agent';
                details = `<div><strong>Agent:</strong> ${n.details.agentName}</div><div><strong>Champ:</strong> ${n.details.field}</div><div><strong>${n.details.oldValue} → ${n.details.newValue}</strong></div>`;
            }
            
            return `
                <div style="background:#34495e; border-radius:8px; padding:12px; margin-bottom:10px; ${isUnread ? 'border-left: 3px solid #e74c3c; background-color: rgba(231, 76, 60, 0.1);' : 'border-left: 3px solid #2ecc71;'}">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:5px;">
                        <div><span style="font-size:1.2rem;">${icon}</span> <strong>${title}</strong></div>
                        <span style="font-size:0.7rem; color:#bdc3c7;">${date}</span>
                    </div>
                    <div style="font-size:0.8rem; margin-bottom:10px;">
                        <div><strong>Par:</strong> ${n.createdByName} (${n.createdByRole === 'ADMIN' ? 'Admin' : 'CP'})</div>
                        ${details}
                    </div>
                    ${isUnread ? `<button class="mark-read-btn" data-id="${n.id}" style="background:#27ae60; border:none; padding:5px 12px; border-radius:5px; color:white; cursor:pointer;">✓ Marquer comme lu</button>` : '<span style="font-size:0.7rem; color:#27ae60;">✓ Lu</span>'}
                </div>
            `;
        }).join('');
    }
    
    panel.innerHTML = `
        <div style="background:#2c3e50; border-radius:10px; width:500px; max-width:90%; max-height:80vh; overflow:hidden; display:flex; flex-direction:column;">
            <div style="padding:15px; border-bottom:1px solid #34495e; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <h3 style="margin:0;">🔔 Notifications</h3>
                <div style="display:flex; gap:10px;">
                    <span style="background:#e74c3c; color:white; padding:4px 10px; border-radius:20px;">${unreadNotifications.length} non lue(s)</span>
                    <button id="markAllReadBtn" style="background:#3498db; border:none; padding:5px 12px; border-radius:5px; color:white; cursor:pointer;">✅ Tout lire</button>
                    <button id="closeNotifPanel" style="background:#7f8c8d; border:none; padding:5px 12px; border-radius:5px; color:white; cursor:pointer;">✖️ Fermer</button>
                </div>
            </div>
            <div style="overflow-y:auto; padding:15px; max-height:60vh;">${notificationsHtml}</div>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    document.getElementById('closeNotifPanel').onclick = () => panel.remove();
    document.getElementById('markAllReadBtn').onclick = () => {
        notifications.forEach(n => { if (!n.readBy.includes(currentUser.username)) n.readBy.push(currentUser.username); });
        saveData();
        updateNotificationBadge();
        panel.remove();
        showNotificationsPanel();
    };
    document.querySelectorAll('.mark-read-btn').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const notif = notifications.find(n => n.id === id);
            if (notif && !notif.readBy.includes(currentUser.username)) {
                notif.readBy.push(currentUser.username);
                saveData();
                updateNotificationBadge();
                panel.remove();
                showNotificationsPanel();
            }
        };
    });
}

function attachNotificationClick() {
    const icon = document.getElementById('notificationIcon');
    if (icon) {
        icon.onclick = function(e) {
            e.stopPropagation();
            console.log("🔔 Clic détecté");
            showNotificationsPanel();
        };
        console.log("✅ Événement notification attaché");
        return true;
    }
    return false;
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge && currentUser) {
        const count = notifications.filter(n => !n.readBy.includes(currentUser.username)).length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// Attendre que l'icône apparaisse
setInterval(function() {
    if (document.getElementById('notificationIcon') && currentUser) {
        attachNotificationClick();
    }
}, 500);

// Exposer globalement
window.showNotificationsPanel = showNotificationsPanel;
window.attachNotificationClick = attachNotificationClick;
window.updateNotificationBadge = updateNotificationBadge;

console.log("✅ Notifications chargées");
