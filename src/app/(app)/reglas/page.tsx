import Link from "next/link";

const matchPoints = [
  {
    icon: "🎯",
    title: "Marcador exacto",
    pts: "5 puntos",
    color: "text-primary",
    bg: "bg-primary/5 border-primary/20",
    desc: "Predices el marcador exacto del partido. Ej: Colombia 2–1 Brasil y termina 2–1.",
  },
  {
    icon: "✓",
    title: "Resultado correcto",
    pts: "2 puntos",
    color: "text-secondary",
    bg: "bg-secondary/5 border-secondary/20",
    desc: "Predices quién gana o si hay empate, aunque el marcador no sea exacto.",
  },
  {
    icon: "🏆",
    title: "Campeón del Mundial",
    pts: "+10 pts bonus",
    color: "text-accent",
    bg: "bg-accent/10 border-accent/30",
    desc: "Eliges el campeón del Mundial en el Bracket antes de que inicien los octavos de final.",
  },
  {
    icon: "🥈",
    title: "Subcampeón",
    pts: "+5 pts bonus",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
    desc: "Eliges el subcampeón del Mundial en el Bracket.",
  },
];

const crazyPoints = [
  { diff: "Exacto 🎯",      pts: "10 pts", color: "text-success",        bg: "bg-success/10" },
  { diff: "Diferencia ±1",  pts: "6 pts",  color: "text-secondary",      bg: "bg-secondary/10" },
  { diff: "Diferencia ±2",  pts: "3 pts",  color: "text-text-primary",   bg: "bg-surface" },
  { diff: "Diferencia ±3",  pts: "1 pt",   color: "text-text-secondary", bg: "bg-surface" },
  { diff: "Diferencia 4+",  pts: "0 pts",  color: "text-error/60",       bg: "bg-error/5" },
];

const crazyBonuses = [
  { icon: "⭐", label: "Único en acertar exacto",        pts: "+5 pts", color: "text-accent" },
  { icon: "🎯", label: "El más cercano de la jornada",   pts: "+2 pts", color: "text-secondary" },
  { icon: "⏰", label: "Responder antes del límite",      pts: "+1 pt",  color: "text-success" },
];

const crazyCategories = [
  {
    name: "Goles", icon: "⚽",
    questions: [
      "Total de goles en la jornada",
      "Minuto promedio del primer gol de cada partido",
      "Cantidad de goles en tiempo añadido",
    ],
  },
  {
    name: "Disciplina", icon: "🟨",
    questions: [
      "Total de tarjetas amarillas",
      "Total de faltas cobradas",
      "Minutos totales de tiempo añadido (suma de partidos)",
    ],
  },
  {
    name: "Volumen de juego", icon: "🚩",
    questions: [
      "Total de tiros de esquina en la jornada",
      "Total de tiros al arco (incluyendo bloqueados)",
      "Total de pases fallados en la jornada",
    ],
  },
  {
    name: "Rareza máxima", icon: "🤯",
    questions: [
      "Cantidad de goles de cabeza",
      "Cantidad de autogoles en la jornada",
      "Número total de penaltis cobrados",
      "Jugadores que entraron como sustitutos (total)",
    ],
  },
];

const generalRules = [
  "Las predicciones de partidos se bloquean automáticamente cuando arranca cada partido.",
  "El Bracket (campeón y subcampeón) se bloquea cuando inician los octavos de final.",
  "Las Predicciones Locas se bloquean 30 minutos antes del primer partido de la jornada.",
  "Los puntos se calculan automáticamente con los resultados oficiales.",
  "En caso de empate en puntos, gana quien tenga más marcadores exactos.",
  "Solo se puntúan partidos terminados (tiempo reglamentario + prórroga si aplica).",
  "¡Juego limpio! Una cuenta por persona.",
];

