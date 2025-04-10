import Client from "bitcoin-core";
import { promises } from 'fs'
import path from 'path'
import { exec } from 'child_process'
interface UTXO {
    txid: string;
    vout: number;
    amount: number;
}

export default function BtcCoin() {
    const client = new Client({
        username: 'alice',
        password: 'bxPUPEB0UHDnkOImq4pelZBc5SzHNQ49m5bzrJ1KofQ',
        host: 'http://localhost:18443',
    });

    // ปรับให้พารามิเตอร์เป็น Object
    async function makeTransaction({ destinationAddress, amount }: { destinationAddress: string, amount: number }) {
        const txId = await client.command('sendtoaddress', destinationAddress, amount);
        return txId;
    }

    // ปรับให้พารามิเตอร์เป็น Object
    async function makeMultipleTransactions({
        source,
        destination,
    }: {
        source: {
            clientAddress: string;
        };
        destination: {
            address: string;
            amount: number;
        }[];
    }): Promise<string | null> {
        try {
            // client.wallet = source.clientWallet;
            const unspent = await client.command('listunspent');
            const inputs = unspent.map((tx: UTXO) => ({ txid: tx.txid, vout: tx.vout }));

            const outputs = destination.reduce((acc, { address, amount }) => {
                acc[address] = amount;
                return acc;
            }, {} as { [key: string]: number });

            const totalAmount = destination.reduce((sum, { amount }) => sum + amount, 0);
            const totalInputAmount = unspent.reduce((sum: number, tx: UTXO) => sum + tx.amount, 0);
            const fee = 0.0001;
            const change = totalInputAmount - totalAmount - fee;

            if (change > 0) {
                outputs[source.clientAddress] = change;
            }

            const rawTx: string = await client.command('createrawtransaction', inputs, outputs);
            console.log('Raw Transaction:', rawTx);

            const signedTx: { hex: string } = await client.command('signrawtransactionwithwallet', rawTx);
            console.log('Signed Transaction:', signedTx);

            const txId: string = await client.command('sendrawtransaction', signedTx.hex);
            console.log('Transaction successful, Transaction ID:', txId);

            return txId;
        } catch (err) {
            console.error("Error in makeMultipleTransactions: ", err);
            return null;
        }
    }

    return {
        async getBlockInfo() {
            const info = await client.command('getblockchaininfo');
            return info
        },
        async loadWallet(walletDir: string, existedWallet: string[]) {
            try {
                const subFolders = await promises.readdir(walletDir);
                for (const folder of subFolders) {
                    if (!existedWallet.includes(folder))
                        await client.command('loadwallet', `${folder}`);
                }
            } catch (err) {
                console.error('Error reading wallet directory:', err);
            }
        },
        setDefaultWallet(name: string) {
            client.wallet = name
        },
        async getWalletNames(): Promise<string[]> {
            const wallets = await client.command('listwallets');
            return wallets
        },
        async checkWalletExistence({ walletName }: { walletName: string }) {
            const wallets = (await this.getWalletNames())
            return wallets.includes(walletName)
        },
        async unSpant() {
            const unSpant = await client.command('listunspent');
            return unSpant
        },
        async getWalletInfo() {
            const walletInfo = await client.command('getwalletinfo');
            return walletInfo
        },
        async getNewCoin({ newAddress, amount }: { newAddress: string, amount: number }) {
            const generateResult = await client.command('generatetoaddress', amount, newAddress);
            return generateResult;
        },


        async clientTransaction({ destinationAddress, amount }: { destinationAddress: string, amount: number }) {
            try {
                const balance = await this.getBalance();
                if (balance < amount) {
                    console.log("Insufficient funds in client wallet");
                    return;
                }
                const txId = await makeTransaction({ destinationAddress, amount });
                return txId;
            } catch (err) {
                console.error("Error in clientTransaction: ", err);
            }
        },

        async exchangeTransaction({
            clientAddress,
            amount,
            destinationAddress,
            exchangeAddress
        }: {
            clientAddress: string;
            amount: number;
            destinationAddress: string;
            exchangeAddress: string;
        }) {
            try {
                const txid = await makeMultipleTransactions({
                    source: {
                        clientAddress: clientAddress,
                    },
                    destination: [
                        { address: exchangeAddress, amount: 0.0005 },
                        { address: destinationAddress, amount: amount - 0.0005 }
                    ]
                });
                return txid;
            } catch (err) {
                console.error("Error in exchangeTransaction: ", err);
            }
        },
        async getBlockById(bId: string) {
            try {
                const txInfo = await client.command('getblock ', bId);
                return txInfo;
            } catch (err) {
                console.error("Error getting transaction info: ", err);
            }
        },
        async getInfoTransaction({ txId }: { txId: string }) {
            try {
                const txInfo = await client.command('gettransaction', txId);
                return txInfo;
            } catch (err) {
                console.error("Error getting transaction info: ", err);
            }
        },

        async getNewAddress(): Promise<string> {
            const wallet = await client.command('getnewaddress');
            return wallet;
        },

        async getBalance(): Promise<number> {
            const result = await client.command('getbalance');
            return result as number;
        },

        async getAddressByBalance({ address }: { address: string }): Promise<number> {
            const balance = await client.command('getreceivedbyaddress', `${address}`);
            return balance;
        },

        async createWallet({ name }: { name: string }): Promise<string> {
            const a = await client.command('createwallet', name);
            return a.name;
        }
    }
}

export type BTCCoin = ReturnType<typeof BtcCoin>;
