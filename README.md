# Tienda-jose

Aplicación web de control de inventario y movimientos para una tienda de barrio. Permite llevar la cuenta exacta de cuántas unidades hay de cada producto a partir de las entradas y salidas registradas en Supabase, y avisa cuáles artículos están por agotarse.

## Qué hace la app

- Calcula las existencias a partir de cada movimiento registrado (el stock no se edita a mano; la base de datos lo actualiza mediante un trigger).
- Impide registrar salidas mayores al stock disponible.
- Señala con la etiqueta **Stock bajo** los productos cuyo stock actual es menor o igual al stock mínimo.
- Muestra precios en pesos colombianos con formato `$12.500`.

## Ventanas

1. **Inventario**: resume el total de productos, los productos con stock bajo y la cantidad de movimientos registrados. Incluye buscador por nombre, filtro por categoría, tabla de productos con su estado y el botón **Nuevo producto**.
2. **Nuevo producto**: formulario con nombre, categoría, precio y stock mínimo obligatorios. Todo producto nuevo inicia con stock `0` y al guardar vuelve a Inventario con los datos actualizados.
3. **Movimientos**: formulario para registrar una **Entrada** o **Salida** (producto con stock actual, cantidad mayor que `0` y nota opcional) junto al historial ordenado del movimiento más reciente al más antiguo.

## Variables de entorno

La aplicación se conecta a Supabase desde el cliente usando estas dos variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Puedes copiar `.env.example` como `.env` y completar ambos valores (si no se definen en el entorno, `src/config.ts` usa la configuración de respaldo del proyecto).

## Cómo ejecutarla en local

```bash
npm install
npm run dev
```

Para generar la compilación estática de producción:

```bash
npm run build
```
