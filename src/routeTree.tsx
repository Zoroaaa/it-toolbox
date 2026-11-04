import {
  createRootRoute,
  createRoute,
  lazyRouteComponent,
  Outlet,
} from '@tanstack/react-router'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/HomePage'
import { RouteError, RouteNotFound, RoutePending } from '@/components/system/RouteStates'
import { Toaster } from '@/components/ui/Toaster'

const ToolPage = lazyRouteComponent(() => import('@/pages/ToolPage'), 'ToolPage')
const FavoritesPage = lazyRouteComponent(() => import('@/pages/FavoritesPage'), 'FavoritesPage')
const CategoryPage = lazyRouteComponent(() => import('@/pages/CategoryPage'), 'CategoryPage')
const HistoryPage = lazyRouteComponent(() => import('@/pages/HistoryPage'), 'HistoryPage')

const rootRoute = createRootRoute({
  component: () => (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  ),
  notFoundComponent: RouteNotFound,
  errorComponent: RouteError,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const toolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tool/$id',
  component: ToolPage,
  pendingComponent: RoutePending,
})

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/favorites',
  component: FavoritesPage,
})

const categoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/category/$name',
  component: CategoryPage,
})

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryPage,
})

export const routeTree = rootRoute.addChildren([
  indexRoute,
  toolRoute,
  favoritesRoute,
  categoryRoute,
  historyRoute,
])
