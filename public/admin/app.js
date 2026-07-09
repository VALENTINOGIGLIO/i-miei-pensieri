// Firebase Configuration (Matching src/lib/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyA5cgwDmRnuA3Qm1_C88vzgi7cwDPz4jik",
  authDomain: "i-miei-pensieri.web.app",
  projectId: "mythic-cedar-z6tp2",
  storageBucket: "mythic-cedar-z6tp2.firebasestorage.app",
  messagingSenderId: "732185655993",
  appId: "1:732185655993:web:e3183beacbfed5c6a8f968"
};

// Initialize Firebase App
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase Services with Custom Database ID
const auth = firebase.auth();
const db = firebase.app().firestore("ai-studio-3088714c-a3be-4ce3-a9cd-f94c8dd37474");
const functions = firebase.app().functions();

// State Variables
let currentUser = null;
let flagsListener = null;

// DOM Elements
const loadingOverlay = document.getElementById("loading-overlay");
const loginContainer = document.getElementById("login-container");
const loginError = document.getElementById("login-error");
const btnGoogleLogin = document.getElementById("btn-google-login");
const adminContainer = document.getElementById("admin-container");
const btnLogout = document.getElementById("btn-logout");

// Stats Elements
const statAuthUsers = document.getElementById("stat-auth-users");
const statFsUsers = document.getElementById("stat-fs-users");
const statThoughts = document.getElementById("stat-thoughts");
const btnRefreshUsers = document.getElementById("btn-refresh-users");
const usersTableBody = document.getElementById("users-table-body");

// DevOps Elements
const btnDeploy = document.getElementById("btn-deploy");
const btnUndeploy = document.getElementById("btn-undeploy");
const devopsLogContainer = document.getElementById("devops-log-container");
const devopsLog = document.getElementById("devops-log");

// Feature Toggles Elements
const toggles = {
  maintenanceMode: document.getElementById("flag-maintenanceMode"),
  microphone: document.getElementById("flag-microphone"),
  thoughtList: document.getElementById("flag-thoughtList"),
  analysis: document.getElementById("flag-analysis"),
  readingAdvice: document.getElementById("flag-readingAdvice")
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH & ROUTING GATEKEEPER
// ─────────────────────────────────────────────────────────────────────────────
auth.onAuthStateChanged(async (user) => {
  showLoading(true);
  currentUser = user;

  if (user) {
    // Restringe l'accesso esclusivamente a b.valentinogiglio@gmail.com
    if (user.email === "b.valentinogiglio@gmail.com") {
      loginContainer.classList.add("hidden");
      adminContainer.classList.remove("hidden");
      
      // Sottoscrizione alle feature flags e caricamento dati
      startFlagsListener();
      startGithubConfigListener();
      await fetchAdminStats();
    } else {
      // Logout forzato per email non autorizzate
      showError("Accesso negato: Solo b.valentinogiglio@gmail.com è autorizzato.");
      await auth.signOut();
      showAuthPage();
    }
  } else {
    // Nessun utente, mostra login
    stopFlagsListener();
    stopGithubConfigListener();
    showAuthPage();
  }
  showLoading(false);
  lucide.createIcons(); // Aggiorna icone
});

function showAuthPage() {
  adminContainer.classList.add("hidden");
  loginContainer.classList.remove("hidden");
}

function showLoading(show) {
  if (show) {
    loadingOverlay.classList.remove("hidden");
  } else {
    loadingOverlay.classList.add("hidden");
  }
}

function showError(msg) {
  if (msg) {
    loginError.innerText = msg;
    loginError.classList.remove("hidden");
  } else {
    loginError.classList.add("hidden");
  }
}

// GOOGLE LOGIN CLICK
btnGoogleLogin.addEventListener("click", async () => {
  showError("");
  btnGoogleLogin.disabled = true;
  const originalHtml = btnGoogleLogin.innerHTML;
  btnGoogleLogin.innerHTML = "<span>Verifica con Google...</span>";

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    // Forza la selezione dell'account se necessario
    provider.setCustomParameters({ prompt: 'select_account' });
    await auth.signInWithPopup(provider);
  } catch (err) {
    console.error(err);
    showError(err.message || "Errore durante l'accesso con Google. Riprova.");
    btnGoogleLogin.disabled = false;
    btnGoogleLogin.innerHTML = originalHtml;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB ACTIONS CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
let githubConfigListener = null;

function startGithubConfigListener() {
  if (githubConfigListener) return;
  githubConfigListener = db.collection("config").doc("github")
    .onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data.owner) document.getElementById("gh-owner").value = data.owner;
        if (data.repo) document.getElementById("gh-repo").value = data.repo;
        if (data.token) {
          document.getElementById("gh-token").placeholder = "•••••••••••• (Configurato)";
        }
      }
    }, (err) => {
      console.error("Errore caricamento configurazione GitHub:", err);
    });
}

