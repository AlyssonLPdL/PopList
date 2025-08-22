import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ItemDetail() {
  const { listName: encodedListName, itemId: encodedItemId } = useParams();
  const listName = decodeURIComponent(encodedListName || "");
  const itemId = parseInt(decodeURIComponent(encodedItemId || ""));
  const [item, setItem] = useState(null);
  const [listData, setListData] = useState(null);

  useEffect(() => {
    const loadItem = async () => {
      if (window.api?.getList) {
        const data = await window.api.getList(listName);
        if (data) {
          setListData(data);
          const foundItem = data.items.find(it => it.id === itemId);
          setItem(foundItem || null);
        }
      }
    };

    loadItem();
  }, [listName, itemId]);

  if (!item) {
    return <div style={{ padding: 16 }}>Item não encontrado</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Detalhes do Item</h2>
      <h3>{item.name}</h3>
      <p><strong>Tipo:</strong> {item.type}</p>
      <p><strong>Episódio/Capítulo:</strong> {item.episode}</p>
      <p><strong>Tags:</strong> {item.tags.join(', ')}</p>
      <p><strong>Opinião:</strong> {item.opinion}</p>
      <button onClick={() => window.close()}>Fechar</button>
    </div>
  );
}