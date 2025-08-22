import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ItemDetail() {
  const { listName: encodedListName, itemId: encodedItemId } = useParams();
  const listName = decodeURIComponent(encodedListName || "");
  const itemId = parseInt(decodeURIComponent(encodedItemId || ""));
  const [item, setItem] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const loadItem = async () => {
      if (window.api?.getList) {
        const data = await window.api.getList(listName);
        if (data) {
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

  const renderStars = (rating) => {
    const stars = [];
    const starRating = rating / 2;
    const fullStars = Math.floor(starRating);
    const hasHalfStar = starRating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} style={styles.star}>★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} style={styles.star}>☆</span>);
      } else {
        stars.push(<span key={i} style={styles.star}>☆</span>);
      }
    }

    return stars;
  };

  if (!item) {
    return <div style={styles.loading}>Carregando...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.titleBar}>
        <div style={styles.titleBarText}>
          {item.name} - Detalhes
        </div>
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
        {item.thumb && (
          <div style={styles.imageContainer}>
            <img
              src={item.thumb}
              alt={item.name}
              style={styles.image}
            />
          </div>
        )}

        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <strong>Tipo:</strong> {item.type}
          </div>
          <div style={styles.detailItem}>
            <strong>Episódio/Capítulo:</strong> {item.episode}
          </div>
          <div style={styles.detailItem}>
            <strong>Rating:</strong> {(item.rating / 2).toFixed(1)}/5
          </div>
          <div style={styles.ratingStars}>
            {renderStars(item.rating)}
          </div>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Tags</h3>
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
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Sinônimos</h3>
            <div style={styles.synonyms}>
              {item.synonyms.join(', ')}
            </div>
          </div>
        )}

        {item.synopsis && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Sinopse</h3>
            <p style={styles.synopsis}>{item.synopsis}</p>
          </div>
        )}
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
  imageContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  image: {
    width: "200px",
    height: "280px",
    objectFit: "cover",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "15px",
    marginBottom: "20px",
    backgroundColor: "white",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  detailItem: {
    fontSize: "14px",
    color: "#333",
  },
  ratingStars: {
    gridColumn: "span 2",
    display: "flex",
    gap: "2px",
    justifyContent: "center",
    fontSize: "24px",
    color: "#FFD700",
  },
  star: {
    margin: "0 2px",
  },
  section: {
    marginBottom: "20px",
    backgroundColor: "white",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 10px 0",
    color: "#2c3e50",
  },
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  tag: {
    backgroundColor: "#e1f0fa",
    color: "#3498db",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
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
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "16px",
    color: "#666",
  },
};