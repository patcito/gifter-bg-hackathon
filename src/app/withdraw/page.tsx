import { Button } from "react-daisyui";
import { Account } from "../../components/Account";
import { Connect } from "../../components/Connect";
import { Connected } from "../../components/Connected";
import { Withdraw } from "../../components/Withdraw";
import { NetworkSwitcher } from "../../components/NetworkSwitcher";

export function Withdraw() {
  return (
    <>
      <Connected>
        <Withdraw />
        <NetworkSwitcher />
      </Connected>
    </>
  );
}

export default Withdraw;
