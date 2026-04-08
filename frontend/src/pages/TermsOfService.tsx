import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Seo } from '@/components/Seo';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <Seo
        title="Términos y condiciones de uso"
        description="Términos y condiciones de uso de ENARMX: plataforma de preparación y simulación para el ENARM y residencia médica en México."
        path="/terminos"
      />
      <div className="container max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link to="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </Button>

        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Términos y condiciones de uso</CardTitle>
            <p className="text-sm text-muted-foreground">
              Última actualización: marzo de 2026. Este documento es un borrador orientativo; debe ser
              revisado por asesoría legal antes de uso en producción.
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none text-foreground">
            <h3>1. Identificación</h3>
            <p>
              El presente sitio y la aplicación asociada (en adelante, la &quot;Plataforma&quot;) ofrecen
              herramientas de preparación y simulación relacionadas con el Examen Nacional de Residencias
              Médicas (ENARM) y contenidos educativos similares. El responsable del tratamiento y titular
              del servicio debe identificarse en la configuración legal definitiva de su organización
              (denominación social, domicilio y contacto).
            </p>

            <h3>2. Aceptación</h3>
            <p>
              Al registrarse o utilizar la Plataforma, usted declara haber leído y aceptado estos términos.
              Si no está de acuerdo, debe abstenerse de usar el servicio.
            </p>

            <h3>3. Objeto del servicio</h3>
            <p>
              La Plataforma permite el acceso a casos clínicos, exámenes de práctica, estadísticas y
              funciones colaterales que se describan en la interfaz. El servicio se presta &quot;tal
              cual&quot; y puede modificarse o interrumpirse por mantenimiento, actualización o causas de
              fuerza mayor.
            </p>

            <h3>4. Cuenta de usuario</h3>
            <p>
              Usted es responsable de la confidencialidad de sus credenciales y de la veracidad de los
              datos que proporcione. Debe notificar de inmediato cualquier uso no autorizado de su cuenta.
              Nos reservamos la facultad de suspender cuentas que incumplan estos términos o dañen la
              Plataforma u otros usuarios.
            </p>

            <h3>5. Uso permitido</h3>
            <p>
              Queda prohibido utilizar la Plataforma con fines ilícitos, para extraer datos de forma
              masiva no autorizada (scraping), vulnerar la seguridad, suplantar identidades o interferir
              con el normal funcionamiento del servicio. El contenido educativo es para uso personal del
              usuario salvo acuerdo expreso en contrario.
            </p>

            <h3>6. Propiedad intelectual</h3>
            <p>
              Los textos, diseño, software, marcas y demás elementos de la Plataforma están protegidos por
              la legislación aplicable. No se concede ninguna licencia sobre ellos salvo la necesaria para
              usar el servicio conforme a estos términos.
            </p>

            <h3>7. Limitación de responsabilidad</h3>
            <p>
              La Plataforma tiene fines formativos y de autoevaluación. No sustituye la formación académica
              oficial ni la práctica clínica supervisada. No garantizamos resultados en exámenes oficiales
              ni la ausencia de errores en el contenido. En la medida en que la ley lo permita, quedan
              excluidas garantías implícitas y no nos hacemos responsables por daños indirectos o lucro
              cesante derivados del uso del servicio.
            </p>

            <h3>8. Suscripciones y pagos</h3>
            <p>
              Si la Plataforma incluye planes de pago, precios, renovaciones y políticas de reembolso se
              comunicarán en el momento de la contratación y formarán parte del acuerdo con el usuario.
            </p>

            <h3>9. Modificaciones</h3>
            <p>
              Podemos actualizar estos términos publicando la nueva versión en la Plataforma. El uso
              continuado tras los cambios implica aceptación salvo disposición legal en contrario.
            </p>

            <h3>10. Ley aplicable y jurisdicción</h3>
            <p>
              Las controversias se someterán a la legislación y tribunales que corresponda según la
              residencia del titular del servicio, sin perjuicio de normas imperativas del consumidor.
            </p>

            <p className="text-sm text-muted-foreground not-prose mt-8">
              Para consultas sobre estos términos, utilice el canal de contacto que su organización defina
              (correo electrónico o formulario en la Plataforma).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
