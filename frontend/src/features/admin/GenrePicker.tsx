import { formatGenre, genreOptions } from '../manga/genreOptions'

export function GenrePicker({ value, onChange }: { value: string[]; onChange: (genres: string[]) => void }) {
  function toggleGenre(genre: string) {
    onChange(value.includes(genre) ? value.filter((item) => item !== genre) : [...value, genre])
  }

  return <fieldset className="genre-picker">
    <legend>Genres</legend>
    <div className="genre-picker-options">
      {genreOptions.map((genre) => <button
        className={value.includes(genre) ? 'genre-picker-option selected' : 'genre-picker-option'}
        type="button"
        key={genre}
        aria-pressed={value.includes(genre)}
        onClick={() => toggleGenre(genre)}
      >{formatGenre(genre)}</button>)}
    </div>
    <small>Select one or more genres. Click a selected genre to remove it.</small>
  </fieldset>
}
