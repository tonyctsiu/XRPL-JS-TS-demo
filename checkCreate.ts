import { XrplClient } from "xrpl-client";
import { utils, derive, sign } from "xrpl-accountlib";

const main = async () => {
  const client = new XrplClient("wss://s.altnet.rippletest.net:51233/");

  if (process.argv.length < 5) {
    console.log("create check to destination account");
    console.log(
      "Usage: node dist/checkCreate <source FamilySeed> <destination: r-address> <XRP amount> [sequence no]"
    );
    console.log(
      "if sequence no is empty, the sequence no queried from blockchain is used."
    );
    process.exit(1);
  }

  const account = derive.familySeed(process.argv[2]);

  var data = await client.send({
    id: 1,
    command: "account_info",
    account: account.address,
    strict: true,
  });

  if (data.error != null) {
    console.log("Error: ", data.result.error_message);
    process.exit(1);
  }
  console.log("account info: ", data);
  var sequence = data.account_data.Sequence;
  if (process.argv.length >= 6) {
    sequence = parseInt(process.argv[5]);
  }
  var { id, signedTransaction } = sign(
    {
      TransactionType: "CheckCreate",
      Account: account.address,
      Destination: process.argv[3],
      SendMax: String(parseFloat(process.argv[4]) * 1_000_000),
      InvoiceID:
        "6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B",
      DestinationTag: 1,
      TicketSequence: 38486526,
      Sequence: 0,
      Fee: "12",
    },
    account
  );
  console.log("id ", id);
  console.log("signedTransaction ", signedTransaction);

  var result = await client.send({
    command: "submit",
    tx_blob: signedTransaction,
  });
  console.log("submission ", result);
  console.log("waiting for finality");
  await sleep(10000);

  data = await client.send({
    command: "tx",
    transaction: result.tx_json.hash,
  });
  console.log("finality result: ", JSON.stringify(data, null, 2));
  process.exit(1);
};

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main();
