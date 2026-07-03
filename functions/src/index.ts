import * as functions from "firebase-functions";
import { Resend } from "resend";

// Inizializza Resend con l'API Key fornita dall'utente
const resend = new Resend("re_M4CBKC58_81TXFLR1jPUczBUTYeR39ZjK");

// Indirizzo email di default (preso dal primo utente, poiché l'utente non l'ha specificato)
const DESTINATION_EMAIL = "b.valentinogiglio@gmail.com";

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
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
  } catch (error) {
    functions.logger.error("Errore durante l'invio dell'email", error);
  }
});
