// imageSearchService.js
import { searchAniListMultiple } from './anilistApi';
import { searchTMDbMultiple } from './tmdbApi';
import { searchRAWGMultiple } from './rawgApi';

export async function searchImages(query, mediaType, apiType) {
  try {
    switch (apiType) {
      case 'anilist':
        const anilistResults = await searchAniListMultiple(query, mediaType);
        return anilistResults.slice(0, 5).map(item => ({
          url: item.coverImage?.large || item.coverImage?.medium,
          title: item.title.romaji
        }));
      case 'tmdb':
        const tmdbResults = await searchTMDbMultiple(query, mediaType);
        return tmdbResults.slice(0, 5).map(item => ({
          url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          title: item.title || item.name
        })).filter(item => item.url); // Filtrar itens sem imagem
      case 'rawg':
        const rawgResults = await searchRAWGMultiple(query);
        return rawgResults.slice(0, 5).map(item => ({
          url: item.background_image,
          title: item.name
        })).filter(item => item.url); // Filtrar itens sem imagem
      default:
        return [];
    }
  } catch (error) {
    console.error('Erro na busca de imagens:', error);
    return [];
  }
}