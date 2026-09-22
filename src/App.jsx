import './App.css'
import { getSheetCsv, parseSheetCsv } from './sheets'
import { useEffect, useState } from 'react'
import { getAlbumCoverByName } from './musicbrainz'
import { supabase } from './supabase'

function App() {
const [albums, setAlbums] = useState([])
const [allAlbums, setAllAlbums] = useState([])
const [userRole, setUserRole] = useState(null)
const [moderatorPassword, setModeratorPassword] = useState('')
const [pickedAlbums, setPickedAlbums] = useState([])
const [albumSearch, setAlbumSearch] = useState('')
const [moderatorAuthenticated, setModeratorAuthenticated] = useState(false)
const [gameAlbumCount, setGameAlbumCount] = useState(10)
const [gameMode, setGameMode] = useState(null)
const [showRules, setShowRules] = useState(false)
const [tierLimits, setTierLimits] = useState({
  S: 1,
  A: 2,
  B: 3,
  C: 4,
})
const handleModeratorLogin = () => {
const correctPassword = '98920125'

  if (moderatorPassword === correctPassword) {
  setModeratorAuthenticated(true)
} else {
    alert('パスワードが違います')
  }
}

const handleModeSelect = (mode) => {
  setGameMode(mode)

  if (mode === 'standard') {
    setGameAlbumCount(10)

    setTierLimits({
      S: 1,
      A: 2,
      B: 3,
      C: 4,
    })
  }
}

const handleStartGame = () => {
  console.log('ゲーム開始ボタンが押された！')

  const selectedGameAlbumCount =
    gameMode === 'standard' ? 10 : gameAlbumCount

  const selectedTierLimits =
    gameMode === 'standard'
      ? {
          S: 1,
          A: 2,
          B: 3,
          C: 4,
        }
      : tierLimits

  const totalTierLimit =
    selectedTierLimits.S +
    selectedTierLimits.A +
    selectedTierLimits.B +
    selectedTierLimits.C

  if (totalTierLimit < selectedGameAlbumCount) {
    alert('Tierの最大枚数の合計が、ゲーム枚数より少ないです！')
    return
  }

  const resetAlbums = allAlbums.map((album) => ({
    ...album,
    tier: null,
  }))

  const pickedIds = new Set(
    pickedAlbums.map((album) => album.id)
  )

  const remainingAlbums = resetAlbums.filter(
    (album) => !pickedIds.has(album.id)
  )

  const shuffledRemaining = [...remainingAlbums]
    .sort(() => Math.random() - 0.5)

  const selectedAlbums = [
    ...pickedAlbums,
    ...shuffledRemaining,
].slice(0, selectedGameAlbumCount)

  setAlbums(selectedAlbums)
  console.log('選ばれたアルバム:', selectedAlbums)
  setCurrentAlbumIndex(0)
  setGameStarted(true)
  setGameFinished(false)

  console.log('ゲーム開始:', selectedAlbums)
}

useEffect(() => {
  const sheetNames = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G',
    'H', 'I', 'J', 'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
    'W', 'X', 'Y', 'Z', '記号', '日本語'
  ]

Promise.all(
  sheetNames.map((sheetName) =>
    getSheetCsv(sheetName)
      .then((csv) => {
        console.log('読み込み成功:', sheetName)
        return csv
      })
      .catch((error) => {
        console.error('読み込み失敗:', sheetName, error)
        throw error
      })
  )
)
    .then(async (csvList) => {
      const { data: imageFiles, error: imageError } =
  await supabase.storage
    .from('album-covers')
    .list()

    const imageUrls = {}

imageFiles.forEach((file) => {
  const { data: urlData } =
    supabase.storage
      .from('album-covers')
      .getPublicUrl(file.name)

  imageUrls[file.name] = urlData.publicUrl
})

console.log('Supabase画像URL一覧:', imageUrls)

if (imageError) {
  console.error(
    'Supabase画像一覧の取得エラー:',
    imageError
  )
  return
}
      const allData = csvList.flatMap((csv) =>
        parseSheetCsv(csv)
      )

      console.log('全データ:', allData)

      const savedImages = localStorage.getItem(
  'album-tier-list-images'
)

const images = savedImages
  ? JSON.parse(savedImages)
  : {}

const newAlbums = allData.map((album, index) => {
  const imageKey =
    `${album.artist}::${album.title}`

  return {
    id: index + 1,
    title: album.title,
    artist: album.artist,
    tier: null,
    image:
  imageUrls[`${index + 1}.jpg`] ||
  imageUrls[`${index + 1}.jpeg`] ||
  imageUrls[`${index + 1}.png`] ||
  Object.entries(imageUrls).find(
    ([fileName]) =>
      fileName.startsWith(imageKey + '.')
  )?.[1] ||
  images[imageKey] ||
  null,
  }
})

      setAllAlbums(newAlbums)
      setAlbums(newAlbums)

      console.log('スプレッドシート読み込み完了')
    })
    .catch((error) => {
      console.error(
        'スプレッドシート読み込みエラー:',
        error
      )
    })
}, [])

  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedOverTier, setDraggedOverTier] = useState(null)
  const [tierError, setTierError] = useState('')

