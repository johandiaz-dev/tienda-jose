import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from './config';

type Seccion = 'inventario' | 'movimientos';

interface Categoria {
  id: number | string;
  nombre: string;
}

export default function App() {
  const [seccion, setSeccion] = useState<Seccion>('inventario');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorConexion, setErrorConexion] = useState<string | null>(null);

  async function cargarCategorias() {
    setCargando(true);
    setErrorConexion(null);

    const { data, error } = await supabase
      .from('categorias')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) {
      setErrorConexion(error.message);
      setCategorias([]);
    } else {
      setCategorias(data ?? []);
    }

    setCargando(false);
  }

  useEffect(() => {
    void cargarCategorias();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <header className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <a
            href="#inventario"
            onClick={(e) => {
              e.preventDefault();
              setSeccion('inventario');
            }}
            className="font-display text-xl font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0"
          >
            Tienda-jose
          </a>

          <nav aria-label="Navegación principal" className="flex items-center gap-6 sm:gap-8">
            <button
              type="button"
              onClick={() => setSeccion('inventario')}
              aria-current={seccion === 'inventario' ? 'page' : undefined}
              className={`relative py-2 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                seccion === 'inventario'
                  ? 'text-[#1D4ED8]'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Inventario
              {seccion === 'inventario' && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-[#1D4ED8]"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setSeccion('movimientos')}
              aria-current={seccion === 'movimientos' ? 'page' : undefined}
              className={`relative py-2 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                seccion === 'movimientos'
                  ? 'text-[#1D4ED8]'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Movimientos
              {seccion === 'movimientos' && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-[#1D4ED8]"
                />
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {seccion === 'inventario' ? (
          <section aria-labelledby="titulo-inventario" className="space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div>
                <h1
                  id="titulo-inventario"
                  className="font-display text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl"
                >
                  Inventario
                </h1>
                <p className="mt-1 max-w-prose text-sm text-[#475569]">
                  Prueba de conexión con la base de datos leyendo las categorías registradas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void cargarCategorias()}
                disabled={cargando}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors duration-150 hover:border-[#CBD5E1] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`h-4 w-4 text-[#475569] ${cargando ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Volver a consultar</span>
              </button>
            </div>

            {errorConexion && (
              <div
                role="alert"
                className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3.5 text-sm text-[#B91C1C]"
              >
                <p className="font-semibold">No se pudo leer la tabla de categorías en Supabase.</p>
                <p className="mt-1 font-mono text-xs text-[#991B1B]">{errorConexion}</p>
                <p className="mt-2 text-xs text-[#7F1D1D]">
                  Verifica la URL, la publishable key en la configuración o los permisos de lectura
                  en Supabase e intenta de nuevo.
                </p>
              </div>
            )}

            {!errorConexion && (
              <div className="overflow-hidden rounded-md border border-[#E2E8F0] bg-[#FFFFFF]">
                <div className="flex items-center justify-between border-b-2 border-double border-[#CBD5E1] px-4 py-3 sm:px-5">
                  <h2 className="text-sm font-semibold text-[#0F172A]">
                    Categorías en la base de datos
                  </h2>
                  {!cargando && (
                    <span className="font-mono text-xs font-medium text-[#475569] tabular-nums">
                      {categorias.length}{' '}
                      {categorias.length === 1 ? 'categoría' : 'categorías'}
                    </span>
                  )}
                </div>

                {cargando ? (
                  <div className="divide-y divide-[#E2E8F0]" aria-busy="true">
                    {[1, 2, 3, 4].map((fila) => (
                      <div key={fila} className="px-4 py-3.5 sm:px-5">
                        <div className="h-4 w-44 animate-pulse rounded bg-[#E2E8F0]" />
                      </div>
                    ))}
                  </div>
                ) : categorias.length === 0 ? (
                  <div className="px-4 py-8 text-center sm:px-5">
                    <p className="text-sm font-medium text-[#0F172A]">
                      La conexión respondió, pero la tabla categorías no tiene filas todavía.
                    </p>
                    <p className="mt-1 text-sm text-[#475569]">
                      Agrega categorías en Supabase o verifica las políticas de lectura y vuelve a
                      consultar.
                    </p>
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b-2 border-double border-[#CBD5E1] bg-[#F8FAFC] text-xs font-semibold text-[#475569]">
                        <th scope="col" className="px-4 py-2.5 sm:px-5">
                          Nombre
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-sm">
                      {categorias.map((categoria) => (
                        <tr
                          key={categoria.id}
                          className="transition-colors duration-100 hover:bg-[#F8FAFC]"
                        >
                          <td className="px-4 py-3 font-medium text-[#0F172A] sm:px-5">
                            {categoria.nombre}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </section>
        ) : (
          <section aria-labelledby="titulo-movimientos" className="space-y-6">
            <div className="border-b border-[#E2E8F0] pb-4">
              <h1
                id="titulo-movimientos"
                className="font-display text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl"
              >
                Movimientos
              </h1>
              <p className="mt-1 max-w-prose text-sm text-[#475569]">
                Espacio reservado para registrar entradas y salidas de mercancía en los siguientes
                pasos.
              </p>
            </div>

            <div className="rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-5 py-8">
              <p className="max-w-prose text-sm text-[#475569]">
                Esta sección mostrará el formulario de entradas y salidas junto al historial más
                reciente cuando se construya la ventana de movimientos.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
