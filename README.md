# 🧮 Calculadora en React

Una calculadora moderna, elegante y responsiva construida con **React** y **Vite**.

---

## ✨ Características

- 🔢 **Operaciones básicas**: Suma (`+`), resta (`−`), multiplicación (`×`), división (`÷`).
- 🔬 **Funciones científicas**:
  - **Raíz cuadrada (`√x`)**: Calcula la raíz cuadrada del número actual (con validación de números negativos).
  - **Logaritmo decimal (`log`)**: Logaritmo en base 10 ($\log_{10}$).
  - **Logaritmo natural (`ln`)**: Logaritmo en base $e$ ($\ln$).
  - **Potencia al cuadrado (`x²`)**: Eleva el valor actual al cuadrado.
- 🔄 **Operaciones adicionales**: Porcentaje (`%`), cambio de signo (`±`), borrado rápido (`⌫`) y borrado total (`C` / `AC`).
- ⌨️ **Soporte completo de teclado**:
  - Números: `0` - `9`
  - Operadores: `+`, `-`, `*`, `/`, `%`
  - Científicas: `R` (`√`), `L` (`log`), `N` (`ln`), `S` (`x²`)
  - Calcular: `Enter` o `=`
  - Borrar: `Backspace` (un dígito) y `Esc` / `c` (limpiar todo)
  - Decimal: `.` o `,`
- 🕒 **Historial de operaciones**: Panel desplegable para revisar cálculos previos y cargarlos con un solo clic.
- 📋 **Copiar al portapapeles**: Haz clic sobre el número en pantalla para copiarlo directamente.
- 🔊 **Efecto de sonido opcional**: Sonido sutil al presionar teclas (activable/desactivable desde la barra superior).
- 📱 **Diseño responsivo y pulido**: Estilo moderno oscuro con efectos de *glassmorphism* y animaciones de pulsación.

---

## 🚀 Cómo iniciar el proyecto

1. **Instalar dependencias** (si aún no lo has hecho):
   ```bash
   npm install
   ```

2. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

3. Abre el enlace local que te indicará la consola (por defecto: `http://localhost:5173`) en tu navegador web.

---

## 🛠️ Comandos disponibles

- `npm run dev`: Inicia el entorno local de desarrollo con Hot Module Replacement (HMR).
- `npm run build`: Genera la versión de producción optimizada en la carpeta `dist`.
- `npm run lint`: Ejecuta el linter (Oxlint) para verificar la calidad del código.