export default function ReglasPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

      <div>
        <h1 className="font-syne text-2xl font-bold text-secondary">Reglas 📋</h1>
        <p className="text-text-secondary text-sm mt-1">
          Cómo funciona la Polla Mundialista Jamar 2026
        </p>
      </div>

      {/* ——— MÓDULO 1: PREDICCIONES DE PARTIDOS ——— */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <h2 className="font-syne font-bold text-secondary text-lg">Predicciones de Partidos</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Predice el marcador exacto de cada partido antes de que arranque. Los puntos se suman al ranking general.
        </p>
        {matchPoints.map((r) => (
          <div key={r.title} className={`card border ${r.bg} flex items-start gap-4`}>
            <span className="text-3xl flex-shrink-0">{r.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-semibold text-text-primary">{r.title}</p>
                <span className={`font-syne font-bold text-sm ${r.color}`}>{r.pts}</span>
              </div>
              <p className="text-text-secondary text-sm mt-0.5">{r.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ——— MÓDULO 2: PREDICCIONES LOCAS ——— */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎲</span>
          <h2 className="font-syne font-bold text-secondary text-lg">Predicciones Locas</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Por cada jornada aparece una pregunta de estadística rara. Adivina el número antes del cierre
          y gana hasta <strong className="text-text-primary">15 puntos</strong> (10 base + 5 bonus).
          Los puntos suman al ranking general.
        </p>

        <div className="card bg-secondary/5 border-secondary/20 space-y-3">
          <p className="font-semibold text-secondary text-sm">¿Cómo funciona?</p>
          <ol className="space-y-2 text-sm text-text-secondary">
            {[
              "Antes de cada jornada aparece UNA pregunta seleccionada aleatoriamente del banco.",
              "Tienes hasta 30 minutos antes del primer partido para ingresar tu número.",
              "Mientras se juegan los partidos, ves en tiempo real el número actual vs. tu predicción.",
              "Al terminar la jornada el sistema calcula los puntos automáticamente.",
              "Las 13 preguntas rotan sin repetirse hasta agotar el banco, luego reinician.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary/20 text-secondary text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="card space-y-2">
          <p className="font-semibold text-text-primary text-sm mb-3">Sistema de puntos</p>
          <div className="space-y-1.5">
            {crazyPoints.map((row) => (
              <div key={row.diff} className={`flex items-center justify-between px-3 py-2 rounded-xl ${row.bg}`}>
                <span className="text-sm text-text-secondary">{row.diff}</span>
                <span className={`font-syne font-bold text-sm ${row.color}`}>{row.pts}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border mt-3 pt-3 space-y-1.5">
            <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">
              Bonuses adicionales
            </p>
            {crazyBonuses.map((b) => (
              <div key={b.label} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary flex items-center gap-2">
                  <span>{b.icon}</span>{b.label}
                </span>
                <span className={`font-syne font-bold text-sm ${b.color}`}>{b.pts}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <p className="font-semibold text-text-primary text-sm">Banco de 13 preguntas</p>
          {crazyCategories.map((cat) => (
            <div key={cat.name}>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>{cat.icon}</span>{cat.name}
              </p>
              <ul className="space-y-1">
                {cat.questions.map((q) => (
                  <li key={q} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ——— REGLAS GENERALES ——— */}
      <section className="card space-y-3">
        <h2 className="font-syne font-bold text-secondary">Reglas generales</h2>
        <ul className="space-y-2 text-sm text-text-secondary">
          {generalRules.map((rule) => (
            <li key={rule} className="flex items-start gap-2">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <div className="card bg-secondary border-secondary/20 text-center py-6">
        <p className="text-2xl mb-2">⚽</p>
        <p className="font-syne font-bold text-white mb-1">¡Que empiece el juego!</p>
        <p className="text-white/70 text-sm mb-4">Predice partidos, compite en Locas y llega al top del ranking</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            href="/partidos"
            className="inline-block bg-bg text-secondary font-bold px-5 py-2.5 rounded-xl hover:bg-surface transition active:scale-95 text-sm"
          >
            ⚽ Predecir partidos
          </Link>
          <Link
            href="/predicciones-locas"
            className="inline-block bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-white/30 transition active:scale-95 text-sm"
          >
            🎲 Predicciones Locas
          </Link>
        </div>
      </div>

    </div>
  );
}
