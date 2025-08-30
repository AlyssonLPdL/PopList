import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ALL_TYPES } from "../utils/apiConfig";

export default function EditItem() {
  const { listName: encodedListName, itemId: encodedItemId } = useParams();
  const listName = decodeURIComponent(encodedListName || "");
  const itemId = parseInt(decodeURIComponent(encodedItemId || ""));
  
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [episode, setEpisode] = useState(0);
  const [episodeEnabled, setEpisodeEnabled] = useState(true);
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");
  const [userTags, setUserTags] = useState([]);
  const [listData, setListData] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterTagText, setFilterTagText] = useState("");
  const [synonyms, setSynonyms] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Carrega dados do item e da lista
  useEffect(() => {
    const loadData = async () => {
      if (window.api?.getList) {
        const data = await window.api.getList(listName);
        if (data) {
          setListData(data);
          setUserTags(Array.isArray(data.customTags) ? data.customTags : []);

          // Encontrar o item a ser editado
          const itemToEdit = data.items.find(item => item.id === itemId);
          if (itemToEdit) {
            setName(itemToEdit.name);
            setType(itemToEdit.type);
            setEpisode(itemToEdit.episode || 0);
            setEpisodeEnabled(itemToEdit.episode !== undefined && itemToEdit.episode !== null);
            setRating(itemToEdit.rating || 0);
            setSelectedTags(Array.isArray(itemToEdit.tags) ? itemToEdit.tags : []);
            setSynonyms(Array.isArray(itemToEdit.synonyms) ? itemToEdit.synonyms.join(', ') : "");
            setSynopsis(itemToEdit.synopsis || "");
          }
        }
        setIsLoading(false);
      }
    };
    loadData();
  }, [listName, itemId]);

  // Função para adicionar tag
  const addTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Função para remover tag
  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Digite um nome para o item");
      return;
    }

    if (window.api?.editItem) {
      const item = {
        id: itemId,
        name,
        type,
        episode: episodeEnabled ? parseInt(episode) || 0 : 0,
        tags: selectedTags,
        rating,
        synonyms: synonyms.split(',').map(s => s.trim()).filter(s => s),
        synopsis,
        // Mantém a imagem existente
        thumb: listData.items.find(i => i.id === itemId)?.thumb || null,
        // Mantém a sequência existente
        next: listData.items.find(i => i.id === itemId)?.next || null,
        prev: listData.items.find(i => i.id === itemId)?.prev || null,
      };

      try {
        const result = await window.api.editItem(listName, itemId, item);

        if (result.ok) {
          window.close();
        } else {
          setError(result.reason || "Erro ao editar item");
        }
      } catch (err) {
        setError("Falha na comunicação com o sistema");
      }
    }
  };

  // Filtrar tags baseado no texto de filtro
  const filteredTags = userTags.filter((tag) =>
    tag.toLowerCase().includes(filterTagText.toLowerCase())
  );

  // Renderizar estrelas para a avaliação
  const renderStars = () => {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
      <label key={star} style={styles.starLabel}>
        <input
          type="checkbox"
          checked={rating >= star}
          onChange={() => setRating(rating === star ? star - 1 : star)}
          style={styles.starInput}
        />
        <span style={styles.starIcon}>{rating >= star ? "★" : "☆"}</span>
      </label>
    ));
  };

  if (isLoading) {
    return <div style={styles.loading}>Carregando...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.window}>
        <div style={styles.titleBar}>
          <div style={styles.titleBarText}>
            Editar Item - {listName}
          </div>
          <div style={styles.windowControls}>
            <button style={styles.controlButton} onClick={() => window.close()}>
              <span style={styles.controlIcon}>×</span>
            </button>
          </div>
        </div>

        <div style={styles.content}>
          <h2 style={styles.title}>Editar Item</h2>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.columnsContainer}>
            {/* Coluna do formulário */}
            <div style={styles.formColumn}>
              <div style={styles.form}>
                <input
                  type="text"
                  placeholder="Nome do item"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={styles.input}
                />

                {type && (
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    style={styles.select}
                  >
                    {ALL_TYPES.filter((t) =>
                      (
                        listData?.enabledTypes || ALL_TYPES.map((t) => t.value)
                      ).includes(t.value)
                    ).map((typeOption) => (
                      <option key={typeOption.value} value={typeOption.value}>
                        {typeOption.label}
                      </option>
                    ))}
                  </select>
                )}

                <div style={styles.episodeContainer}>
                  <input
                    type="number"
                    placeholder="Episódio/Capítulo"
                    value={episode}
                    onChange={(e) => setEpisode(e.target.value)}
                    style={{
                      ...styles.input,
                      ...(!episodeEnabled && styles.disabledInput),
                    }}
                    disabled={!episodeEnabled}
                  />
                  <button
                    onClick={() => setEpisodeEnabled(!episodeEnabled)}
                    style={
                      episodeEnabled
                        ? styles.toggleButtonOn
                        : styles.toggleButtonOff
                    }
                  >
                    {episodeEnabled ? "On" : "Off"}
                  </button>
                </div>

                <div style={styles.ratingContainer}>
                  <label style={styles.ratingLabel}>Avaliação:</label>
                  <div style={styles.starsContainer}>{renderStars()}</div>
                </div>

                <div style={styles.synonymsContainer}>
                  <label style={styles.label}>Sinônimos (separados por vírgula):</label>
                  <input
                    type="text"
                    placeholder="Sinônimos"
                    value={synonyms}
                    onChange={(e) => setSynonyms(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.synopsisContainer}>
                  <label style={styles.label}>Sinopse:</label>
                  <textarea
                    placeholder="Sinopse"
                    value={synopsis}
                    onChange={(e) => setSynopsis(e.target.value)}
                    style={styles.textarea}
                    rows="5"
                  />
                </div>

                {/* Tags selecionadas */}
                <div style={styles.selectedTagsContainer}>
                  <label style={styles.tagsLabel}>Tags selecionadas:</label>
                  <div style={styles.selectedTags}>
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        style={styles.tagChip}
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </span>
                    ))}
                    {selectedTags.length === 0 && (
                      <span style={styles.noTagsText}>
                        Nenhuma tag selecionada
                      </span>
                    )}
                  </div>
                </div>

                <div style={styles.buttonContainer}>
                  <button onClick={handleSave} style={styles.saveButton}>
                    Salvar Alterações
                  </button>
                  <button
                    onClick={() => window.close()}
                    style={styles.cancelButton}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

            {/* Coluna das tags */}
            <div style={styles.tagsColumn}>
              <div style={styles.tagsSection}>
                <h3 style={styles.tagsTitle}>Tags Disponíveis</h3>
                <input
                  type="text"
                  placeholder="Filtrar tags..."
                  value={filterTagText}
                  onChange={(e) => setFilterTagText(e.target.value)}
                  style={styles.filterInput}
                />
                <div style={styles.tagsList}>
                  {filteredTags.map((tag) => (
                    <div
                      key={tag}
                      style={styles.tagItem}
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                    </div>
                  ))}
                  {filteredTags.length === 0 && (
                    <div style={styles.noTags}>
                      {filterTagText
                        ? "Nenhuma tag encontrada"
                        : "Nenhuma tag disponível"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // ... (usar os mesmos estilos do CreateItem.jsx, com pequenas adaptações)
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  window: {
    width: "700px",
    height: "700px",
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
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
  title: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#2c3e50",
    margin: "0 0 20px 0",
  },
  error: {
    color: "#e74c3c",
    backgroundColor: "#fdf2f2",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "15px",
  },
  columnsContainer: {
    display: "flex",
    gap: "20px",
    height: "85%",
  },
  formColumn: {
    flex: 1,
  },
  tagsColumn: {
    flex: 1,
    borderLeft: "1px solid #e0e0e0",
    paddingLeft: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
  },
  textarea: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    resize: "vertical",
    minHeight: "100px",
  },
  select: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white",
  },
  episodeContainer: {
    display: "flex",
    gap: "10px",
  },
  toggleButtonOn: {
    padding: "10px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  toggleButtonOff: {
    padding: "10px",
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  disabledInput: {
    backgroundColor: "#f0f0f0",
    color: "#a0a0a0",
  },
  ratingContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  ratingLabel: {
    fontSize: "14px",
    fontWeight: "500",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "5px",
    display: "block",
  },
  starsContainer: {
    display: "flex",
    gap: "5px",
  },
  starLabel: {
    cursor: "pointer",
  },
  starInput: {
    display: "none",
  },
  starIcon: {
    fontSize: "24px",
    color: "#f39c12",
  },
  synonymsContainer: {
    marginTop: "10px",
  },
  synopsisContainer: {
    marginTop: "10px",
  },
  selectedTagsContainer: {
    marginTop: "10px",
  },
  tagsLabel: {
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "5px",
    display: "block",
  },
  selectedTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
    minHeight: "40px",
    alignItems: "center",
  },
  tagChip: {
    backgroundColor: "#e1f0fa",
    color: "#3498db",
    padding: "5px 10px",
    borderRadius: "16px",
    fontSize: "12px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    transition: "all 0.2s ease",
  },
  noTagsText: {
    color: "#95a5a6",
    fontStyle: "italic",
  },
  buttonContainer: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  saveButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#4caf50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  cancelButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  tagsSection: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  tagsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 15px 0",
    color: "#2c3e50",
  },
  filterInput: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    marginBottom: "15px",
  },
  tagsList: {
    flex: 1,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  tagItem: {
    padding: "8px 12px",
    backgroundColor: "#f5f5f7",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  noTags: {
    color: "#95a5a6",
    fontStyle: "italic",
    textAlign: "center",
    padding: "20px",
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