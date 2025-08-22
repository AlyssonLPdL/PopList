import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ListView() {
  const { name } = useParams();
  const listName = decodeURIComponent(name || "");
  const [data, setData] = useState({ name: listName, items: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isMaximized, setIsMaximized] = useState(false);

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
    if (window.api?.openCreateItemWindow) {
      await window.api.openCreateItemWindow(listName);
    }
  };

  const openItemDetail = async (item) => {
    if (window.api?.openItemDetailWindow) {
      await window.api.openItemDetailWindow(listName, item.id);
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

  // Filtrar itens com base no termo de busca e tipo
  const filteredItems = data.items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  // Obter tipos únicos para o filtro
  const uniqueTypes = ["all", ...new Set(data.items.map(item => item.type))];

  return (
    <div style={styles.container}>
      {/* Header personalizado */}
      <div style={styles.titleBar}>
        <div style={styles.titleBarText}>{data.name}</div>
        <div style={styles.windowControls}>
          <button style={styles.controlButton} onClick={handleMinimize}>
            <span style={styles.controlIcon}>−</span>
          </button>
          <button style={styles.controlButton} onClick={handleMaximize}>
            <span style={styles.controlIcon}>{isMaximized ? '❐' : '□'}</span>
          </button>
          <button style={{...styles.controlButton, ...styles.closeButton}} onClick={handleClose}>
            <span style={styles.controlIcon}>×</span>
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Barra de ferramentas com busca e filtro */}
        <div style={styles.toolbar}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscar item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.filterContainer}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={styles.filterSelect}
            >
              {uniqueTypes.map(type => (
                <option key={type} value={type}>
                  {type === "all" ? "Todos os tipos" : type}
                </option>
              ))}
            </select>
          </div>
          <button onClick={addItem} style={styles.addButton}>
            + Adicionar Item
          </button>
        </div>

        {/* Lista de itens */}
        <div style={styles.itemsContainer}>
          {filteredItems.length === 0 ? (
            <div style={styles.emptyState}>
              {data.items.length === 0 
                ? "Nenhum item nesta lista ainda." 
                : "Nenhum item corresponde aos filtros."}
            </div>
          ) : (
            <div style={styles.itemsGrid}>
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  style={styles.itemCard}
                  onClick={() => openItemDetail(item)}
                >
                  <div style={styles.cardHeader}>
                    <h3 style={styles.itemName}>{item.name}</h3>
                    <span style={styles.itemType}>{item.type}</span>
                  </div>
                  <div style={styles.cardContent}>
                    <p style={styles.itemEpisode}>Episódio: {item.episode}</p>
                    {item.tags && item.tags.length > 0 && (
                      <div style={styles.tagsContainer}>
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} style={styles.tag}>
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span style={styles.moreTags}>+{item.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
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
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden'
  },
  titleBar: {
    height: '32px',
    backgroundColor: 'rgb(129 202 255)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    WebkitAppRegion: 'drag',
    borderBottom: '1px solid #d0d0d0'
  },
  titleBarText: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    marginLeft: '8px'
  },
  windowControls: {
    display: 'flex',
    WebkitAppRegion: 'no-drag',
  },
  controlButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: '#e0e0e0'
    }
  },
  closeButton: {
    ':hover': {
      backgroundColor: '#e81123 !important',
      color: 'white'
    }
  },
  controlIcon: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffffff'
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    overflow: 'hidden'
  },
  toolbar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  searchContainer: {
    flex: 1,
    minWidth: '150px'
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    ':focus': {
      borderColor: '#3498db',
      boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.2)'
    }
  },
  filterContainer: {
    minWidth: '120px'
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    ':focus': {
      borderColor: '#3498db',
      boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.2)'
    }
  },
  addButton: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#2980b9'
    }
  },
  itemsContainer: {
    flex: 1,
    overflow: 'auto'
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px'
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  itemName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0',
    flex: 1,
    marginRight: '8px'
  },
  itemType: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#7f8c8d',
    backgroundColor: '#f1f2f6',
    padding: '4px 8px',
    borderRadius: '12px',
    whiteSpace: 'nowrap'
  },
  cardContent: {
    flex: 1
  },
  itemEpisode: {
    fontSize: '14px',
    color: '#34495e',
    margin: '0 0 12px 0'
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px'
  },
  tag: {
    fontSize: '11px',
    color: '#3498db',
    backgroundColor: '#e1f0fa',
    padding: '2px 6px',
    borderRadius: '8px'
  },
  moreTags: {
    fontSize: '11px',
    color: '#95a5a6',
    padding: '2px 6px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#95a5a6',
    fontSize: '16px'
  }
};