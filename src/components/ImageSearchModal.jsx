// ImageSearchModal.jsx
import React, { useState, useEffect } from 'react';

export default function ImageSearchModal({ 
  isOpen, 
  onClose, 
  onSelectImage, 
  currentImage,
  mediaType,
  apiType,
  itemName
}) {
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fazer busca automática com o nome do item
      handleSearch(itemName);
    } else {
      // Limpar resultados quando o modal fechar
      setSearchResults([]);
      setCustomImageUrl('');
    }
  }, [isOpen, itemName]);

  const handleSearch = async (searchQuery = itemName) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const results = await window.api.searchImages(searchQuery, mediaType, apiType);
      // Garantir que sempre temos um array, mesmo se a API retornar undefined/null
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Erro na busca:', error);
      setSearchResults([]);
    }
    setIsLoading(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCustomImageUrl(text);
    } catch (error) {
      console.error('Erro ao colar:', error);
    }
  };

  const handleSaveCustomImage = () => {
    if (customImageUrl.trim()) {
      onSelectImage(customImageUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2>Selecionar Imagem</h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div style={styles.customImageSection}>
          <h3 style={styles.sectionTitle}>Usar URL personalizada</h3>
          <div style={styles.urlInputContainer}>
            <input
              type="text"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="Cole o URL da imagem aqui..."
              style={styles.urlInput}
            />
            <button 
              onClick={handlePaste}
              style={styles.pasteButton}
            >
              Colar
            </button>
            <button 
              onClick={handleSaveCustomImage}
              style={styles.saveButton}
              disabled={!customImageUrl.trim()}
            >
              Usar esta imagem
            </button>
          </div>
        </div>

        <div style={styles.resultsSection}>
          <h3 style={styles.sectionTitle}>Sugestões baseadas em "{itemName}"</h3>
          {isLoading ? (
            <div style={styles.loading}>Carregando sugestões...</div>
          ) : (
            <div style={styles.resultsGrid}>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  style={styles.imageContainer}
                  onClick={() => onSelectImage(result.url)}
                >
                  <img
                    src={result.url}
                    alt={result.title}
                    style={styles.resultImage}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgfiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGR5PSIuMzVlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSI+SW1hZ2VtIG7Do28gZW5jb250cmFkYTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                  <div style={styles.imageOverlay}>
                    <span style={styles.imageTitle}>{result.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {searchResults.length === 0 && !isLoading && (
          <div style={styles.noResults}>
            Nenhuma sugestão encontrada para "{itemName}"
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#333',
  },
  customImageSection: {
    padding: '20px',
    borderBottom: '1px solid #eee',
  },
  urlInputContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  pasteButton: {
    padding: '10px 15px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '10px 15px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  resultsSection: {
    padding: '20px',
    flex: 1,
    overflowY: 'auto',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
  },
  resultsGrid: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
  },
  imageContainer: {
    position: 'relative',
    cursor: 'pointer',
    borderRadius: '4px',
    overflow: 'hidden',
    transition: 'transform 0.2s',
    width: 'calc(33.333% - 10px)',
  },
  resultImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    padding: '8px',
    color: 'white',
  },
  imageTitle: {
    fontSize: '11px',
    fontWeight: '500',
  },
  noResults: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
  },
};