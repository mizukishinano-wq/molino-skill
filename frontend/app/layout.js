import "./globals.css";
import Shell from "../components/Shell";
import { APP_NAME } from "../lib/api";

export const metadata = {
  title: APP_NAME + " スキルチェック",
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
