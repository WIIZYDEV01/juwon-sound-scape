import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-extrabold text-primary mb-2">404</p>
      <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">
        That route doesn't exist. Head home and keep exploring the catalog.
      </p>
      <Button asChild>
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  );
}
