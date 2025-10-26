import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import BackgroundVideo from "./components/BackgroundVideo"
import routes from "./routes"

// ✅ Provider unificado (tema claro/escuro + vídeo A/B)
import  ThemeStyleProvider  from "@/components/theme-style-provider"

import "./index.css"

const router = createBrowserRouter(routes)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeStyleProvider>
      {/* vídeo de fundo (lê bgVariant) */}
      <BackgroundVideo />

      {/* conteúdo acima do vídeo; header h-20 => pt-20 */}
      <div className="relative z-10 pt-20">
        <RouterProvider router={router} />
      </div>
    </ThemeStyleProvider>
  </React.StrictMode>
)