function stopGithubConfigListener() {
  if (githubConfigListener) {
    githubConfigListener();
    githubConfigListener = null;
  }
}

// Gestione Toggle Form GitHub
const githubConfigToggle = document.getElementById("github-config-toggle");
const githubForm = document.getElementById("github-form");

githubConfigToggle.addEventListener("click", () => {
  githubConfigToggle.classList.toggle("open");
  githubForm.classList.toggle("hidden");
  lucide.createIcons();
});

// Gestione Salvataggio Configurazione GitHub
githubForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const tokenVal = document.getElementById("gh-token").value.trim();
  const ownerVal = document.getElementById("gh-owner").value.trim();
  const repoVal = document.getElementById("gh-repo").value.trim();

  const dataToSave = {
    owner: ownerVal,
    repo: repoVal
  };

  if (tokenVal) {
    dataToSave.token = tokenVal;
  }

  const btnSaveGh = document.getElementById("btn-save-gh");
  btnSaveGh.disabled = true;
  btnSaveGh.innerHTML = "Salvataggio...";

  try {
    await db.collection("config").doc("github").set(dataToSave, { merge: true });
    alert("Configurazione GitHub salvata correttamente!");
    document.getElementById("gh-token").value = "";
  } catch (err) {
    console.error(err);
    alert("Errore durante il salvataggio: " + err.message);
  } finally {
    btnSaveGh.disabled = false;
    btnSaveGh.innerHTML = "<span>Salva Configurazione</span>";
    lucide.createIcons();
  }
});

// LOGOUT CLICK
btnLogout.addEventListener("click", async () => {
  showLoading(true);
  try {
    await auth.signOut();
  } catch (err) {
    console.error(err);
  }
  showLoading(false);
});

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE FLAGS LISTENERS & UPDATE
// ─────────────────────────────────────────────────────────────────────────────
function startFlagsListener() {
  if (flagsListener) return;
  
  flagsListener = db.collection("config").doc("features")
    .onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data();
        // Aggiorna gli switch in base ai dati di Firestore
        Object.keys(toggles).forEach(key => {
          if (data[key] !== undefined && toggles[key]) {
            toggles[key].checked = data[key];
          }
        });
      }
    }, (err) => {
      console.error("Errore snapshot feature flags:", err);
    });
}

function stopFlagsListener() {
  if (flagsListener) {
    flagsListener();
    flagsListener = null;
  }
}

