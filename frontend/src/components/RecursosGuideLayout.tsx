import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/Seo';

type RecursosGuideLayoutProps = {
  title: string;
  description: string;
  path: string;
  socialTitle?: string;
  heading: string;
  children: ReactNode;
};

export function RecursosGuideLayout({
  title,
  description,
  path,
  socialTitle,
  heading,
  children,
}: RecursosGuideLayoutProps) {
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <Seo title={title} description={description} path={path} socialTitle={socialTitle} />
      <div className="container max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link to="/recursos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Guías y recursos
          </Link>
        </Button>
        <article>
          <h1 className="text-3xl font-bold text-foreground mb-6">{heading}</h1>
          <div className="text-foreground space-y-4 leading-relaxed">{children}</div>
        </article>
        <p className="mt-10 text-sm text-muted-foreground">
          ¿Listo para practicar?{' '}
          <Link to="/" className="text-primary font-medium hover:underline underline-offset-2">
            Crea tu cuenta gratis en ENARMX
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
