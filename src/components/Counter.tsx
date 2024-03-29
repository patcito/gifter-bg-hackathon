"use client";

import { useEffect, useState } from "react";
import { Account } from "../components/Account";
import {
  useNetwork,
  useWaitForTransaction,
  erc20ABI,
  usePrepareContractWrite,
  useContractWrite,
  useAccount,
  useContractRead,
} from "wagmi";
import { useGifterDeposit, usePrepareGifterDeposit } from "../generated";
import { secp256k1 } from "@noble/curves/secp256k1";
import { hexToNumber, hexToString } from "viem";
import {
  BigNumber,
  FixedFormat,
  FixedNumber,
  formatFixed,
  parseFixed,

  // Types
} from "@ethersproject/bignumber";
import { splitSignature } from "@ethersproject/bytes";
import { log } from "console";
import { ethers } from "ethers";
interface Market {
  protocol: number;
  underlying: string;
  maturity: bigint;
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
const CONTRACT = "0x0468888d36F1e6318D2c4C7ee65BD2C4b5942fa4";

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
interface ApproveTokenProps {
  stakingAmount: bigint;
  address: `0x${string}` | undefined;
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
  const [approved, setApproved] = useState(false);
  const { address } = useAccount();
  let chosenOrderIndex = -1;
  const Approved = () => {
    if (!address) return <></>;
    console.log(address);
    useContractRead({
      address: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
      abi: erc20ABI,
      functionName: "allowance",
      args: [address, CONTRACT],
      onSuccess(data) {
        console.log("data", data);

        if (data.valueOf() >= stakingAmount) {
          setApproved(true);
        } else {
          setApproved(false);
        }
      },
    });

    return <>{approved ? <Deposit /> : null} </>;
  };
  function ApproveToken(props: ApproveTokenProps) {
    if (!props.address) return <></>;
    if (props.stakingAmount <= 0) return <></>;
    const { config } = usePrepareContractWrite({
      address: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
      abi: erc20ABI,
      functionName: "approve",
      args: [CONTRACT, props.stakingAmount],
    });
    const { data, write } = useContractWrite({
      ...config,
      onSuccess: () => {
        console.log(data);
        setApproved(true);
      },
    });
    return (
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white rounded py-2 px-4"
        onClick={() => write?.()}
      >
        Approve
      </button>
    );
  }
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
        console.log(data.payingPremium[1]);
      })
      .catch((error) => {
        console.error("Error fetching order book:", error);
      });
  }, []);
  const Deposit = () => {
    const order = orderBook?.payingPremium[0].order;
    const meta = orderBook?.payingPremium[0].meta;
    if (!order) return <></>;
    if (!meta) return <></>;
    const split = splitSignature(meta.signature);
    console.log(split);

    const { config } = usePrepareGifterDeposit({
      address: CONTRACT,
      args: [
        [order],
        [stakingAmount],
        [
          {
            v: split.v,
            //@ts-ignore
            r: `${split.r}`,
            //@ts-ignore
            s: `${split.s}`,
          },
        ],
        0,
        receiverAddress,
        market[0].maturity,
      ],
    });

    const { data, write } = useContractWrite({
      ...config,
      onSuccess: () => {
        console.log(data);
      },
      onError(error, variables, context) {
        alert();
        console.log(error, variables, context);
      },
    });
    return (
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white rounded py-2 px-4"
        onClick={() => write?.()}
      >
        Send Gift
      </button>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("amountToGift", amountToGift);

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
              if (e.target.value == "") {
                e.target.value = "0";
              }
              const bnValue = BigNumber.from(String(e.target.value ?? "0"));
              setAmountToGift(bnValue.toBigInt());
              //PremiumFilled = (premium * fillAmount)/principal
              let chosenOrder = orderBook?.payingPremium[0];
              let premiumAvailable = BigNumber.from(
                chosenOrder?.meta?.premiumAvailable
              );

              let principalAvailable = BigNumber.from(
                chosenOrder?.meta?.principalAvailable
              );

              let x = premiumAvailable.div(principalAvailable);

              let amountStake = bnValue
                .mul(10 ** 12)
                .div(premiumAvailable.mul(10 ** 6).div(principalAvailable));
              console.log(amountToGift);
              console.log(Number(amountToGift));
              console.log(principalAvailable);
              console.log(Number(principalAvailable));
              console.log(premiumAvailable);
              console.log(Number(premiumAvailable));
              const reward = BigNumber.from(premiumAvailable ?? "1")
                .mul(10 ** 12)
                .div(principalAvailable ?? 90)
                .mul(
                  BigNumber.from(365).div(
                    calculateDaysToUnixDate(
                      Number(chosenOrder?.order.maturity ?? "0")
                    )
                  )
                );
              /*setRewardAPR(
                reward.toBigInt()
                /*100 *
                  (Number(premiumAvailable ?? 1) /
                    Number(principalAvailable ?? 90)) *
                  (365 /
                    calculateDaysToUnixDate(
                      Number(chosenOrder?.order.maturity ?? "0")
                    ))
                )
              );*/
              console.log(amountStake);
              console.log("maturity", chosenOrder?.order.maturity);
              setStakingAmount(amountStake.toBigInt());
              setCompletionDate(BigInt(chosenOrder?.order.maturity || 0));
            }}
            required
          />
        </div>
        {!approved && (
          <ApproveToken stakingAmount={stakingAmount} address={address} />
        )}
        {stakingAmount >= 0 && <Approved />}
      </form>
      {JSON.stringify(stakingAmount.toString())}
      {stakingAmount > 0 && (
        <div className="mt-8">
          <p>
            Sender should stake:{" "}
            <span className="font-semibold">
              {(Number(stakingAmount) / 10 ** 6).toString()}
            </span>
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
    </div>
  );
}
