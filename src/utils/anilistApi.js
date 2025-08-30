// anilistApi.js
import { translateText, isTranslationEnabled, getTargetLanguage } from './translationService.js';

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
        type
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

    // Verificar se o tipo retornado corresponde ao tipo solicitado
    if (data.data.Media && data.data.Media.type === type) {
      return data.data.Media;
    }

    // Se não corresponde, retornar null para forçar uma nova busca
    return null;
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
export async function processAniListData(mediaData) {
  if (!mediaData) return null;

  // Escolher o título preferido (prioridade: inglês → romaji → nativo)
  const title = mediaData.title.english || mediaData.title.romaji || mediaData.title.native;

  // Processar sinopse (remover tags HTML)
  const synopsis = mediaData.description
    ? mediaData.description.replace(/<[^>]*>/g, '')
    : '';

  // Traduzir sinopse se configurado
  let translatedSynopsis = synopsis;
  if (synopsis && isTranslationEnabled()) {
    translatedSynopsis = await translateText(synopsis, getTargetLanguage());
  }

  // Coletar todos os sinônimos possíveis
  const allSynonyms = [];
  
  // Adicionar títulos alternativos
  if (mediaData.title.romaji && mediaData.title.romaji !== title) {
    allSynonyms.push(mediaData.title.romaji);
  }
  if (mediaData.title.english && mediaData.title.english !== title) {
    allSynonyms.push(mediaData.title.english);
  }
  if (mediaData.title.native && mediaData.title.native !== title) {
    allSynonyms.push(mediaData.title.native);
  }
  
  // Adicionar sinônimos da API
  if (mediaData.synonyms && Array.isArray(mediaData.synonyms)) {
    mediaData.synonyms.forEach(synonym => {
      if (synonym && synonym !== title && !allSynonyms.includes(synonym)) {
        allSynonyms.push(synonym);
      }
    });
  }

  // Filtrar e limitar sinônimos
  const synonyms = allSynonyms
    .filter(syn => syn && syn.trim().length > 0)
    .slice(0, 5);

  return {
    name: title,
    thumb: mediaData.coverImage?.large || mediaData.coverImage?.medium || null,
    synopsis: translatedSynopsis,
    synonyms: synonyms
  };
}

export async function searchAniListMultiple(searchQuery, type = 'ANIME') {
  const query = `
    query ($search: String, $type: MediaType) {
      Page(page: 1, perPage: 5) {
        media(search: $search, type: $type) {
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
        }
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
    return data.data.Page.media || [];
  } catch (error) {
    console.error('Erro na busca múltipla do AniList:', error);
    return [];
  }
}