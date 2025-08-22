import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ItemDetail() {
  const { listName: encodedListName, itemId: encodedItemId } = useParams();
  const listName = decodeURIComponent(encodedListName || "");
  const itemId = parseInt(decodeURIComponent(encodedItemId || ""));
  const [item, setItem] = useState(null);
  const [listData, setListData] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

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

  const handleMinimize = () => {
    if (window.api?.minimizeWindow) window.api.minimizeWindow();
  };

  const handleMaximize = () => {
    if (window.api?.maximizeWindow) {
      window.api.maximizeWindow();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.api?.closeWindow) window.api.closeWindow();
  };

  if (!item) {
    return <div style={{ padding: 16 }}>Item não encontrado</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header personalizado */}
      <div style={styles.titleBar}>
        <div style={styles.titleBarText}>Detalhes do Item</div>
        <div style={styles.windowControls}>
          <button style={styles.controlButton} onClick={handleMinimize}>
            <span style={styles.controlIcon}>−</span>
          </button>
          <button style={styles.controlButton} onClick={handleMaximize}>
            <span style={styles.controlIcon}>{isMaximized ? "❐" : "□"}</span>
          </button>
          <button
            style={{ ...styles.controlButton, ...styles.closeButton }}
            onClick={handleClose}
          >
            <span style={styles.controlIcon}>×</span>
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <h2>{item.name}</h2>
        <p><strong>Tipo:</strong> {item.type}</p>
        <p><strong>Episódio/Capítulo:</strong> {item.episode}</p>
        <p><strong>Tags:</strong> {item.tags.join(', ')}</p>
        <p><strong>Opinião:</strong> {item.opinion}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f5f5f7",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: "hidden",
  },
  titleBar: {
    height: "32px",
    backgroundColor: "rgb(129 202 255)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 8px",
    WebkitAppRegion: "drag",
    borderBottom: "1px solid #d0d0d0",
  },
  titleBarText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
    marginLeft: "8px",
  },
  windowControls: {
    display: "flex",
    WebkitAppRegion: "no-drag",
  },
  controlButton: {
    width: "32px",
    height: "32px",
    border: "none",
    backgroundColor: "transparent",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s ease",
  },
  closeButton: {
    ":hover": {
      backgroundColor: "#e81123 !important",
      color: "white",
    },
  },
  controlIcon: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    padding: "16px",
    overflow: "auto",
  },
};