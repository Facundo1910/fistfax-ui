import React, { useState, useEffect, useCallback, useRef } from 'react';
import { productosService } from '../services/api';
import './Productos.css';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState('error');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensajeModal, setMensajeModal] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 10;
  const prevProductosLengthRef = useRef(0);
  const [formData, setFormData] = useState({
    nombre: '',
    precioUnitario: '',
    stockActual: '',
    proveedor: '',
  });
  const [mostrarDropdownProveedor, setMostrarDropdownProveedor] = useState(false);
  const dropdownRef = useRef(null);

  const cargarProductos = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorType('error');
    try {
      const data = await productosService.obtenerProductos();
      setProductos(data);
    } catch (err) {
      setError('Error al cargar productos: ' + (err.message || 'Error desconocido'));
      setErrorType('error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const productoData = {
        nombre: formData.nombre,
        precioUnitario: Number.parseFloat(formData.precioUnitario),
        stockActual: Number.parseInt(formData.stockActual, 10),
        proveedor: formData.proveedor,
      };

      if (productoEditando) {
        await productosService.actualizarProducto(productoEditando.id, productoData);
        alert('Producto actualizado exitosamente');
      } else {
        await productosService.crearProducto(productoData);
        alert('Producto creado exitosamente');
      }
      
      setFormData({
        nombre: '',
        precioUnitario: '',
        stockActual: '',
        proveedor: '',
      });
      setMostrarFormulario(false);
      setProductoEditando(null);
      cargarProductos();
    } catch (err) {
      setError(`Error al ${productoEditando ? 'actualizar' : 'crear'} producto: ` + (err.message || 'Error desconocido'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (producto) => {
    setProductoEditando(producto);
    setFormData({
      nombre: producto.nombre,
      precioUnitario: producto.precioUnitario.toString(),
      stockActual: producto.stockActual.toString(),
      proveedor: producto.proveedor,
    });
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await productosService.eliminarProducto(id);
      alert('Producto eliminado exitosamente');
      cargarProductos();
    } catch (err) {
      const errorStatus = err.status || (err.error === 'Internal Server Error' ? 500 : null);
      const errorMessage = err.message || err.error || '';
      const errorString = JSON.stringify(err).toLowerCase();
      
      let mensaje = 'Error al eliminar producto';
      let esRestriccionPedido = false;
      
      if (
        errorStatus === 500 || 
        err.error === 'Internal Server Error' ||
        errorString.includes('constraint') ||
        errorString.includes('foreign key') ||
        errorString.includes('pedido') ||
        errorString.includes('order') ||
        errorMessage.toLowerCase().includes('pedido') ||
        errorMessage.toLowerCase().includes('constraint')
      ) {
        esRestriccionPedido = true;
        mensaje = 'No se puede eliminar este producto porque está siendo utilizado en uno o más pedidos.';
        setErrorType('warning');
      } else if (errorStatus === 404) {
        mensaje = 'Producto no encontrado.';
        setErrorType('error');
      } else if (errorStatus === 403 || errorStatus === 401) {
        mensaje = 'No tienes permisos para eliminar este producto.';
        setErrorType('error');
      } else {
        mensaje = `Error al eliminar producto: ${errorMessage || 'Error desconocido'}`;
        setErrorType('error');
      }
      
      setError(mensaje);
      console.error('Error al eliminar:', err);
      
      if (esRestriccionPedido) {
        setMensajeModal('Este producto no puede ser eliminado porque está asociado a pedidos existentes.\n\nPara eliminarlo, primero debes eliminar o modificar los pedidos que lo contienen.');
        setMostrarModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    setFormData({
      nombre: '',
      precioUnitario: '',
      stockActual: '',
      proveedor: '',
    });
    setProductoEditando(null);
    setMostrarFormulario(false);
  };

  const totalPaginas = Math.ceil(productos.length / productosPorPagina);

  const indiceInicio = (paginaActual - 1) * productosPorPagina;
  const indiceFin = indiceInicio + productosPorPagina;
  const productosPaginados = productos.slice(indiceInicio, indiceFin);

  const proveedoresUnicos = [...new Set(productos.map(p => p.proveedor).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  const proveedoresFiltrados = formData.proveedor
    ? proveedoresUnicos.filter(proveedor =>
        proveedor.toLowerCase().includes(formData.proveedor.toLowerCase())
      )
    : proveedoresUnicos;

  const handleProveedorChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      proveedor: value,
    });
    setMostrarDropdownProveedor(true);
  };

  const handleSeleccionarProveedor = (proveedor) => {
    setFormData({
      ...formData,
      proveedor: proveedor,
    });
    setMostrarDropdownProveedor(false);
  };

  const handleProveedorFocus = () => {
    setMostrarDropdownProveedor(true);
  };

  const handleProveedorBlur = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget)) {
      setTimeout(() => {
        setMostrarDropdownProveedor(false);
      }, 200);
    }
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const productosLengthCambio = productos.length !== prevProductosLengthRef.current;
    prevProductosLengthRef.current = productos.length;

    if (productosLengthCambio) {
      const nuevoTotalPaginas = Math.ceil(productos.length / productosPorPagina);
      if (nuevoTotalPaginas > 0 && paginaActual > nuevoTotalPaginas) {
        setPaginaActual(nuevoTotalPaginas);
      } else if (productos.length === 0 && paginaActual !== 1) {
        setPaginaActual(1);
      }
    }
  }, [productos.length, paginaActual, productosPorPagina]);

  return (
    <div className="productos-container">
      <div className="productos-header">
        <h2>Gestión de Productos</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (mostrarFormulario) {
              handleCancelar();
            } else {
              setMostrarFormulario(true);
              setProductoEditando(null);
            }
          }}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo Producto'}
        </button>
      </div>

      {error && (
        <div className={`alert ${errorType === 'warning' ? 'alert-warning' : 'alert-error'}`}>
          {error}
        </div>
      )}

      {mostrarFormulario && (() => {
        let buttonText;
        if (loading) {
          buttonText = productoEditando ? 'Actualizando...' : 'Creando...';
        } else {
          buttonText = productoEditando ? 'Actualizar Producto' : 'Crear Producto';
        }

        return (
        <form className="producto-form" onSubmit={handleSubmit}>
          <h3>{productoEditando ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
          <div className="form-group">
            <label htmlFor="nombre">Nombre del Producto</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="precioUnitario">Precio Unitario</label>
            <input
              type="number"
              id="precioUnitario"
              name="precioUnitario"
              value={formData.precioUnitario}
              onChange={handleInputChange}
              required
              step="0.01"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="stockActual">Stock Actual</label>
            <input
              type="number"
              id="stockActual"
              name="stockActual"
              value={formData.stockActual}
              onChange={handleInputChange}
              required
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="proveedor">Proveedor</label>
            <div className="proveedor-dropdown-container">
              <input
                type="text"
                id="proveedor"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleProveedorChange}
                onFocus={handleProveedorFocus}
                onBlur={handleProveedorBlur}
                required
                placeholder="Seleccione o escriba un proveedor"
                autoComplete="off"
              />
              {mostrarDropdownProveedor && proveedoresFiltrados.length > 0 && (
                <ul 
                  ref={dropdownRef}
                  className="proveedor-dropdown"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {proveedoresFiltrados.slice(0, 10).map((proveedor) => (
                    <li
                      key={proveedor}
                      className="proveedor-dropdown-item"
                      tabIndex={0}
                      onClick={() => handleSeleccionarProveedor(proveedor)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSeleccionarProveedor(proveedor);
                        }
                      }}
                    >
                      {proveedor}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-success" disabled={loading}>
            {buttonText}
          </button>
        </form>
        );
      })()}

      {loading && !mostrarFormulario && (
        <div className="loading">Cargando productos...</div>
      )}

      <div className="productos-list">
        {productos.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No hay productos registrados. Crea tu primer producto.</p>
          </div>
        ) : (
          <>
            <div className="pagination-info">
              <p>
                Mostrando {productosPaginados.length > 0 ? indiceInicio + 1 : 0} - {Math.min(indiceFin, productos.length)} de {productos.length} productos
              </p>
            </div>
            <table className="productos-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Precio Unitario</th>
                  <th>Stock Actual</th>
                  <th>Proveedor</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosPaginados.map((producto) => (
                  <tr key={producto.id}>
                    <td>{producto.id}</td>
                    <td>{producto.nombre}</td>
                    <td>${producto.precioUnitario?.toFixed(2) || '0.00'}</td>
                    <td>{producto.stockActual}</td>
                    <td>{producto.proveedor}</td>
                    <td>
                      <div className="acciones-buttons">
                        <button
                          className="btn btn-edit"
                          onClick={() => handleEditar(producto)}
                          disabled={loading}
                          title="Editar producto"
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleEliminar(producto.id)}
                          disabled={loading}
                          title="Eliminar producto"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {totalPaginas > 1 && (
              <div className="pagination-controls">
                <button
                  className="btn btn-pagination"
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1 || loading}
                  title="Página anterior"
                >
                  Anterior
                </button>
                
                <div className="pagination-numbers">
                  {(() => {
                    const paginas = [];
                    const mostrarElipsis = totalPaginas > 7;
                    
                    if (mostrarElipsis) {
                      paginas.push(1);
                      
                      if (paginaActual > 3) {
                        paginas.push('ellipsis-start');
                      }
                      
                      const inicio = Math.max(2, paginaActual - 1);
                      const fin = Math.min(totalPaginas - 1, paginaActual + 1);
                      
                      for (let i = inicio; i <= fin; i++) {
                        if (i !== 1 && i !== totalPaginas) {
                          paginas.push(i);
                        }
                      }
                      
                      if (paginaActual < totalPaginas - 2) {
                        paginas.push('ellipsis-end');
                      }
                      
                      if (totalPaginas > 1) {
                        paginas.push(totalPaginas);
                      }
                    } else {
                      for (let i = 1; i <= totalPaginas; i++) {
                        paginas.push(i);
                      }
                    }
                    
                    return paginas.map((item) => {
                      if (item === 'ellipsis-start' || item === 'ellipsis-end') {
                        return (
                          <span key={item} className="pagination-ellipsis">
                            ...
                          </span>
                        );
                      }
                      
                      return (
                        <button
                          key={item}
                          className={`btn btn-pagination ${item === paginaActual ? 'active' : ''}`}
                          onClick={() => cambiarPagina(item)}
                          disabled={loading}
                        >
                          {item}
                        </button>
                      );
                    });
                  })()}
                </div>
                
                <button
                  className="btn btn-pagination"
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas || loading}
                  title="Página siguiente"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {mostrarModal && (
        <dialog 
          className="modal-overlay" 
          open
          onCancel={(e) => {
            e.preventDefault();
            setMostrarModal(false);
          }}
          aria-labelledby="modal-title"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h3 id="modal-title">No se puede eliminar el producto</h3>
              <button 
                className="modal-close" 
                onClick={() => setMostrarModal(false)}
                aria-label="Cerrar"
                type="button"
              >
                Cerrar
              </button>
            </div>
            <div className="modal-body">
              <p>{mensajeModal}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary" 
                onClick={() => setMostrarModal(false)}
                type="button"
              >
                Entendido
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default Productos;

