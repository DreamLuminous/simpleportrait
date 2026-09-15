import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "简照｜隐私友好的证件照制作工具",
  description: "在本机完成证件照裁剪、尺寸换算、换底与导出。支持自定义像素、毫米、DPI 和冲印排版。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
