// anilistApi.js
const ANILIST_API_URL = 'https://graphql.anilist.co';

/**
 * Busca informações na API do AniList
 * @param {string} searchQuery - Nome do item a ser buscado
 * @param {string} type - Tipo de mídia (ANIME/MANGA)
 * @returns {Promise<Object>} Dados da mídia
 */
export async function searchAniList(searchQuery, type = 'ANIME') {
  const query = `
    query ($search: String, $type: MediaType) {
      Media(search: $search, type: $type) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
        }
        description
        synonyms
      }
    }
  `;

  const variables = {
    search: searchQuery,
    type: type
  };

  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.data.Media;
  } catch (error) {
    console.error('Erro na busca do AniList:', error);
    return null;
  }
}

/**
 * Processa os dados da API para o formato do nosso aplicativo
 * @param {Object} mediaData - Dados retornados pela API
 * @returns {Object} Dados processados
 */
export function processAniListData(mediaData) {
  if (!mediaData) return null;

  // Escolher o título preferido (prioridade: inglês → romaji → nativo)
  const title = mediaData.title.english || mediaData.title.romaji || mediaData.title.native;

  // Processar sinopse (remover tags HTML)
  const synopsis = mediaData.description 
    ? mediaData.description.replace(/<[^>]*>/g, '') 
    : '';

  // Filtrar e limitar sinônimos
  const synonyms = (mediaData.synonyms || [])
    .filter(syn => syn && /^[a-zA-Z0-9\s\-]+$/.test(syn)) // Apenas texto ASCII
    .slice(0, 3);

  return {
    name: title,
    thumb: mediaData.coverImage?.large || mediaData.coverImage?.medium || null,
    synopsis: synopsis,
    synonyms: synonyms
  };
}