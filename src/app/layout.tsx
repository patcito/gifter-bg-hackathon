import { Providers } from "./providers";

import "./globals.css";
import { Connect } from "../components/Connect";

export const metadata = {
  title: "wagmi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="hero width-[300px] bg-base-200">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-5xl font-bold">Gifter 🎁💸</h1>
                <p className="py-6">
                  Make a donation to a charity or a gift to a friend. Get it
                  back 3 month later!
                </p>

                <Connect />
              </div>
            </div>
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
