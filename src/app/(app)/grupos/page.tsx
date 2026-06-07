import { getStandings } from "@/lib/api-football";

export const revalidate = 3600;

export default async function GruposPage() {
  const standings = await getStandings();

  const byGroup = standings.reduce((acc, row) => {
    if (!acc[row.group]) acc[row.group] = [];
    acc[row.group].push(row);
    return acc;
  }, {} as Record<string, typeof standings>);

  const groupKeys = Object.keys(byGroup).sort();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="font-syne text-2xl font-bold text-secondary">Tabla de Grupos 📊</h1>
        <p className="text-text-secondary text-sm mt-1">
          Posiciones actualizadas de la fase de grupos
        </p>
      </div>

      {groupKeys.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">⏳</p>
          <p className="font-semibold text-text-primary">La fase de grupos aún no ha comenzado</p>
          <p className="text-text-secondary text-sm mt-1">
            Las tablas se actualizarán cuando arranquen los partidos el 11 de junio
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupKeys.map((groupKey) => {
            const rows = byGroup[groupKey];
            const label = groupKey.replace("GROUP_", "Grupo ");
            return (
              <div key={groupKey} className="card overflow-hidden p-0">
                <div className="bg-secondary px-4 py-2">
                  <h2 className="font-syne font-bold text-white text-sm">{label}</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="text-left px-4 py-2 text-xs text-text-secondary font-semibold w-6">#</th>
                      <th className="text-left px-2 py-2 text-xs text-text-secondary font-semibold">Equipo</th>
                      <th className="text-center py-2 text-xs text-text-secondary font-semibold w-8">PJ</th>
                      <th className="text-center py-2 text-xs text-text-secondary font-semibold w-8">G</th>
                      <th className="text-center py-2 text-xs text-text-secondary font-semibold w-8">E</th>
                      <th className="text-center py-2 text-xs text-text-secondary font-semibold w-8">P</th>
                      <th className="text-center py-2 text-xs text-text-secondary font-semibold w-10">DG</th>
                      <th className="text-center py-2 text-xs text-text-secondary font-semibold w-10 pr-4">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={row.team.id}
                        className={`border-b border-border last:border-0 ${i < 2 ? "bg-success/5" : ""}`}
                      >
                        <td className="px-4 py-2.5 text-text-secondary text-xs">{row.position}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            {row.team.flag ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={row.team.flag} alt={row.team.name} className="w-5 h-3.5 rounded object-cover flex-shrink-0" />
                            ) : (
                              <span className="text-xs font-bold text-text-secondary w-5">{row.team.code}</span>
                            )}
                            <span className="font-medium text-text-primary truncate max-w-[100px]">{row.team.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-2.5 text-text-secondary">{row.played}</td>
                        <td className="text-center py-2.5 text-text-secondary">{row.won}</td>
                        <td className="text-center py-2.5 text-text-secondary">{row.draw}</td>
                        <td className="text-center py-2.5 text-text-secondary">{row.lost}</td>
                        <td className="text-center py-2.5 text-text-secondary">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                        <td className="text-center py-2.5 pr-4 font-syne font-bold text-secondary">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-success px-4 py-1.5 bg-success/5 border-t border-border">
                  ↑ Los 2 primeros clasifican a octavos
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
