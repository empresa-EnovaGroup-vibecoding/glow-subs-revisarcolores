import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Suscripcion, EstadoSuscripcion } from '@/types';
import { format, addDays, differenceInDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Copy, Check, RefreshCw, XCircle, Plus, Trash2, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ServicioFormInline, { PendingSuscripcion } from './ServicioFormInline';

interface Props {
  clienteId: string;
  nombre: string;
  whatsapp: string;
  onNombreChange: (v: string) => void;
  onWhatsappChange: (v: string) => void;
}

export default function ClienteEditPanel({ clienteId, nombre, whatsapp, onNombreChange, onWhatsappChange }: Props) {
  const {
    getSuscripcionesByCliente, addSuscripcion, updateSuscripcion, deleteSuscripcion,
    paneles, servicios, getCuposDisponibles, getPanelById, getServicioById,
  } = useData();
  const suscripciones = getSuscripcionesByCliente(clienteId);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pendingSubs, setPendingSubs] = useState<PendingSuscripcion[]>([]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRenovar = (sub: Suscripcion) => {
    const newFechaInicio = format(new Date(), 'yyyy-MM-dd');
    const newFechaVencimiento = format(addDays(new Date(), 30), 'yyyy-MM-dd');
    updateSuscripcion({
      ...sub,
      fechaInicio: newFechaInicio,
      fechaVencimiento: newFechaVencimiento,
      estado: 'activa',
    });
    toast.success('Suscripción renovada +30 días');
  };

  const handleCancelar = (sub: Suscripcion) => {
    updateSuscripcion({ ...sub, estado: 'cancelada' });
    toast.success('Suscripción cancelada');
  };

  const handleAddPending = (item: PendingSuscripcion) => {
    setPendingSubs(prev => [...prev, item]);
  };

  const handleRemovePending = (tempId: string) => {
    setPendingSubs(prev => prev.filter(i => i._tempId !== tempId));
  };

  const handleSavePending = () => {
    for (const item of pendingSubs) {
      addSuscripcion({
        clienteId,
        servicioId: item.servicioId,
        panelId: item.panelId,
        fechaInicio: item.fechaInicio,
        precioCobrado: item.precioCobrado,
        credencialEmail: item.credencialEmail,
        credencialPassword: item.credencialPassword,
        notas: item.notas,
      });
    }
    setPendingSubs([]);
    toast.success(`${pendingSubs.length} servicio(s) agregado(s)`);
  };

  const getProgress = (sub: Suscripcion) => {
    const inicio = startOfDay(new Date(sub.fechaInicio));
    const vencimiento = startOfDay(new Date(sub.fechaVencimiento));
    const hoy = startOfDay(new Date());
    const totalDias = differenceInDays(vencimiento, inicio);
    const diasTranscurridos = differenceInDays(hoy, inicio);
    if (totalDias <= 0) return 100;
    const pct = Math.max(0, Math.min(100, (diasTranscurridos / totalDias) * 100));
    return pct;
  };

  const getDiasRestantes = (sub: Suscripcion) => {
    const vencimiento = startOfDay(new Date(sub.fechaVencimiento));
    const hoy = startOfDay(new Date());
    return differenceInDays(vencimiento, hoy);
  };

  const getProgressColor = (dias: number, estado: EstadoSuscripcion) => {
    if (estado === 'cancelada') return 'bg-muted-foreground';
    if (dias <= 0) return 'bg-destructive';
    if (dias <= 5) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="space-y-5">
      {/* Client data */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Nombre</Label>
          <Input value={nombre} onChange={e => onNombreChange(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">WhatsApp</Label>
          <Input value={whatsapp} onChange={e => onWhatsappChange(e.target.value)} className="h-9" />
        </div>
      </div>

      <Separator />

      {/* Existing subscriptions */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Suscripciones Activas ({suscripciones.length})</h4>

        {suscripciones.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">Sin suscripciones</p>
        ) : (
          <div className="space-y-3">
            {suscripciones.map(sub => {
              const servicio = getServicioById(sub.servicioId);
              const panel = getPanelById(sub.panelId);
              const diasRestantes = getDiasRestantes(sub);
              const progress = getProgress(sub);
              const progressColor = getProgressColor(diasRestantes, sub.estado);

              return (
                <div key={sub.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{servicio?.nombre || 'Servicio eliminado'}</span>
                        <span className={
                          sub.estado === 'activa'
                            ? diasRestantes <= 0 ? 'alert-badge bg-destructive/10 text-destructive text-[10px]'
                              : diasRestantes <= 5 ? 'alert-badge bg-warning/10 text-warning text-[10px]'
                              : 'alert-badge bg-success/10 text-success text-[10px]'
                            : sub.estado === 'vencida' ? 'alert-badge bg-destructive/10 text-destructive text-[10px]'
                            : 'alert-badge bg-muted text-muted-foreground text-[10px]'
                        }>
                          {sub.estado === 'cancelada' ? 'Cancelada' : diasRestantes <= 0 ? 'Vencido' : diasRestantes <= 5 ? 'Por vencer' : 'Al día'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {panel?.nombre || '—'} · ${sub.precioCobrado.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-primary hover:text-primary"
                        onClick={() => handleRenovar(sub)}
                      >
                        <RefreshCw className="h-3 w-3" />
                        Renovar
                      </Button>
                      {sub.estado !== 'cancelada' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleCancelar(sub)}
                        >
                          <XCircle className="h-3 w-3" />
                          Cancelar
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => deleteSuscripcion(sub.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{format(new Date(sub.fechaInicio), 'dd MMM yyyy', { locale: es })}</span>
                      <span>
                        {diasRestantes > 0
                          ? `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}`
                          : diasRestantes === 0 ? 'Vence hoy'
                          : `Venció hace ${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) !== 1 ? 's' : ''}`
                        }
                      </span>
                      <span>{format(new Date(sub.fechaVencimiento), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${progressColor}`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* Credentials */}
                  {(sub.credencialEmail || sub.credencialPassword) && (
                    <div className="flex items-center gap-3 rounded-md bg-muted/50 p-2.5 text-xs">
                      {sub.credencialEmail && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{sub.credencialEmail}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(sub.credencialEmail!, `email-${sub.id}`)}
                            className="rounded p-0.5 hover:bg-muted"
                          >
                            {copiedField === `email-${sub.id}` ? (
                              <Check className="h-3 w-3 text-success" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      )}
                      {sub.credencialPassword && (
                        <div className="flex items-center gap-1.5">
                          <Lock className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-muted-foreground">{sub.credencialPassword}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(sub.credencialPassword!, `pass-${sub.id}`)}
                            className="rounded p-0.5 hover:bg-muted"
                          >
                            {copiedField === `pass-${sub.id}` ? (
                              <Check className="h-3 w-3 text-success" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {sub.notas && (
                    <p className="text-[11px] text-muted-foreground italic">📝 {sub.notas}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Add new services */}
      <ServicioFormInline
        items={pendingSubs}
        onAdd={handleAddPending}
        onRemove={handleRemovePending}
      />

      {pendingSubs.length > 0 && (
        <Button
          type="button"
          size="sm"
          className="w-full"
          onClick={handleSavePending}
        >
          Guardar {pendingSubs.length} servicio(s) nuevo(s)
        </Button>
      )}
    </div>
  );
}
