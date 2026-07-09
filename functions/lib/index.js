"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerGithubWorkflow = exports.getAdminStats = exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions"));
// Indirizzo email di default (preso dal primo utente, poiché l'utente non l'ha specificato)
const DESTINATION_EMAIL = "b.valentinogiglio@gmail.com";
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    const email = user.email || "Email non fornita";
    const displayName = user.displayName || "Nome non fornito";
    const creationTime = user.metadata.creationTime || new Date().toISOString();
    try {
        const { Resend } = await Promise.resolve().then(() => __importStar(require("resend")));
        const resend = new Resend("re_M4CBKC58_81TXFLR1jPUczBUTYeR39ZjK");
        const data = await resend.emails.send({
            from: "Notifiche App <onboarding@resend.dev>",
            to: DESTINATION_EMAIL,
            subject: "🎉 Nuovo utente registrato in I Miei Pensieri!",
            html: `
        <h2>Un nuovo utente è appena entrato nell'app!</h2>
        <p>Ecco i dettagli del nuovo account:</p>
        <ul>
          <li><strong>Nome:</strong> ${displayName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Data registrazione:</strong> ${creationTime}</li>
          <li><strong>ID Utente:</strong> ${user.uid}</li>
        </ul>
        <p>Continua così!</p>
      `,
        });
        functions.logger.info("Email inviata con successo", data);
    }
    catch (error) {
        functions.logger.error("Errore durante l'invio dell'email", error);
    }
});
/**
 * Recupera le statistiche e l'elenco degli utenti registrati.
 * Riservata a b.valentinogiglio@gmail.com.
 */
exports.getAdminStats = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Utente non autenticato.");
    }
    if (context.auth.token.email !== "b.valentinogiglio@gmail.com") {
        throw new functions.https.HttpsError("permission-denied", "Accesso non autorizzato.");
    }
    try {
        const admin = await Promise.resolve().then(() => __importStar(require("firebase-admin")));
        if (!admin.apps.length) {
            admin.initializeApp();
        }
        // 1. Ottieni la lista utenti da Firebase Auth
        const listUsersResult = await admin.auth().listUsers(100);
        const users = listUsersResult.users.map(u => ({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            creationTime: u.metadata.creationTime,
            lastSignInTime: u.metadata.lastSignInTime,
        }));
        // 2. Ottieni statistiche dal database specifico
        const firestore = new admin.firestore.Firestore({
            databaseId: "ai-studio-3088714c-a3be-4ce3-a9cd-f94c8dd37474"
        });
        // Conteggio utenti Firestore
        const usersSnap = await firestore.collection("users").get();
        const totalFirestoreUsers = usersSnap.size;
        // Conteggio pensieri (Group Query)
        const thoughtsSnap = await firestore.collectionGroup("thoughts").get();
        const totalThoughts = thoughtsSnap.size;
        return {
            success: true,
            users,
            stats: {
                totalAuthUsers: users.length,
                totalFirestoreUsers,
                totalThoughts,
            }
        };
    }
    catch (err) {
        functions.logger.error("Errore in getAdminStats", err);
        throw new functions.https.HttpsError("internal", err.message || "Errore sconosciuto.");
    }
});
/**
 * Avvia i workflow di deploy/undeploy su GitHub Actions in modo asincrono.
 * Riservata a b.valentinogiglio@gmail.com.
 */
exports.triggerGithubWorkflow = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Utente non autenticato.");
    }
    if (context.auth.token.email !== "b.valentinogiglio@gmail.com") {
        throw new functions.https.HttpsError("permission-denied", "Accesso non autorizzato.");
    }
    const { action } = data;
    if (action !== "deploy" && action !== "undeploy") {
        throw new functions.https.HttpsError("invalid-argument", "Azione non valida. Deve essere 'deploy' o 'undeploy'.");
    }
    try {
        const admin = await Promise.resolve().then(() => __importStar(require("firebase-admin")));
        if (!admin.apps.length) {
            admin.initializeApp();
        }
        const firestore = new admin.firestore.Firestore({
            databaseId: "ai-studio-3088714c-a3be-4ce3-a9cd-f94c8dd37474"
        });
        const githubDoc = await firestore.collection("config").doc("github").get();
        if (!githubDoc.exists) {
            throw new Error("Configurazione GitHub non impostata su Firestore. Crea il documento 'config/github' con token, owner e repo.");
        }
        const { token, owner, repo } = githubDoc.data() || {};
        if (!token || !owner || !repo) {
            throw new Error("Configurazione GitHub incompleta nel documento 'config/github'. Assicurati di impostare token, owner e repo.");
        }
        const workflowFile = action === "deploy" ? "deploy.yml" : "undeploy.yml";
        const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token.trim()}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json",
                "User-Agent": "Firebase-Cloud-Functions"
            },
            body: JSON.stringify({
                ref: "main"
            })
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`GitHub API ha risposto con errore [Status ${response.status}]: ${errText}`);
        }
        return {
            success: true,
            message: `Azione di ${action === "deploy" ? "Deploy" : "Undeploy"} avviata correttamente su GitHub!`
        };
    }
    catch (err) {
        functions.logger.error("Errore in triggerGithubWorkflow", err);
        throw new functions.https.HttpsError("internal", err.message || "Errore sconosciuto.");
    }
});
//# sourceMappingURL=index.js.map