// CreateItem.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { autoSearchItem } from "../utils/autoSearch";

export default function CreateItem() {
  const { listName } = useParams();
  const decodedListName = decodeURIComponent(listName || "");
  const [name, setName] = useState("");
  const [type, setType] = useState("anime");
  const [episode, setEpisode] = useState(0);
  const [tags, setTags] = useState("");
  const [opinion, setOpinion] = useState("");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [autoFillData, setAutoFillData] = useState(null);

  // Busca automática quando o nome ou tipo mudar
  useEffect(() => {
    const fetchData = async () => {
      if (name.length > 3) { // Só busca se tiver pelo menos 3 caracteres
        setIsSearching(true);
        const data = await autoSearchItem(name, type);
        setAutoFillData(data);
        setIsSearching(false);
      }
    };

    const delayDebounce = setTimeout(fetchData, 1000); // Debounce de 1s
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
        episode: parseInt(episode) || 0,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        opinion,
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

  return (
    <div style={styles.container}>
      <div style={styles.window}>
        <div style={styles.titleBar}>
          <div style={styles.titleBarText}>Adicionar Item - {decodedListName}</div>
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
            <div style={styles.searching}>Buscando informações na AniList...</div>
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
            
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={styles.select}
            >
              <option value="anime">Anime</option>
              <option value="manga">Manga</option>
            </select>
            
            <input
              type="number"
              placeholder="Episódio/Capítulo"
              value={episode}
              onChange={(e) => setEpisode(e.target.value)}
              style={styles.input}
            />
            
            <input
              type="text"
              placeholder="Tags (separadas por vírgula)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={styles.input}
            />
            
            <textarea
              placeholder="Sua opinião"
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              style={styles.textarea}
            />
            
            <div style={styles.buttonContainer}>
              <button onClick={handleAdd} style={styles.addButton}>
                Adicionar Item
              </button>
              <button onClick={() => window.close()} style={styles.cancelButton}>
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
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  window: {
    width: '500px',
    height: '600px',
    borderRadius: '10px',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
  },
  titleBar: {
    height: '40px',
    backgroundColor: 'rgb(129 202 255)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    WebkitAppRegion: 'drag'
  },
  titleBarText: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'white'
  },
  windowControls: {
    display: 'flex',
    WebkitAppRegion: 'no-drag'
  },
  controlButton: {
    width: '30px',
    height: '30px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease'
  },
  controlIcon: {
    fontSize: '20px',
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    padding: '20px',
    overflow: 'auto'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 20px 0'
  },
  error: {
    color: '#e74c3c',
    backgroundColor: '#fdf2f2',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px'
  },
  searching: {
    color: '#3498db',
    padding: '10px',
    backgroundColor: '#e1f0fa',
    borderRadius: '6px',
    marginBottom: '15px'
  },
  autoFillInfo: {
    padding: '10px',
    backgroundColor: '#e8f5e9',
    borderRadius: '6px',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  thumbPreview: {
    width: '60px',
    height: '80px',
    overflow: 'hidden',
    borderRadius: '4px'
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical'
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  addButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  }
};