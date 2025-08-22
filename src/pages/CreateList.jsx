import React, { useState } from 'react';

export default function CreateList() {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  const handleCreate = async () => {
    if (!name) return setStatus('Informe um nome');
    if (!window.api?.createList) return setStatus('API indisponível');
    const res = await window.api.createList(name);
    if (res?.ok) {
      // Fecha a janela de criação (funciona em Electron)
      window.close();
    } else {
      setStatus('Erro: ' + (res?.reason || 'unknown'));
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h3>Criar nova lista</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da lista" />
      <div style={{ marginTop: 10 }}>
        <button onClick={handleCreate} disabled={!name}>Criar</button>
      </div>
      {status && <p style={{ color: 'red' }}>{status}</p>}
    </div>
  );
}
