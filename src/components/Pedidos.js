import React, { useState, useEffect, useCallback } from 'react';
import { pedidosService, productosService } from '../services/api';
import './Pedidos.css';

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [nombreComprador, setNombreComprador] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);
  const [mostrarDetallePedido, setMostrarDetallePedido] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const pedidosPorPagina = 10;

  const cargarPedidos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pedidosService.obtenerPedidos();
      setPedidos(data);
    } catch (err) {
      setError('Error al cargar pedidos: ' + (err.message || 'Error desconocido'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarProductos = useCallback(async () => {
    try {
      const data = await productosService.obtenerProductos();
      setProductos(data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await cargarPedidos();
      await cargarProductos();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agregarAlCarrito = () => {
    if (!productoSeleccionado) {
      setError('Por favor selecciona un producto');
      return;
    }

    const producto = productos.find(p => p.id === Number.parseInt(productoSeleccionado, 10));
    if (!producto) {
      setError('Producto no encontrado');
      return;
    }

    if (cantidadSeleccionada <= 0) {
      setError('La cantidad debe ser mayor a cero');
      return;
    }

    if (cantidadSeleccionada > producto.stockActual) {
      setError('Stock insuficiente. Stock disponible: ' + producto.stockActual);
      return;
    }

    // Verificar si el producto ya está en el carrito
    const itemExistente = carrito.find(item => item.productoId === producto.id);
    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + cantidadSeleccionada;
      if (nuevaCantidad > producto.stockActual) {
        setError('Stock insuficiente. Stock disponible: ' + producto.stockActual);
        return;
      }
      setCarrito(carrito.map(item =>
        item.productoId === producto.id
          ? { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * producto.precioUnitario }
          : item
      ));
    } else {
      setCarrito([
        ...carrito,
        {
          productoId: producto.id,
          nombreProducto: producto.nombre,
          precioUnitario: producto.precioUnitario,
          cantidad: cantidadSeleccionada,
          subtotal: cantidadSeleccionada * producto.precioUnitario,
          stockDisponible: producto.stockActual
        }
      ]);
    }

    setError(null);
    setProductoSeleccionado('');
    setCantidadSeleccionada(1);
  };

  const eliminarDelCarrito = (productoId) => {
    setCarrito(carrito.filter(item => item.productoId !== productoId));
  };

  const actualizarCantidadCarrito = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }

    const item = carrito.find(item => item.productoId === productoId);
    if (!item) return;

    const producto = productos.find(p => p.id === productoId);
    if (nuevaCantidad > producto.stockActual) {
      setError('Stock insuficiente. Stock disponible: ' + producto.stockActual);
      return;
    }

    setCarrito(carrito.map(item =>
      item.productoId === productoId
        ? { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.precioUnitario }
        : item
    ));
    setError(null);
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombreComprador.trim()) {
      setError('El nombre del comprador es obligatorio');
      return;
    }

    if (carrito.length === 0) {
      setError('Debes agregar al menos un producto al carrito');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pedidoData = {
        nombreComprador: nombreComprador.trim(),
        items: carrito.map(item => ({
          productoId: item.productoId,
          cantidad: item.cantidad
        }))
      };

      await pedidosService.crearPedido(pedidoData);
      alert('Pedido creado exitosamente');

      // Limpiar formulario
      setNombreComprador('');
      setCarrito([]);
      setProductoSeleccionado('');
      setCantidadSeleccionada(1);
      setMostrarFormulario(false);

      // Recargar pedidos y productos (para actualizar stock)
      await cargarPedidos();
      await cargarProductos();
    } catch (err) {
      const errorMessage = err.message || err.error || 'Error desconocido';
      setError('Error al crear pedido: ' + errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    setNombreComprador('');
    setCarrito([]);
    setProductoSeleccionado('');
    setCantidadSeleccionada(1);
    setMostrarFormulario(false);
    setError(null);
  };

  const verDetallePedido = async (id) => {
    try {
      const pedido = await pedidosService.obtenerPedidoPorId(id);
      setMostrarDetallePedido(pedido);
    } catch (err) {
      setError('Error al cargar detalle del pedido: ' + (err.message || 'Error desconocido'));
      console.error(err);
    }
  };

  const totalPaginas = Math.ceil(pedidos.length / pedidosPorPagina);
  const indiceInicio = (paginaActual - 1) * pedidosPorPagina;
  const indiceFin = indiceInicio + pedidosPorPagina;
  const pedidosPaginados = pedidos.slice(indiceInicio, indiceFin);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'N/A';
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return fechaString;
    }
  };

  const productosDisponibles = productos.filter(p => p.stockActual > 0);

  return (
    <div className="pedidos-container">
      <div className="pedidos-header">
        <h2>Gestión de Pedidos</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (mostrarFormulario) {
              handleCancelar();
            } else {
              setMostrarFormulario(true);
              setError(null);
            }
          }}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo Pedido'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {mostrarFormulario && (
        <form className="pedido-form" onSubmit={handleSubmit}>
          <h3>Crear Nuevo Pedido</h3>

          <div className="form-group">
            <label htmlFor="nombreComprador">Nombre del Comprador</label>
            <input
              type="text"
              id="nombreComprador"
              value={nombreComprador}
              onChange={(e) => setNombreComprador(e.target.value)}
              required
              placeholder="Ingrese el nombre del comprador"
            />
          </div>

          <div className="carrito-section">
            <h4>Agregar Productos al Carrito</h4>
            <div className="agregar-producto">
              <div className="form-group-inline">
                <label htmlFor="productoSeleccionado">Producto</label>
                <select
                  id="productoSeleccionado"
                  value={productoSeleccionado}
                  onChange={(e) => {
                    setProductoSeleccionado(e.target.value);
                    const producto = productos.find(p => p.id === Number.parseInt(e.target.value, 10));
                    if (producto) {
                      const itemEnCarrito = carrito.find(item => item.productoId === producto.id);
                      const stockDisponible = itemEnCarrito
                        ? producto.stockActual - itemEnCarrito.cantidad
                        : producto.stockActual;
                      if (cantidadSeleccionada > stockDisponible) {
                        setCantidadSeleccionada(Math.max(1, stockDisponible));
                      }
                    }
                  }}
                >
                  <option value="">Seleccione un producto</option>
                  {productosDisponibles.map(producto => {
                    const itemEnCarrito = carrito.find(item => item.productoId === producto.id);
                    const stockDisponible = itemEnCarrito
                      ? producto.stockActual - itemEnCarrito.cantidad
                      : producto.stockActual;
                    return (
                      <option
                        key={producto.id}
                        value={producto.id}
                        disabled={stockDisponible <= 0}
                      >
                        {producto.nombre} - Stock: {stockDisponible} - ${producto.precioUnitario?.toFixed(2)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group-inline">
                <label htmlFor="cantidadSeleccionada">Cantidad</label>
                <input
                  type="number"
                  id="cantidadSeleccionada"
                  value={cantidadSeleccionada}
                  onChange={(e) => {
                    const cantidad = Number.parseInt(e.target.value, 10) || 1;
                    setCantidadSeleccionada(Math.max(1, cantidad));
                  }}
                  min="1"
                  required
                />
              </div>

              <button
                type="button"
                className="btn btn-add"
                onClick={agregarAlCarrito}
                disabled={!productoSeleccionado || loading}
              >
                Agregar
              </button>
            </div>

            {carrito.length > 0 && (
              <div className="carrito-items">
                <h4>Carrito de Compras</h4>
                <table className="carrito-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio Unitario</th>
                      <th>Cantidad</th>
                      <th>Subtotal</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.map((item) => {
                      const producto = productos.find(p => p.id === item.productoId);
                      const stockDisponible = producto ? producto.stockActual : 0;
                      return (
                        <tr key={item.productoId}>
                          <td>{item.nombreProducto}</td>
                          <td>${item.precioUnitario?.toFixed(2)}</td>
                          <td>
                            <input
                              type="number"
                              value={item.cantidad}
                              onChange={(e) => {
                                const nuevaCantidad = Number.parseInt(e.target.value, 10) || 0;
                                actualizarCantidadCarrito(item.productoId, nuevaCantidad);
                              }}
                              min="1"
                              max={stockDisponible}
                              className="cantidad-input"
                            />
                          </td>
                          <td>${item.subtotal?.toFixed(2)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-remove"
                              onClick={() => eliminarDelCarrito(item.productoId)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="total-label">Total:</td>
                      <td className="total-amount">${calcularTotal().toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success" disabled={loading || carrito.length === 0}>
              {loading ? 'Creando...' : 'Crear Pedido'}
            </button>
            <button type="button" className="btn btn-cancel" onClick={handleCancelar} disabled={loading}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading && !mostrarFormulario && (
        <div className="loading">Cargando pedidos...</div>
      )}

      <div className="pedidos-list">
        {pedidos.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No hay pedidos registrados. Crea tu primer pedido.</p>
          </div>
        ) : (
          <>
            <div className="pagination-info">
              <p>
                Mostrando {pedidosPaginados.length > 0 ? indiceInicio + 1 : 0} - {Math.min(indiceFin, pedidos.length)} de {pedidos.length} pedidos
              </p>
            </div>
            <table className="pedidos-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del Comprador</th>
                  <th>Fecha</th>
                  <th>Total Final</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidosPaginados.map((pedido) => (
                  <tr key={pedido.id}>
                    <td>{pedido.id}</td>
                    <td>{pedido.nombreComprador}</td>
                    <td>{formatearFecha(pedido.fechaCreacion)}</td>
                    <td>${pedido.totalFinal?.toFixed(2) || '0.00'}</td>
                    <td>
                      <button
                        className="btn btn-view"
                        onClick={() => verDetallePedido(pedido.id)}
                        disabled={loading}
                        title="Ver detalle del pedido"
                      >
                        Ver Detalle
                      </button>
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
                          className={'btn btn-pagination ' + (item === paginaActual ? 'active' : '')}
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

      {mostrarDetallePedido && (
        <dialog
          className="modal-overlay"
          open
          onCancel={(e) => {
            e.preventDefault();
            setMostrarDetallePedido(null);
          }}
          aria-labelledby="modal-title"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h3 id="modal-title">Detalle del Pedido #{mostrarDetallePedido.id}</h3>
              <button
                className="modal-close"
                onClick={() => setMostrarDetallePedido(null)}
                aria-label="Cerrar"
                type="button"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detalle-pedido">
                <p><strong>Comprador:</strong> {mostrarDetallePedido.nombreComprador}</p>
                <p><strong>Fecha:</strong> {formatearFecha(mostrarDetallePedido.fechaCreacion)}</p>
                <p><strong>Total Bruto:</strong> ${mostrarDetallePedido.totalBruto?.toFixed(2) || '0.00'}</p>
                <p><strong>Descuento Aplicado:</strong> ${mostrarDetallePedido.descuentoAplicado?.toFixed(2) || '0.00'}</p>
                <p><strong>Total Final:</strong> ${mostrarDetallePedido.totalFinal?.toFixed(2) || '0.00'}</p>

                {mostrarDetallePedido.items && mostrarDetallePedido.items.length > 0 && (
                  <div className="detalle-items">
                    <h4>Items del Pedido</h4>
                    <table className="detalle-items-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cantidad</th>
                          <th>Precio Unitario</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mostrarDetallePedido.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.nombreProducto}</td>
                            <td>{item.cantidad}</td>
                            <td>${item.precioUnitario?.toFixed(2)}</td>
                            <td>${item.subtotal?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setMostrarDetallePedido(null)}
                type="button"
              >
                Cerrar
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default Pedidos;