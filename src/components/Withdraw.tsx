"use client";

import { useEffect, useState } from "react";
import { useNetwork, useWaitForTransaction } from "wagmi";
import { useGifterWithdraw, usePrepareGifterWithdraw } from "../generated";

interface Market {
  protocol: number;
  underlying: string;
  maturity: string;
}

interface PremiumOrder {
  key: string;
  protocol: number;
  maker: string;
  underlying: string;
  vault: boolean;
  exit: boolean;
  principal: string;
  premium: string;
  maturity: string;
  expiry: string;
}

interface PremiumMeta {
  price: string;
  signature: string;
  premiumAvailable: string;
  principalAvailable: string;
  status: string;
  sequence: number;
}

interface PremiumData {
  order: PremiumOrder;
  meta: PremiumMeta;
}

interface PremiumResponse {
  receivingPremium: PremiumData[];
  payingPremium: PremiumData[];
  timestamp: number;
  nonce: number;
}

function calculateDaysToUnixDate(unixTimestamp: number): number {
  const currentDate = new Date();
  const targetDate = new Date(unixTimestamp * 1000); // Convert Unix timestamp to milliseconds

  // Calculate the time difference in milliseconds
  const timeDifference = targetDate.getTime() - currentDate.getTime();

  // Calculate the number of days
  const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

  return daysDifference;
}

function convertUnixToDate(unixTimestamp: number): string {
  const date = new Date(unixTimestamp * 1000);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString(undefined, options);
}

export function Withdraw() {
  const [stakingAmount, setStakingAmount] = useState(0);
  const [completionDate, setCompletionDate] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [market, setMarket] = useState<Market[]>([]);
  const [orderBook, setOrderBook] = useState<PremiumResponse>();
  let chosenOrderIndex = -1;

  useEffect(() => {
    // Fetch active markets
    fetch("https://api-v3-dev.swivel.exchange/v3/markets?status=active")
      .then((response) => response.json())
      .then((data) => {
        console.log(data); // Test output for active markets
        setMarket(data);
      })
      .catch((error) => {
        console.error("Error fetching active markets:", error);
      });

    // Fetch order book
    fetch(
      "https://api-v3-dev.swivel.exchange/v3/orderbook?protocol=1&underlying=0x07865c6E87B9F70255377e024ace6630C1Eaa37F&maturity=1696112940"
    )
      .then((response) => response.json())
      .then((data: PremiumResponse) => {
        setOrderBook(data);
        //chosenOrderIndex = findOrderWithHighestPremium(orderBook?.payingPremium)// Test output for order book
        console.log(data.payingPremium[1]);
      })
      .catch((error) => {
        console.error("Error fetching order book:", error);
      });
  }, []);
  const withdraw = () => {
    const { config } = usePrepareGifterWithdraw({
      args: [123, `0x123`, "wrwrwer"],
    });

    const { data, write } = useGifterWithdraw({
      ...config,
      onSuccess: () => alert("yes"),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    withdraw();
  };
  function ProcessingMessage({ hash }: { hash?: `0x${string}` }) {
    const { chain } = useNetwork();
    const etherscan = chain?.blockExplorers?.etherscan;

    return (
      <span>
        Processing transaction...{" "}
        {etherscan && (
          <a href={`${etherscan.url}/tx/${hash}`}>{etherscan.name}</a>
        )}
      </span>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center pt-[50px]">
      <form className="w-80" onSubmit={handleSubmit}>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white rounded py-2 px-4"
        >
          Withdraw
        </button>
      </form>

      {withdrawAmount > 0 && (
        <div className="mt-8">
          <p>
            Amount to withdraw:{" "}
            <span className="font-semibold">{withdrawAmount}</span>
          </p>
          <p>
            Maturity:{" "}
            <span className="font-semibold">
              {String(convertUnixToDate(Number(completionDate)))}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
