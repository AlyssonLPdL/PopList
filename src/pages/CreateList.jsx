import React, { useState } from "react";

export default function CreateList() {
  const [listName, setListName] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!listName.trim()) {
      setError("Digite um nome para a lista");
      return;
    }

    if (window.api?.createList) {
      const result = await window.api.createList(listName.trim());
      
      if (result.ok) {
        window.close();
      } else {
        setError(result.reason === 'exists' 
          ? "Uma lista com este nome já existe" 
          : "Erro ao criar lista");
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.window}>
        <h2 style={styles.title}>Criar Nova Lista</h2>
        {error && <div style={styles.error}>{error}</div>}
        <input
          type="text"
          placeholder="Nome da lista"
          value={listName}
          onChange={(e) => {
            setListName(e.target.value);
            setError("");
          }}
          style={styles.input}
          onKeyPress={(e) => e.key === "Enter" && handleCreate()}
        />
        <div style={styles.buttonContainer}>
          <button
            onClick={handleCreate}
            style={styles.createButton}
          >
            Criar
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
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    overflow: 'hidden' // Remove scrollbar
  },
  window: {
    padding: '24px',
    borderRadius: '16px',
    background: "#fff",
    width: '380px',
    maxHeight: '240px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden' // Remove scrollbar interno
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 16px 0',
    textAlign: 'center'
  },
  error: {
    color: '#e74c3c',
    backgroundColor: '#fdf2f2',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    ':focus': {
      borderColor: '#3498db',
      boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.2)'
    }
  },
  buttonContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: 'auto'
  },
  createButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#2980b9'
    }
  },
  cancelButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#7f8c8d'
    }
  }
};