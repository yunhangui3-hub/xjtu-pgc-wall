import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "西交秋招便利贴情报墙",
  description: "留下你的秋招心愿，找到同行的人。西安交通大学校园秋招互助社区。",
  openGraph: {
    title: "西交秋招便利贴情报墙",
    description: "留下你的秋招心愿，找到同行的人",
    images: [{ url: "/og.png", width: 1732, height: 909, alt: "西交秋招便利贴情报墙" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "西交秋招便利贴情报墙",
    description: "留下你的秋招心愿，找到同行的人",
    images: ["/og.png"],
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
