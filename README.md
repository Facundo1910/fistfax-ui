# FistFax UI - Sistema de Gestión de Ferretería

Aplicación React para la gestión de pedidos y stock de una ferretería.

## Características

- ✅ Gestión de productos (crear, listar)
- 🔄 Integración con API backend
- 🎨 Interfaz moderna y responsive

## Requisitos Previos

- Node.js (v14 o superior)
- npm o yarn
- Backend corriendo en `http://localhost:8080`

## Instalación

```bash
npm install
```

## Ejecutar la aplicación

```bash
npm start
```

La aplicación se abrirá en `http://localhost:3000`

## Estructura del Proyecto

```
src/
├── components/       # Componentes React
│   └── Productos.js  # Componente de gestión de productos
├── services/         # Servicios API
│   └── api.js       # Configuración y llamadas a la API
├── App.js           # Componente principal
└── index.js         # Punto de entrada
```

## API Endpoints

### Productos

- `POST /api/productos` - Crear un nuevo producto
- `GET /api/productos` - Obtener todos los productos
- `GET /api/productos/:id` - Obtener un producto por ID
- `PUT /api/productos/:id` - Actualizar un producto
- `DELETE /api/productos/:id` - Eliminar un producto

## Tecnologías Utilizadas

- React 19
- Axios
- CSS3

