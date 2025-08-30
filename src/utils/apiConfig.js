// apiConfig.js
export const AVAILABLE_APIS = {
  ANILIST: {
    id: 'anilist',
    name: 'AniList',
    types: ['anime', 'manga'],
    enabled: true,
    typeMapping: {
      'anime': 'ANIME',
      'manga': 'MANGA'
    }
  },
  TMDB: {
    id: 'tmdb',
    name: 'The Movie DB',
    types: ['movie', 'tv'],
    enabled: true,
    typeMapping: {
      'movie': 'movie',
      'tv': 'tv'
    }
  },
  RAWG: {
    id: 'rawg',
    name: 'RAWG',
    types: ['game'],
    enabled: true,
    typeMapping: {
      'game': 'game'
    }
  }
};

export const ALL_TYPES = Object.values(AVAILABLE_APIS)
  .filter(api => api.enabled)
  .flatMap(api => api.types.map(type => ({
    value: type,
    api: api.id,
    label: type.charAt(0).toUpperCase() + type.slice(1),
    apiType: api.typeMapping[type] || type
  })));