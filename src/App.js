import React, { useState } from 'react';
import './App.css';
import Productos from './components/Productos';
import Pedidos from './components/Pedidos';

function App() {
  const [moduloActivo, setModuloActivo] = useState('productos');

  return (
    <div className="App">
      <header className="App-header">
        <h1>FixFast - Gestión de Ferretería</h1>
        <p>Sistema de gestión de pedidos y stock</p>
      </header>
      <nav className="App-nav">
        <button
          className={'nav-button ' + (moduloActivo === 'productos' ? 'active' : '')}
          onClick={() => setModuloActivo('productos')}
        >
          Productos
        </button>
        <button
          className={'nav-button ' + (moduloActivo === 'pedidos' ? 'active' : '')}
          onClick={() => setModuloActivo('pedidos')}
        >
          Pedidos
        </button>
      </nav>
      <main className="App-main">
        {moduloActivo === 'productos' ? <Productos /> : <Pedidos />}
      </main>
    </div>
  );
}

export default App;