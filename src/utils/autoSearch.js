// autoSearch.js
import { searchAniList, processAniListData } from './anilistApi';

/**
 * Busca automática por informações na AniList
 * @param {string} itemName - Nome do item a ser buscado
 * @param {string} itemType - Tipo do item (anime/manga)
 * @returns {Promise<Object>} Dados processados ou null se não encontrado
 */
export async function autoSearchItem(itemName, itemType) {
  try {
    if (!itemName || !itemType) return null;
    
    const mediaData = await searchAniList(itemName, itemType);
    if (!mediaData) return null;
    
    return processAniListData(mediaData);
  } catch (error) {
    console.error('Erro na busca automática:', error);
    return null;
  }
}