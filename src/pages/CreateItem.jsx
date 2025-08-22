import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function CreateItem() {
  const { listName } = useParams();
  const decodedListName = decodeURIComponent(listName || "");
  const [name, setName] = useState("");
  const [type, setType] = useState("anime");
  const [episode, setEpisode] = useState(0);
  const [tags, setTags] = useState("");
  const [opinion, setOpinion] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!window.api) {
      setError("API do Electron não está disponível");
    }
  }, []);

  const handleAdd = async () => {
    if (!window.api?.addItem) {
      setError("API não disponível");
      return;
    }

    const item = {
      name,
      type,
      episode: parseInt(episode) || 0,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      opinion,
      synonyms: [],
      thumb: null,
      synopsis: "",
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
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Novo item para: {listName}</h2>
      {error && (
        <div style={{ color: "red", margin: "10px 0" }}>Erro: {error}</div>
      )}
      <input
        type="text"
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Tipo (anime, manga...)"
        value={type}
        onChange={(e) => setType(e.target.value)}
      />
      <input
        type="number"
        placeholder="Episódio/Capítulo"
        value={episode}
        onChange={(e) => setEpisode(e.target.value)}
      />
      <input
        type="text"
        placeholder="Tags (vírgula)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      <input
        type="text"
        placeholder="Opinião"
        value={opinion}
        onChange={(e) => setOpinion(e.target.value)}
      />
      <button onClick={handleAdd}>Adicionar item</button>
      <button onClick={() => window.close()}>Cancelar</button>
    </div>
  );
}
