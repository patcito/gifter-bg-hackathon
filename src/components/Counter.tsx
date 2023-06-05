"use client";

import { useEffect, useState } from "react";
import { useNetwork, useWaitForTransaction } from "wagmi";
import { useGifterDeposit, usePrepareGifterDeposit } from "../generated.ts";

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

export function Counter() {
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amountToGift, setAmountToGift] = useState("");
  const [stakingAmount, setStakingAmount] = useState(0);
  const [completionDate, setCompletionDate] = useState("");
  const [rewardAmount, setRewardAmount] = useState(0);
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
  const prepareDeposit = () => {
    const { config } = usePrepareGifterDeposit({
      args: [
        123,
        `0x123`,
        BigInt("12344"),
        BigInt("23423424"),
        `0xwerwrwer`,
        "wrwrwer",
      ],
    });

    const { data, write } = useGifterDeposit({
      ...config,
      onSuccess: () => alert("yes"),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate staking amount, completion date, and reward amount
    const stakingAmount = parseFloat(amountToGift) * 0.1; // 10% of amount to gift
    const completionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const rewardAmount = stakingAmount * 1.2; // 120% of staking amount

    setStakingAmount(stakingAmount);
    setCompletionDate(completionDate.toDateString());
    setRewardAmount(rewardAmount);
  };
  function ProcessingMessage({ hash }: { hash?: `0x${string}` }) {
    const { chain } = useNetwork();
    const etherscan = chain?.blockExplorers?.etherscan;
    const { config } = usePrepareGifterDeposit({
      args: [],
    });
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
        <div className="mb-4">
          <label
            htmlFor="receiverAddress"
            className="text-lg font-semibold mb-2"
          >
            Receiver Address
          </label>
          <input
            type="text"
            id="receiverAddress"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="amountToGift" className="text-lg font-semibold mb-2">
            Amount to Gift
          </label>
          <input
            type="number"
            id="amountToGift"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={amountToGift}
            onChange={(e) => {
              setAmountToGift(e.target.value);
              //PremiumFilled = (premium * fillAmount)/principal
              let chosenOrder = orderBook?.payingPremium[0];
              let premiumAvailable = chosenOrder?.meta?.premiumAvailable;
              let principalAvailable = chosenOrder?.meta?.principalAvailable;
              let amountStake =
                (Number(principalAvailable ?? 90) * Number(amountToGift)) /
                Number(premiumAvailable ?? 1);
              console.log(Number(amountStake));
              setCompletionDate(chosenOrder?.order.maturity ?? "");
              setStakingAmount(Number(amountStake));
            }}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white rounded py-2 px-4"
        >
          Submit
        </button>
      </form>

      {stakingAmount > 0 && (
        <div className="mt-8">
          <p>
            Sender should stake:{" "}
            <span className="font-semibold">{stakingAmount}</span>
          </p>
          <p>
            Completion date:{" "}
            <span className="font-semibold">
              {String(convertUnixToDate(Number(completionDate)))}
            </span>
          </p>
          <p>
            Reward amount: <span className="font-semibold">{rewardAmount}</span>
          </p>
        </div>
      )}
    </div>
  );
}
