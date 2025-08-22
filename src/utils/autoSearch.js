// autoSearch.js
import { searchAniList, processAniListData } from './anilistApi';
import { ALL_TYPES, AVAILABLE_APIS } from './apiConfig';

/**
 * Busca automática por informações na API correspondente ao tipo
 * @param {string} itemName - Nome do item a ser buscado
 * @param {string} itemType - Tipo do item (anime/manga)
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
        break;
      // Adicionar casos para outras APIs no futuro
      // case 'tmdb':
      //   mediaData = await searchTMDB(itemName, typeConfig.apiType);
      //   break;
      default:
        console.error(`API ${typeConfig.api} não implementada.`);
        return null;
    }

    if (!mediaData) return null;

    // Processar os dados de acordo com a API
    switch (typeConfig.api) {
      case 'anilist':
        return processAniListData(mediaData);
      // Adicionar processamento para outras APIs no futuro
      // case 'tmdb':
      //   return processTMDBData(mediaData);
      default:
        return null;
    }
  } catch (error) {
    console.error('Erro na busca automática:', error);
    return null;
  }
}