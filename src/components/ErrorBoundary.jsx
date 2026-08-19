import { Component } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Une erreur s'est produite</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {this.state.error?.message || "Impossible d'afficher cette page."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Réessayer
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
