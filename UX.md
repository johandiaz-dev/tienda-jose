# Plan de mejoras de usabilidad — Tienda-jose

Este documento define las mejoras de usabilidad de **Tienda-jose** basadas en las **10 heurísticas de Jakob Nielsen**, adaptadas al ritmo real de una tienda de barrio: atención rápida en mostrador desde celular o computador, pedidos a proveedores y control diario de entradas y salidas sin depender de un cuaderno de papel.

El plan pone foco especial en tres pilares críticos para el tendero: **prevención de errores**, **consistencia** y **eficiencia de uso**.

---

## 1. Prevención de errores (Heurística 5 y Heurística 9)

En una tienda de barrio, un número mal digitado o una salida registrada sin existencias descuadra la caja y la bodega. La interfaz debe evitar fallos antes de que ocurran y permitir corregirlos sin volver a llenar todo el formulario.

- **Validación estricta de enteros y montos en formularios**
  - En **Nuevo producto**, impedir guardar con campos vacíos, precios negativos o precio igual a `0` (*«Ingresa un precio mayor a 0»*), y stock mínimo negativo.
  - En **Movimientos**, restringir **Cantidad** a enteros mayores que `0`.
- **Advertencia preventiva antes de registrar salidas imposibles**
  - Mostrar las unidades disponibles junto al producto en el selector (`Arroz Diana — Stock: 5`) y debajo del campo cuando se elige un producto.
  - Si el usuario selecciona **Salida** para un producto con stock `0` o digita una cantidad superior al stock actual, mostrar una advertencia preventiva inmediata antes de enviar, sin bloquear el envío para que el trigger de Supabase siga siendo la fuente de verdad.
- **Recuperación sin pérdida de datos ante rechazos de la base de datos**
  - Si Supabase rechaza una salida (por ejemplo, *«No hay suficiente stock: quedan 5 unidades»*), mostrar el mensaje exacto debajo del formulario con `role="alert"` y conservar seleccionados el producto, el tipo, la cantidad y la nota para que el tendero solo ajuste la cifra.
- **Reglas del negocio visibles en el punto de decisión**
  - En **Nuevo producto**, mantener visible el aviso *«El producto empieza con stock 0. El stock solo cambia cuando registras una entrada o una salida»* para evitar que el usuario busque un campo de inventario inicial.
  - Si se agrega edición o borrado futuro, exigir confirmación clara antes de acciones destructivas y proteger con `Escape` solo cuando el formulario no tiene cambios sin guardar.
- **Mensajes de error accionables (Heurística 9)**
  - Todo error de campo o conexión indica qué ocurrió y cómo resolverlo (por ejemplo, revisar la conexión o ajustar la cantidad) e incluye `role="alert"` para lectores de pantalla.

---

## 2. Consistencia y estándares (Heurística 4, Heurística 2 y Heurística 1)

Quien atiende la tienda necesita reconocer de inmediato dónde está, qué significa cada cifra y qué va a pasar al tocar un botón.

- **Lenguaje de tienda de barrio, no técnico (Heurística 2)**
  - Usar términos cotidianos en español claro: *Inventario*, *Movimientos*, *Entrada*, *Salida*, *Stock mínimo*, *Precio en pesos*, *Stock bajo*.
  - Evitar etiquetas en inglés o abreviaturas técnicas innecesarias.
- **Verbos claros y consistentes en botones**
  - Cada acción dice exactamente lo que hace en infinitivo o acción directa: **Nuevo producto**, **Guardar producto**, **Registrar**, **Cancelar**, **Registrar movimiento**, **Actualizar historial**, **Mostrar todos los productos**.
- **Formato numérico contable uniforme**
  - Precios siempre en pesos colombianos con signo `$`, separador de miles con punto y sin decimales (`$12.500`).
  - Cantidades y columnas numéricas (`Precio`, `Stock`, `Mínimo`, `Cantidad`) alineadas a la derecha con cifras tabulares (`tabular-nums`) para comparar en columna como en un cuaderno contable.
- **Señalización accesible del estado del sistema (Heurística 1 y WCAG 2.2)**
  - Indicar claramente la pestaña activa en el menú superior (**Inventario** o **Movimientos**).
  - Mostrar confirmaciones visibles tras guardar (`role="status"`): *«Producto guardado con stock 0»* o *«Entrada/Salida registrada»*, además de recargar de inmediato tarjetas, tabla e historial.
  - Combinar siempre color y texto explícito en estados (**Stock bajo**, **Normal**, **Entrada**, **Salida**) con contraste mínimo de 4.5:1 (WCAG 2.2: 1.4.1 y 1.4.3).
  - Mantener etiquetas `<label>` visibles encima de cada campo y filtro (WCAG 2.2: 3.3.2), y foco de teclado visible en todos los controles.

---

## 3. Flexibilidad y eficiencia de uso (Heurística 7, Heurística 3 y Heurística 6)

Durante las horas pico o cuando llega un proveedor, la app debe resolver las tareas frecuentes en el menor número de toques posible.

- **Atajo directo de Inventario a Movimientos**
  - Incluir en cada fila de **Inventario** la acción **Registrar movimiento**, que abre **Movimientos** con el producto ya preseleccionado, enfoca el campo **Cantidad** y sugiere **Entrada** cuando el producto tiene **Stock bajo** (o **Salida** en caso contrario).
- **Filtro rápido de reposición («Solo stock bajo»)**
  - Junto al buscador por nombre y al selector de categoría, ofrecer un botón de un toque **Solo stock bajo** para que el tendero genere la lista de compra al proveedor en segundos.
- **Acceso en un clic a las vistas principales**
  - Navegación superior fija y compacta entre **Inventario** y **Movimientos**, más botón directo **Nuevo producto** tanto en el encabezado de Inventario como en el estado vacío cuando aún no hay productos.
- **Ergonomía para mostrador en celular y teclado**
  - Objetivos táctiles amplios (`>= 44px` de altura en móvil) en botones, selectores y controles **Entrada** / **Salida** para operar con una sola mano sin pulsaciones accidentales (WCAG 2.2: 2.5.8).
  - Foco automático en el primer campo al abrir **Nuevo producto**, navegación con flechas (`ArrowLeft` / `ArrowRight`) entre **Entrada** y **Salida**, y tecla `Escape` para volver rápidamente cuando no hay datos escritos.
- **Visualización directa sin ruido (Reconocimiento antes que recuerdo, Heurística 6)**
  - **Inventario**: tres tarjetas de resumen (total de productos, productos con stock bajo, movimientos registrados) y una sola tabla filtrable de consulta exacta.
  - **Movimientos**: formulario de registro junto al historial cronológico del más reciente al más antiguo para verificar al instante las últimas ventas o ingresos.
