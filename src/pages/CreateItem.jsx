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
  const [tags, setTags] = useState("");
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [autoFillData, setAutoFillData] = useState(null);
  const [userTypes, setUserTypes] = useState([]);
  const [userTags, setUserTags] = useState([]);
  const [enabledTypes, setEnabledTypes] = useState([]);
  const [listData, setListData] = useState(null);

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
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
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

  // Renderizar estrelas para a avaliação
  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
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

            <input
              type="text"
              placeholder="Tags (separadas por vírgula)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={styles.input}
              list="userTagsList"
            />
            <datalist id="userTagsList">
              {userTags.map((tag, index) => (
                <option key={index} value={tag} />
              ))}
            </datalist>

            <div style={styles.ratingContainer}>
              <label style={styles.ratingLabel}>Avaliação:</label>
              <div style={styles.starsContainer}>{renderStars()}</div>
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
    width: "500px",
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
  textarea: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    minHeight: "80px",
    resize: "vertical",
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
};
