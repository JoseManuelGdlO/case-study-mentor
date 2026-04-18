import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Seo } from '@/components/Seo';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <Seo
        title="Política de privacidad"
        description="Política de privacidad de ENARMX: tratamiento de datos personales, cookies y uso de la plataforma de preparación ENARM."
        path="/privacidad"
      />
      <div className="container max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </Button>

        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Política de privacidad</CardTitle>
            <p className="text-sm text-muted-foreground">
              Última actualización: marzo de 2026. Este documento es un borrador orientativo; debe ser
              revisado por asesoría legal antes de uso en producción.
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none text-foreground">
            <h3>1. Responsable del tratamiento</h3>
            <p>
              Debe completarse con la identidad del responsable (titular de la Plataforma), domicilio y
              datos de contacto conforme a la normativa de protección de datos aplicable en su país (por
              ejemplo, en México, la Ley Federal de Protección de Datos Personales en Posesión de los
              Particulares y su reglamento, cuando proceda).
            </p>

            <h3>2. Datos que recopilamos</h3>
            <p>
              Podemos tratar: datos de registro e identificación (nombre, correo electrónico); datos de
              perfil y preferencias; datos de uso de la Plataforma (exámenes realizados, respuestas,
              estadísticas agregadas); datos técnicos (dirección IP, tipo de navegador, identificadores de
              dispositivo); y, si utiliza inicio de sesión con Google, la información que ese proveedor
              comunique según su configuración y permisos.
            </p>

            <h3>3. Finalidades</h3>
            <p>
              Utilizamos los datos para prestar el servicio, autenticar usuarios, personalizar la
              experiencia, mejorar contenidos y funciones, cumplir obligaciones legales, atender solicitudes
              y, en su caso, enviar comunicaciones relacionadas con la cuenta o el servicio, siempre con
              base en la legitimación que corresponda (ejecución del contrato, interés legítimo o
              consentimiento).
            </p>

            <h3>4. Cookies y tecnologías similares</h3>
            <p>
              La Plataforma puede emplear cookies o almacenamiento local para mantener la sesión, preferencias
              de seguridad y análisis básico del uso. Puede configurar su navegador para rechazar cookies,
              aunque algunas funciones podrían dejar de estar disponibles.
            </p>

            <h3>5. Conservación</h3>
            <p>
              Conservamos los datos el tiempo necesario para las finalidades indicadas y los plazos legales
              aplicables. Tras la baja de la cuenta, podremos conservar cierta información bloqueada por
              obligaciones legales o la defensa de reclamaciones.
            </p>

            <h3>6. Destinatarios y encargados</h3>
            <p>
              No vendemos sus datos personales. Podemos compartirlos con proveedores que nos prestan
              servicios de alojamiento, analítica o autenticación (por ejemplo, Google), bajo acuerdos que
              exigen medidas de seguridad y tratamiento acotado. También podremos revelar información si la
              ley lo exige o ante autoridades competentes.
            </p>

            <h3>7. Transferencias internacionales</h3>
            <p>
              Si algún proveedor trata datos fuera de su país, aplicaremos las salvaguardas previstas en la
              normativa (cláusulas contractuales tipo, decisiones de adecuación u otros mecanismos).
            </p>

            <h3>8. Derechos del titular</h3>
            <p>
              Según la legislación aplicable, usted puede ejercer derechos de acceso, rectificación,
              cancelación, oposición, limitación del tratamiento o portabilidad, así como retirar el
              consentimiento cuando el tratamiento se base en él. Puede presentar reclamación ante la
              autoridad de protección de datos que corresponda.
            </p>

            <h3>9. Menores de edad</h3>
            <p>
              El servicio está dirigido a personas con capacidad legal para contratar. Si tiene conocimiento
              de que un menor ha facilitado datos sin el consentimiento adecuado, rogamos contacte al
              responsable para su eliminación.
            </p>

            <h3>10. Seguridad</h3>
            <p>
              Aplicamos medidas técnicas y organizativas razonables para proteger la información. Ningún
              sistema es completamente seguro; le recomendamos usar contraseñas robustas y no compartir su
              cuenta.
            </p>

            <h3>11. Cambios en esta política</h3>
            <p>
              Publicaremos las actualizaciones en esta página y, cuando sea relevante, le notificaremos por
              medios adicionales.
            </p>

            <p className="text-sm text-muted-foreground not-prose mt-8">
              Para ejercer sus derechos o formular preguntas sobre privacidad, utilice el contacto que su
              organización defina. También puede consultar los{' '}
              <Link to="/terminos" className="text-primary underline hover:no-underline">
                términos y condiciones
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
