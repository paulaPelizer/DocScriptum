// src/routes.tsx
import * as React from "react";
import { Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { PrivateRoute } from "@/components/PrivateRoute";

// Helpers
const F = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={null}>{children}</Suspense>
);
const P = (el: JSX.Element) => <PrivateRoute>{el}</PrivateRoute>;

// ==========================
// Páginas (lazy imports)
// ==========================

/** HOME / LOGIN */
const PageHome = React.lazy(() => import("@/pages/index"));
const PageLogin = React.lazy(() => import("@/pages/login/index"));

/** RESET ACCESS (NOVO) */
const PageResetAccess = React.lazy(() => import("@/pages/reset-access/index"));

/** CLIENTES */
const PageClients = React.lazy(() => import("@/pages/clients/index"));
const PageClientsNew = React.lazy(() => import("@/pages/clients/new/index"));
const PageClientsEdit = React.lazy(() => import("@/pages/clients/edit/index"));
const PageClientDetail = React.lazy(() => import("@/pages/clients/[id]/index"));

/** DASHBOARD */
const PageDashboard = React.lazy(() => import("@/pages/dashboard/index"));

/** DOCUMENTOS */
const PageDocs = React.lazy(() => import("@/pages/documents/index"));
const PageDocsNew = React.lazy(() => import("@/pages/documents/new/index"));
const PageDocsRoutingNew = React.lazy(
  () => import("@/pages/documents/routing/new/index")
);
const PageDocsRoutingGrd = React.lazy(
  () => import("@/pages/documents/routing/[id]/grd/index")
);
const PageDocumentDetail = React.lazy(
  () => import("@/pages/documents/[id]/index")
);

/** GRDs / PLANEJAMENTO */
const PageGrds = React.lazy(() => import("@/pages/grds/index"));
const PagePlanning = React.lazy(() => import("@/pages/planning/index"));

/** PROJETOS */
const PageProjects = React.lazy(() => import("@/pages/projects/index"));
const PageProjectsEdit = React.lazy(() => import("@/pages/projects/edit/index"));
const PageProjectsNew = React.lazy(() => import("@/pages/projects/new/index"));
const PageProjectDetail = React.lazy(
  () => import("@/pages/projects/[id]/index")
);
const PageProjectDocs = React.lazy(
  () => import("@/pages/projects/[id]/documents/index")
);
const PageProjectEdit = React.lazy(
  () => import("@/pages/projects/[id]/edit/index")
);
const PageProjectPlanning = React.lazy(
  () => import("@/pages/projects/[id]/planning/index")
);
const PageProjectRouting = React.lazy(
  () => import("@/pages/projects/[id]/routing/index")
);

/** SOLICITAÇÕES */
const PageRequests = React.lazy(() => import("@/pages/requests/index"));
const PageRequestsAttend = React.lazy(
  () => import("@/pages/requests/attend/index")
);
const PageRequestsAttendGenGrds = React.lazy(
  () => import("@/pages/requests/attend/generate-grds/index")
);
const PageRequestsNew = React.lazy(() => import("@/pages/requests/new/index"));
const PageRequestsTender = React.lazy(
  () => import("@/pages/requests/tender/index")
);
const PageRequestsTenderGenGrds = React.lazy(
  () => import("@/pages/requests/tender/generate-grds/index")
);
const PageRequestDetail = React.lazy(
  () => import("@/pages/requests/[id]/index")
);
const PageRequestGenGrd = React.lazy(
  () => import("@/pages/requests/[id]/generate-grd/index")
);

/** RECURSOS */
const PageResources = React.lazy(() => import("@/pages/resources/index"));
const PageResourcesNew = React.lazy(
  () => import("@/pages/resources/new/index")
);
// se/ quando você criar essas páginas, é só descomentar:
// const PageResourceDetail = React.lazy(() => import("@/pages/resources/[id]/index"));
// const PageResourceEdit = React.lazy(() => import("@/pages/resources/[id]/edit/index"));

