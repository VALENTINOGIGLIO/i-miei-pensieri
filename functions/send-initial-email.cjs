const { Resend } = require("resend");
const fs = require("fs");

const resend = new Resend("re_M4CBKC58_81TXFLR1jPUczBUTYeR39ZjK");
const DESTINATION_EMAIL = "b.valentinogiglio@gmail.com";

async function sendInitialEmail() {
  try {
    const data = fs.readFileSync("../users.json", "utf8");
    const json = JSON.parse(data);
    const users = json.users;

    let htmlList = users.map(u => `<li><strong>${u.displayName || "N/A"}</strong> (${u.email})</li>`).join("");

    const response = await resend.emails.send({
      from: "Notifiche App <onboarding@resend.dev>",
      to: DESTINATION_EMAIL,
      subject: "📊 Report Iniziale: Tutti gli Utenti Registrati",
      html: `
        <h2>Ecco la lista di tutti gli utenti registrati finora:</h2>
        <ul>
          ${htmlList}
        </ul>
        <p>Totale utenti: <strong>${users.length}</strong></p>
      `,
    });

    console.log("Email iniziale inviata con successo!", response);
  } catch (error) {
    console.error("Errore durante l'invio:", error);
  }
}

sendInitialEmail();
