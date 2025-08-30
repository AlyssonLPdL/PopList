// tmdbApi.js
const TMDB_API_KEY = 'sua_chave_api_tmdb'; // Você precisa se registrar no TMDB para obter uma chave API gratuita
const TMDB_API_URL = 'https://api.themoviedb.org/3';

/**
 * Busca informações na API do TMDB
 * @param {string} searchQuery - Nome do item a ser buscado
 * @param {string} type - Tipo de mídia (movie/tv)
 * @returns {Promise<Object>} Dados da mídia
 */
export async function searchTMDB(searchQuery, type = 'movie') {
  const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';

  try {
    const response = await fetch(
      `${TMDB_API_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=pt-BR`
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Retorna o primeiro resultado
      return data.results[0];
    }

    return null;
  } catch (error) {
    console.error('Erro na busca do TMDB:', error);
    return null;
  }
}

/**
 * Busca múltiplos resultados na API do TMDB
 * @param {string} searchQuery - Nome do item a ser buscado
 * @param {string} type - Tipo de mídia (movie/tv)
 * @returns {Promise<Array>} Lista de resultados
 */
export async function searchTMDbMultiple(searchQuery, type = 'movie') {
  const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';

  try {
    const response = await fetch(
      `${TMDB_API_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=pt-BR`
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.results ? data.results.slice(0, 5) : [];
  } catch (error) {
    console.error('Erro na busca múltipla do TMDB:', error);
    return [];
  }
}

/**
 * Processa os dados da API para o formato do nosso aplicativo
 * @param {Object} mediaData - Dados retornados pela API
 * @param {string} type - Tipo de mídia (movie/tv)
 * @returns {Promise<Object>} Dados processados
 */
export async function processTMDBData(mediaData, type = 'movie') {
  if (!mediaData) return null;

  const title = mediaData.title || mediaData.name;
  const thumb = mediaData.poster_path 
    ? `https://image.tmdb.org/t/p/w500${mediaData.poster_path}`
    : null;

  // Obter sinopse
  let synopsis = mediaData.overview || '';

  // Obter sinônimos (títulos alternativos)
  let synonyms = [];
  if (mediaData.original_title && mediaData.original_title !== title) {
    synonyms.push(mediaData.original_title);
  }

  return {
    name: title,
    thumb: thumb,
    synopsis: synopsis,
    synonyms: synonyms
  };
}