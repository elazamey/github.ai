import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Decisions from "./pages/Decisions";
import EvidenceLog from "./pages/EvidenceLog";
import Home from "./pages/Home";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";
import RegisterProject from "./pages/RegisterProject";
import Roadmap from "./pages/Roadmap";

function Router() {
  return <DashboardLayout><Switch>
    <Route path="/" component={Home} />
    <Route path="/projects" component={Projects} />
    <Route path="/projects/new" component={RegisterProject} />
    <Route path="/projects/:id" component={ProjectDetail} />
    <Route path="/evidence" component={EvidenceLog} />
    <Route path="/decisions" component={Decisions} />
    <Route path="/roadmap" component={Roadmap} />
    <Route component={NotFound} />
  </Switch></DashboardLayout>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Router /><Toaster /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
