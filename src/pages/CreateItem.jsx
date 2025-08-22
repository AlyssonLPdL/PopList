import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { autoSearchItem } from "../utils/autoSearch";
import { ALL_TYPES } from "../utils/apiConfig";

export default function CreateItem() {
  const { listName } = useParams();
  const decodedListName = decodeURIComponent(listName || "");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [episode, setEpisode] = useState(0);
  const [episodeEnabled, setEpisodeEnabled] = useState(true);
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [autoFillData, setAutoFillData] = useState(null);
  const [userTags, setUserTags] = useState([]);
  const [listData, setListData] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterTagText, setFilterTagText] = useState("");

  // Carrega tipos e tags personalizados da lista
  useEffect(() => {
    const loadListData = async () => {
      if (window.api?.getList) {
        const data = await window.api.getList(decodedListName);
        if (data) {
          setListData(data);
          // Carregar tags personalizadas para o datalist
          setUserTags(Array.isArray(data.customTags) ? data.customTags : []);

          // Definir o tipo inicial baseado nos tipos habilitados
          const enabledTypes = Array.isArray(data.enabledTypes)
            ? data.enabledTypes
            : ALL_TYPES.map((t) => t.value);

          // Se houver tipos habilitados, usar o primeiro como padrão
          if (enabledTypes.length > 0 && !type) {
            setType(enabledTypes[0]);
          }
        } else {
          // Se a lista não existe, criar estrutura padrão
          const defaultData = {
            name: decodedListName,
            items: [],
            enabledTypes: ALL_TYPES.map((t) => t.value),
            customTags: [],
          };
          setListData(defaultData);

          // Definir o primeiro tipo disponível como padrão
          if (ALL_TYPES.length > 0 && !type) {
            setType(ALL_TYPES[0].value);
          }
        }
      }
    };
    loadListData();
  }, [decodedListName]);

  // Busca automática quando o nome ou tipo mudar
  useEffect(() => {
    const fetchData = async () => {
      if (name.length > 3 && type) {
        // Garantir que type não está vazio
        setIsSearching(true);
        const data = await autoSearchItem(name, type);
        setAutoFillData(data);
        setIsSearching(false);
      } else if (autoFillData) {
        // Se o nome ficou muito curto ou tipo mudou, limpar dados anteriores
        setAutoFillData(null);
      }
    };

    const delayDebounce = setTimeout(fetchData, 1000);
    return () => clearTimeout(delayDebounce);
  }, [name, type]);

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

  const handleAdd = async () => {
    if (!name.trim()) {
      setError("Digite um nome para o item");
      return;
    }

    if (window.api?.addItem) {
      const item = {
        name,
        type,
        episode: episodeEnabled ? parseInt(episode) || 0 : 0,
        tags: selectedTags,
        rating,
        synonyms: autoFillData?.synonyms || [],
        thumb: autoFillData?.thumb || null,
        synopsis: autoFillData?.synopsis || "",
        next: null,
        prev: null,
      };

      try {
        const result = await window.api.addItem(decodedListName, item);

        if (result.ok) {
          window.close();
        } else {
          setError(result.reason || "Erro ao adicionar item");
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

  return (
    <div style={styles.container}>
      <div style={styles.window}>
        <div style={styles.titleBar}>
          <div style={styles.titleBarText}>
            Adicionar Item - {decodedListName}
          </div>
          <div style={styles.windowControls}>
            <button style={styles.controlButton} onClick={() => window.close()}>
              <span style={styles.controlIcon}>×</span>
            </button>
          </div>
        </div>

        <div style={styles.content}>
          <h2 style={styles.title}>Novo Item</h2>

          {error && <div style={styles.error}>{error}</div>}

          {isSearching && (
            <div style={styles.searching}>
              Buscando informações na AniList...
            </div>
          )}

          {autoFillData && !isSearching && (
            <div style={styles.autoFillInfo}>
              <div style={styles.thumbPreview}>
                {autoFillData.thumb && (
                  <img
                    src={autoFillData.thumb}
                    alt={autoFillData.name}
                    style={styles.thumbImage}
                  />
                )}
              </div>
              <p>Informações encontradas: {autoFillData.name}</p>
            </div>
          )}

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
                  <button onClick={handleAdd} style={styles.addButton}>
                    Adicionar Item
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
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: 0,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  window: {
    width: "650px",
    height: "600px",
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
  searching: {
    color: "#3498db",
    padding: "10px",
    backgroundColor: "#e1f0fa",
    borderRadius: "6px",
    marginBottom: "15px",
  },
  autoFillInfo: {
    padding: "10px",
    backgroundColor: "#e8f5e9",
    borderRadius: "6px",
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  thumbPreview: {
    width: "60px",
    height: "80px",
    overflow: "hidden",
    borderRadius: "4px",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  columnsContainer: {
    display: "flex",
    gap: "20px",
    height: "70%",
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
  addButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#3498db",
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
    ":hover": {
      backgroundColor: "#e0e0e0",
    },
  },
  noTags: {
    color: "#95a5a6",
    fontStyle: "italic",
    textAlign: "center",
    padding: "20px",
  },
};
