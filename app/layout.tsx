import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: '프리셀 VS - 온라인 대전 프리셀 게임',
    template: '%s | 프리셀 VS'
  },
  description: '온라인 실시간 대전 프리셀 게임. 친구와 함께 프리셀 대결을 즐기고, 랭크를 올려보세요. 무료로 플레이하고 리더보드에서 최고 순위를 차지하세요!',
  keywords: [
    '프리셀',
    '프리셀 게임',
    '온라인 프리셀',
    '대전 프리셀',
    '프리셀 VS',
    'freecell',
    'freecell game',
    'online freecell',
    '카드 게임',
    '무료 게임',
    '브라우저 게임',
    '실시간 대전',
    '랭크 게임'
  ],
  authors: [{ name: '프리셀 VS' }],
  creator: '프리셀 VS',
  publisher: '프리셀 VS',
  metadataBase: new URL('https://freecell-vs.vercel.app'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://freecell-vs.vercel.app',
    title: '프리셀 VS - 온라인 대전 프리셀 게임',
    description: '온라인 실시간 대전 프리셀 게임. 친구와 함께 프리셀 대결을 즐기고, 랭크를 올려보세요!',
    siteName: '프리셀 VS',
    images: [
      {
        url: '/og-image.png', // 이미지를 public/og-image.png에 추가해야 합니다
        width: 1200,
        height: 630,
        alt: '프리셀 VS 게임 썸네일'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: '프리셀 VS - 온라인 대전 프리셀 게임',
    description: '온라인 실시간 대전 프리셀 게임. 친구와 함께 프리셀 대결을 즐기고, 랭크를 올려보세요!',
    images: ['/og-image.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    // Google Search Console 인증 코드 (나중에 추가)
    // google: 'your-verification-code',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" translate="no">
      <head>
        <meta name="google" content="notranslate" />
        {/* 추가 메타 태그 */}
        <meta name="theme-color" content="#15803d" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* 구조화된 데이터 (Schema.org) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: '프리셀 VS',
              description: '온라인 실시간 대전 프리셀 게임',
              url: 'https://freecell-vs.vercel.app',
              applicationCategory: 'GameApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'KRW'
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '100'
              }
            })
          }}
        />

      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        translate="no"
      >
        {children}
      </body>
    </html>
  );
}