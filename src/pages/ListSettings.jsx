import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ALL_TYPES, AVAILABLE_APIS } from "../utils/apiConfig";

export default function ListSettings() {
  const { name } = useParams();
  const listName = decodeURIComponent(name || "");
  const [data, setData] = useState(null);
  const [enabledTypes, setEnabledTypes] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [newListName, setNewListName] = useState("");
  const [importTagsText, setImportTagsText] = useState("");
  const [availableLists, setAvailableLists] = useState([]);
  const [selectedListForImport, setSelectedListForImport] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [availableListsData, setAvailableListsData] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = async () => {
    if (!listName) return;
    if (window.api?.getList && window.api?.getLists) {
      const d = await window.api.getList(listName);
      const lists = await window.api.getLists();
      if (d) {
        setData(d);
        setEnabledTypes(d.enabledTypes || ALL_TYPES.map((t) => t.value));
        setNewListName(d.name);
      }
      setAvailableLists(lists.filter((l) => l !== listName));
    }
  };

  useEffect(() => {
    load();
    loadOtherLists();
  }, [listName]);

  const loadOtherLists = async () => {
    if (window.api?.getAllListsData) {
      const listsData = await window.api.getAllListsData();
      setAvailableListsData(listsData.filter((list) => list.name !== listName));
    }
  };

  const toggleType = (typeValue) => {
    if (enabledTypes.includes(typeValue)) {
      setEnabledTypes(enabledTypes.filter((t) => t !== typeValue));
    } else {
      setEnabledTypes([...enabledTypes, typeValue]);
    }
  };

  const saveSettings = async () => {
    if (window.api?.updateList && data) {
      try {
        let result;

        // Se o nome foi alterado, renomear a lista primeiro
        if (newListName !== data.name) {
          const renameResult = await window.api.renameList(
            data.name,
            newListName
          );
          if (!renameResult.ok) {
            alert(`Erro ao renomear lista: ${renameResult.reason}`);
            return;
          }
        }

        // Atualizar os outros dados da lista
        result = await window.api.updateList(
          newListName !== data.name ? newListName : data.name,
          {
            ...data,
            name: newListName,
            enabledTypes: enabledTypes,
            customTags: data.customTags || [],
          }
        );

        if (result.ok) {
          window.close();
        }
      } catch (error) {
        console.error("Erro ao salvar configurações:", error);
        alert(
          "Erro ao salvar configurações. Verifique o console para mais detalhes."
        );
      }
    }
  };

  const deleteList = async () => {
    if (window.api?.deleteList) {
      try {
        const result = await window.api.deleteList(data.name);
        if (result.ok) {
          window.close();
          // A lista principal será atualizada pelo evento 'lists-updated'
        } else {
          alert(`Erro ao excluir lista: ${result.reason}`);
        }
      } catch (error) {
        console.error("Erro ao excluir lista:", error);
        alert("Erro ao excluir lista. Verifique o console para mais detalhes.");
      }
    }
  };

  const addCustomTag = async () => {
    if (!newTag.trim()) return;

    try {
      const currentTags = Array.isArray(data.customTags) ? data.customTags : [];
      const updatedTags = [...currentTags, newTag.trim()];

      setData({
        ...data,
        customTags: updatedTags,
      });

      setNewTag("");
    } catch (error) {
      console.error("Erro ao adicionar tag:", error);
    }
  };

  const removeTag = (indexToRemove) => {
    const updatedTags = data.customTags.filter(
      (_, index) => index !== indexToRemove
    );
    setData({
      ...data,
      customTags: updatedTags,
    });
  };

  const importTagsFromText = () => {
    if (!importTagsText.trim()) return;

    const tags = importTagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const currentTags = Array.isArray(data.customTags) ? data.customTags : [];
    const updatedTags = [...new Set([...currentTags, ...tags])]; // Remove duplicates

    setData({
      ...data,
      customTags: updatedTags,
    });

    setImportTagsText("");
  };

  const importTagsFromList = async () => {
    if (!selectedListForImport) return;

    try {
      const otherList = availableListsData.find(
        (list) => list.name === selectedListForImport
      );
      if (otherList && Array.isArray(otherList.customTags)) {
        const currentTags = Array.isArray(data.customTags)
          ? data.customTags
          : [];
        const updatedTags = [
          ...new Set([...currentTags, ...otherList.customTags]),
        ];

        setData({
          ...data,
          customTags: updatedTags,
        });
      }
    } catch (error) {
      console.error("Erro ao importar tags de outra lista:", error);
    }
  };

  if (!data) {
    return (
      <div style={styles.container}>
        <div style={styles.titleBar}>
          <div style={styles.titleBarText}>Carregando...</div>
        </div>
        <div style={styles.loading}>
          <div>Carregando configurações...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.titleBar}>
        <div style={styles.titleBarText}>
          Configurações da Lista - {data.name}
        </div>
        <div style={styles.windowControls}>
          <button
            style={{ ...styles.controlButton, ...styles.closeButton }}
            onClick={() => window.close()}
          >
            <span style={styles.controlIcon}>×</span>
          </button>
        </div>
      </div>

      <div style={styles.tabContainer}>
        <button
          style={
            activeTab === "general"
              ? { ...styles.tabButton, ...styles.activeTab }
              : styles.tabButton
          }
          onClick={() => setActiveTab("general")}
        >
          Geral
        </button>
        <button
          style={
            activeTab === "types"
              ? { ...styles.tabButton, ...styles.activeTab }
              : styles.tabButton
          }
          onClick={() => setActiveTab("types")}
        >
          Tipos
        </button>
        <button
          style={
            activeTab === "tags"
              ? { ...styles.tabButton, ...styles.activeTab }
              : styles.tabButton
          }
          onClick={() => setActiveTab("tags")}
        >
          Tags
        </button>
        <button
          style={
            activeTab === "import"
              ? { ...styles.tabButton, ...styles.activeTab }
              : styles.tabButton
          }
          onClick={() => setActiveTab("import")}
        >
          Importar
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === "danger" ? styles.dangerTab : {}),
          }}
          onClick={() => setActiveTab("danger")}
        >
          ⚠️ Perigo
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === "general" && (
          <div style={styles.settingsSection}>
            <h3 style={styles.sectionTitle}>Configurações Gerais</h3>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Nome da Lista</label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                style={styles.settingsInput}
                placeholder="Nome da lista"
              />
            </div>
          </div>
        )}

        {activeTab === "types" && (
          <div style={styles.settingsSection}>
            <h3 style={styles.sectionTitle}>Tipos de Mídia Habilitados</h3>
            <p style={styles.sectionDescription}>
              Selecione os tipos de mídia que esta lista pode conter:
            </p>
            <div style={styles.typesContainer}>
              {ALL_TYPES.map((type) => (
                <label key={type.value} style={styles.typeLabel}>
                  <input
                    type="checkbox"
                    checked={enabledTypes.includes(type.value)}
                    onChange={() => toggleType(type.value)}
                    style={styles.typeCheckbox}
                  />
                  <span style={styles.typeText}>
                    {type.label} (via{" "}
                    {AVAILABLE_APIS[type.api.toUpperCase()]?.name || type.api})
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tags" && (
          <div style={styles.settingsSection}>
            <h3 style={styles.sectionTitle}>Tags Personalizadas</h3>
            <div style={styles.inputRow}>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nova tag"
                style={styles.settingsInput}
                onKeyPress={(e) => e.key === "Enter" && addCustomTag()}
              />
              <button onClick={addCustomTag} style={styles.settingsButton}>
                Adicionar
              </button>
            </div>
            <div style={styles.tagsContainer}>
              {(data.customTags || []).map((tag, index) => (
                <span
                  key={index}
                  style={styles.tag}
                  onClick={() => removeTag(index)}
                  title="Clique para remover"
                >
                  {tag} ×
                </span>
              ))}
              {(data.customTags || []).length === 0 && (
                <p style={styles.noTags}>Nenhuma tag personalizada ainda.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "import" && (
          <div style={styles.settingsSection}>
            <h3 style={styles.sectionTitle}>Importar Tags</h3>

            <div style={styles.importSection}>
              <h4 style={styles.subSectionTitle}>De Texto</h4>
              <p style={styles.sectionDescription}>
                Digite tags separadas por vírgulas:
              </p>
              <div style={styles.inputRow}>
                <textarea
                  value={importTagsText}
                  onChange={(e) => setImportTagsText(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  style={{ ...styles.settingsInput, ...styles.textArea }}
                  rows={3}
                />
              </div>
              <button
                onClick={importTagsFromText}
                style={styles.settingsButton}
              >
                Importar Tags
              </button>
            </div>
            <div style={styles.importSection}>
              <h4 style={styles.subSectionTitle}>De Outra Lista</h4>
              <p style={styles.sectionDescription}>
                Selecione uma lista para importar suas tags:
              </p>
              <div style={styles.inputRow}>
                <select
                  value={selectedListForImport}
                  onChange={(e) => setSelectedListForImport(e.target.value)}
                  style={styles.settingsInput}
                >
                  <option value="">Selecione uma lista</option>
                  {availableListsData.map((list) => (
                    <option key={list.name} value={list.name}>
                      {list.name} ({list.customTags?.length || 0} tags)
                    </option>
                  ))}
                </select>
                <button
                  onClick={importTagsFromList}
                  style={styles.settingsButton}
                  disabled={!selectedListForImport}
                >
                  Importar
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === "danger" && (
          <div style={styles.settingsSection}>
            <h3 style={{ ...styles.sectionTitle, color: "#e74c3c" }}>
              Zona de Perigo
            </h3>
            <div style={styles.dangerZone}>
              <h4 style={styles.subSectionTitle}>
                Excluir Lista Permanentemente
              </h4>
              <p style={styles.sectionDescription}>
                Esta ação não pode ser desfeita. Todos os itens e configurações
                serão permanentemente removidos.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={styles.deleteButton}
              >
                🗑️ Excluir Lista
              </button>
            </div>
          </div>
        )}
        {showDeleteConfirm && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={styles.modalTitle}>Confirmar Exclusão</h3>
              <p>Tem certeza que deseja excluir a lista "{data.name}"?</p>
              <p style={styles.warningText}>
                ⚠️ Esta ação não pode ser desfeita!
              </p>

              <div style={styles.modalButtons}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button onClick={deleteList} style={styles.confirmDeleteButton}>
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={styles.footer}>
          <button onClick={() => window.close()} style={styles.cancelButton}>
            Cancelar
          </button>
          <button onClick={saveSettings} style={styles.saveButton}>
            Salvar Configurações
          </button>
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
    alignItems: "center",
    justifyContent: "center",
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
  tabContainer: {
    display: "flex",
    backgroundColor: "#e8e8e8",
    borderBottom: "1px solid #d0d0d0",
  },
  tabButton: {
    padding: "10px 16px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  activeTab: {
    backgroundColor: "white",
    borderBottom: "2px solid #3498db",
  },
  content: {
    flex: 1,
    padding: "20px",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
  },
  settingsSection: {
    marginBottom: "30px",
    flex: 1,
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 16px 0",
    color: "#2c3e50",
  },
  subSectionTitle: {
    fontSize: "16px",
    fontWeight: "500",
    margin: "0 0 12px 0",
    color: "#34495e",
  },
  sectionDescription: {
    fontSize: "14px",
    color: "#7f8c8d",
    margin: "0 0 16px 0",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  inputLabel: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "500",
    color: "#2c3e50",
  },
  typesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
  typeLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  typeCheckbox: {
    margin: 0,
    width: "16px",
    height: "16px",
  },
  typeText: {
    fontSize: "14px",
  },
  inputRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "16px",
    alignItems: "center",
  },
  settingsInput: {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
  },
  textArea: {
    resize: "vertical",
    minHeight: "80px",
  },
  settingsButton: {
    padding: "8px 16px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "16px",
  },
  tag: {
    backgroundColor: "#e1f0fa",
    color: "#3498db",
    padding: "6px 12px",
    borderRadius: "16px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#d1e7f7",
      transform: "scale(1.05)",
    },
  },
  noTags: {
    color: "#95a5a6",
    fontStyle: "italic",
  },
  importSection: {
    marginBottom: "30px",
    padding: "16px",
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    paddingTop: "20px",
    borderTop: "1px solid #e0e0e0",
    marginTop: "auto",
  },
  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  saveButton: {
    padding: "10px 20px",
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    fontSize: "16px",
    color: "#7f8c8d",
  },
  dangerTab: {
    backgroundColor: "#ffe6e6",
    color: "#e74c3c",
    borderBottom: "2px solid #e74c3c",
  },
  dangerZone: {
    padding: "20px",
    backgroundColor: "#ffe6e6",
    border: "2px solid #e74c3c",
    borderRadius: "8px",
  },
  deleteButton: {
    padding: "12px 24px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    ":hover": {
      backgroundColor: "#c0392b",
    },
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    width: "400px",
    maxWidth: "90%",
    textAlign: "center",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    margin: "0 0 16px 0",
    color: "#2c3e50",
  },
  warningText: {
    color: "#e74c3c",
    fontWeight: "bold",
    margin: "16px 0",
  },
  modalButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    marginTop: "20px",
  },
  confirmDeleteButton: {
    padding: "10px 20px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    ":hover": {
      backgroundColor: "#c0392b",
    },
  },
};
