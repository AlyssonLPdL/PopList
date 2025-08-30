// imageSearchService.js
import { searchAniList } from './anilistApi';
// Futuramente adicionar outras APIs como TMDB

export async function searchImages(query, mediaType, apiType) {
  try {
    switch (apiType) {
      case 'anilist':
        const results = await searchAniList(query, mediaType);
        return results.slice(0, 5).map(item => ({
          url: item.coverImage?.large || item.coverImage?.medium,
          title: item.title.romaji
        }));
      
      // Adicione outros casos para diferentes APIs aqui
      // case 'tmdb':
      //   return searchTMDBImages(query, mediaType);
      
      default:
        return [];
    }
  } catch (error) {
    console.error('Erro na busca de imagens:', error);
    return [];
  }
}