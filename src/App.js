import React from 'react';
import './App.css';
import Productos from './components/Productos';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>FistFax - Gestión de Ferretería</h1>
        <p>Sistema de gestión de pedidos y stock</p>
      </header>
      <main className="App-main">
        <Productos />
      </main>
    </div>
  );
}

export default App;