useEffect(() => {
  const savedImages = localStorage.getItem(
    'album-tier-list-images'
  )

  if (!savedImages) return

  const images = JSON.parse(savedImages)

  setAlbums((currentAlbums) =>
    currentAlbums.map((album) => {
      const imageKey =
        `${album.artist}::${album.title}`

      return images[imageKey]
        ? { ...album, image: images[imageKey] }
        : album
    })
  )
}, [])

  useEffect(() => {
    const currentAlbum = albums[currentAlbumIndex]

    console.log('ジャケット検索対象:', currentAlbum)

if (!currentAlbum) return
if (currentAlbum.image) return

const savedImages = localStorage.getItem(
  'album-tier-list-images'
)

if (savedImages) {
  const images = JSON.parse(savedImages)

  const imageKey =
    `${currentAlbum.artist}::${currentAlbum.title}`

  if (images[imageKey]) {
    setAlbums((currentAlbums) =>
      currentAlbums.map((album) =>
        album.id === currentAlbum.id
          ? { ...album, image: images[imageKey] }
          : album
      )
    )

    return
  }
}

getAlbumCoverByName(
  currentAlbum.title,
  currentAlbum.artist
).then((coverUrl) => {
  if (!coverUrl) return

  const savedImages = localStorage.getItem(
    'album-tier-list-images'
  )

  const images = savedImages
    ? JSON.parse(savedImages)
    : {}

  const imageKey =
    `${currentAlbum.artist}::${currentAlbum.title}`

  images[imageKey] = coverUrl

  localStorage.setItem(
    'album-tier-list-images',
    JSON.stringify(images)
  )

  setAlbums((currentAlbums) =>
    currentAlbums.map((album) =>
      album.id === currentAlbum.id
        ? { ...album, image: coverUrl }
        : album
    )
  )
})
  }, [currentAlbumIndex, albums])

  const StartGame = () => {
    const resetAlbums = albums.map((album) => ({
      ...album,
      tier: null,
    }))

const shuffledAlbums = [...resetAlbums]
  .sort(() => Math.random() - 0.5)
  .slice(0, gameAlbumCount)

    setAlbums(shuffledAlbums)
    setCurrentAlbumIndex(0)
    setGameStarted(true)
    setGameFinished(false)
  }

const handleRestartGame = () => {
  const resetAlbums = allAlbums.map((album) => ({
    ...album,
    tier: null,
  }))

const shuffledAlbums = [...resetAlbums]
  .sort(() => Math.random() - 0.5)
  .slice(0, 10)

    setAlbums(shuffledAlbums)
    setCurrentAlbumIndex(0)
    setGameStarted(true)
    setGameFinished(false)
  }

