import axios from 'axios';

// En desarrollo, usa rutas relativas que serán proxeadas por react-scripts
// En producción, usa la URL completa del backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.REACT_APP_API_URL || 'https://fixfast-backend.onrender.com/api')
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Servicio de Productos
export const productosService = {
  // Crear un nuevo producto
  crearProducto: async (producto) => {
    try {
      const response = await api.post('/productos', producto);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obtener todos los productos
  obtenerProductos: async () => {
    try {
      const response = await api.get('/productos');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obtener un producto por ID
  obtenerProductoPorId: async (id) => {
    try {
      const response = await api.get(`/productos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Actualizar un producto
  actualizarProducto: async (id, producto) => {
    try {
      const response = await api.put(`/productos/${id}`, producto);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Eliminar un producto
  eliminarProducto: async (id) => {
    try {
      const response = await api.delete(`/productos/${id}`);
      return response.data;
    } catch (error) {
      // Pasar el objeto de error completo para mejor manejo
      const errorData = error.response?.data || { message: error.message };
      if (error.response) {
        errorData.status = error.response.status;
      }
      throw errorData;
    }
  },
};

export default api;

