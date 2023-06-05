"use client";

import { BaseError } from "viem";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button, Card } from "react-daisyui";

export function Connect() {
  const { connector, isConnected } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div>
      <div>
        {isConnected && (
          <Button className="btn btn-primary" onClick={() => disconnect()}>
            Disconnect from {connector?.name}
          </Button>
        )}

        {connectors
          .slice(0, 1)
          .filter((x) => x.ready && x.id !== connector?.id)
          .map((x) => (
            <Button
              className="btn btn-primary"
              key={x.id}
              onClick={() => connect({ connector: x })}
            >
              Connect with {x.name}
              {isLoading && x.id === pendingConnector?.id && " (connecting)"}
            </Button>
          ))}
      </div>

      {error && <div>{(error as BaseError).shortMessage}</div>}
    </div>
  );
}
