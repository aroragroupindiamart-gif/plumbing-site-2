import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import {
  BRAND_NAME, NICHE, PHONE_NUMBER, PHONE_TEL,
  GA_ID, ADSENSE_ID, GSC_TOKEN,
} from "@/lib/config";
import StickyNav from "@/components/StickyNav";
import MobileStickyBar from "@/components/MobileStickyBar";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Local ${NICHE}`,
  description: `${BRAND_NAME} connects you with trusted local ${NICHE.toLowerCase()} professionals across the US. 24/7 service. Call ${PHONE_NUMBER} now.`,
  ...(GSC_TOKEN ? { verification: { google: GSC_TOKEN } } : {}),
  openGraph: {
    images: [{ url: "/opengraph.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {ADSENSE_ID && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}

        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body>
        <StickyNav />
        <main>{children}</main>
        <MobileStickyBar phoneNumber={PHONE_NUMBER} phoneTel={PHONE_TEL} />
      </body>
    </html>
  );
}