const handleImageChange = async (event, albumId) => {
  const file = event.target.files[0]

  if (!file) return

  const album = allAlbums.find(
    (album) => album.id === albumId
  )

  if (!album) return

  const fileExtension =
    file.name.split('.').pop()

  const filePath =
  `${album.id}.${fileExtension}`
  
  const { error: uploadError } =
    await supabase.storage
      .from('album-covers')
      .upload(filePath, file, {
        upsert: true,
      })

  if (uploadError) {
    console.error(
      '画像アップロードエラー:',
      uploadError
    )
    alert('画像のアップロードに失敗しました')
    return
  }

  const { data } =
    supabase.storage
      .from('album-covers')
      .getPublicUrl(filePath)

  const imageUrl = data.publicUrl

  setAlbums((currentAlbums) =>
    currentAlbums.map((album) =>
      album.id === albumId
        ? { ...album, image: imageUrl }
        : album
    )
  )

  setAllAlbums((currentAlbums) =>
    currentAlbums.map((album) =>
      album.id === albumId
        ? { ...album, image: imageUrl }
        : album
    )
  )
}
const handleShareResult = () => {
  const resultText = ['S', 'A', 'B', 'C']
    .map((tier) => {
      const tierAlbums = albums.filter(
        (album) => album.tier === tier
      )

      const albumNames = tierAlbums
        .map((album) => `${album.artist} - ${album.title}`)
        .join('\n')

      return `${tier} Tier\n${albumNames || 'なし'}`
    })
    .join('\n\n')

  const shareText =
    `Album Tier List 結果\n\n${resultText}`

  const textArea = document.createElement('textarea')
  textArea.value = shareText
  textArea.style.position = 'fixed'
  textArea.style.left = '-9999px'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    document.execCommand('copy')
    alert('結果をコピーしました！画像で共有する場合は、結果画面をスクリーンショットしてください！')
  } catch {
    alert('結果のコピーに失敗しました')
  }

  document.body.removeChild(textArea)
}
const handleDragStart = (event, albumId) => {
  event.dataTransfer.setData('albumId', albumId)
  setIsDragging(true)
}


