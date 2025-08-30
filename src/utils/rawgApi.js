// rawgApi.js
const RAWG_API_KEY = '7379f6997a5a48f08c81c831bdb26b53'; // Você precisa se registrar no RAWG para obter uma chave API gratuita
const RAWG_API_URL = 'https://api.rawg.io/api';

/**
 * Busca informações na API do RAWG
 * @param {string} searchQuery - Nome do jogo a ser buscado
 * @returns {Promise<Object>} Dados do jogo
 */
export async function searchRAWG(searchQuery) {
  try {
    const response = await fetch(
      `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(searchQuery)}&page_size=1`
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0];
    }

    return null;
  } catch (error) {
    console.error('Erro na busca do RAWG:', error);
    return null;
  }
}

/**
 * Busca múltiplos resultados na API do RAWG
 * @param {string} searchQuery - Nome do jogo a ser buscado
 * @returns {Promise<Array>} Lista de resultados
 */
export async function searchRAWGMultiple(searchQuery) {
  try {
    const response = await fetch(
      `${RAWG_API_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(searchQuery)}&page_size=5`
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Erro na busca múltipla do RAWG:', error);
    return [];
  }
}

/**
 * Processa os dados da API para o formato do nosso aplicativo
 * @param {Object} gameData - Dados retornados pela API
 * @returns {Promise<Object>} Dados processados
 */
export async function processRAWGData(gameData) {
  if (!gameData) return null;

  const title = gameData.name;
  const thumb = gameData.background_image || null;

  // Obter sinopse
  let synopsis = gameData.description_raw || '';

  // Remover tags HTML da sinopse
  synopsis = synopsis.replace(/<[^>]*>/g, '');

  // Obter sinônimos (títulos alternativos)
  let synonyms = [];
  if (gameData.alternative_names) {
    synonyms = gameData.alternative_names.slice(0, 5);
  }

  return {
    name: title,
    thumb: thumb,
    synopsis: synopsis,
    synonyms: synonyms
  };
}