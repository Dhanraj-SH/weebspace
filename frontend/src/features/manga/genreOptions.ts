export const genreOptions = ['action', 'actionAdventure', 'adventure', 'animation', 'awardWinning', 'boysLove', 'cars', 'comedy', 'dementia', 'demons', 'drama', 'ecchi', 'erotica', 'fantasy', 'game', 'girlsLove', 'gourmet', 'harem', 'historical', 'horror', 'isekai', 'josei', 'kids', 'magic', 'mahouShoujo', 'martialArts', 'mecha', 'military', 'music', 'mystery', 'parody', 'police', 'psychological', 'romance', 'samurai', 'school', 'sciFi', 'sciFiFantasy', 'seinen', 'shoujo', 'shoujoAi', 'shounen', 'shounenAi', 'sliceOfLife', 'space', 'sports', 'superPower', 'supernatural', 'suspense', 'thriller', 'unknown', 'vampire']

export function formatGenre(genre: string) {
  return genre === 'sciFi' ? 'Sci-fi' : genre.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase())
}
