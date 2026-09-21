export async function searchAlbum(title, artist) {
  const query = encodeURIComponent(
    `release:"${title}" AND artist:"${artist}"`
  )

  const response = await fetch(
    `https://musicbrainz.org/ws/2/release/?query=${query}&fmt=json`
  )

  if (!response.ok) {
    throw new Error('MusicBrainzの検索に失敗しました')
  }

  const data = await response.json()

  return data.releases?.[0] ?? null
}
export async function getAlbumCover(mbid) {
  return `https://coverartarchive.org/release/${mbid}/front-500`
}
export async function getAlbumCoverByName(title, artist) {
  const album = await searchAlbum(title, artist)

  if (!album) {
    return null
  }

  try {
    return await getAlbumCover(album.id)
  } catch {
    return null
  }
}