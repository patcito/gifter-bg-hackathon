"use client";

import { useEffect, useState } from "react";
import { useNetwork, useWaitForTransaction } from "wagmi";
import { useGifterDeposit, usePrepareGifterDeposit } from "../generated";
import { secp256k1 } from "@noble/curves/secp256k1";
import { hexToNumber, hexToString } from "viem";
import Big from "big.js";

import {
  BigNumber,
  FixedFormat,
  FixedNumber,
  formatFixed,
  parseFixed,

  // Types
} from "@ethersproject/bignumber";
import { log } from "console";
interface Market {
  protocol: number;
  underlying: string;
  maturity: string;
}

interface PremiumOrder {
  key: `0x${string}`;
  protocol: number;
  maker: `0x${string}`;
  underlying: `0x${string}`;
  vault: boolean;
  exit: boolean;
  principal: bigint;
  premium: bigint;
  maturity: bigint;
  expiry: bigint;
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

function dec2hex(str: string) {
  // .toString(16) only works up to 2^53
  let dec = str.toString().split(""),
    sum = [],
    hex = [],
    i,
    s;
  while (dec.length) {
    //@ts-ignore
    s = 1 * dec.shift();
    for (i = 0; s || i < sum.length; i++) {
      s += (sum[i] || 0) * 10;
      sum[i] = s % 16;
      s = (s - sum[i]) / 16;
    }
  }
  while (sum.length) {
    //@ts-ignore
    hex.push(sum.pop().toString(16));
  }
  return hex.join("");
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
  const [receiverAddress, setReceiverAddress] = useState<`0x${string}`>("0x");
  const [amountToGift, setAmountToGift] = useState(BigInt(0));
  const [stakingAmount, setStakingAmount] = useState(BigInt(0));
  const [rewardAPR, setRewardAPR] = useState(BigInt(0));
  const [completionDate, setCompletionDate] = useState<bigint>(BigInt(0));
  const [rewardAmount, setRewardAmount] = useState(BigInt(0));
  const [market, setMarket] = useState<Market[]>([]);
  const [orderBook, setOrderBook] = useState<PremiumResponse>();
  const [submitted, setSubmitted] = useState(false);
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
  const Deposit = () => {
    const order = orderBook?.receivingPremium[0].order;
    const meta = orderBook?.receivingPremium[0].meta;
    if (!order) return <></>;
    if (!meta) return <></>;
    const signatureHex = meta.signature;
    const { r, s } = secp256k1.Signature.fromCompact(
      signatureHex.slice(2, 130)
    );
    const v = hexToNumber(`0x${signatureHex.slice(130)}`);

    const { config } = usePrepareGifterDeposit({
      args: [
        [order],
        [stakingAmount],
        [
          {
            v,
            r: `0x${dec2hex(r.toString())}`,
            s: `0x${dec2hex(s.toString())}`,
          },
        ],
        0,
        receiverAddress,
        market[0].maturity,
      ],
    });
    console.log("config", config.request.args);
    return <div>{JSON.stringify(config)}</div>;
    const { data, write } = useGifterDeposit({
      ...config,
      onSuccess: () => {
        console.log(data);
        alert("yes");
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("amountToGift", amountToGift);
    // Calculate staking amount, completion date, and reward amount
    const stakingAmount = BigNumber.from(amountToGift).div(10); // 10% of amount to gift
    const completionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const rewardAmount = BigNumber.from(stakingAmount).mul(12).div(10); // 120% of staking amount
    setStakingAmount(stakingAmount.toBigInt());
    setCompletionDate(BigNumber.from(completionDate.getTime()).toBigInt());
    setRewardAmount(rewardAmount.toBigInt());
    setSubmitted(true);
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
            onChange={(e) => {
              const address: `0x${string}` = e.target.value as `0x${string}`;
              setReceiverAddress(address);
            }}
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
            value={amountToGift.toString()}
            onChange={(e) => {
              const bnValue = Big(e.target.value);
              setAmountToGift(BigInt(bnValue.toNumber()));
              //PremiumFilled = (premium * fillAmount)/principal
              let chosenOrder = orderBook?.payingPremium[0];
              let premiumAvailable = Big(
                chosenOrder?.meta?.premiumAvailable.toString() || 0
              );
              console.log("premium", premiumAvailable);
              let principalAvailable = Big(
                chosenOrder?.meta?.principalAvailable.toString() || 0
              );

              console.log("principal", principalAvailable);
              alert(
                "amountStake: " +
                  bnValue +
                  " pa: " +
                  premiumAvailable +
                  " pra: " +
                  principalAvailable
              );
              let x = premiumAvailable.div(principalAvailable);
              alert(x);
              let amountStake = bnValue.div(
                premiumAvailable.div(principalAvailable)
              );
              console.log(amountToGift);
              console.log(Number(amountToGift));
              console.log(principalAvailable);
              console.log(Number(principalAvailable));
              console.log(premiumAvailable);
              console.log(Number(premiumAvailable));
              const reward = Big(premiumAvailable ?? 1)
                .mul(100)
                .div(principalAvailable ?? 90)
                .mul(
                  Big(365).div(
                    calculateDaysToUnixDate(
                      Number(chosenOrder?.order.maturity ?? "0")
                    )
                  )
                );
              setRewardAPR(BigInt(reward.toString()));
              console.log(amountStake);
              console.log("maturity", chosenOrder?.order.maturity);
              setStakingAmount(BigInt(amountStake.toString()));
              setCompletionDate(BigInt(chosenOrder?.order.maturity || 0));
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
      {JSON.stringify(stakingAmount.toString())}
      {stakingAmount > 0 && (
        <div className="mt-8">
          <p>
            Sender should stake:{" "}
            <span className="font-semibold">{stakingAmount.toString()}</span>
          </p>
          <p>
            Completion date:{" "}
            <span className="font-semibold">
              {String(convertUnixToDate(Number(completionDate)))}
            </span>
          </p>
          <p>
            Reward amount:{" "}
            <span className="font-semibold">{rewardAmount.toString()}</span>
          </p>
          <p>
            Reward APR: <span className="font-semibold">{rewardAPR + "%"}</span>
          </p>
        </div>
      )}
      {submitted && <Deposit />}
    </div>
  );
}
