import type { Metadata, Viewport } from "next";
import "./globals.css";
import styles from "./layout.module.css";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import BottomNav from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "Personal Portal",
  description: "Multi-functional personal portal app",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#15202b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <div className={styles.container}>
          <aside className={styles.sidebar}>
            <Sidebar />
          </aside>
          <main className={styles.main}>
            {children}
          </main>
          <aside className={styles.rightSidebar}>
            <RightSidebar />
          </aside>
          <div className={styles.bottomNavContainer}>
            <BottomNav />
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
