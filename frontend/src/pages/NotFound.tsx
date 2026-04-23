import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Seo } from "@/components/Seo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Seo
        title="Página no encontrada"
        description="La página que buscas no existe en ENARMX."
        path={location.pathname || "/"}
        noIndex
      />
      <div className="text-center px-4">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">No encontramos esta página</p>
        <Link to="/" className="text-primary font-medium underline hover:text-primary/90 underline-offset-2">
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
