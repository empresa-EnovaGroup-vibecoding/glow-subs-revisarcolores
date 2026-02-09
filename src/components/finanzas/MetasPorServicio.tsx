import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { isSameMonth } from 'date-fns';
import { Target, Check, X, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface Props {
  mesKey: string;
  selectedDate: Date;
}

const STORAGE_KEY = 'finanzas_meta_por_servicio';

interface ServiceGoals {
  [mesKey: string]: {
    [servicioId: string]: number;
  };
}

function getStoredServiceGoals(): ServiceGoals {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredServiceGoal(mesKey: string, servicioId: string, value: number) {
  const goals = getStoredServiceGoals();
  if (!goals[mesKey]) goals[mesKey] = {};
  if (value > 0) {
    goals[mesKey][servicioId] = value;
  } else {
    delete goals[mesKey][servicioId];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export default function MetasPorServicio({ mesKey, selectedDate }: Props) {
  const { servicios, suscripciones, pagos } = useData();
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const allGoals = getStoredServiceGoals();
    setGoals(allGoals[mesKey] || {});
  }, [mesKey]);

  // Calculate income per service for the selected month
  const ingresosPorServicio = useMemo(() => {
    const map: Record<string, number> = {};

    // Get all active subscriptions and their payments
    for (const sub of suscripciones) {
      if (!sub.servicioId) continue;

      // Find payments for this client in this month
      const pagosMes = pagos.filter(
        p => p.clienteId === sub.clienteId && isSameMonth(new Date(p.fecha), selectedDate)
      );

      if (pagosMes.length > 0) {
        // Get all active subs for this client to prorate payments
        const subsCliente = suscripciones.filter(
          s => s.clienteId === sub.clienteId && s.estado === 'activa'
        );
        const totalCobrar = subsCliente.reduce((sum, s) => sum + s.precioCobrado, 0);
        const totalPagado = pagosMes.reduce((sum, p) => sum + p.monto, 0);

        if (totalCobrar > 0) {
          // Prorate payment proportionally across services
          const ratio = sub.precioCobrado / totalCobrar;
          const asignado = Math.round(totalPagado * ratio * 100) / 100;
          map[sub.servicioId] = (map[sub.servicioId] || 0) + asignado;
        }
      }
    }

    // Round all values
    for (const key of Object.keys(map)) {
      map[key] = Math.round(map[key] * 100) / 100;
    }

    return map;
  }, [suscripciones, pagos, selectedDate]);

  // Only show services that have active subscriptions or goals
  const serviciosRelevantes = useMemo(() => {
    const activeServiceIds = new Set(
      suscripciones.filter(s => s.estado === 'activa').map(s => s.servicioId)
    );
    return servicios.filter(
      s => activeServiceIds.has(s.id) || goals[s.id]
    );
  }, [servicios, suscripciones, goals]);

  const hasAnyGoal = Object.keys(goals).length > 0;

  const handleSave = (servicioId: string) => {
    const num = parseFloat(editValue);
    if (!isNaN(num) && num >= 0) {
      setStoredServiceGoal(mesKey, servicioId, num);
      setGoals(prev => {
        const next = { ...prev };
        if (num > 0) {
          next[servicioId] = num;
        } else {
          delete next[servicioId];
        }
        return next;
      });
      setEditingId(null);
      setEditValue('');
    }
  };

  const startEdit = (servicioId: string) => {
    setEditValue(goals[servicioId] ? String(goals[servicioId]) : '');
    setEditingId(servicioId);
  };

  if (serviciosRelevantes.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-lg">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Target className="h-4 w-4 text-primary" />
              Metas por servicio
              {hasAnyGoal && (
                <span className="text-[10px] font-normal text-muted-foreground ml-1">
                  ({Object.keys(goals).length} configuradas)
                </span>
              )}
            </h3>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {serviciosRelevantes.map(servicio => {
              const meta = goals[servicio.id] || 0;
              const ingresos = ingresosPorServicio[servicio.id] || 0;
              const porcentaje = meta > 0 ? Math.min(Math.round((ingresos / meta) * 100), 100) : 0;
              const porcentajeReal = meta > 0 ? Math.round((ingresos / meta) * 100) : 0;
              const alcanzada = meta > 0 && ingresos >= meta;
              const isEditing = editingId === servicio.id;

              return (
                <div key={servicio.id} className="rounded-md border border-border/50 bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{servicio.nombre}</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          placeholder="Meta USD"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSave(servicio.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="h-6 w-24 text-xs px-2"
                          min={0}
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleSave(servicio.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-1 px-2"
                        onClick={() => startEdit(servicio.id)}
                      >
                        <Settings className="h-3 w-3" />
                        {meta > 0 ? `$${meta}` : 'Sin meta'}
                      </Button>
                    )}
                  </div>

                  {meta > 0 ? (
                    <>
                      <div className="relative">
                        <Progress
                          value={porcentaje}
                          className={cn(
                            'h-2.5 rounded-full',
                            alcanzada && '[&>div]:bg-emerald-500'
                          )}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">
                          ${ingresos.toLocaleString(undefined, { minimumFractionDigits: 2 })} / ${meta.toLocaleString()} USD
                        </span>
                        {alcanzada ? (
                          <span className="flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3 w-3" />
                            {porcentajeReal}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-medium">
                            {porcentajeReal}%
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Ingresos: ${ingresos.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                      <span>Sin meta configurada</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
