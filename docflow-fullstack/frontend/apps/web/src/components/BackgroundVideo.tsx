import React from "react"
import { useThemeStyle } from "@/components/theme-style-provider"

const VIDEO_ID_A = "-tTglFYF1wo" // vídeo 1 (perfeito)
const VIDEO_ID_B = "najDdw22zH8" // vídeo 2 (com bordas laterais)

function ytSrc(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&rel=0&playsinline=1`
}

export default function BackgroundVideo() {
  const { bgVariant } = useThemeStyle()
  const videoId = bgVariant === "alt" ? VIDEO_ID_B : VIDEO_ID_A

  // só o vídeo B recebe zoom
  const scale = videoId === VIDEO_ID_B ? 1.20 : 1.20

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <iframe
        key={videoId}
        src={ytSrc(videoId)}
        title="DocScriptum background video"
        allow="autoplay; fullscreen; picture-in-picture"
        referrerPolicy="no-referrer"
        allowFullScreen
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "177.78vh", // mantém proporção 16:9
          height: "100vh",
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          border: "none",
        }}
      />
    </div>
  )
}
