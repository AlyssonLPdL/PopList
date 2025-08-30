import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ImageSearchModal from "../components/ImageSearchModal";

export default function ItemDetail() {
  const { listName: encodedListName, itemId: encodedItemId } = useParams();
  const listName = decodeURIComponent(encodedListName || "");
  const itemId = parseInt(decodeURIComponent(encodedItemId || ""));
  const [item, setItem] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [sequencePosition, setSequencePosition] = useState(null);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);

  useEffect(() => {
    const loadItem = async () => {
      if (window.api?.getList) {
        const data = await window.api.getList(listName);
        if (data) {
          const foundItem = data.items.find((it) => it.id === itemId);
          setItem(foundItem || null);
          // Store all items for sequence management (excluding current item)
          setAllItems(data.items.filter((it) => it.id !== itemId));
        }
      }
    };

    loadItem();
  }, [listName, itemId]);

  // ItemDetail.jsx - Corrigir o useEffect
  useEffect(() => {
    const handleListsUpdated = () => {
      reloadItem();
    };

    let removeListener = null;
    if (window.api) {
      removeListener = window.api.onListsUpdated(handleListsUpdated);
    }

    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, [listName, itemId]);

  // Adicionar este useEffect para debug
  useEffect(() => {
    if (item) {
      console.log("Item carregado:", item);
      if (item.prev) {
        console.log("Item anterior:", item.prev);
      }
      if (item.next) {
        console.log("Próximo item:", item.next);
      }
    }
  }, [item]);

  const handleMinimize = () => {
    if (window.api?.minimizeWindow) window.api.minimizeWindow();
  };

  const handleMaximize = () => {
    if (window.api?.maximizeWindow) {
      window.api.maximizeWindow();
      setIsMaximized(!isMaximized);
    }
  };

  const reloadItem = async () => {
    if (window.api?.getList) {
      const data = await window.api.getList(listName);
      if (data) {
        const foundItem = data.items.find((it) => it.id === itemId);
        setItem(foundItem || null);
        setAllItems(data.items.filter((it) => it.id !== itemId));
      }
    }
  };

  const handleClose = () => {
    if (window.api?.closeWindow) window.api.closeWindow();
  };

  const handleImageSelect = async (newImageUrl) => {
    try {
      const updatedItem = { ...item, thumb: newImageUrl };
      const result = await window.api.editItem(listName, item.id, updatedItem);

      if (result.ok) {
        setItem(updatedItem);
        setShowImageSearchModal(false);
      } else {
        alert("Erro ao atualizar a imagem");
      }
    } catch (error) {
      console.error("Erro ao atualizar imagem:", error);
      alert("Erro ao atualizar a imagem");
    }
  };

  const handleEdit = () => {
    if (window.api?.openEditItemWindow) {
      window.api.openEditItemWindow(listName, itemId);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir "${item.name}"?`)) {
      if (window.api?.deleteItem) {
        try {
          const result = await window.api.deleteItem(listName, itemId);
          if (result.ok) {
            if (window.api?.closeWindow) {
              window.api.closeWindow();
            }
          } else {
            alert(`Erro ao excluir: ${result.reason}`);
          }
        } catch (error) {
          alert("Falha ao excluir item");
        }
      }
    }
  };

  // Funções de sequência atualizadas
  const handleAddToSequence = async (targetItem, position) => {
    console.log("Adicionando à sequência:", targetItem, position);
    if (window.api?.updateItemSequence) {
      try {
        const result = await window.api.updateItemSequence(
          listName,
          itemId,
          targetItem.id,
          position
        );
        console.log("Resultado da sequência:", result);
        if (!result.ok) {
          alert(`Erro ao adicionar sequência: ${result.reason}`);
        } else {
          // Fechar o modal após adicionar com sucesso
          setShowSequenceModal(false);
          setSequencePosition(null);

          // Forçar recarregamento do item
          await reloadItem();
        }
      } catch (error) {
        console.error("Falha ao adicionar sequência:", error);
        alert("Falha ao adicionar sequência");
      }
    }
  };

  // Modifique a função handleRemoveFromSequence para recarregar após sucesso
  const handleRemoveFromSequence = async (sequenceType) => {
    if (window.api?.removeItemSequence) {
      try {
        const result = await window.api.removeItemSequence(
          listName,
          itemId,
          sequenceType
        );

        if (!result.ok) {
          alert(`Erro ao remover sequência: ${result.reason}`);
        } else {
          // Forçar recarregamento do item
          await reloadItem();
        }
      } catch (error) {
        console.error("Falha ao remover sequência:", error);
        alert("Falha ao remover sequência");
      }
    }
  };

  const handleNavigateToItem = (targetItemId) => {
    if (window.api?.openItemDetailWindowAndCloseCurrent) {
      window.api.openItemDetailWindowAndCloseCurrent(listName, targetItemId);
    }
  };

  const openSequenceModal = (position) => {
    setSequencePosition(position);
    setShowSequenceModal(true);
    setSearchTerm("");
  };

  const RatingBar = ({ rating }) => {
    const percentage = (rating / 10) * 100;
    return (
      <div style={styles.ratingContainer}>
        <div style={styles.ratingLabel}>{(rating / 2).toFixed(1)}</div>
        <div style={styles.ratingBar}>
          <div
            style={{
              ...styles.ratingProgress,
              width: `${percentage}%`,
              backgroundColor:
                percentage >= 80
                  ? "#4caf50"
                  : percentage >= 60
                  ? "#8bc34a"
                  : percentage >= 40
                  ? "#ffc107"
                  : percentage >= 20
                  ? "#ff9800"
                  : "#f44336",
            }}
          ></div>
        </div>
      </div>
    );
  };

  const SequenceModal = () => {
    const inputRef = React.useRef(null);

    React.useEffect(() => {
      if (showSequenceModal && inputRef.current) {
        inputRef.current.focus();
      }
    }, [showSequenceModal, searchTerm]); // Foca sempre que searchTerm mudar

    if (!showSequenceModal) return null;

    const filteredItems = allItems.filter((targetItem) => {
      const isAlreadyInSequence =
        targetItem.id === item?.prev?.id || targetItem.id === item?.next?.id;

      return (
        targetItem.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !isAlreadyInSequence
      );
    });

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>
              Adicionar {sequencePosition === "before" ? "Anterior" : "Próximo"}
            </h2>
            <button
              style={styles.closeModalButton}
              onClick={() => {
                setShowSequenceModal(false);
                setSequencePosition(null);
              }}
            >
              ×
            </button>
          </div>

          <div style={styles.searchContainer}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Pesquisar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
              autoFocus
            />
          </div>

          <div style={styles.modalContent}>
            {filteredItems.length === 0 ? (
              <p style={styles.noResults}>Nenhum item encontrado</p>
            ) : (
              <div style={styles.itemsGrid}>
                {filteredItems.map((targetItem) => (
                  <div key={targetItem.id} style={styles.itemCard}>
                    <div style={styles.itemCardContent}>
                      <div
                        style={styles.itemCardImage}
                        onClick={() => handleNavigateToItem(targetItem.id)}
                      >
                        <img
                          src={targetItem.thumb}
                          alt={targetItem.name}
                          style={styles.itemImage}
                          onError={(e) => {
                            e.target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgfiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGR5PSIuMzVlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSI+SW1hZ2VtIG7Do28gZW5jb250cmFkYTwvdGV4dD48L3N2Zz4=";
                          }}
                        />
                      </div>
                      <div style={styles.itemCardDetails}>
                        <h4
                          style={styles.itemCardTitle}
                          title={targetItem.name}
                        >
                          {targetItem.name}
                        </h4>
                        <button
                          style={styles.sequenceButton}
                          onClick={() =>
                            handleAddToSequence(targetItem, sequencePosition)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!item) {
    return <div style={styles.loading}>Carregando...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.titleBar}>
        <div style={styles.titleBarText}>{item.name} - Detalhes</div>
        <div style={styles.windowControls}>
          <button style={styles.controlButton} onClick={handleMinimize}>
            <span style={styles.controlIcon}>−</span>
          </button>
          <button style={styles.controlButton} onClick={handleMaximize}>
            <span style={styles.controlIcon}>{isMaximized ? "❐" : "□"}</span>
          </button>
          <button style={styles.controlButton} onClick={handleClose}>
            <span style={styles.controlIcon}>×</span>
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.headerActions}>
          <div style={styles.actionButtons}>
            <button style={styles.editButton} onClick={handleEdit}>
              Editar
            </button>
            <button style={styles.deleteButton} onClick={handleDelete}>
              Apagar
            </button>
          </div>
        </div>

        <div style={styles.mainContent}>
          <div style={styles.leftPanel}>
            {item.thumb && (
              <div
                style={styles.imageCard}
                onClick={() => setShowImageSearchModal(true)}
                title="Clique para buscar outra imagem"
              >
                <img src={item.thumb} alt={item.name} style={styles.image} />
              </div>
            )}

            <div style={styles.detailsCard}>
              <h3 style={styles.cardTitle}>Informações</h3>
              <div style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <strong>Tipo: </strong> {item.type}
                </div>
                <div style={styles.detailItem}>
                  <strong>Episódio/Capítulo: </strong> {item.episode}
                </div>
                <div style={styles.detailItem}>
                  <strong>Rating: </strong>
                </div>
                <div style={styles.ratingItem}>
                  <RatingBar rating={item.rating} />
                </div>
              </div>
            </div>

            {item.synopsis && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Sinopse</h3>
                <p style={styles.synopsis}>{item.synopsis}</p>
              </div>
            )}
          </div>

          <div style={styles.rightPanel}>
            {item.tags && item.tags.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Tags</h3>
                <div style={styles.tagsContainer}>
                  {item.tags.map((tag, index) => (
                    <span key={index} style={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.synonyms && item.synonyms.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Sinônimos</h3>
                <div style={styles.synonyms}>{item.synonyms.join(", ")}</div>
              </div>
            )}

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Sequência</h3>
              <div style={styles.sequenceCardsContainer}>
                {/* Card para o item anterior */}
                <div style={styles.sequenceCard}>
                  <div style={styles.sequenceCardHeader}>
                    <span style={styles.sequenceCardLabel}>Anterior</span>
                    {item.prev ? (
                      <button
                        style={styles.removeSequenceButton}
                        onClick={() => handleRemoveFromSequence("prev")}
                        title="Remover da sequência"
                      >
                        ×
                      </button>
                    ) : (
                      <button
                        style={styles.addSequenceButtonSmall}
                        onClick={() => openSequenceModal("before")}
                        title="Adicionar anterior"
                      >
                        +
                      </button>
                    )}
                  </div>
                  <div style={styles.sequenceCardBody}>
                    {item.prev ? (
                      <div
                        style={styles.sequenceCardContent}
                        onClick={() => handleNavigateToItem(item.prev.id)}
                      >
                        <img
                          src={item.prev.thumb}
                          alt={item.prev.name}
                          style={styles.sequenceCardImage}
                          onError={(e) => {
                            console.error(
                              "Erro ao carregar imagem:",
                              item.prev.thumb
                            );
                            e.target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSI+SW1hZ2VtIG7Do28gZW5jb250cmFkYTwvdGV4dD48L3N2Zz4=";
                          }}
                        />
                        <span style={styles.sequenceCardName}>
                          {item.prev.name}
                        </span>
                      </div>
                    ) : (
                      <span style={styles.sequenceNone}>
                        Nenhum item anterior
                      </span>
                    )}
                  </div>
                </div>

                {/* Card para o próximo item */}
                <div style={styles.sequenceCard}>
                  <div style={styles.sequenceCardHeader}>
                    <span style={styles.sequenceCardLabel}>Próximo</span>
                    {item.next ? (
                      <button
                        style={styles.removeSequenceButton}
                        onClick={() => handleRemoveFromSequence("next")}
                        title="Remover da sequência"
                      >
                        ×
                      </button>
                    ) : (
                      <button
                        style={styles.addSequenceButtonSmall}
                        onClick={() => openSequenceModal("after")}
                        title="Adicionar próximo"
                      >
                        +
                      </button>
                    )}
                  </div>
                  <div style={styles.sequenceCardBody}>
                    {item.next ? (
                      <div
                        style={styles.sequenceCardContent}
                        onClick={() => handleNavigateToItem(item.next.id)}
                      >
                        <img
                          src={item.next.thumb}
                          alt={item.next.name}
                          style={styles.sequenceCardImage}
                          onError={(e) => {
                            e.target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgfiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGR5PSIuMzVlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSI+SW1hZ2VtIG7Do28gZW5jb250cmFkYTwvdGV4dD48L3N2Zz4=";
                          }}
                        />
                        <span style={styles.sequenceCardName}>
                          {item.next.name}
                        </span>
                      </div>
                    ) : (
                      <span style={styles.sequenceNone}>
                        Nenhum próximo item
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SequenceModal />
      <ImageSearchModal
        isOpen={showImageSearchModal}
        onClose={() => setShowImageSearchModal(false)}
        onSelectImage={handleImageSelect}
        currentImage={item.thumb}
        mediaType={item.type}
        apiType={item.type}
        itemName={item.name}
      />
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
    height: "40px",
    backgroundColor: "rgb(129 202 255)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    WebkitAppRegion: "drag",
  },
  titleBarText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
  },
  windowControls: {
    display: "flex",
    WebkitAppRegion: "no-drag",
  },
  controlButton: {
    width: "30px",
    height: "30px",
    border: "none",
    backgroundColor: "transparent",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s ease",
  },
  controlIcon: {
    fontSize: "20px",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: "20px",
    overflow: "auto",
  },
  headerActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "20px",
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
  },
  editButton: {
    padding: "8px 16px",
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  deleteButton: {
    padding: "8px 16px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  mainContent: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "20px",
  },
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    padding: "20px",
  },
  imageCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    padding: "15px",
    display: "flex",
    justifyContent: "center",
    cursor: "pointer",
  },
  detailsCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    padding: "20px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 15px 0",
    color: "#2c3e50",
    paddingBottom: "10px",
    borderBottom: "1px solid #eee",
  },
  image: {
    width: "100%",
    height: "auto",
    maxHeight: "400px",
    objectFit: "cover",
    borderRadius: "4px",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "12px",
  },
  detailItem: {
    fontSize: "14px",
    color: "#333",
    display: "flex",
    alignItems: "center",
  },
  ratingItem: {
    gridColumn: "span 2",
  },
  ratingContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  ratingLabel: {
    fontSize: "14px",
    fontWeight: "500",
    minWidth: "50px",
  },
  ratingBar: {
    flex: 1,
    height: "8px",
    backgroundColor: "#e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
  },
  ratingProgress: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  tag: {
    backgroundColor: "#e1f0fa",
    color: "#3498db",
    padding: "6px 12px",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "500",
  },
  synonyms: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.4",
  },
  synopsis: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.6",
    margin: 0,
  },
  sequenceCardsContainer: {
    display: "grid",
    gap: "15px",
  },
  sequenceCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "15px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    border: "1px solid #e0e0e0",
  },
  sequenceCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    borderBottom: "1px solid #eee",
    paddingBottom: "5px",
  },
  sequenceCardLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#555",
  },
  sequenceCardBody: {
    minHeight: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sequenceCardContent: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    width: "100%",
  },
  sequenceCardImage: {
    width: "50px",
    height: "70px",
    objectFit: "cover",
    borderRadius: "4px",
    flexShrink: 0,
  },
  sequenceCardName: {
    fontSize: "14px",
    fontWeight: "500",
    flex: 1,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  sequenceNone: {
    fontSize: "14px",
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    width: "100%",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "8px",
    width: "80%",
    maxWidth: "800px",
    maxHeight: "80%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #eee",
  },
  modalTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
  },
  closeModalButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#999",
  },
  searchContainer: {
    padding: "15px 20px",
    borderBottom: "1px solid #eee",
  },
  searchInput: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
  },
  modalContent: {
    flex: 1,
    overflow: "auto",
    padding: "10px",
  },
  noResults: {
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
    margin: "40px 0",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
  },
  itemCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  itemCardImage: {
    width: "70px",
    height: "100px",
    overflow: "hidden",
    cursor: "pointer",
    flexShrink: 0,
  },
  itemImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  itemCardContent: {
    display: "flex",
    height: "100px", // Altura fixa para manter consistência
  },
  itemCardDetails: {
    flex: 1,
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  itemCardTitle: {
    fontSize: "12px",
    fontWeight: "500",
    margin: "0 0 8px 0",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: "1.2",
    maxHeight: "2.4em",
  },
  sequenceButton: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#4caf50",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    alignSelf: "flex-end",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "16px",
    color: "#666",
  },
};
