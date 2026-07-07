import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllLocations, getLocation, getService,
  getSiblingServices, getNearbyLocations,
  isServiceAllowedForTier, getServicesByLocationTier,
} from "@/lib/data";
import {
  BRAND_NAME, PHONE_NUMBER, PHONE_TEL, SITE_URL,
  NICHE, NICHE_PLURAL, NICHE_SINGULAR, SCHEMA_TYPE,
} from "@/lib/config";
import { selectVariant } from "@/lib/spintax";
import Footer from "@/components/Footer";

export const dynamicParams = false;

export async function generateStaticParams() {
  // Await only twice so we never chain 2,249 microtasks in a loop
  const [locations, allServices] = await Promise.all([
    getAllLocations(),
    getAllServices(),
  ]);
  const total = allServices.length;
  const isDev = process.env.NODE_ENV !== "production";
  const params: { state: string; place: string; service: string }[] = [];

  outer: for (const loc of locations) {
    const limit =
      loc.tier === 1 ? total
      : loc.tier === 2 ? Math.ceil(total * 0.5)
      : Math.ceil(total * 0.17);
    const services = allServices.slice(0, limit);
    for (const svc of services) {
      params.push({
        state: loc.state_code.toLowerCase(),
        place: loc.place_slug,
        service: svc.service_slug,
      });
      // In dev cap at 50 to keep startup fast
      if (isDev && params.length >= 50) break outer;
    }
  }

  return params;
}

interface Props {
  params: Promise<{ state: string; place: string; service: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, place, service: serviceSlug } = await params;
  const stateCode = state.toUpperCase();
  const [loc, svc] = await Promise.all([getLocation(stateCode, place), getService(serviceSlug)]);
  if (!loc || !svc) return { title: "Not Found" };
  if (!(await isServiceAllowedForTier(svc.id, loc.tier))) return { title: "Not Found" };

  const title       = `${svc.service_name} in ${loc.place_name}, ${stateCode}`.slice(0, 60);
  const description = `Need ${svc.service_name.toLowerCase()} in ${loc.place_name}, ${loc.state_name}? ${BRAND_NAME} provides 24/7 licensed service. Call ${PHONE_NUMBER} now.`.slice(0, 155);
  const canonicalUrl = `${SITE_URL}/${stateCode.toLowerCase()}/${loc.place_slug}/${svc.service_slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl },
  };
}

function introParagraph(svcName: string, cityName: string, stateName: string, keywords: string[], locId: number, svcId: number): string {
  const kw = selectVariant(keywords, locId, svcId);
  return selectVariant([
    `When you need ${kw} in ${cityName}, you need a trusted professional who responds fast. Our licensed ${NICHE_PLURAL.toLowerCase()} are ready 24 hours a day, 7 days a week.`,
    `${cityName} residents rely on ${BRAND_NAME} for dependable ${kw}. Our certified ${NICHE_PLURAL.toLowerCase()} serve the entire ${cityName} area with same-day service available.`,
    `Don't let a ${NICHE.toLowerCase()} problem disrupt your life. Our ${cityName} ${kw} specialists have the tools and experience to resolve any issue quickly — the first time.`,
    `For ${kw} in ${cityName}, our team of licensed, insured ${NICHE_PLURAL.toLowerCase()} brings years of hands-on experience and guaranteed workmanship to every job.`,
  ], locId, svcId + 11);
}

function bodyParagraph1(svcName: string, cityName: string, keywords: string[], locId: number, svcId: number): string {
  const kw = selectVariant(keywords, locId, svcId + 1);
  return selectVariant([
    `Our ${cityName} ${NICHE_PLURAL.toLowerCase()} bring years of hands-on experience in ${kw}. Every technician is fully licensed, insured, and background-checked. We use professional-grade equipment to ensure lasting results.`,
    `For ${kw} in ${cityName}, no job is too big or too small. We handle everything from routine maintenance to complex emergency repairs, always delivering the highest standard of workmanship.`,
    `${BRAND_NAME} has built a reputation in ${cityName} by providing honest, transparent ${kw} at fair prices. We give upfront quotes with no hidden fees, and our technicians explain every step before they begin work.`,
    `When it comes to ${kw} in ${cityName}, our crew arrives on time, respects your property, and cleans up completely before leaving. All work is backed by a written guarantee.`,
  ], locId, svcId + 3);
}

