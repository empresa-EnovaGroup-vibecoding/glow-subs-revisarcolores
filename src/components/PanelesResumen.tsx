import { useMemo } from 'react';
import { Panel } from '@/types';
import { LayoutGrid, Layers, Users, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { differenceInDays, parseISO } from 'date-fns';

interface Props {
  paneles: Panel[];
  onFilterChange?: (filter: string) => void;
  activeFilter?: string;
}

export default function PanelesResumen({ paneles, onFilterChange, activeFilter }: Props) {
  const stats = useMemo(() => {
    const activos = paneles.filter(p => p.estado === 'activo');
    const totalPaneles = activos.length;

    const servicioMap: Record<string, number> = {};
    paneles.forEach(p => {
      const s = p.servicioAsociado || 'Otro';
      servicioMap[s] = (servicioMap[s] || 0) + 1;
    });

    const cuposTotal = paneles.reduce((a, p) => a + p.capacidadTotal, 0);
    const cuposUsados = paneles.reduce((a, p) => a + p.cuposUsados, 0);
    const ocupacion = cuposTotal > 0 ? Math.round((cuposUsados / cuposTotal) * 100) : 0;

    // Próximos a vencer (15 días)
    const hoy = new Date();
    const proximosVencer = paneles.filter(p => {
      if (!p.fechaExpiracion) return false;
      const diff = differenceInDays(parseISO(p.fechaExpiracion), hoy);
      return diff >= 0 && diff <= 15;
    }).length;

    // Vencidos (expired)
    const vencidos = paneles.filter(p => {
      if (!p.fechaExpiracion) return false;
      const diff = differenceInDays(parseISO(p.fechaExpiracion), hoy);
      return diff < 0;
    }).length;

    const inversionMensual = paneles.reduce((a, p) => a + (p.costoMensual || 0), 0);

    return { totalPaneles, servicioMap, cuposTotal, cuposUsados, ocupacion, proximosVencer, vencidos, inversionMensual };
  }, [paneles]);

  const cards = [
    {
      id: 'total',
      icon: LayoutGrid,
      label: 'Total Paneles',
      value: stats.totalPaneles,
      sub: `de ${paneles.length} registrados`,
      color: 'text-primary',
    },
    {
      id: 'servicios',
      icon: Layers,
      label: 'Por Servicio',
      value: null,
      servicioMap: stats.servicioMap,
      color: 'text-primary',
    },
    {
      id: 'cupos',
      icon: Users,
      label: 'Cupos',
      value: `${stats.cuposUsados}/${stats.cuposTotal}`,
      sub: 'ocupados',
      color: 'text-primary',
    },
    {
      id: 'ocupacion',
      icon: TrendingUp,
      label: 'Ocupación',
      value: `${stats.ocupacion}%`,
      progress: stats.ocupacion,
      color: stats.ocupacion > 80 ? 'text-warning' : 'text-primary',
    },
    {
      id: 'por-vencer',
      icon: AlertTriangle,
      label: 'Próx. a Vencer',
      value: stats.proximosVencer,
      sub: 'en 15 días',
      color: stats.proximosVencer > 0 ? 'text-destructive' : 'text-success',
      alert: stats.proximosVencer > 0,
      clickable: stats.proximosVencer > 0,
      filterKey: 'por-vencer',
    },
    {
      id: 'inversion',
      icon: DollarSign,
      label: 'Inversión Mensual',
      value: `$${stats.inversionMensual.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      sub: 'USD/mes',
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          onClick={() => card.clickable && card.filterKey && onFilterChange?.(activeFilter === card.filterKey ? '' : card.filterKey)}
          className={`stat-card relative overflow-hidden ${card.alert ? 'ring-1 ring-destructive/30' : ''} ${card.clickable ? 'cursor-pointer hover:ring-2 hover:ring-destructive/50 transition-all' : ''} ${activeFilter === card.filterKey ? 'ring-2 ring-destructive/60 bg-destructive/5' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-medium text-muted-foreground truncate">{card.label}</p>
            <card.icon className={`h-3.5 w-3.5 shrink-0 ${card.color}`} />
          </div>

          {card.servicioMap ? (
            <div className="space-y-0.5">
              {Object.entries(card.servicioMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground truncate mr-1">{name}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              {Object.keys(card.servicioMap).length > 4 && (
                <p className="text-[10px] text-muted-foreground">+{Object.keys(card.servicioMap).length - 4} más</p>
              )}
            </div>
          ) : (
            <>
              <p className={`text-xl font-bold leading-none ${card.color}`}>{card.value}</p>
              {card.progress !== undefined && (
                <Progress value={card.progress} className="mt-2 h-1.5" />
              )}
              {card.sub && (
                <p className="text-[10px] text-muted-foreground mt-1">{card.sub}</p>
              )}
              {card.id === 'por-vencer' && stats.vencidos > 0 && (
                <p className="text-[10px] text-destructive font-medium mt-0.5">{stats.vencidos} vencido{stats.vencidos !== 1 ? 's' : ''}</p>
              )}
              {card.clickable && (
                <p className="text-[9px] text-muted-foreground mt-1">{activeFilter === card.filterKey ? 'Click para quitar filtro' : 'Click para ver cuáles'}</p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
