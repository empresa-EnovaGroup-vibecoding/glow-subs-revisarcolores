import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X, Minus, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  currentMesKey: string;
}

const STORAGE_KEY = 'finanzas_meta_mensual';

function getStoredGoals(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

interface MonthResult {
  mesKey: string;
  label: string;
  meta: number;
  ingresos: number;
  porcentaje: number;
  alcanzada: boolean;
}

export default function MetaHistorial({ currentMesKey }: Props) {
  const { pagos, cortes } = useData();

  const historial = useMemo(() => {
    const goals = getStoredGoals();
    const now = new Date();
    const results: MonthResult[] = [];

    for (let i = 1; i <= 6; i++) {
      const monthDate = subMonths(now, i);
      const mesKey = format(monthDate, 'yyyy-MM');
      const meta = goals[mesKey] || 0;

      // Calculate real income for this month (same logic as FinanzasPage)
      const cortesDelMes = cortes.filter(c => isSameMonth(new Date(c.fecha), monthDate));
      const usdtFromCortes = cortesDelMes.reduce((sum, c) => sum + c.usdtRecibidoReal, 0);
      const pagosDirectosUSD = pagos.filter(p =>
        isSameMonth(new Date(p.fecha), monthDate) &&
        (!p.moneda || p.moneda === 'USD') &&
        !p.corteId
      );
      const usdDirectos = pagosDirectosUSD.reduce((sum, p) => sum + p.monto, 0);
      const ingresos = Math.round((usdtFromCortes + usdDirectos) * 100) / 100;

      const porcentaje = meta > 0 ? Math.round((ingresos / meta) * 100) : 0;

      results.push({
        mesKey,
        label: format(monthDate, 'MMM yyyy', { locale: es }),
        meta,
        ingresos,
        porcentaje,
        alcanzada: meta > 0 && ingresos >= meta,
      });
    }

    return results.reverse(); // oldest first
  }, [pagos, cortes]);

  const hasAnyGoal = historial.some(m => m.meta > 0);

  if (!hasAnyGoal) return null;

  const alcanzadas = historial.filter(m => m.alcanzada).length;
  const conMeta = historial.filter(m => m.meta > 0).length;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-primary" />
          Historial de metas (últimos 6 meses)
        </h3>
        {conMeta > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {alcanzadas}/{conMeta} alcanzadas
          </span>
        )}
      </div>

      {/* Visual bar chart */}
      <div className="flex items-end gap-1.5 h-28">
        {historial.map((m) => {
          const barHeight = m.meta > 0
            ? Math.max(8, Math.min(100, m.porcentaje))
            : 8;

          return (
            <div key={m.mesKey} className="flex-1 flex flex-col items-center gap-1">
              {/* Percentage label */}
              <span className={cn(
                'text-[9px] font-semibold',
                m.meta === 0 ? 'text-muted-foreground' : m.alcanzada ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              )}>
                {m.meta > 0 ? `${m.porcentaje}%` : '—'}
              </span>

              {/* Bar */}
              <div className="w-full flex-1 flex items-end">
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all relative group',
                    m.meta === 0
                      ? 'bg-muted'
                      : m.alcanzada
                        ? 'bg-emerald-500/80'
                        : m.porcentaje >= 80
                          ? 'bg-amber-500/80'
                          : 'bg-destructive/60'
                  )}
                  style={{ height: `${barHeight}%` }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10">
                    <div className="bg-popover border border-border rounded-md px-2.5 py-1.5 shadow-md text-[10px] whitespace-nowrap space-y-0.5">
                      <p className="font-semibold capitalize">{m.label}</p>
                      {m.meta > 0 ? (
                        <>
                          <p>Meta: ${m.meta.toLocaleString()}</p>
                          <p>Ingresos: ${m.ingresos.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          <p className={m.alcanzada ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-destructive font-semibold'}>
                            {m.alcanzada ? '✓ Alcanzada' : `✗ Faltaron $${(m.meta - m.ingresos).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">Sin meta configurada</p>
                      )}
                    </div>
                  </div>

                  {/* Icon overlay */}
                  {m.meta > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {m.alcanzada ? (
                        <Check className="h-3 w-3 text-white/90" />
                      ) : (
                        <X className="h-3 w-3 text-white/70" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Month label */}
              <span className="text-[9px] text-muted-foreground capitalize leading-none">
                {format(new Date(m.mesKey + '-01'), 'MMM', { locale: es })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/80" /> Alcanzada
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500/80" /> ≥80%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-destructive/60" /> {'<80%'}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted" /> Sin meta
        </span>
      </div>
    </div>
  );
}
