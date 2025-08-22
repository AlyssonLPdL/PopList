import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ListView() {
  const { name } = useParams();
  const listName = decodeURIComponent(name || "");
  const [data, setData] = useState({ name: listName, items: [] });

  const load = async () => {
    if (!listName) return;
    if (window.api?.getList) {
      const d = await window.api.getList(listName);
      if (d) setData(d);
      else setData({ name: listName, items: [] });
    }
  };

  useEffect(() => {
    load();
    const cb = () => load();
    let remover = null;
    if (window.api?.onListsUpdated) {
      remover = window.api.onListsUpdated(cb);
    }
    return () => {
      if (typeof remover === "function") remover();
    };
  }, [listName]);

  const addItem = async () => {
    if (window.api?.openCreateWindow) {
      await window.api.openCreateWindow(listName);
    }
  };

  const openItemDetail = async (item) => {
    if (window.api?.openItemDetailWindow) {
      await window.api.openItemDetailWindow(listName, item.id);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>{data.name}</h2>
      <button onClick={addItem}>Adicionar item</button>
      <ul>
        {data.items.map((it) => (
          <li 
            key={it.id} 
            onClick={() => openItemDetail(it)}
            style={{ cursor: 'pointer', padding: '8px', border: '1px solid #ccc', margin: '4px 0' }}
          >
            {it.name} — {it.type} (Episódio: {it.episode})
          </li>
        ))}
      </ul>
    </div>
  );
}