"use client";

import { useToast } from "./Toast";

interface Props {
  url?: string;
}

export function ShareButton({ url }: Props) {
  const { toast } = useToast();
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.origin : "");

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Polla Mundialista 2026 | Jamar",
          text: "¡Únete a la polla del Mundial FIFA 2026! Predice los resultados y compite 🏆⚽",
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast("Link copiado al portapapeles 📋", "success");
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `¡Únete a la Polla Mundialista 2026! 🏆⚽\nPredice los resultados del Mundial y compite conmigo.\nEntra aquí: ${shareUrl}`
  )}`;

  return (
    <div className="flex gap-2">
      <button
        onClick={handleShare}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-border bg-white hover:bg-surface transition font-semibold text-sm text-text-primary active:scale-95"
      >
        🔗 Copiar link
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#20bd5a] transition active:scale-95"
      >
        📲 WhatsApp
      </a>
    </div>
  );
}
