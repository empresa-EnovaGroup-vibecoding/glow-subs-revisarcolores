import { TrendingUp, TrendingDown, DollarSign, AlertCircle, ArrowRightLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  totalGastos: number;
  totalIngresos: number;
  ganancia: number;
  clientesQueDeben: number;
  pendienteConvertir: { count: number; label: string };
  onClientesQueDebenClick?: () => void;
  showDeudores?: boolean;
}

export default function FinanzasResumen({
  totalGastos, totalIngresos, ganancia, clientesQueDeben,
  pendienteConvertir, onClientesQueDebenClick, showDeudores,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Gastos del Mes</p>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </div>
        <p className="mt-2 text-2xl font-bold text-destructive">${totalGastos.toLocaleString()}</p>
        <p className="text-[11px] text-muted-foreground mt-1">Lo que pagas a proveedores</p>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Ingresos Reales</p>
          <TrendingUp className="h-4 w-4 text-success" />
        </div>
        <p className="mt-2 text-2xl font-bold text-success">${totalIngresos.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        <p className="text-[11px] text-muted-foreground mt-1">USDT de cortes + pagos USD</p>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Ganancia Neta</p>
          <DollarSign className="h-4 w-4 text-primary" />
        </div>
        <p className={`mt-2 text-2xl font-bold ${ganancia >= 0 ? 'text-success' : 'text-destructive'}`}>
          ${ganancia.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">Ingresos reales - Gastos</p>
      </div>

      {onClientesQueDebenClick ? (
        <button
          onClick={onClientesQueDebenClick}
          className={'stat-card text-left transition-all ' + (clientesQueDeben > 0 ? 'hover:ring-2 hover:ring-warning/50 cursor-pointer' : '')}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Clientes que Deben</p>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-warning" />
              {clientesQueDeben > 0 && (
                showDeudores
                  ? <ChevronUp className="h-3.5 w-3.5 text-warning" />
                  : <ChevronDown className="h-3.5 w-3.5 text-warning" />
              )}
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-warning">{clientesQueDeben}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {clientesQueDeben > 0 ? 'Click para ver y cobrar' : 'Todos al dia'}
          </p>
        </button>
      ) : (
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Clientes que Deben</p>
            <AlertCircle className="h-4 w-4 text-warning" />
          </div>
          <p className="mt-2 text-2xl font-bold text-warning">{clientesQueDeben}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Sin pago este mes</p>
        </div>
      )}

      <div className="stat-card">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Pendiente Convertir</p>
          <ArrowRightLeft className="h-4 w-4 text-warning" />
        </div>
        <p className="mt-2 text-2xl font-bold text-warning">{pendienteConvertir.count}</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {pendienteConvertir.count > 0 ? pendienteConvertir.label : 'Todo convertido'}
        </p>
      </div>
    </div>
  );
}
