import "./globals.css";

export const metadata = {
  title: "TimeTrack — Where did my day go?",
  description: "24-hour life tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