/** MENSAGERIA (NOVO) */
const PageMensageria = React.lazy(() => import("@/pages/mensageria/index"));
// const PageMensageriaNew = React.lazy(() => import("@/pages/mensageria/new/index"));
// const PageMensageriaDetail = React.lazy(() => import("@/pages/mensageria/[id]/index"));
// const PageMensageriaXML = React.lazy(() => import("@/pages/mensageria/[id]/xml/index"));
// const PageMensageriaRetorno = React.lazy(() => import("@/pages/mensageria/[id]/retorno/index"));
// const PageMensageriaReprocess = React.lazy(() => import("@/pages/mensageria/[id]/reprocess/index"));

// ==========================
// Definição de rotas
// ==========================
const routes: RouteObject[] = [
  // Públicas
  { path: "/", element: <F><PageHome /></F> },
  { path: "/login", element: <F><PageLogin /></F> },

  // Reset de acesso
  { path: "/reset-access", element: <F><PageResetAccess /></F> },

  // Dashboard
  { path: "/dashboard", element: P(<F><PageDashboard /></F>) },

  // Clientes
  { path: "/clients", element: P(<F><PageClients /></F>) },
  { path: "/clients/new", element: P(<F><PageClientsNew /></F>) },
  { path: "/clients/:id", element: P(<F><PageClientDetail /></F>) },
  { path: "/clients/:id/edit", element: P(<F><PageClientsEdit /></F>) },

  // Documentos
  { path: "/documents", element: P(<F><PageDocs /></F>) },
  { path: "/documents/new", element: P(<F><PageDocsNew /></F>) },
  { path: "/documents/:id/edit", element: P(<F><PageDocsNew /></F>) },
  { path: "/documents/routing/new", element: P(<F><PageDocsRoutingNew /></F>) },
  { path: "/documents/routing/:id/grd", element: P(<F><PageDocsRoutingGrd /></F>) },
  { path: "/documents/:id", element: P(<F><PageDocumentDetail /></F>) },

  // GRDs / Planejamento
  { path: "/grds", element: P(<F><PageGrds /></F>) },
  { path: "/planning", element: P(<F><PagePlanning /></F>) },

  // Projetos
  { path: "/projects", element: P(<F><PageProjects /></F>) },
  { path: "/projects/edit", element: P(<F><PageProjectsEdit /></F>) },
  { path: "/projects/new", element: P(<F><PageProjectsNew /></F>) },
  { path: "/projects/:id", element: P(<F><PageProjectDetail /></F>) },
  { path: "/projects/:id/documents", element: P(<F><PageProjectDocs /></F>) },
  { path: "/projects/:id/edit", element: P(<F><PageProjectEdit /></F>) },
  { path: "/projects/:id/planning", element: P(<F><PageProjectPlanning /></F>) },
  { path: "/projects/:id/routing", element: P(<F><PageProjectRouting /></F>) },

  // Solicitações
  { path: "/requests", element: P(<F><PageRequests /></F>) },
  { path: "/requests/attend", element: P(<F><PageRequestsAttend /></F>) },
  {
    path: "/requests/attend/generate-grds",
    element: P(<F><PageRequestsAttendGenGrds /></F>),
  },
  { path: "/requests/new", element: P(<F><PageRequestsNew /></F>) },
  { path: "/requests/tender", element: P(<F><PageRequestsTender /></F>) },
  {
    path: "/requests/tender/generate-grds",
    element: P(<F><PageRequestsTenderGenGrds /></F>),
  },
  { path: "/requests/:id", element: P(<F><PageRequestDetail /></F>) },
  {
    path: "/requests/:id/generate-grd",
    element: P(<F><PageRequestGenGrd /></F>),
  },

  // Recursos
  { path: "/resources", element: P(<F><PageResources /></F>) },
  { path: "/resources/new", element: P(<F><PageResourcesNew /></F>) },
  // mesma página usada para edição; ela detecta :id e muda o modo:
  { path: "/resources/:id/edit", element: P(<F><PageResourcesNew /></F>) },
  // se você criar página de detalhes depois:
  // { path: "/resources/:id", element: P(<F><PageResourceDetail /></F>) },

  // Mensageria
  { path: "/mensageria", element: P(<F><PageMensageria /></F>) },
];

export default routes;
