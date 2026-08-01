import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XJTU PGC 秋招心愿情报墙",
  description: "XJTU PGC 陪伴西交同学投递宝洁：记录目标、分享困惑、寻找同行伙伴。",
  openGraph: {
    title: "XJTU PGC 秋招心愿情报墙",
    description: "秋招路上，有一群西交同学和 PGC 一起同行。",
    images: [{ url: "/og-pgc-care.png", width: 1732, height: 909, alt: "XJTU PGC 秋招心愿情报墙" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "XJTU PGC 秋招心愿情报墙",
    description: "秋招路上，有一群西交同学和 PGC 一起同行。",
    images: ["/og-pgc-care.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
