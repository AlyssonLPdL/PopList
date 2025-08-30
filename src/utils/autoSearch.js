// autoSearch.js
import { searchAniList, processAniListData } from './anilistApi.js';
import { searchTMDB, processTMDBData } from './tmdbApi.js';
import { searchRAWG, processRAWGData } from './rawgApi.js';
import { ALL_TYPES, AVAILABLE_APIS } from './apiConfig.js';

/**
 * Busca automática por informações na API correspondente ao tipo
 * @param {string} itemName - Nome do item a ser buscado
 * @param {string} itemType - Tipo do item (anime/manga/movie/tv/game)
 * @returns {Promise<Object>} Dados processados ou null se não encontrado
 */
export async function autoSearchItem(itemName, itemType) {
  try {
    if (!itemName || !itemType) return null;

    // Encontrar a API configurada para este tipo
    const typeConfig = ALL_TYPES.find(t => t.value === itemType);
    if (!typeConfig) {
      console.error(`Tipo "${itemType}" não está configurado em nenhuma API.`);
      return null;
    }

    // Verificar se a API está habilitada
    const apiConfig = AVAILABLE_APIS[typeConfig.api.toUpperCase()];
    if (!apiConfig || !apiConfig.enabled) {
      console.error(`API ${typeConfig.api} não está habilitada.`);
      return null;
    }

    // Executar a busca na API correspondente
    let mediaData = null;
    switch (typeConfig.api) {
      case 'anilist':
        // Usar o tipo mapeado para a API
        mediaData = await searchAniList(itemName, typeConfig.apiType);
        if (mediaData) {
          return processAniListData(mediaData);
        }
        break;
      case 'tmdb':
        // Buscar no TMDB
        mediaData = await searchTMDB(itemName, typeConfig.apiType);
        if (mediaData) {
          return processTMDBData(mediaData, typeConfig.apiType);
        }
        break;
      case 'rawg':
        // Buscar no RAWG
        mediaData = await searchRAWG(itemName);
        if (mediaData) {
          return processRAWGData(mediaData);
        }
        break;
      default:
        console.error(`API ${typeConfig.api} não implementada.`);
        return null;
    }

    return null;
  } catch (error) {
    console.error('Erro na busca automática:', error);
    return null;
  }
}