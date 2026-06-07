import Link from "next/link";

const rules = [
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
    title: "Campeón",
    pts: "10 puntos bonus",
    color: "text-accent",
    bg: "bg-accent/10 border-accent/30",
    desc: "Eliges el campeón del Mundial en el Bracket antes de los octavos de final.",
  },
  {
    icon: "🥈",
    title: "Subcampeón",
    pts: "5 puntos bonus",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
    desc: "Eliges el subcampeón del Mundial en el Bracket.",
  },
];

export default function ReglasPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-syne text-2xl font-bold text-secondary">Reglas 📋</h1>
        <p className="text-text-secondary text-sm mt-1">
          Cómo funciona la Polla Mundialista Jamar 2026
        </p>
      </div>

      {/* Sistema de puntos */}
      <div className="space-y-3">
        <h2 className="font-syne font-bold text-secondary">Sistema de puntos</h2>
        {rules.map((r) => (
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
      </div>

      {/* Reglas generales */}
      <div className="card space-y-3">
        <h2 className="font-syne font-bold text-secondary">Reglas generales</h2>
        <ul className="space-y-2 text-sm text-text-secondary">
          {[
            "Las predicciones se bloquean automáticamente cuando arranca cada partido.",
            "El Bracket (campeón, subcampeón) se bloquea cuando inician los octavos de final.",
            "Los puntos se calculan automáticamente con los resultados oficiales.",
            "En caso de empate en puntos, gana quien tenga más marcadores exactos.",
            "Solo se puntúan partidos terminados en tiempo reglamentario + prórroga + penales.",
            "¡Juego limpio! Una cuenta por persona.",
          ].map((rule) => (
            <li key={rule} className="flex items-start gap-2">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="card bg-secondary border-secondary/20 text-center py-6">
        <p className="text-2xl mb-2">⚽</p>
        <p className="font-syne font-bold text-white mb-3">¡Que empiece el juego!</p>
        <Link
          href="/partidos"
          className="inline-block bg-white text-secondary font-bold px-6 py-2.5 rounded-xl hover:bg-surface transition active:scale-95 text-sm"
        >
          Ir a predecir
        </Link>
      </div>
    </div>
  );
}
