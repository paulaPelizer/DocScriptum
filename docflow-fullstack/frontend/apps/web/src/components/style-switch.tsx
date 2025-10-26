import { useThemeStyle } from "@/components/theme-style-provider"
import { Clapperboard } from "lucide-react"

export function StyleSwitch() {
  const { bgVariant, setBgVariant } = useThemeStyle()

  const toggleVideo = () => {
    setBgVariant(bgVariant === "default" ? "alt" : "default")
  }

  return (
    <button
      onClick={toggleVideo}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border hover:bg-foreground/10 transition"
      title={bgVariant === "default" ? "Trocar para Vídeo B" : "Trocar para Vídeo A"}
      aria-label="Alternar vídeo de fundo"
    >
      <Clapperboard className="w-4 h-4" />
      <span>{bgVariant === "default" ? "Vídeo A" : "Vídeo B"}</span>
    </button>
  )
}
