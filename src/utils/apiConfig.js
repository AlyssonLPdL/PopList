// apiConfig.js
export const AVAILABLE_APIS = {
  ANILIST: {
    id: 'anilist',
    name: 'AniList',
    types: ['anime', 'manga'],
    enabled: true
  }
  // Podemos adicionar mais APIs no futuro:
  // TMDB: {
  //   id: 'tmdb',
  //   name: 'The Movie DB',
  //   types: ['movie', 'tv'],
  //   enabled: false
  // }
};

export const ALL_TYPES = Object.values(AVAILABLE_APIS)
  .filter(api => api.enabled)
  .flatMap(api => api.types.map(type => ({
    value: type,
    api: api.id,
    label: type.charAt(0).toUpperCase() + type.slice(1)
  })));