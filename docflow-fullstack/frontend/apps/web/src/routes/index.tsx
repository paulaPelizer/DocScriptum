import * as React from "react"
import { Suspense } from "react"
import type { RouteObject } from "react-router-dom"
/*import { PrivateRoute } from "@/components/PrivateRoute"*/
import { PrivateRoute } from "@/components/PrivateRoute"
import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "@/services/auth";

// Páginas (lazy)
const PageHome = React.lazy(() => import("@/pages/index"))
const PageLogin = React.lazy(() => import("@/pages/login/index"))

const PageClients = React.lazy(() => import("@/pages/clients/index"))
const PageClientsNew = React.lazy(() => import("@/pages/clients/new/index"))

const PageDashboard = React.lazy(() => import("@/pages/dashboard/index"))

const PageDocs = React.lazy(() => import("@/pages/documents/index"))
const PageDocsNew = React.lazy(() => import("@/pages/documents/new/index"))
const PageDocsRoutingNew = React.lazy(() => import("@/pages/documents/routing/new/index"))
const PageDocsRoutingGrd = React.lazy(() => import("@/pages/documents/routing/[id]/grd/index"))

const PageGrds = React.lazy(() => import("@/pages/grds/index"))
const PagePlanning = React.lazy(() => import("@/pages/planning/index"))

const PageProjects = React.lazy(() => import("@/pages/projects/index"))
const PageProjectsEdit = React.lazy(() => import("@/pages/projects/edit/index"))
const PageProjectsNew = React.lazy(() => import("@/pages/projects/new/index"))
const PageProjectDetail = React.lazy(() => import("@/pages/projects/[id]/index"))
const PageProjectDocs = React.lazy(() => import("@/pages/projects/[id]/documents/index"))
const PageProjectEdit = React.lazy(() => import("@/pages/projects/[id]/edit/index"))
const PageProjectPlanning = React.lazy(() => import("@/pages/projects/[id]/planning/index"))
const PageProjectRouting = React.lazy(() => import("@/pages/projects/[id]/routing/index"))

const PageRequests = React.lazy(() => import("@/pages/requests/index"))
const PageRequestsAttend = React.lazy(() => import("@/pages/requests/attend/index"))
const PageRequestsAttendGenGrds = React.lazy(() => import("@/pages/requests/attend/generate-grds/index"))
const PageRequestsNew = React.lazy(() => import("@/pages/requests/new/index"))
const PageRequestsTender = React.lazy(() => import("@/pages/requests/tender/index"))
const PageRequestsTenderGenGrds = React.lazy(() => import("@/pages/requests/tender/generate-grds/index"))
const PageRequestDetail = React.lazy(() => import("@/pages/requests/[id]/index"))
const PageRequestGenGrd = React.lazy(() => import("@/pages/requests/[id]/generate-grd/index"))

const PageSuppliers = React.lazy(() => import("@/pages/suppliers/index"))
const PageSuppliersNew = React.lazy(() => import("@/pages/suppliers/new/index"))

// Helper para Suspense
const F = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={null}>{children}</Suspense>
)

// Helper para proteger
const P = (el: JSX.Element) => (
  <PrivateRoute>
    {el}
  </PrivateRoute>
)

const routes: RouteObject[] = [
  // Públicas
  { path: "/", element: <F><PageHome /></F> },
  { path: "/login", element: <F><PageLogin /></F> },

  // Protegidas
  { path: "/clients", element: P(<F><PageClients /></F>) },
  { path: "/clients/new", element: P(<F><PageClientsNew /></F>) },

  { path: "/dashboard", element: P(<F><PageDashboard /></F>) },

  { path: "/documents", element: P(<F><PageDocs /></F>) },
  { path: "/documents/new", element: P(<F><PageDocsNew /></F>) },
  { path: "/documents/routing/new", element: P(<F><PageDocsRoutingNew /></F>) },
  { path: "/documents/routing/:id/grd", element: P(<F><PageDocsRoutingGrd /></F>) },

  { path: "/grds", element: P(<F><PageGrds /></F>) },
  { path: "/planning", element: P(<F><PagePlanning /></F>) },

  { path: "/projects", element: P(<F><PageProjects /></F>) },
  { path: "/projects/edit", element: P(<F><PageProjectsEdit /></F>) },
  { path: "/projects/new", element: P(<F><PageProjectsNew /></F>) },
  { path: "/projects/:id", element: P(<F><PageProjectDetail /></F>) },
  { path: "/projects/:id/documents", element: P(<F><PageProjectDocs /></F>) },
  { path: "/projects/:id/edit", element: P(<F><PageProjectEdit /></F>) },
  { path: "/projects/:id/planning", element: P(<F><PageProjectPlanning /></F>) },
  { path: "/projects/:id/routing", element: P(<F><PageProjectRouting /></F>) },

  { path: "/requests", element: P(<F><PageRequests /></F>) },
  { path: "/requests/attend", element: P(<F><PageRequestsAttend /></F>) },
  { path: "/requests/attend/generate-grds", element: P(<F><PageRequestsAttendGenGrds /></F>) },
  { path: "/requests/new", element: P(<F><PageRequestsNew /></F>) },
  { path: "/requests/tender", element: P(<F><PageRequestsTender /></F>) },
  { path: "/requests/tender/generate-grds", element: P(<F><PageRequestsTenderGenGrds /></F>) },
  { path: "/requests/:id", element: P(<F><PageRequestDetail /></F>) },
  { path: "/requests/:id/generate-grd", element: P(<F><PageRequestGenGrd /></F>) },
  
  // (Opcional) 404
  // { path: "*", element: <F><NotFoundPage /></F> },
]

export default routes
