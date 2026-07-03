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
exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const resend_1 = require("resend");
// Inizializza Resend con l'API Key fornita dall'utente
const resend = new resend_1.Resend("re_M4CBKC58_81TXFLR1jPUczBUTYeR39ZjK");
// Indirizzo email di default (preso dal primo utente, poiché l'utente non l'ha specificato)
const DESTINATION_EMAIL = "b.valentinogiglio@gmail.com";
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    const email = user.email || "Email non fornita";
    const displayName = user.displayName || "Nome non fornito";
    const creationTime = user.metadata.creationTime || new Date().toISOString();
    try {
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
//# sourceMappingURL=index.js.map