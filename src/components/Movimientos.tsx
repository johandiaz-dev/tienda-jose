import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../config';

export interface ProductoInventario {
  id: number | string;
  nombre: string;
  categoria: string;
  categoria_id: number | string;
  precio: number;
  stock_actual: number;
  stock_minimo: number;
  stock_bajo: boolean;
}

type TipoMovimiento = 'entrada' | 'salida';

interface MovimientoRegistro {
  id: number | string;
  producto_id: number | string;
  tipo: TipoMovimiento;
  cantidad: number;
  nota: string | null;
  creado_en: string;
}

interface MovimientosProps {
  productos: ProductoInventario[];
  cargandoProductos: boolean;
  productoPreseleccionadoId?: string | null;
  onLimpiarPreseleccion?: () => void;
  onRecargarTodo: () => Promise<void>;
  onActividadChange?: (activo: boolean) => void;
}

interface ErroresFormulario {
  productoId?: string;
  cantidad?: string;
}

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha);
}

export function Movimientos({
  productos,
  cargandoProductos,
  productoPreseleccionadoId,
  onLimpiarPreseleccion,
  onRecargarTodo,
  onActividadChange,
}: MovimientosProps) {
  const [movimientos, setMovimientos] = useState<MovimientoRegistro[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(true);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);

  const [productoId, setProductoId] = useState<string>('');
  const [tipo, setTipo] = useState<TipoMovimiento>('entrada');
  const [cantidad, setCantidad] = useState<string>('');
  const [nota, setNota] = useState<string>('');

  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState<boolean>(false);

  const refProducto = useRef<HTMLSelectElement>(null);
  const refCantidad = useRef<HTMLInputElement>(null);
  const refRadioEntrada = useRef<HTMLButtonElement>(null);
  const refRadioSalida = useRef<HTMLButtonElement>(null);

  const cargarHistorial = useCallback(async () => {
    setCargandoHistorial(true);
    setErrorHistorial(null);

    const { data, error } = await supabase
      .from('movimientos')
      .select('id, producto_id, tipo, cantidad, nota, creado_en')
      .order('creado_en', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      setErrorHistorial(error.message);
      setCargandoHistorial(false);
      return;
    }

    setMovimientos((data as MovimientoRegistro[]) ?? []);
    setCargandoHistorial(false);
  }, []);

  useEffect(() => {
    void cargarHistorial();
  }, [cargarHistorial]);

  useEffect(() => {
    onActividadChange?.(cargandoHistorial || registrando);
    return () => {
      onActividadChange?.(false);
    };
  }, [cargandoHistorial, registrando, onActividadChange]);

  const mapaProductos = useMemo(() => {
    const mapa = new Map<string, ProductoInventario>();
    for (const producto of productos) {
      mapa.set(String(producto.id), producto);
    }
    return mapa;
  }, [productos]);

  useEffect(() => {
    if (!productoPreseleccionadoId) {
      return;
    }

    const producto = mapaProductos.get(productoPreseleccionadoId);
    setProductoId(productoPreseleccionadoId);
    setTipo(producto?.stock_bajo ? 'entrada' : 'salida');
    setErrores({});
    setErrorRegistro(null);
    setMensajeExito(null);
    onLimpiarPreseleccion?.();
    refCantidad.current?.focus();
  }, [productoPreseleccionadoId, mapaProductos, onLimpiarPreseleccion]);

  const productoSeleccionado = productoId ? mapaProductos.get(productoId) : undefined;

  const avisoStockSalida = useMemo(() => {
    if (tipo !== 'salida' || !productoSeleccionado) {
      return null;
    }

    if (productoSeleccionado.stock_actual <= 0) {
      return 'Este producto tiene 0 unidades disponibles; no podrás registrar una salida hasta anotar una entrada.';
    }

    const cantidadLimpia = cantidad.trim();
    if (/^\d+$/.test(cantidadLimpia)) {
      const numero = Number.parseInt(cantidadLimpia, 10);
      if (numero > productoSeleccionado.stock_actual) {
        const unidadTexto = productoSeleccionado.stock_actual === 1 ? 'unidad' : 'unidades';
        return `La cantidad supera el stock disponible: quedan ${productoSeleccionado.stock_actual} ${unidadTexto}.`;
      }
    }

    return null;
  }, [tipo, productoSeleccionado, cantidad]);

  function manejarTecladoTipo(evento: KeyboardEvent<HTMLButtonElement>) {
    if (
      evento.key !== 'ArrowLeft' &&
      evento.key !== 'ArrowRight' &&
      evento.key !== 'ArrowUp' &&
      evento.key !== 'ArrowDown'
    ) {
      return;
    }

    evento.preventDefault();
    const siguienteTipo: TipoMovimiento = tipo === 'entrada' ? 'salida' : 'entrada';
    setTipo(siguienteTipo);
    setErrorRegistro(null);
    setMensajeExito(null);

    if (siguienteTipo === 'entrada') {
      refRadioEntrada.current?.focus();
    } else {
      refRadioSalida.current?.focus();
    }
  }

  function validar(): ErroresFormulario {
    const nuevosErrores: ErroresFormulario = {};

    if (productoId === '') {
      nuevosErrores.productoId = 'Falta el producto. Elige uno de la lista.';
    }

    const cantidadLimpia = cantidad.trim();
    if (cantidadLimpia === '') {
      nuevosErrores.cantidad = 'Falta la cantidad. Escribe cuántas unidades entran o salen.';
    } else if (!/^\d+$/.test(cantidadLimpia) || Number.parseInt(cantidadLimpia, 10) <= 0) {
      nuevosErrores.cantidad =
        'La cantidad no es válida. Escribe un número entero mayor que 0.';
    }

    return nuevosErrores;
  }

  async function manejarRegistro(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorRegistro(null);
    setMensajeExito(null);

    const nuevosErrores = validar();
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      if (nuevosErrores.productoId) {
        refProducto.current?.focus();
      } else if (nuevosErrores.cantidad) {
        refCantidad.current?.focus();
      }
      return;
    }

    const productoElegido = mapaProductos.get(productoId);
    const productoValor = productoElegido ? productoElegido.id : productoId;
    const cantidadNumero = Number.parseInt(cantidad.trim(), 10);
    const notaLimpia = nota.trim();

    setRegistrando(true);

    const { error } = await supabase.from('movimientos').insert({
      producto_id: productoValor,
      tipo,
      cantidad: cantidadNumero,
      nota: notaLimpia === '' ? null : notaLimpia,
    });

    if (error) {
      setErrorRegistro(error.message);
      setRegistrando(false);
      return;
    }

    const nombreProducto = productoElegido ? productoElegido.nombre : 'producto seleccionado';
    const accionTexto = tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada';
    const unidadTexto = cantidadNumero === 1 ? 'unidad' : 'unidades';

    setProductoId('');
    setTipo('entrada');
    setCantidad('');
    setNota('');
    setErrores({});
    setRegistrando(false);
    setMensajeExito(`${accionTexto}: ${cantidadNumero} ${unidadTexto} en «${nombreProducto}».`);

    await Promise.all([cargarHistorial(), onRecargarTodo()]);
  }

  return (
    <section aria-labelledby="titulo-movimientos" className="space-y-6">
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1
          id="titulo-movimientos"
          className="font-display text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl"
        >
          Movimientos
        </h1>
        <p className="mt-1 max-w-prose text-sm text-[#475569]">
          Registra entradas de proveedor o salidas de mercancía para mantener el stock al día.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="rounded-md border border-[#E2E8F0] bg-[#FFFFFF] p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-[#0F172A]">
              Registrar movimiento
            </h2>

            <form onSubmit={(e) => void manejarRegistro(e)} noValidate className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="mov-producto"
                  className="block text-sm font-medium text-[#0F172A]"
                >
                  Producto
                </label>
                <select
                  ref={refProducto}
                  id="mov-producto"
                  value={productoId}
                  onChange={(e) => {
                    setProductoId(e.target.value);
                    setErrorRegistro(null);
                    setMensajeExito(null);
                    if (errores.productoId) {
                      setErrores((prev) => ({ ...prev, productoId: undefined }));
                    }
                  }}
                  disabled={cargandoProductos || registrando}
                  aria-invalid={Boolean(errores.productoId)}
                  aria-describedby={errores.productoId ? 'error-mov-producto' : undefined}
                  className={`mt-1.5 min-h-[44px] w-full rounded-md border bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#0F172A] transition-colors duration-150 disabled:opacity-60 ${
                    errores.productoId
                      ? 'border-[#B91C1C] focus:border-[#B91C1C]'
                      : 'border-[#E2E8F0] focus:border-[#1D4ED8]'
                  }`}
                >
                  <option value="">
                    {cargandoProductos ? 'Cargando productos...' : 'Selecciona un producto'}
                  </option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={String(producto.id)}>
                      {producto.nombre} — Stock: {producto.stock_actual}
                    </option>
                  ))}
                </select>
                {productoSeleccionado && (
                  <p className="mt-1.5 text-xs text-[#475569]">
                    Stock actual:{' '}
                    <span className="font-mono font-medium text-[#0F172A] tabular-nums">
                      {productoSeleccionado.stock_actual}
                    </span>{' '}
                    {productoSeleccionado.stock_actual === 1 ? 'unidad' : 'unidades'}
                  </p>
                )}
                {errores.productoId && (
                  <p
                    id="error-mov-producto"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-[#B91C1C]"
                  >
                    {errores.productoId}
                  </p>
                )}
              </div>

              <div>
                <span id="etiqueta-tipo" className="block text-sm font-medium text-[#0F172A]">
                  Tipo de movimiento
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="etiqueta-tipo"
                  className="mt-1.5 grid grid-cols-2 gap-2.5"
                >
                  <button
                    ref={refRadioEntrada}
                    type="button"
                    role="radio"
                    aria-checked={tipo === 'entrada'}
                    tabIndex={tipo === 'entrada' ? 0 : -1}
                    disabled={registrando}
                    onKeyDown={manejarTecladoTipo}
                    onClick={() => {
                      setTipo('entrada');
                      setErrorRegistro(null);
                      setMensajeExito(null);
                    }}
                    className={`min-h-[44px] rounded-md border px-3.5 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-60 ${
                      tipo === 'entrada'
                        ? 'border-[#15803D] bg-[#F0FDF4] text-[#15803D]'
                        : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    Entrada
                  </button>

                  <button
                    ref={refRadioSalida}
                    type="button"
                    role="radio"
                    aria-checked={tipo === 'salida'}
                    tabIndex={tipo === 'salida' ? 0 : -1}
                    disabled={registrando}
                    onKeyDown={manejarTecladoTipo}
                    onClick={() => {
                      setTipo('salida');
                      setErrorRegistro(null);
                      setMensajeExito(null);
                    }}
                    className={`min-h-[44px] rounded-md border px-3.5 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-60 ${
                      tipo === 'salida'
                        ? 'border-[#B91C1C] bg-[#FEF2F2] text-[#B91C1C]'
                        : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    Salida
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="mov-cantidad"
                  className="block text-sm font-medium text-[#0F172A]"
                >
                  Cantidad
                </label>
                <input
                  ref={refCantidad}
                  id="mov-cantidad"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  disabled={registrando}
                  value={cantidad}
                  onChange={(e) => {
                    setCantidad(e.target.value);
                    setErrorRegistro(null);
                    setMensajeExito(null);
                    if (errores.cantidad) {
                      setErrores((prev) => ({ ...prev, cantidad: undefined }));
                    }
                  }}
                  aria-invalid={Boolean(errores.cantidad)}
                  aria-describedby={
                    errores.cantidad
                      ? 'error-mov-cantidad'
                      : avisoStockSalida
                        ? 'aviso-stock-salida'
                        : undefined
                  }
                  placeholder="Ej. 10"
                  className={`mt-1.5 min-h-[44px] w-full rounded-md border bg-[#FFFFFF] px-3.5 py-2 font-mono text-sm text-[#0F172A] tabular-nums placeholder:font-sans placeholder:text-[#64748B] transition-colors duration-150 disabled:opacity-60 ${
                    errores.cantidad
                      ? 'border-[#B91C1C] focus:border-[#B91C1C]'
                      : 'border-[#E2E8F0] focus:border-[#1D4ED8]'
                  }`}
                />
                {errores.cantidad && (
                  <p
                    id="error-mov-cantidad"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-[#B91C1C]"
                  >
                    {errores.cantidad}
                  </p>
                )}
                {!errores.cantidad && avisoStockSalida && (
                  <p
                    id="aviso-stock-salida"
                    role="status"
                    className="mt-1.5 text-xs font-medium text-[#B45309]"
                  >
                    {avisoStockSalida}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="mov-nota" className="block text-sm font-medium text-[#0F172A]">
                  Nota <span className="font-normal text-[#475569]">(opcional)</span>
                </label>
                <input
                  id="mov-nota"
                  type="text"
                  disabled={registrando}
                  value={nota}
                  onChange={(e) => {
                    setNota(e.target.value);
                    setMensajeExito(null);
                  }}
                  placeholder="Ej. Pedido semanal o venta en mostrador"
                  className="mt-1.5 min-h-[44px] w-full rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] transition-colors duration-150 focus:border-[#1D4ED8] disabled:opacity-60"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={registrando || cargandoProductos}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-[#FFFFFF] transition-colors duration-150 hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap cursor-pointer"
                >
                  {registrando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  <span>Registrar</span>
                </button>
              </div>
            </form>
          </div>

          {errorRegistro && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3.5 text-sm text-[#B91C1C]"
            >
              <p className="font-semibold">{errorRegistro}</p>
              <p className="mt-1 text-xs text-[#7F1D1D]">
                Ajusta la cantidad según el stock disponible o revisa la conexión e intenta de
                nuevo.
              </p>
            </div>
          )}

          {mensajeExito && !errorRegistro && (
            <div
              role="status"
              className="mt-4 flex items-center justify-between gap-3 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-medium text-[#15803D]"
            >
              <p>{mensajeExito}</p>
              <button
                type="button"
                onClick={() => setMensajeExito(null)}
                className="min-h-[36px] rounded px-2 text-xs font-medium text-[#15803D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-md border border-[#E2E8F0] bg-[#FFFFFF]">
            <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] px-4 py-3.5 sm:px-5">
              <h2 className="font-display text-lg font-bold text-[#0F172A]">Historial</h2>

              <button
                type="button"
                onClick={() => void cargarHistorial()}
                disabled={cargandoHistorial}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#0F172A] transition-colors duration-150 hover:bg-[#F8FAFC] disabled:opacity-60 sm:min-h-[36px] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 text-[#475569] ${cargandoHistorial ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Actualizar historial</span>
              </button>
            </div>

            {errorHistorial ? (
              <div role="alert" className="px-4 py-6 text-sm text-[#B91C1C] sm:px-5">
                <p className="font-semibold">No se pudo cargar el historial de movimientos.</p>
                <p className="mt-1 font-mono text-xs text-[#991B1B]">{errorHistorial}</p>
                <p className="mt-1.5 text-xs text-[#7F1D1D]">
                  Revisa tu conexión o los permisos en Supabase y vuelve a actualizar el historial.
                </p>
              </div>
            ) : cargandoHistorial ? (
              <div className="divide-y divide-[#E2E8F0]" aria-busy="true">
                <div className="border-b-2 border-double border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 sm:px-5">
                  <div className="h-3.5 w-28 rounded bg-[#E2E8F0]" />
                </div>
                {[1, 2, 3, 4].map((fila) => (
                  <div
                    key={fila}
                    className="grid grid-cols-5 items-center gap-4 px-4 py-3.5 sm:px-5"
                  >
                    <div className="h-4 w-24 animate-pulse rounded bg-[#F1F5F9]" />
                    <div className="h-4 w-28 animate-pulse rounded bg-[#E2E8F0]" />
                    <div className="h-4 w-14 animate-pulse rounded bg-[#F1F5F9]" />
                    <div className="ml-auto h-4 w-10 animate-pulse rounded bg-[#E2E8F0]" />
                    <div className="h-4 w-20 animate-pulse rounded bg-[#F1F5F9]" />
                  </div>
                ))}
              </div>
            ) : movimientos.length === 0 ? (
              <div className="px-4 py-10 text-center sm:px-6">
                <p className="text-sm font-medium text-[#0F172A]">
                  Aún no hay movimientos registrados.
                </p>
                <p className="mt-1 text-sm text-[#475569]">
                  Usa el formulario para anotar la primera entrada o salida de mercancía.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-double border-[#CBD5E1] bg-[#F8FAFC] text-xs font-semibold text-[#475569]">
                      <th scope="col" className="px-4 py-3 sm:px-5">
                        Fecha
                      </th>
                      <th scope="col" className="px-4 py-3 sm:px-5">
                        Producto
                      </th>
                      <th scope="col" className="px-4 py-3 sm:px-5">
                        Tipo
                      </th>
                      <th scope="col" className="px-4 py-3 text-right sm:px-5">
                        Cantidad
                      </th>
                      <th scope="col" className="px-4 py-3 sm:px-5">
                        Nota
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-sm">
                    {movimientos.map((movimiento) => {
                      const producto = mapaProductos.get(String(movimiento.producto_id));
                      const esEntrada = movimiento.tipo === 'entrada';

                      return (
                        <tr key={movimiento.id}>
                          <td className="px-4 py-3 font-mono text-xs text-[#475569] tabular-nums whitespace-nowrap sm:px-5">
                            {formatearFecha(movimiento.creado_en)}
                          </td>
                          <td className="px-4 py-3 font-medium text-[#0F172A] sm:px-5">
                            {producto ? producto.nombre : `Producto ${movimiento.producto_id}`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap sm:px-5">
                            <span
                              className={`font-semibold ${
                                esEntrada ? 'text-[#15803D]' : 'text-[#B91C1C]'
                              }`}
                            >
                              {esEntrada ? 'Entrada' : 'Salida'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#0F172A] tabular-nums sm:px-5">
                            {movimiento.cantidad}
                          </td>
                          <td className="px-4 py-3 text-[#475569] sm:px-5">
                            {movimiento.nota ? (
                              movimiento.nota
                            ) : (
                              <span className="text-[#64748B]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
