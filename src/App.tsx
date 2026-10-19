import { Suspense, lazy } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Compass } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState, Spinner } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { AppProvider } from "@/context/AppContext";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Chat = lazy(() => import("@/pages/Chat"));
const Research = lazy(() => import("@/pages/Research"));
const News = lazy(() => import("@/pages/News"));
const Weather = lazy(() => import("@/pages/Weather"));
const Integrations = lazy(() => import("@/pages/Integrations"));
const Reports = lazy(() => import("@/pages/Reports"));
const Settings = lazy(() => import("@/pages/Settings"));

function NotFound() {
  return (
    <div className="mx-auto max-w-lg p-8">
      <EmptyState icon={Compass} title="Page not found" description="That page doesn't exist." action={<Button asChild><Link to="/">Back to dashboard</Link></Button>} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="flex h-dvh items-center justify-center"><Spinner className="h-6 w-6 text-primary" /></div>}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="chat" element={<Chat />} />
              <Route path="research" element={<Research />} />
              <Route path="news" element={<News />} />
              <Route path="weather" element={<Weather />} />
              <Route path="reports" element={<Reports />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}
