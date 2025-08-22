import React, { useEffect, useState, useCallback } from "react";

export default function AppHome() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLists = useCallback(async () => {
    if (window.api?.getLists) {
      const arr = await window.api.getLists();
      setLists(arr || []);
    } else {
      setLists([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLists();
    let unsub = null;
    if (window.api?.onListsUpdated) {
      const cb = () => loadLists();
      unsub = window.api.onListsUpdated(cb);
    }
    return () => {
      if (unsub) unsub();
    };
  }, [loadLists]);

  const handleOpenCreate = async () => {
    if (window.api?.openCreateWindow) await window.api.openCreateWindow();
  };

  const handleOpenList = async (name) => {
    if (window.api?.openListWindow) await window.api.openListWindow(name);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>PopList — Listas</h1>
      <button onClick={handleOpenCreate}>Criar Lista</button>

      <h2 style={{ marginTop: 20 }}>Listas existentes</h2>
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <ul>
          {lists.length === 0 && <li>(nenhuma lista)</li>}
          {lists.map((name) => (
            <li key={name}>
              <button
                onClick={() => handleOpenList(name)}
                style={{ marginRight: 8 }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
