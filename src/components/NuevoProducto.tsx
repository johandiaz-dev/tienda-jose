import { FormEvent, useRef, useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { supabase } from '../config';

export interface Categoria {
  id: number | string;
  nombre: string;
}

interface NuevoProductoProps {
  categorias: Categoria[];
  onCancelar: () => void;
  onGuardado: () => Promise<void>;
}

interface ErroresFormulario {
  nombre?: string;
  categoriaId?: string;
  precio?: string;
  stockMinimo?: string;
}

export function NuevoProducto({ categorias, onCancelar, onGuardado }: NuevoProductoProps) {
  const [nombre, setNombre] = useState<string>('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [precio, setPrecio] = useState<string>('');
  const [stockMinimo, setStockMinimo] = useState<string>('');

  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [errorSupabase, setErrorSupabase] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<boolean>(false);

  const refNombre = useRef<HTMLInputElement>(null);
  const refCategoria = useRef<HTMLSelectElement>(null);
  const refPrecio = useRef<HTMLInputElement>(null);
  const refStockMinimo = useRef<HTMLInputElement>(null);

  function validar(): ErroresFormulario {
    const nuevosErrores: ErroresFormulario = {};

    if (nombre.trim() === '') {
      nuevosErrores.nombre = 'Escribe el nombre del producto.';
    }

    if (categoriaId === '') {
      nuevosErrores.categoriaId = 'Selecciona una categoría.';
    }

    const precioLimpio = precio.trim();
    if (precioLimpio === '') {
      nuevosErrores.precio = 'Escribe el precio en pesos.';
    } else if (!/^\d+$/.test(precioLimpio)) {
      nuevosErrores.precio = 'Ingresa un precio entero sin puntos ni decimales.';
    }

    const stockMinimoLimpio = stockMinimo.trim();
    if (stockMinimoLimpio === '') {
      nuevosErrores.stockMinimo = 'Escribe el stock mínimo.';
    } else if (!/^\d+$/.test(stockMinimoLimpio)) {
      nuevosErrores.stockMinimo = 'Ingresa un número entero igual o mayor que 0.';
    }

    return nuevosErrores;
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorSupabase(null);

    const nuevosErrores = validar();
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      if (nuevosErrores.nombre) {
        refNombre.current?.focus();
      } else if (nuevosErrores.categoriaId) {
        refCategoria.current?.focus();
      } else if (nuevosErrores.precio) {
        refPrecio.current?.focus();
      } else if (nuevosErrores.stockMinimo) {
        refStockMinimo.current?.focus();
      }
      return;
    }

    const categoriaElegida = categorias.find((c) => String(c.id) === categoriaId);
    const categoriaValor = categoriaElegida ? categoriaElegida.id : categoriaId;

    setGuardando(true);

    const { error } = await supabase.from('productos').insert({
      nombre: nombre.trim(),
      categoria_id: categoriaValor,
      precio: Number.parseInt(precio.trim(), 10),
      stock_actual: 0,
      stock_minimo: Number.parseInt(stockMinimo.trim(), 10),
    });

    if (error) {
      setErrorSupabase(error.message);
      setGuardando(false);
      return;
    }

    setGuardando(false);
    await onGuardado();
  }

  return (
    <section aria-labelledby="titulo-nuevo-producto" className="space-y-6">
      <div className="border-b border-[#E2E8F0] pb-5">
        <button
          type="button"
          onClick={onCancelar}
          disabled={guardando}
          className="mb-3 inline-flex min-h-[36px] items-center gap-1.5 text-sm font-medium text-[#475569] transition-colors duration-150 hover:text-[#0F172A] disabled:opacity-60 whitespace-nowrap cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Volver a Inventario</span>
        </button>

        <h1
          id="titulo-nuevo-producto"
          className="font-display text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl"
        >
          Nuevo producto
        </h1>
        <p className="mt-1 max-w-prose text-sm text-[#475569]">
          Registra un artículo nuevo en el catálogo de la tienda.
        </p>
      </div>

      <div className="max-w-2xl rounded-md border border-[#E2E8F0] bg-[#FFFFFF] p-5 sm:p-6">
        <div className="mb-6 flex items-start gap-3 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm text-[#334155]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4ED8]" aria-hidden="true" />
          <p>
            El producto empieza con stock 0. El stock solo cambia cuando registras una entrada o una
            salida.
          </p>
        </div>

        <form onSubmit={(e) => void manejarEnvio(e)} noValidate className="space-y-5">
          <div>
            <label htmlFor="campo-nombre" className="block text-sm font-medium text-[#0F172A]">
              Nombre
            </label>
            <input
              ref={refNombre}
              id="campo-nombre"
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errores.nombre) {
                  setErrores((prev) => ({ ...prev, nombre: undefined }));
                }
              }}
              aria-invalid={Boolean(errores.nombre)}
              aria-describedby={errores.nombre ? 'error-nombre' : undefined}
              placeholder="Ej. Arroz Diana 500 g"
              className={`mt-1.5 min-h-[42px] w-full rounded-md border bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] transition-colors duration-150 ${
                errores.nombre
                  ? 'border-[#B91C1C] focus:border-[#B91C1C]'
                  : 'border-[#E2E8F0] focus:border-[#1D4ED8]'
              }`}
            />
            {errores.nombre && (
              <p id="error-nombre" className="mt-1.5 text-xs font-medium text-[#B91C1C]">
                {errores.nombre}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="campo-categoria" className="block text-sm font-medium text-[#0F172A]">
              Categoría
            </label>
            <select
              ref={refCategoria}
              id="campo-categoria"
              value={categoriaId}
              onChange={(e) => {
                setCategoriaId(e.target.value);
                if (errores.categoriaId) {
                  setErrores((prev) => ({ ...prev, categoriaId: undefined }));
                }
              }}
              aria-invalid={Boolean(errores.categoriaId)}
              aria-describedby={errores.categoriaId ? 'error-categoria' : undefined}
              className={`mt-1.5 min-h-[42px] w-full rounded-md border bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#0F172A] transition-colors duration-150 ${
                errores.categoriaId
                  ? 'border-[#B91C1C] focus:border-[#B91C1C]'
                  : 'border-[#E2E8F0] focus:border-[#1D4ED8]'
              }`}
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={String(categoria.id)}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
            {errores.categoriaId && (
              <p id="error-categoria" className="mt-1.5 text-xs font-medium text-[#B91C1C]">
                {errores.categoriaId}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="campo-precio" className="block text-sm font-medium text-[#0F172A]">
                Precio (COP)
              </label>
              <input
                ref={refPrecio}
                id="campo-precio"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={precio}
                onChange={(e) => {
                  setPrecio(e.target.value);
                  if (errores.precio) {
                    setErrores((prev) => ({ ...prev, precio: undefined }));
                  }
                }}
                aria-invalid={Boolean(errores.precio)}
                aria-describedby={errores.precio ? 'error-precio' : undefined}
                placeholder="Ej. 3200"
                className={`mt-1.5 min-h-[42px] w-full rounded-md border bg-[#FFFFFF] px-3.5 py-2 font-mono text-sm text-[#0F172A] tabular-nums placeholder:font-sans placeholder:text-[#64748B] transition-colors duration-150 ${
                  errores.precio
                    ? 'border-[#B91C1C] focus:border-[#B91C1C]'
                    : 'border-[#E2E8F0] focus:border-[#1D4ED8]'
                }`}
              />
              {errores.precio && (
                <p id="error-precio" className="mt-1.5 text-xs font-medium text-[#B91C1C]">
                  {errores.precio}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="campo-stock-minimo"
                className="block text-sm font-medium text-[#0F172A]"
              >
                Stock mínimo
              </label>
              <input
                ref={refStockMinimo}
                id="campo-stock-minimo"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={stockMinimo}
                onChange={(e) => {
                  setStockMinimo(e.target.value);
                  if (errores.stockMinimo) {
                    setErrores((prev) => ({ ...prev, stockMinimo: undefined }));
                  }
                }}
                aria-invalid={Boolean(errores.stockMinimo)}
                aria-describedby={errores.stockMinimo ? 'error-stock-minimo' : undefined}
                placeholder="Ej. 5"
                className={`mt-1.5 min-h-[42px] w-full rounded-md border bg-[#FFFFFF] px-3.5 py-2 font-mono text-sm text-[#0F172A] tabular-nums placeholder:font-sans placeholder:text-[#64748B] transition-colors duration-150 ${
                  errores.stockMinimo
                    ? 'border-[#B91C1C] focus:border-[#B91C1C]'
                    : 'border-[#E2E8F0] focus:border-[#1D4ED8]'
                }`}
              />
              {errores.stockMinimo && (
                <p id="error-stock-minimo" className="mt-1.5 text-xs font-medium text-[#B91C1C]">
                  {errores.stockMinimo}
                </p>
              )}
            </div>
          </div>

          {errorSupabase && (
            <div
              role="alert"
              className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]"
            >
              <p className="font-mono text-xs sm:text-sm">{errorSupabase}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#E2E8F0] pt-5">
            <button
              type="button"
              onClick={onCancelar}
              disabled={guardando}
              className="min-h-[40px] rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors duration-150 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="min-h-[40px] rounded-md bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-[#FFFFFF] transition-colors duration-150 hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {guardando ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