const handleDrop = (event, tier) => {
  event.preventDefault()
  setIsDragging(false)
  setDraggedOverTier(null)

  const albumId = Number(event.dataTransfer.getData('albumId'))

if (tier === 'S') {
  const sAlbums = albums.filter(
    (album) => album.tier === 'S'
  )

  if (sAlbums.length >= tierLimits.S) {
    setTierError('S Tierはいっぱいです！')
    return
  }
}
    if (tier === 'A') {
      const aAlbums = albums.filter(
        (album) => album.tier === 'A'
      )

      if (aAlbums.length >= tierLimits.A) {
        setTierError('A Tierはいっぱいです！')
        return
      }
    }

    if (tier === 'B') {
      const bAlbums = albums.filter(
        (album) => album.tier === 'B'
      )

      if (bAlbums.length >= tierLimits.B) {
        setTierError('B Tierはいっぱいです！')
        return
      }
    }

    if (tier === 'C') {
      const cAlbums = albums.filter(
        (album) => album.tier === 'C'
      )

      if (cAlbums.length >= tierLimits.C) {
        setTierError('C Tierはいっぱいです！')
        return
      }
    }

setTierError('')

const updatedAlbums = albums.map((album) =>
  album.id === albumId
    ? { ...album, tier: tier }
    : album
)

    setAlbums(updatedAlbums)

    if (
      albums[currentAlbumIndex] &&
      albums[currentAlbumIndex].id === albumId
    ) {
      const nextIndex = currentAlbumIndex + 1

      setCurrentAlbumIndex(nextIndex)

      if (nextIndex >= albums.length) {
        setGameFinished(true)
      }
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

return (
  <div className="app">
    <h1>Album Tier List</h1>

    {!gameStarted && allAlbums.length > 0 && (
      <>
        {!userRole ? (
          <div className="role-select">
            <h2>遊び方を選択</h2>

            <button
  onClick={() => {
    setUserRole('player')
    setGameMode(null)
  }}
>
  プレイヤー
</button>

            <button
  onClick={() => {
    setUserRole('moderator')
    setGameMode(null)
  }}
>
  モデレーター
</button>

          </div>
        ) : !gameMode ? (
  <div className="mode-select">
    <h2>モードを選択</h2>

<button onClick={() => handleModeSelect('standard')}>
  スタンダードモード
</button>

<button onClick={() => handleModeSelect('custom')}>
  カスタムモード
</button>
  </div>
) : userRole === 'moderator' ? (
          !moderatorAuthenticated ? (
            <div className="moderator-login">
              <h2>モデレーター認証</h2>

              <input
                type="password"
                placeholder="パスワード"
                value={moderatorPassword}
                onChange={(event) =>
                  setModeratorPassword(event.target.value)
                }
              />

              <button onClick={handleModeratorLogin}>
                認証
              </button>
            </div>
          ) : (
            <div className="moderator-pickup">
              <h2>アルバムをピックアップ</h2>

              <p>
                今回のゲームに入れたいアルバムを選択してください。
              </p>

              <p>
                選択中：{pickedAlbums.length}枚
              </p>
              {gameMode === 'custom' && (
  <>
    <div className="tier-limit-setting">
      <h3>Tierの最大枚数</h3>

      {['S', 'A', 'B', 'C'].map((tier) => (
        <div key={tier}>
          <label>
            {tier}：
            <input
              type="number"
              min="0"
              value={tierLimits[tier]}
              onChange={(event) =>
                setTierLimits((current) => ({
                  ...current,
                  [tier]: Number(event.target.value),
                }))
              }
            />
            枚
          </label>
        </div>
      ))}
    </div>

    <div className="game-count-setting">
      <label htmlFor="game-album-count">
        ゲームで使うアルバム枚数：
      </label>

      <select
        id="game-album-count"
        value={gameAlbumCount}
        onChange={(event) =>
          setGameAlbumCount(Number(event.target.value))
        }
      >
        <option value={5}>5枚</option>
        <option value={10}>10枚</option>
        <option value={15}>15枚</option>
        <option value={20}>20枚</option>
      </select>
    </div>
  </>
)}
              <input
                type="text"
                className="album-search"
                placeholder="アーティスト名・アルバム名で検索"
                value={albumSearch}
                onChange={(event) =>
                  setAlbumSearch(event.target.value)
                }
              />

              <div className="album-pickup-list">
                {allAlbums
                  .filter((album) => {
                    const searchText =
                      albumSearch.toLowerCase()

                    return (
                      album.title
                        .toLowerCase()
                        .includes(searchText) ||
                      album.artist
                        .toLowerCase()
                        .includes(searchText)
                    )
                  })
                  .map((album) => {
                    const isPicked = pickedAlbums.some(
                      (pickedAlbum) =>
                        pickedAlbum.id === album.id
                    )

                    return (
                      <button
                        type="button"
                        className={
                          isPicked
                            ? 'pickup-album picked'
                            : 'pickup-album'
                        }
                        key={album.id}
                        onClick={() => {
                          if (isPicked) {
                            setPickedAlbums((current) =>
                              current.filter(
                                (pickedAlbum) =>
                                  pickedAlbum.id !== album.id
                              )
                            )
                          } else {
                            setPickedAlbums((current) => [
                              ...current,
                              album,
                            ])
                          }
                        }}
                      >
                        {album.image ? (
                          <img
                            className="pickup-album-cover"
                            src={album.image}
                            alt={album.title}
                          />
                        ) : (
                          <div className="pickup-album-cover">
                            🎵
                          </div>
                        )}

                        <div className="pickup-album-title">
                          {album.title}
                        </div>

                        <div className="pickup-album-artist">
                          {album.artist}
                        </div>
                      </button>
                    )
                  })}
              </div>
              
{tierLimits.S +
  tierLimits.A +
  tierLimits.B +
  tierLimits.C <
  gameAlbumCount && (
  <p>
    Tierの最大枚数の合計が、ゲーム枚数より少ないです！
  </p>
)}

  <button
    onClick={handleStartGame}
    disabled={
      tierLimits.S +
       tierLimits.A +
       tierLimits.B +
       tierLimits.C <
    gameAlbumCount
   }
>
  ゲーム開始
</button>
            </div>
          )
                ) : (
          <div>
            {gameMode === 'custom' && (
              <>
                <div className="game-count-setting">
                  <label htmlFor="game-album-count">
                    ゲームで使うアルバム枚数：
                  </label>

                  <select
                    id="game-album-count"
                    value={gameAlbumCount}
                    onChange={(event) =>
                      setGameAlbumCount(Number(event.target.value))
                    }
                  >
                    <option value={5}>5枚</option>
                    <option value={10}>10枚</option>
                    <option value={15}>15枚</option>
                    <option value={20}>20枚</option>
                  </select>
                </div>

                <div className="tier-limit-setting">
                  <h3>Tierの最大枚数</h3>

                  {['S', 'A', 'B', 'C'].map((tier) => (
                    <div key={tier}>
                      <label>
                        {tier}：
                        <input
                          type="number"
                          min="0"
                          value={tierLimits[tier]}
                          onChange={(event) =>
                            setTierLimits((current) => ({
                              ...current,
                              [tier]: Number(event.target.value),
                            }))
                          }
                        />
                        枚
                      </label>
                    </div>
                  ))}
                </div>

                {tierLimits.S +
                  tierLimits.A +
                  tierLimits.B +
                  tierLimits.C <
                  gameAlbumCount && (
                  <p>
                    Tierの最大枚数の合計が、ゲーム枚数より少ないです！
                  </p>
                )}
              </>
            )}
            <button
  type="button"
  onClick={() => setShowRules(true)}
>
  ルール説明
</button>

            <button
              onClick={handleStartGame}
              disabled={
                tierLimits.S +
                  tierLimits.A +
                  tierLimits.B +
                  tierLimits.C <
                gameAlbumCount
              }
            >
              ゲーム開始！
            </button>
          </div>
        )}
      </>
    )}

    {['S', 'A', 'B', 'C'].map((tier) => (
      <div
        className={
          draggedOverTier === tier
            ? 'tier dragging'
            : 'tier'
        }
        key={tier}
        onDrop={(event) => handleDrop(event, tier)}
        onDragOver={handleDragOver}
        onDragEnter={() => setDraggedOverTier(tier)}
      >
        <div
          className={
            'tier-label ' + tier.toLowerCase()
          }
        >
          {tier}
        </div>

        <div className="tier-content">
          {albums
            .filter((album) => album.tier === tier)
            .map((album) => (
              <div
                className="album-card small"
                key={album.id}
              >
                {album.image ? (
                  <img
                    className="album-cover"
                    src={album.image}
                    alt={album.title}
                  />
                ) : (
                  <div className="album-cover">
                    🎵
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    ))}

    {tierError && (
      <div className="tier-error">
        {tierError}
      </div>
    )}
    {showRules && (
      <div className="rules">
        <h2>ルール説明</h2>

        <p>
          Next Albumに表示されたアルバムを、
          S・A・B・CのいずれかのTierに配置してください。
        </p>

        <p>
          一度配置したアルバムは、あとから移動できません。
        </p>

        <p>
          スタンダードモードでは、各Tierには最大枚数があります。Sが1枚、Aが2枚、Bが3枚、Cが4枚です。
        </p>

        <p>
        カスタムモードでは、設定した枚数・Tier上限でプレイできます。
        </p>

        <p>
          すべてのアルバムを配置するとゲーム終了です。
        </p>

        <button
          type="button"
          onClick={() => setShowRules(false)}
        >
          閉じる
        </button>
      </div>
    )}

    {gameStarted && !gameFinished && (
      <>
        <h2>Next Album</h2>

        <div
          className="album-card next-album"
          draggable
          onDragStart={(event) =>
            handleDragStart(
              event,
              albums[currentAlbumIndex]?.id
            )
          }
        >
          {albums[currentAlbumIndex]?.image ? (
            <img
              className="album-cover"
              src={albums[currentAlbumIndex].image}
              alt={albums[currentAlbumIndex].title}
            />
          ) : (
            <div className="album-cover">
              🎵
            </div>
          )}

          <div className="album-info">
            <div className="album-title">
              {albums[currentAlbumIndex]?.title}
            </div>

            <div className="artist-name">
              {albums[currentAlbumIndex]?.artist}
            </div>

            {userRole === 'moderator' && (
              <div>
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById('image-file-input')
                      .click()
                  }
                >
                  画像を変更
                </button>

                <input
                  id="image-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(event) =>
                    handleImageChange(
                      event,
                      albums[currentAlbumIndex]?.id
                    )
                  }
                />
              </div>
            )}
          </div>
        </div>
      </>
    )}

    {gameFinished && (
      <div className="result">
        <h2>結果発表！！！</h2>

<p>
  {gameAlbumCount}枚すべてのアルバムを配置しました！
</p>
<button
  type="button"
  onClick={handleShareResult}
>
  結果を共有
</button>
        <button onClick={handleRestartGame}>
          もう一度遊ぶ
        </button>
      </div>
    )}
  </div>
)
}
export default App