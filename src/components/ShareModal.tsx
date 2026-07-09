import { useState, useRef, useEffect } from "react";
import X from "lucide-react/dist/esm/icons/x";
import Download from "lucide-react/dist/esm/icons/download";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Copy from "lucide-react/dist/esm/icons/copy";
import Check from "lucide-react/dist/esm/icons/check";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import QRCode from "qrcode";
import { ProcessedThought } from "../types";
import { useLanguage } from "../contexts/LanguageContext";

const APP_URL = "https://i-miei-pensieri.web.app";

interface ShareModalProps {
  thought: ProcessedThought;
  onClose: () => void;
}

/**
 * Wrappa il testo in linee che rientrano in maxWidth (canvas units).
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function generateCanvas(thought: ProcessedThought, aspectRatio: "1:1" | "9:16"): Promise<HTMLCanvasElement> {
  const SIZE_W = 1080;
  const SIZE_H = aspectRatio === "1:1" ? 1080 : 1920;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE_W;
  canvas.height = SIZE_H;
  const ctx = canvas.getContext("2d")!;

  // ── Sfondo scuro con gradiente ─────────────────────────────────────
  const grad = ctx.createLinearGradient(0, 0, SIZE_W, SIZE_H);
  grad.addColorStop(0, "#0f0f14");
  grad.addColorStop(0.5, "#16161f");
  grad.addColorStop(1, "#0f0f14");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE_W, SIZE_H);

  // ── Accento radiale angolo ─────────────────────────────────────────
  const accentGrad = ctx.createRadialGradient(SIZE_W * 0.8, SIZE_H * 0.2, 0, SIZE_W * 0.8, SIZE_H * 0.2, SIZE_W * 0.8);
  accentGrad.addColorStop(0, "rgba(234, 88, 12, 0.12)");
  accentGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, SIZE_W, SIZE_H);

  // ── Bordo elegante ─────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, SIZE_W - 80, SIZE_H - 80);

  // ── QR Code (solo 9:16, in alto a destra) ─────────────────────────
  if (aspectRatio === "9:16") {
    try {
      const qrDataUrl = await QRCode.toDataURL(APP_URL, {
        width: 180,
        margin: 1,
        color: { dark: "#ffffff", light: "#00000000" },
        errorCorrectionLevel: "M",
      });
      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });
      const QR_SIZE = 180;
      const QR_X = SIZE_W - 80 - QR_SIZE;
      const QR_Y = 80;
      // Sfondo del QR
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(QR_X - 12, QR_Y - 12, QR_SIZE + 24, QR_SIZE + 24 + 40, 12);
      else ctx.rect(QR_X - 12, QR_Y - 12, QR_SIZE + 24, QR_SIZE + 64);
      ctx.fill();
      ctx.drawImage(qrImg, QR_X, QR_Y, QR_SIZE, QR_SIZE);
      // Link testuale sotto il QR
      ctx.font = "500 20px 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.textAlign = "center";
      ctx.fillText("imieipensieri.app", QR_X + QR_SIZE / 2, QR_Y + QR_SIZE + 28);
      ctx.textAlign = "left";
    } catch (e) {
      console.warn("QR Code non generato:", e);
    }
  }

  // ── Logo / app name ────────────────────────────────────────────────
  ctx.font = "bold 36px 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("I Miei Pensieri", 80, 110);

  // ── Accent line ────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(234, 88, 12, 0.8)";
  ctx.fillRect(80, 125, 120, 3);

  // ── Data (sopra titolo in 9:16) ────────────────────────────────────
  const dateStr = new Date(thought.timestamp).toLocaleDateString("it-IT", {
    day: "2-digit", month: "long", year: "numeric",
  });
  if (aspectRatio === "9:16") {
    ctx.font = "400 28px 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
    ctx.fillStyle = "rgba(234, 88, 12, 0.7)";
    ctx.fillText(dateStr.toUpperCase(), 80, 200);
  }

  // ── Titolo ────────────────────────────────────────────────────────
  ctx.font = "bold 62px 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  const titleLines = wrapText(ctx, thought.title || "Riflessione", SIZE_W - 280);

  let y = aspectRatio === "1:1" ? 220 : 370; // 9:16: sotto il QR container (termina ~324)
  for (const line of titleLines.slice(0, 4)) {
    ctx.fillText(line, 80, y);
    y += 72;
  }

  // ── Corpo del pensiero ────────────────────────────────────────────
  const bodyY = y + 40;
  ctx.font = "400 38px 'Georgia', 'Times New Roman', serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";

  const maxBodyY = SIZE_H - 260;
  let bodyLineY = bodyY;
  const bodyLines = wrapText(ctx, thought.content || "", SIZE_W - 200);
  for (const line of bodyLines) {
    if (bodyLineY > maxBodyY) {
      ctx.fillText("...", 80, bodyLineY);
      break;
    }
    ctx.fillText(line, 80, bodyLineY);
    bodyLineY += 56;
  }

  // ── Data (in basso per 1:1) ────────────────────────────────────────
  if (aspectRatio === "1:1") {
    ctx.font = "400 30px 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText(dateStr, 80, SIZE_H - 90);
  }

  // ── Category tag ──────────────────────────────────────────────────
  if (thought.category) {
    const catText = thought.category.toUpperCase();
    ctx.font = "bold 24px 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
    const catW = ctx.measureText(catText).width + 40;
    ctx.fillStyle = "rgba(234, 88, 12, 0.15)";
    ctx.beginPath();

    const rx = aspectRatio === "9:16" ? 80 : SIZE_W - 80 - catW;
    const ry = SIZE_H - 120;
    const rw = catW;
    const rh = 44;
    const radius = 22;
    if (ctx.roundRect) {
      ctx.roundRect(rx, ry, rw, rh, radius);
    } else {
      ctx.moveTo(rx + radius, ry);
      ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, radius);
      ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, radius);
      ctx.arcTo(rx, ry + rh, rx, ry, radius);
      ctx.arcTo(rx, ry, rx + rw, ry, radius);
      ctx.closePath();
    }
    ctx.fill();
    ctx.strokeStyle = "rgba(234, 88, 12, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(234, 88, 12, 0.9)";
    ctx.fillText(catText, rx + 20, ry + 31);
  }

  // ── Footer firma (solo 9:16) ───────────────────────────────────────
  if (aspectRatio === "9:16") {
    ctx.font = "400 26px 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillText(dateStr, 80, SIZE_H - 60);
  }

  return canvas;
}

export function ShareModal({ thought, onClose }: ShareModalProps) {
  const { lang } = useLanguage();
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16">("1:1");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stati per la Condivisione Consapevole
  const [showWarning, setShowWarning] = useState(false);
  const [warningTimer, setWarningTimer] = useState(10);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPreviewUrl(null);
    generateCanvas(thought, aspectRatio)
      .then((canvas) => {
        if (cancelled) return;
        canvasRef.current = canvas;
        setPreviewUrl(canvas.toDataURL("image/png", 0.95));
      })
      .catch((e) => console.error("Errore generazione anteprima canvas:", e));
    return () => { cancelled = true; };
  // Deps primitive: evita re-run a ogni nuovo object reference (oscillazione 60fps)
  }, [thought.id, thought.content, thought.title, thought.timestamp, aspectRatio]);

  useEffect(() => {
    let interval: any = null;
    if (showWarning) {
      setWarningTimer(10);
      interval = setInterval(() => {
        setWarningTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showWarning]);

  const executeDownload = () => {
    if (!canvasRef.current) return;
    try {
      const link = document.createElement("a");
      link.href = canvasRef.current.toDataURL("image/png", 1.0);
      link.download = `pensiero-${thought.id.slice(0, 8)}.png`;
      link.click();
    } catch (err) {
      console.error("Errore download immagine:", err);
    }
  };

  const executeShare = async () => {
    if (!canvasRef.current) return;
    try {
      if (navigator.share) {
        const blob = await new Promise<Blob>((res) =>
          canvasRef.current!.toBlob((b) => res(b!), "image/png", 1.0)
        );
        const file = new File([blob], "pensiero.png", { type: "image/png" });
        
        const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });
        if (canShareFiles) {
          await navigator.share({
            title: thought.title || "Riflessione",
            text: thought.content || "",
            files: [file],
          });
          return;
        } else {
          await navigator.share({
            title: thought.title || "Riflessione",
            text: thought.content || "",
          });
          return;
        }
      }
    } catch (err) {
      console.error("Errore condivisione nativa:", err);
    }
    executeDownload();
  };

  const executeCopyText = async () => {
    try {
      const text = `*${thought.title || "Riflessione"}*\n\n${thought.content || ""}\n\n— I Miei Pensieri`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Errore copia testo:", err);
    }
  };

  const handleInterceptedAction = (action: () => void) => {
    setPendingAction(() => action);
    setShowWarning(true);
  };

  const handleProceed = () => {
    if (warningTimer > 0) return;
    if (pendingAction) {
      pendingAction();
    }
    setShowWarning(false);
    setPendingAction(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-sm flex flex-col gap-4 p-5 max-h-[90vh] overflow-y-auto relative">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">Condividi Pensiero</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex gap-2 justify-center bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => setAspectRatio("1:1")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${aspectRatio === "1:1" ? "bg-[var(--text-primary)] text-[var(--bg-base)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            >
              Quadrato (1:1)
            </button>
            <button
              onClick={() => setAspectRatio("9:16")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${aspectRatio === "9:16" ? "bg-[var(--text-primary)] text-[var(--bg-base)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            >
              Verticale (9:16)
            </button>
          </div>

          {/* Preview card */}
          <div className={`w-full ${aspectRatio === "9:16" ? "overflow-y-auto max-h-[60vh]" : ""} rounded-xl`}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Anteprima card"
                className={`w-full ${aspectRatio === "1:1" ? "aspect-square" : "aspect-[9/16]"} rounded-xl shadow-lg border border-[var(--border-color)] object-contain`}
              />
            ) : (
              <div className="w-full aspect-square bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center text-[var(--text-muted)] text-sm">
                <Loader2 size={20} className="animate-spin mr-2" /> Generazione...
              </div>
            )}
          </div>

          {/* Azioni */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleInterceptedAction(executeDownload)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-xs font-medium"
            >
              <Download size={20} />
              Salva PNG
            </button>

            <button
              onClick={() => handleInterceptedAction(executeShare)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--accent-warm)] text-white hover:opacity-90 transition-all text-xs font-semibold shadow-sm"
            >
              <Share2 size={20} />
              Condividi
            </button>

            <button
              onClick={() => handleInterceptedAction(executeCopyText)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-xs font-medium"
            >
              {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
              {copied ? "Copiato!" : "Testo"}
            </button>
          </div>

          <p className="text-[10px] text-[var(--text-muted)] text-center leading-relaxed">
            Su Instagram: salva e carica come storia/post.<br />
            Su WhatsApp: usa "Condividi" o copia il testo.
          </p>
        </div>
      </div>

      {/* Modale a Schermo Intero: Condivisione Consapevole */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-[#111119] border border-orange-500/20 p-8 rounded-3xl flex flex-col gap-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />
            
            <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-orange-500/20">
              <AlertCircle size={32} />
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold font-display text-white">
                La condivisione è vulnerabilità, non vetrina.
              </h3>
              <p className="text-sm font-serif text-zinc-300 leading-relaxed text-left border-l-2 border-orange-500/30 pl-4 py-1">
                Questo spazio è nato per proteggerti dal rumore e dall'approvazione altrui. Se decidi di portare questo frammento di te all'esterno, fallo con l'intento di creare un ponte autentico con qualcuno che sappia ascoltare. Non usare i tuoi pensieri per misurare il tuo valore attraverso i consensi o per vanità. Rifletti prima di esporre la tua interiorità.
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={handleProceed}
                disabled={warningTimer > 0}
                className="w-full bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:opacity-50 text-white py-3.5 px-6 rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {warningTimer > 0 ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-orange-500" />
                    Rifletti... ({warningTimer}s)
                  </>
                ) : (
                  "Ho riflettuto, procedi"
                )}
              </button>

              <button
                onClick={() => {
                  setShowWarning(false);
                  setPendingAction(null);
                }}
                className="w-full bg-transparent border border-zinc-800 text-zinc-400 hover:text-white py-3 px-6 rounded-xl font-medium text-xs transition-colors"
              >
                Annulla condivisione
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
