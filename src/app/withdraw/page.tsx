import { Button } from "react-daisyui";
import { Account } from "../../components/Account";
import { Connect } from "../../components/Connect";
import { Connected } from "../../components/Connected";
import { NetworkSwitcher } from "../../components/NetworkSwitcher";
import { Withdraw } from "../../components/Withdraw";

export function WithdrawPage() {
  return (
    <>
      <Connected>
        <Withdraw />
        <NetworkSwitcher />
      </Connected>
    </>
  );
}

export default WithdrawPage;
