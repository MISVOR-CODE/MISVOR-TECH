import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const copyByLocale = {
    en: { title: "Page not found", body: "The page you are looking for does not exist or has moved.", cta: "Back to home" },
    es: { title: "Página no encontrada", body: "La página que buscas no existe o ha cambiado de sitio.", cta: "Volver al inicio" },
    fr: { title: "Page introuvable", body: "La page que vous cherchez n'existe pas ou a été déplacée.", cta: "Retour à l'accueil" }
  };
  const locale = (await getLocale().catch(() => "en")) as keyof typeof copyByLocale;
  const copy = copyByLocale[locale] ?? copyByLocale.en;

  return (
    <div className="surface-night lattice -mt-16 flex min-h-[80vh] flex-col items-center justify-center px-4 text-center lg:-mt-20">
      <p className="eyebrow">404</p>
      <h1 className="mt-5 text-4xl font-medium text-[#f6edd6] sm:text-5xl">{copy.title}</h1>
      <p className="mt-3 max-w-md text-[#d9ceb4]">{copy.body}</p>
      <Link href="/" className="btn-brass mt-8">
        {copy.cta}
      </Link>
    </div>
  );
}
