import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function AppHome() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const navigate = useNavigate();

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

  const handleOpenListCreate = async () => {
    if (window.api?.openCreateListWindow)
      await window.api.openCreateListWindow();
  };

  // Modifique a função handleOpenList:
  const handleOpenList = async (name) => {
    if (window.api?.openListWindow) {
      await window.api.openListWindow(name);
    }
  };

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

  return (
    <div style={styles.container}>
      {/* Header personalizado */}
      <div style={styles.titleBar}>
        <div style={styles.titleBarText}>PopList</div>
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
        <header style={styles.header}>
          <h1 style={styles.title}>PopList</h1>
          <button onClick={handleOpenListCreate} style={styles.createButton}>
            + Nova Lista
          </button>
        </header>

        <div style={styles.mainContent}>
          <h2 style={styles.subtitle}>Suas Listas</h2>
          {loading ? (
            <div style={styles.loading}>Carregando...</div>
          ) : (
            <div style={styles.listGrid}>
              {lists.length === 0 && (
                <div style={styles.emptyState}>
                  <p>Nenhuma lista criada ainda</p>
                </div>
              )}
              {lists.map((name) => (
                <div key={name} style={styles.listCard}>
                  <button
                    onClick={() => handleOpenList(name)}
                    style={styles.listButton}
                  >
                    <span style={styles.listName}>{name}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
    alignItems: "anchor-center",
    justifyContent: "center",
    transition: "background-color 0.2s ease",
    ":hover": {
      backgroundColor: "#e0e0e0",
    },
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
    color: "#ffffffff",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "16px",
    overflow: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e0e0e0",
  },
  mainContent: {
    flex: 1,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#2c3e50",
    margin: 0,
  },
  createButton: {
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2980b9",
    },
  },
  subtitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#34495e",
    margin: "0 0 16px 0",
  },
  listGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "12px",
  },
  listCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "transform 0.2s ease",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
  },
  listButton: {
    width: "100%",
    padding: "16px",
    border: "none",
    background: "none",
    cursor: "pointer",
    textAlign: "left",
    transition: "background-color 0.2s ease",
    ":hover": {
      backgroundColor: "#f8f9fa",
    },
  },
  listName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#2c3e50",
    wordBreak: "break-word",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#7f8c8d",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#95a5a6",
    gridColumn: "1 / -1",
  },
};