// Aggiorna la feature flag su Firestore al cambio di stato degli switch
Object.keys(toggles).forEach(key => {
  const element = toggles[key];
  if (element) {
    element.addEventListener("change", async (e) => {
      const isChecked = e.target.checked;
      try {
        await db.collection("config").doc("features").set({
          [key]: isChecked
        }, { merge: true });
      } catch (err) {
        console.error("Failed to update feature flag:", err);
        alert("Errore nell'aggiornamento della feature flag: " + err.message);
        // Ripristina lo stato grafico in caso di errore
        e.target.checked = !isChecked;
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DATI UTENTI E STATISTICHE (Cloud Functions)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchAdminStats() {
  try {
    const getStatsFn = functions.httpsCallable("getAdminStats");
    const res = await getStatsFn();
    if (res.data && res.data.success) {
      const stats = res.data.stats;
      const users = res.data.users;

      // Popola metriche
      statAuthUsers.innerText = stats.totalAuthUsers;
      statFsUsers.innerText = stats.totalFirestoreUsers;
      statThoughts.innerText = stats.totalThoughts;

      // Popola Tabella
      populateUsersTable(users);
    }
  } catch (err) {
    console.error(err);
    alert("Impossibile caricare le statistiche: " + err.message);
  }
}

function populateUsersTable(users) {
  usersTableBody.innerHTML = "";
  
  if (!users || users.length === 0) {
    usersTableBody.innerHTML = `<tr><td colspan="4" class="text-center">Nessun utente registrato.</td></tr>`;
    return;
  }

  users.forEach(u => {
    const tr = document.createElement("tr");
    
    // Avatar / Iniziali
    let avatarHTML = "";
    if (u.photoURL) {
      avatarHTML = `<img src="${u.photoURL}" alt="">`;
    } else {
      const initials = u.displayName ? u.displayName.substring(0, 2).toUpperCase() : "?";
      avatarHTML = initials;
    }

    const creationDate = u.creationTime ? new Date(u.creationTime).toLocaleDateString() : "N/D";
    const lastAccess = u.lastSignInTime ? new Date(u.lastSignInTime).toLocaleDateString() : "Mai";

    tr.innerHTML = `
      <td class="user-profile-cell">
        <div class="user-avatar">${avatarHTML}</div>
        <span>${u.displayName || "Utente Anonimo"}</span>
      </td>
      <td class="user-email-cell">${u.email}</td>
      <td class="user-time-cell">${creationDate}</td>
      <td class="user-time-cell">${lastAccess}</td>
    `;
    usersTableBody.appendChild(tr);
  });
}

btnRefreshUsers.addEventListener("click", async () => {
  btnRefreshUsers.disabled = true;
  await fetchAdminStats();
  btnRefreshUsers.disabled = false;
});

// ─────────────────────────────────────────────────────────────────────────────
// DEVOPS DEPLOY / UNDEPLOY COMMANDS (LOCAL ONLY)
// ─────────────────────────────────────────────────────────────────────────────
async function executeDevops(action) {
  const actionText = action === "deploy" ? "il Deploy su Firebase Hosting" : "la disattivazione dell'Hosting (Undeploy)";
  if (!confirm(`Sei sicuro di voler avviare ${actionText}?`)) {
    return;
  }

  btnDeploy.disabled = true;
  btnUndeploy.disabled = true;
  devopsLogContainer.classList.remove("hidden");
  devopsLog.innerHTML = `<span class="text-amber">Avvio di ${action === 'deploy' ? 'Deploy' : 'Undeploy'} in corso...</span>\nRichiesta inviata a GitHub Actions...`;

  try {
    const triggerGithubWorkflowFn = functions.httpsCallable("triggerGithubWorkflow");
    const res = await triggerGithubWorkflowFn({ action });
    
    if (res.data && res.data.success) {
      const ownerVal = document.getElementById("gh-owner").value.trim() || "VALENTINOGIGLIO";
      const repoVal = document.getElementById("gh-repo").value.trim() || "i-miei-pensieri";
      const runLink = `https://github.com/${ownerVal}/${repoVal}/actions`;
      
      devopsLog.innerHTML = `<span class="text-green">Successo:</span> ${res.data.message}\n\nPuoi monitorare lo stato di avanzamento live su GitHub Actions al seguente link:\n<a href="${runLink}" target="_blank" style="color:var(--blue);text-decoration:underline;">${runLink}</a>\n\n(L'operazione richiede solitamente 1-2 minuti per completarsi nel cloud)`;
    } else {
      devopsLog.innerText = `Errore nell'avvio del workflow: Risposta non valida dal server.`;
    }
  } catch (err) {
    console.error(err);
    devopsLog.innerText = `Errore di esecuzione Cloud Function:\n${err.message}`;
  } finally {
    btnDeploy.disabled = false;
    btnUndeploy.disabled = false;
  }
}

btnDeploy.addEventListener("click", () => executeDevops("deploy"));
btnUndeploy.addEventListener("click", () => executeDevops("undeploy"));