function bodyParagraph2(svcName: string, cityName: string, keywords: string[], locId: number, svcId: number): string {
  const kw = selectVariant(keywords, locId, svcId + 2);
  return selectVariant([
    `Whether you're dealing with an urgent situation or planning a scheduled ${kw} project in ${cityName}, we make the process easy. Call us any time, day or night.`,
    `Our ${kw} services in ${cityName} are backed by a workmanship warranty. We stand behind every job, ensuring you have peace of mind long after our technicians leave.`,
    `When you choose ${BRAND_NAME} for ${kw} in ${cityName}, you're choosing a team that treats your property like their own. We clean up after every job and minimize disruption.`,
    `${cityName} residents trust us for ${kw} because we show up on time, price jobs fairly, and never cut corners. Call ${PHONE_NUMBER} to schedule service.`,
  ], locId, svcId + 5);
}

function trustBullets(svcName: string, cityName: string, keywords: string[], locId: number, svcId: number): string[] {
  const kw = selectVariant(keywords, locId, svcId + 3);
  const sets = [
    [
      `Fully licensed and insured ${kw} technicians`,
      `24/7 emergency response — no extra charge for nights or weekends`,
      `Upfront, transparent pricing — no hidden fees`,
      `All work backed by our workmanship guarantee`,
      `Locally trusted in ${cityName}`,
    ],
    [
      `Same-day ${kw} service available in ${cityName}`,
      `Background-checked technicians — safe for your home and family`,
      `Free estimates on major jobs`,
      `We use only quality, code-compliant materials`,
      `Eco-friendly options available upon request`,
    ],
    [
      `Rapid response — most jobs dispatched within the hour`,
      `${cityName} residents have trusted us for years`,
      `Expert ${kw} diagnosis — right the first time`,
      `Flexible appointment times including evenings and weekends`,
      `Fully equipped for on-the-spot repairs`,
    ],
  ];
  return sets[Math.abs((locId * 31 + svcId) % 3)];
}

function faqItems(svcName: string, cityName: string, keywords: string[], locId: number, svcId: number) {
  const kw0 = selectVariant(keywords, locId, svcId);
  const kw1 = selectVariant(keywords, locId, svcId + 4);
  return [
    {
      q: `How much does ${svcName.toLowerCase()} cost in ${cityName}?`,
      a: selectVariant([
        `The cost of ${kw0} in ${cityName} varies based on the scope of work. We provide free estimates on all major jobs and upfront quotes before any work begins. Call ${PHONE_NUMBER} for a quote.`,
        `Pricing for ${kw0} in ${cityName} depends on factors like the severity and access required. We offer competitive, transparent pricing. Call us at ${PHONE_NUMBER} for an accurate estimate.`,
      ], locId, svcId),
    },
    {
      q: `How quickly can a ${NICHE_SINGULAR.toLowerCase()} arrive in ${cityName}?`,
      a: selectVariant([
        `For emergency ${kw1} calls in ${cityName}, we typically dispatch a technician within 30–60 minutes. For scheduled appointments, we offer same-day and next-day availability.`,
        `Our ${cityName} ${NICHE_PLURAL.toLowerCase()} are strategically located for fast response. Emergency calls are typically answered within the hour.`,
      ], locId, svcId + 1),
    },
    {
      q: `Are your ${NICHE_PLURAL.toLowerCase()} licensed in ${cityName}?`,
      a: `Yes. All of our ${NICHE_PLURAL.toLowerCase()} serving ${cityName} are fully licensed, bonded, and insured in accordance with state and local regulations.`,
    },
    {
      q: `Do you offer 24/7 ${svcName.toLowerCase()} in ${cityName}?`,
      a: `Absolutely. Our ${cityName} team is available 24 hours a day, 7 days a week — including weekends and holidays. There is no extra charge for after-hours emergency calls.`,
    },
    {
      q: `What should I do before the ${NICHE_SINGULAR.toLowerCase()} arrives?`,
      a: selectVariant([
        `For most service calls, just ensure the technician can access the work area. If there is an active problem, try to isolate it to minimize damage. Our dispatcher can walk you through any emergency steps.`,
        `Clear the work area so our technician has room to work safely. Our dispatcher can walk you through any emergency steps when you call ${PHONE_NUMBER}.`,
      ], locId, svcId + 3),
    },
  ];
}

