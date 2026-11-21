import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { supabase } from './config';
import { Categoria, NuevoProducto } from './components/NuevoProducto';
import { Movimientos, ProductoInventario } from './components/Movimientos';

type Seccion = 'inventario' | 'movimientos';
type VistaInventario = 'lista' | 'nuevo';

function formatearPrecio(precio: number): string {
  const valor = Math.round(Number(precio) || 0);
  const negativo = valor < 0 ? '-' : '';
  const absoluto = Math.abs(valor)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo}$${absoluto}`;
}

export default function App() {
  const [seccion, setSeccion] = useState<Seccion>('inventario');
  const [vistaInventario, setVistaInventario] = useState<VistaInventario>('lista');

  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [totalMovimientos, setTotalMovimientos] = useState<number>(0);

  const [cargando, setCargando] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');

  const cargarInventario = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);

    const [resProductos, resCategorias, resMovimientos] = await Promise.all([
      supabase
        .from('vista_productos')
        .select('id, nombre, categoria, categoria_id, precio, stock_actual, stock_minimo, stock_bajo')
        .order('nombre', { ascending: true }),
      supabase.from('categorias').select('id, nombre').order('nombre', { ascending: true }),
      supabase.from('movimientos').select('id', { count: 'exact', head: true }),
    ]);

    const primerError = resProductos.error || resCategorias.error || resMovimientos.error;

    if (primerError) {
      setErrorCarga(primerError.message);
      setCargando(false);
      return;
    }

    setProductos((resProductos.data as ProductoInventario[]) ?? []);
    setCategorias((resCategorias.data as Categoria[]) ?? []);
    setTotalMovimientos(resMovimientos.count ?? 0);
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargarInventario();
  }, [cargarInventario]);

  const cantidadStockBajo = useMemo(
    () => productos.filter((producto) => producto.stock_bajo).length,
    [productos]
  );

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const coincideNombre = !texto || producto.nombre.toLowerCase().includes(texto);
      const coincideCategoria =
        !categoriaFiltro || String(producto.categoria_id) === categoriaFiltro;
      return coincideNombre && coincideCategoria;
    });
  }, [productos, busqueda, categoriaFiltro]);

  const hayFiltrosActivos = busqueda.trim() !== '' || categoriaFiltro !== '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <header className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:gap-8 sm:px-6">
          <a
            href="#inventario"
            onClick={(e) => {
              e.preventDefault();
              setSeccion('inventario');
              setVistaInventario('lista');
            }}
            className="py-3 font-display text-xl font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0"
          >
            Tienda-jose
          </a>

          <nav aria-label="Navegación principal" className="flex items-center gap-5 sm:gap-8">
            <button
              type="button"
              onClick={() => {
                setSeccion('inventario');
                setVistaInventario('lista');
              }}
              aria-current={seccion === 'inventario' ? 'page' : undefined}
              className={`min-h-[48px] border-b-2 px-1 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                seccion === 'inventario'
                  ? 'border-[#1D4ED8] text-[#1D4ED8]'
                  : 'border-transparent text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Inventario
            </button>

            <button
              type="button"
              onClick={() => setSeccion('movimientos')}
              aria-current={seccion === 'movimientos' ? 'page' : undefined}
              className={`min-h-[48px] border-b-2 px-1 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                seccion === 'movimientos'
                  ? 'border-[#1D4ED8] text-[#1D4ED8]'
                  : 'border-transparent text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Movimientos
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {seccion === 'inventario' ? (
          vistaInventario === 'nuevo' ? (
            <NuevoProducto
              categorias={categorias}
              onCancelar={() => setVistaInventario('lista')}
              onGuardado={async () => {
                setVistaInventario('lista');
                await cargarInventario();
              }}
            />
          ) : (
            <section aria-labelledby="titulo-inventario" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
                <div>
                  <h1
                    id="titulo-inventario"
                    className="font-display text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl"
                  >
                    Inventario
                  </h1>
                  <p className="mt-1 max-w-prose text-sm text-[#475569]">
                    Existencias actuales de la tienda y productos que necesitan reposición.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setVistaInventario('nuevo')}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-[#FFFFFF] transition-colors duration-150 hover:bg-[#1E40AF] sm:min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Nuevo producto</span>
                </button>
              </div>

            {errorCarga && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3.5 text-sm text-[#B91C1C]"
              >
                <div>
                  <p className="font-semibold">
                    No se pudo cargar el inventario desde Supabase.
                  </p>
                  <p className="mt-1 font-mono text-xs text-[#991B1B]">{errorCarga}</p>
                  <p className="mt-1.5 text-xs text-[#7F1D1D]">
                    Revisa tu conexión a internet o los permisos de lectura en Supabase y vuelve a
                    cargar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void cargarInventario()}
                  className="min-h-[44px] rounded-md border border-[#FECACA] bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#B91C1C] transition-colors duration-150 hover:bg-[#FEF2F2] sm:min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Volver a cargar
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-5 py-4">
                <p className="text-sm font-medium text-[#475569]">Total de productos</p>
                <p className="mt-2 font-display text-3xl font-bold text-[#0F172A] tabular-nums">
                  {cargando ? '—' : productos.length}
                </p>
              </div>

              <div className="rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-5 py-4">
                <p className="text-sm font-medium text-[#475569]">Productos con stock bajo</p>
                <p
                  className={`mt-2 font-display text-3xl font-bold tabular-nums ${
                    !cargando && cantidadStockBajo > 0 ? 'text-[#B91C1C]' : 'text-[#0F172A]'
                  }`}
                >
                  {cargando ? '—' : cantidadStockBajo}
                </p>
              </div>

              <div className="rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-5 py-4">
                <p className="text-sm font-medium text-[#475569]">Movimientos registrados</p>
                <p className="mt-2 font-display text-3xl font-bold text-[#0F172A] tabular-nums">
                  {cargando ? '—' : totalMovimientos}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-sm">
                <label htmlFor="buscador-productos" className="sr-only">
                  Buscar producto por nombre
                </label>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#475569]"
                  aria-hidden="true"
                />
                <input
                  id="buscador-productos"
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre"
                  className="min-h-[44px] w-full rounded-md border border-[#E2E8F0] bg-[#FFFFFF] pr-3.5 pl-10 text-sm text-[#0F172A] placeholder:text-[#64748B] transition-colors duration-150 focus:border-[#1D4ED8]"
                />
              </div>

              <div className="flex items-center gap-3">
                <label htmlFor="filtro-categoria" className="sr-only">
                  Filtrar por categoría
                </label>
                <select
                  id="filtro-categoria"
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="min-h-[44px] w-full rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#0F172A] transition-colors duration-150 focus:border-[#1D4ED8] sm:w-56"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={String(categoria.id)}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-[#E2E8F0] bg-[#FFFFFF]">
              {cargando ? (
                <div className="divide-y divide-[#E2E8F0]" aria-busy="true">
                  <div className="border-b-2 border-double border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 sm:px-5">
                    <div className="h-3.5 w-32 rounded bg-[#E2E8F0]" />
                  </div>
                  {[1, 2, 3, 4, 5].map((fila) => (
                    <div
                      key={fila}
                      className="grid grid-cols-6 items-center gap-4 px-4 py-3.5 sm:px-5"
                    >
                      <div className="col-span-2 h-4 w-3/4 animate-pulse rounded bg-[#E2E8F0]" />
                      <div className="h-4 w-20 animate-pulse rounded bg-[#F1F5F9]" />
                      <div className="ml-auto h-4 w-16 animate-pulse rounded bg-[#E2E8F0]" />
                      <div className="ml-auto h-4 w-10 animate-pulse rounded bg-[#F1F5F9]" />
                      <div className="h-4 w-16 animate-pulse rounded bg-[#F1F5F9]" />
                    </div>
                  ))}
                </div>
              ) : productos.length === 0 ? (
                <div className="px-4 py-10 text-center sm:px-6">
                  <p className="text-sm font-medium text-[#0F172A]">
                    No hay productos registrados todavía.
                  </p>
                  <p className="mt-1 text-sm text-[#475569]">
                    Cuando agregues el primer producto aparecerá aquí con su precio y existencias.
                  </p>
                </div>
              ) : productosFiltrados.length === 0 ? (
                <div className="px-4 py-10 text-center sm:px-6">
                  <p className="text-sm font-medium text-[#0F172A]">
                    Ningún producto coincide con los filtros actuales.
                  </p>
                  <p className="mt-1 text-sm text-[#475569]">
                    Prueba con otro nombre o vuelve a ver todas las categorías.
                  </p>
                  {hayFiltrosActivos && (
                    <button
                      type="button"
                      onClick={() => {
                        setBusqueda('');
                        setCategoriaFiltro('');
                      }}
                      className="mt-4 inline-flex min-h-[44px] items-center rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors duration-150 hover:bg-[#F8FAFC] sm:min-h-[40px] cursor-pointer"
                    >
                      Mostrar todos los productos
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-collapse text-left">
                    <thead>
                      <tr className="border-b-2 border-double border-[#CBD5E1] bg-[#F8FAFC] text-xs font-semibold text-[#475569]">
                        <th scope="col" className="px-4 py-3 sm:px-5">
                          Producto
                        </th>
                        <th scope="col" className="px-4 py-3 sm:px-5">
                          Categoría
                        </th>
                        <th scope="col" className="px-4 py-3 text-right sm:px-5">
                          Precio
                        </th>
                        <th scope="col" className="px-4 py-3 text-right sm:px-5">
                          Stock
                        </th>
                        <th scope="col" className="px-4 py-3 text-right sm:px-5">
                          Mínimo
                        </th>
                        <th scope="col" className="px-4 py-3 sm:px-5">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-sm">
                      {productosFiltrados.map((producto) => (
                        <tr key={producto.id}>
                          <td className="px-4 py-3 font-medium text-[#0F172A] sm:px-5">
                            {producto.nombre}
                          </td>
                          <td className="px-4 py-3 text-[#475569] sm:px-5">
                            {producto.categoria}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#0F172A] tabular-nums sm:px-5">
                            {formatearPrecio(producto.precio)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono tabular-nums sm:px-5 ${
                              producto.stock_bajo
                                ? 'font-semibold text-[#B91C1C]'
                                : 'text-[#0F172A]'
                            }`}
                          >
                            {producto.stock_actual}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#475569] tabular-nums sm:px-5">
                            {producto.stock_minimo}
                          </td>
                          <td className="px-4 py-3 sm:px-5 whitespace-nowrap">
                            {producto.stock_bajo ? (
                              <span className="font-semibold text-[#B91C1C]">Stock bajo</span>
                            ) : (
                              <span className="text-[#15803D]">Normal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
          )
        ) : (
          <Movimientos
            productos={productos}
            cargandoProductos={cargando}
            onRecargarTodo={cargarInventario}
          />
        )}
      </main>
    </div>
  );
}
