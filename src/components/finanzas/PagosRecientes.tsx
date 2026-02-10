import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { isSameMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, ImageIcon } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  selectedDate: Date;
}

export default function PagosRecientes({ selectedDate }: Props) {
  const { pagos, clientes, deletePago } = useData();
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);

  const pagosMes = pagos
    .filter(p => isSameMonth(new Date(p.fecha), selectedDate))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const getClienteNombre = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Desconocido';

  if (pagosMes.length === 0) return null;

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-semibold">Pagos Recibidos este Mes</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{pagosMes.length} pago{pagosMes.length !== 1 ? 's' : ''} registrado{pagosMes.length !== 1 ? 's' : ''}</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="table-header">Fecha</TableHead>
              <TableHead className="table-header">Cliente</TableHead>
              <TableHead className="table-header text-right">Monto</TableHead>
              <TableHead className="table-header">Metodo</TableHead>
              <TableHead className="table-header text-right">Accion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagosMes.map(p => (
              <TableRow key={p.id}>
                <TableCell className="text-muted-foreground">
                  {format(new Date(p.fecha), 'dd MMM yyyy', { locale: es })}
                </TableCell>
                <TableCell className="font-medium">{getClienteNombre(p.clienteId)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-success">+${p.monto.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    {p.montoOriginal && p.moneda && (
                      <span className="text-[10px] text-muted-foreground">
                        {p.montoOriginal.toLocaleString()} {p.moneda}
                        {p.tasaCambio && (' @ ' + p.tasaCambio)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">{p.metodo}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {p.comprobanteUrl && (
                      <button
                        onClick={() => setComprobanteUrl(p.comprobanteUrl!)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        title="Ver comprobante"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => deletePago(p.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog to show receipt image */}
      <Dialog open={!!comprobanteUrl} onOpenChange={() => setComprobanteUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Comprobante de Pago</DialogTitle>
          </DialogHeader>
          {comprobanteUrl && (
            <img
              src={comprobanteUrl}
              alt="Comprobante de pago"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
