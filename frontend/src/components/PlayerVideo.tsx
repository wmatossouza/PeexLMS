// Aceita link do YouTube (watch, youtu.be ou embed) ou arquivo de vídeo direto (.mp4/.webm).
function embedYoutube(url: string): string | null {
  try {
    const u = new URL(url)
    let id: string | null = null
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1)
    else if (u.hostname.endsWith('youtube.com')) {
      id = u.searchParams.get('v') ?? (u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : null)
    }
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null
  } catch {
    return null
  }
}

export function PlayerVideo({ url, titulo }: { url: string; titulo: string }) {
  const youtube = embedYoutube(url)

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-text">
      {youtube ? (
        <iframe
          src={youtube}
          title={titulo}
          className="h-full w-full"
          allow="accelerometer; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video key={url} src={url} controls preload="metadata" className="h-full w-full" aria-label={titulo}>
          Seu navegador não suporta vídeo.
        </video>
      )}
    </div>
  )
}
