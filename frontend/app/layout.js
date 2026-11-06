import "./globals.css";
import Shell from "../components/Shell";

export const metadata = {
  title: "ホテルモリノ スキルチェック",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
