import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// The well-known dev credentials below are only allowed against a local
// database (localhost / 127.0.0.1 / the docker-compose "db" host). For anything
// else, supply SEED_ADMIN_PASSWORD, so a known password never lands on a real DB.
const isLocalDb = /@(localhost|127\.0\.0\.1|db)(:|\/)/.test(process.env.DATABASE_URL ?? "");
const DEV_DEFAULT_PASSWORD = "ChangeMe123!";

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || (isLocalDb ? DEV_DEFAULT_PASSWORD : undefined);

  if (!adminPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required when seeding a non-local database. " +
        "Refusing to create an admin with a well-known default password."
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      role: "ADMIN",
      passwordHash
    }
  });

  const categoryData = [
    { slug: "fiscal", name: "Fiscal", nameEn: "Tax", nameFr: "Fiscal" },
    { slug: "laboral", name: "Laboral", nameEn: "Employment", nameFr: "Social" },
    { slug: "contable", name: "Contable", nameEn: "Accounting", nameFr: "Comptable" },
    { slug: "juridico", name: "Jurídico", nameEn: "Legal", nameFr: "Juridique" }
  ];

  const categories = await Promise.all(
    categoryData.map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: { name: c.name, nameEn: c.nameEn, nameFr: c.nameFr },
        create: c
      })
    )
  );

  const fiscalCategory = categories.find((c) => c.slug === "fiscal")!;

  // One sample published article per locale so the full-text search index
  // (prisma/sql/enable-search.sql) and the locale switcher both have real
  // content to demonstrate against out of the box.
  const sampleArticles = [
    {
      slug: "modelo-303-plazos-2026",
      locale: "ES" as const,
      title: "Modelo 303: plazos y novedades para 2026",
      excerpt: "Fechas clave de presentación del IVA trimestral y qué cambia este año.",
      body: "<p>Repasamos los plazos del modelo 303 y las novedades fiscales para autónomos y pymes en 2026.</p>"
    },
    {
      slug: "quarterly-vat-filing-deadlines-2026",
      locale: "EN" as const,
      title: "Quarterly VAT filing: deadlines and updates for 2026",
      excerpt: "Key dates for quarterly VAT returns and what's changing this year.",
      body: "<p>An overview of quarterly VAT filing deadlines and tax updates for freelancers and SMEs in 2026.</p>"
    },
    {
      slug: "tva-trimestrielle-echeances-2026",
      locale: "FR" as const,
      title: "TVA trimestrielle : échéances et nouveautés pour 2026",
      excerpt: "Les dates clés de déclaration de TVA et ce qui change cette année.",
      body: "<p>Un point sur les échéances de déclaration de TVA trimestrielle et les nouveautés fiscales 2026.</p>"
    }
  ];

  // Demo articles are for local development; on a real database they would be
  // published on the live site, so they are opt-in there.
  const seedSamples = isLocalDb || process.env.SEED_SAMPLE_ARTICLES === "1";

  for (const article of seedSamples ? sampleArticles : []) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        ...article,
        status: "PUBLISHED",
        publishedAt: new Date(),
        categoryId: fiscalCategory.id,
        authorId: admin.id
      }
    });
  }

  console.log(
    "Seeded admin user:",
    admin.email,
    adminPassword === DEV_DEFAULT_PASSWORD ? "(dev password: ChangeMe123! — change immediately)" : ""
  );
  console.log(
    "Seeded categories:",
    categories.map((c) => c.slug).join(", ")
  );
  console.log(
    "Seeded sample articles:",
    seedSamples ? sampleArticles.map((a) => a.slug).join(", ") : "(skipped: non-local database)"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
