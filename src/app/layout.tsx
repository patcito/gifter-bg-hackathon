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
          <div className="navbar bg-base-100">
            <div className="navbar-start">
              <div className="dropdown">
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li>
                    <a>Item 1</a>
                  </li>
                  <li>
                    <a>Parent</a>
                    <ul className="p-2">
                      <li>
                        <a>Submenu 1</a>
                      </li>
                      <li>
                        <a>Submenu 2</a>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <a>Item 3</a>
                  </li>
                </ul>
              </div>
              <a className="btn btn-ghost normal-case text-xl">Gifter</a>
              <a className="btn mr-5">🎁 Deposit</a>
              <a className="btn">💸 Withdraw</a>
            </div>
            <div className="navbar-end">
              <Connect />
            </div>
          </div>
          <div className="hero width-[300px] bg-base-200">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-5xl font-bold">Gifter 🎁💸</h1>
                <p className="py-6">
                  Make a donation to a charity or a gift to a friend. Get it
                  back 3 month later!
                </p>
              </div>
            </div>
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