function getRating(locId: number, svcId: number): { rating: number; reviewCount: number } {
  const seed = Math.abs(locId * 17 + svcId * 13);
  const ratings = [4.5, 4.6, 4.7, 4.8, 4.9];
  return { rating: ratings[seed % ratings.length], reviewCount: 50 + (seed % 451) };
}

export default async function ServicePage({ params }: Props) {
  const { state, place, service: serviceSlug } = await params;
  const stateCode = state.toUpperCase();

  const [loc, svc] = await Promise.all([getLocation(stateCode, place), getService(serviceSlug)]);
  if (!loc || !svc) notFound();
  if (!(await isServiceAllowedForTier(svc.id, loc.tier))) notFound();

  const [siblings, nearby] = await Promise.all([
    getSiblingServices(loc.id, svc.id, 5),
    getNearbyLocations(loc.id, stateCode, 3),
  ]);

  const faqs    = faqItems(svc.service_name, loc.place_name, svc.base_keywords, loc.id, svc.id);
  const bullets = trustBullets(svc.service_name, loc.place_name, svc.base_keywords, loc.id, svc.id);
  const intro   = introParagraph(svc.service_name, loc.place_name, loc.state_name, svc.base_keywords, loc.id, svc.id);
  const body1   = bodyParagraph1(svc.service_name, loc.place_name, svc.base_keywords, loc.id, svc.id);
  const body2   = bodyParagraph2(svc.service_name, loc.place_name, svc.base_keywords, loc.id, svc.id);
  const canonicalUrl = `${SITE_URL}/${stateCode.toLowerCase()}/${loc.place_slug}/${svc.service_slug}`;
  const { rating, reviewCount } = getRating(loc.id, svc.id);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE,
    name: `${BRAND_NAME} — ${svc.service_name}`,
    description: `Professional ${svc.service_name.toLowerCase()} in ${loc.place_name}, ${loc.state_name}. Licensed and insured. Available 24/7.`,
    telephone: PHONE_NUMBER,
    url: canonicalUrl,
    areaServed: {
      "@type": "City",
      name: loc.place_name,
      containedInPlace: { "@type": "State", name: loc.state_name },
    },
    openingHours: "Mo-Su 00:00-23:59",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${NICHE} Services`,
      itemListElement: [{ "@type": "Offer", itemOffered: { "@type": "Service", name: svc.service_name } }],
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",            item: SITE_URL },
      { "@type": "ListItem", position: 2, name: loc.state_name,    item: `${SITE_URL}/${stateCode.toLowerCase()}` },
      { "@type": "ListItem", position: 3, name: loc.place_name,    item: `${SITE_URL}/${stateCode.toLowerCase()}/${loc.place_slug}` },
      { "@type": "ListItem", position: 4, name: svc.service_name,  item: canonicalUrl },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div style={{ textAlign: "center", padding: "10px 24px", fontSize: "0.85rem", color: "#94a3b8", paddingTop: 80 }}>
        <span style={{ color: "#f97316", fontWeight: 700 }}>
          24/7 {svc.service_name.toUpperCase()} IN {loc.place_name.toUpperCase()}
        </span>
        {" "}&mdash; Serving All of {loc.state_name} &mdash;{" "}
        <a href={`tel:${PHONE_TEL}`} style={{ color: "white", fontWeight: 700 }}>{PHONE_NUMBER}</a>
      </div>

      <section className="hero-gradient" style={{ padding: "60px 24px" }}>
        <div className="service-hero-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "start" }}>
          <div>
            <nav style={{ marginBottom: 20, fontSize: "0.8rem", color: "#64748b" }}>
              <Link href="/" style={{ color: "#64748b", textDecoration: "none" }}>Home</Link>
              <span style={{ margin: "0 6px" }}>/</span>
              <Link href={`/${stateCode.toLowerCase()}`} style={{ color: "#64748b", textDecoration: "none" }}>{loc.state_name}</Link>
              <span style={{ margin: "0 6px" }}>/</span>
              <Link href={`/${stateCode.toLowerCase()}/${loc.place_slug}`} style={{ color: "#64748b", textDecoration: "none" }}>{loc.place_name}</Link>
              <span style={{ margin: "0 6px" }}>/</span>
              <span style={{ color: "#94a3b8" }}>{svc.service_name}</span>
            </nav>

            <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", color: "#f97316", marginBottom: 12 }}>
              {svc.service_name.toUpperCase()} IN {loc.place_name.toUpperCase()}, {stateCode}
            </div>

            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: "white", lineHeight: 1.15, marginBottom: 20 }}>
              {svc.service_name} in {loc.place_name}, {loc.state_name}
            </h1>

            <p style={{ color: "#94a3b8", fontSize: "1.05rem", lineHeight: 1.75, marginBottom: 28, maxWidth: 600 }}>
              {intro}
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
              <a href={`tel:${PHONE_TEL}`} className="btn-primary">Call for {svc.service_name}</a>
              <a href="#about" className="btn-secondary">Learn More</a>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              {["Licensed & Insured", "24/7 Available", `${loc.place_name}-Wide Service`].map((badge) => (
                <span key={badge} className="badge-pill">{badge}</span>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 2 }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled  = star <= Math.floor(rating);
                  const partial = !filled && star - 0.5 <= rating;
                  const fill    = filled || partial ? "#f97316" : "#1e293b";
                  return (
                    <svg key={star} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      {partial ? (
                        <>
                          <defs>
                            <linearGradient id={`half-${star}`}>
                              <stop offset="50%" stopColor="#f97316" />
                              <stop offset="50%" stopColor="#1e293b" />
                            </linearGradient>
                          </defs>
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={`url(#half-${star})`} stroke="#f97316" strokeWidth="1.5" />
                        </>
                      ) : (
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={fill} stroke="#f97316" strokeWidth="1.5" />
                      )}
                    </svg>
                  );
                })}
              </div>
              <span style={{ fontWeight: 700, color: "white", fontSize: "0.95rem" }}>{rating.toFixed(1)}</span>
              <span style={{ color: "#64748b", fontSize: "0.85rem" }}>({reviewCount.toLocaleString()} reviews)</span>
            </div>
          </div>

          <div className="contact-card contact-card-wrapper" style={{ minWidth: 280, maxWidth: 320, padding: "28px 24px", flexShrink: 0 }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.2em", color: "#f97316", marginBottom: 12 }}>
              EMERGENCY DISPATCH
            </div>
            <a href={`tel:${PHONE_TEL}`} style={{ display: "block", fontSize: "1.6rem", fontWeight: 800, color: "#0a0f1e", textDecoration: "none", marginBottom: 20, lineHeight: 1.2 }}>
              {PHONE_NUMBER}
            </a>
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, marginBottom: 16 }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: "#64748b", marginBottom: 4 }}>SERVICE AREA</div>
              <div style={{ fontWeight: 600, color: "#0a0f1e" }}>{loc.place_name}, {stateCode}</div>
            </div>
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, marginBottom: 20 }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: "#64748b", marginBottom: 4 }}>HOURS</div>
              <div style={{ fontWeight: 600, color: "#0a0f1e" }}>Open 24 Hours</div>
            </div>
            <a href={`tel:${PHONE_TEL}`} style={{ display: "block", backgroundColor: "#f97316", color: "white", fontWeight: 800, padding: "14px", borderRadius: 6, textAlign: "center", textDecoration: "none" }}>
              Call Now — Free Estimate
            </a>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#0d1526", padding: "50px 24px", borderTop: "1px solid #1e293b", borderBottom: "1px solid #1e293b" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { icon: "★", title: "24/7 Service",        desc: `${svc.service_name} available around the clock — no extra charge for nights or weekends.` },
              { icon: "⚡", title: "Rapid Response",      desc: `Most ${loc.place_name} calls dispatched within 60 minutes.` },
              { icon: "📍", title: `${loc.place_name}-Wide`, desc: `We serve all neighborhoods throughout ${loc.place_name} and surrounding areas.` },
              { icon: "✓",  title: "Licensed & Insured", desc: "All technicians are fully licensed, bonded, and carry comprehensive liability insurance." },
            ].map((card) => (
              <div key={card.title} className="feature-card" style={{ padding: "24px" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: 12 }}>{card.icon}</div>
                <div style={{ fontWeight: 700, color: "white", marginBottom: 8 }}>{card.title}</div>
                <div style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "white", marginBottom: 20 }}>
            About Our {svc.service_name} in {loc.place_name}
          </h2>
          <p style={{ color: "#94a3b8", lineHeight: 1.8, marginBottom: 20 }}>{body1}</p>
          <p style={{ color: "#94a3b8", lineHeight: 1.8, marginBottom: 40 }}>{body2}</p>

          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "white", marginBottom: 20 }}>
            Why {loc.place_name} Residents Trust Us
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {bullets.map((bullet, i) => (
              <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: "#f97316", fontWeight: 700, marginTop: 2, flexShrink: 0 }}>✓</span>
                <span style={{ color: "#94a3b8", lineHeight: 1.6 }}>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section style={{ backgroundColor: "#0d1526", padding: "60px 24px", borderTop: "1px solid #1e293b" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "white", marginBottom: 32 }}>
            Frequently Asked Questions
          </h2>
          {faqs.map((faq, i) => (
            <details key={i} className="faq-item">
              <summary>
                <h3 style={{ margin: 0, fontSize: "inherit", fontWeight: "inherit", color: "inherit", display: "inline" }}>{faq.q}</h3>
                <span style={{ color: "#f97316", flexShrink: 0 }}>+</span>
              </summary>
              <div className="faq-answer">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>

      <section style={{ padding: "50px 24px 60px" }}>
        <div className="two-col-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: 16 }}>
              Other Services in {loc.place_name}
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {siblings.map((s) => (
                <li key={s.id}>
                  <Link href={`/${stateCode.toLowerCase()}/${loc.place_slug}/${s.service_slug}`} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#f97316" }}>→</span>
                    {s.service_name} in {loc.place_name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: 16 }}>Nearby Areas</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {nearby.map((n) => (
                <li key={n.id}>
                  <Link href={`/${stateCode.toLowerCase()}/${n.place_slug}/${svc.service_slug}`} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#f97316" }}>→</span>
                    {svc.service_name} in {n.place_name}, {stateCode}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#f97316", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "white", marginBottom: 12 }}>
            Need {svc.service_name}? Call Now.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: 24 }}>
            Our network of licensed {NICHE_PLURAL.toLowerCase()} is available 24/7, 365 days a year.
          </p>
          <a href={`tel:${PHONE_TEL}`} style={{ backgroundColor: "white", color: "#f97316", fontWeight: 800, padding: "16px 40px", borderRadius: 6, textDecoration: "none", fontSize: "1.15rem", display: "inline-block" }}>
            {PHONE_NUMBER}
          </a>
        </div>
      </section>

      <Footer city={loc.place_name} stateCode={stateCode} placeSlug={loc.place_slug} />
    </>
  );
}
