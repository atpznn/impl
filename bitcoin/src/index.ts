import path from 'path';
import btc, { type BTCCoin } from './coin/btc'
import os from 'os';
let walletExchangeName = 'exchange'
let exchangeClient: (BTCCoin | null) = null
let exchangeAddress = 'bcrt1qp0qcn9uegrsd3sqhhkg657rqm8tukycsmvas3x'
const userInfo = os.userInfo();
const userName = userInfo.username;
const walletPath = path.join('C:', 'Users', os.userInfo().username, 'AppData', 'Roaming', 'Bitcoin', 'regtest', 'wallets');
async function initialExchange() {
    exchangeClient = btc()
    const oldWallets = await exchangeClient.getWalletNames()
    await exchangeClient?.loadWallet(walletPath, oldWallets)
    const isExist = await exchangeClient.checkWalletExistence({ walletName: walletExchangeName })
    if (!isExist) await exchangeClient.createWallet({ name: walletExchangeName })
    exchangeClient.setDefaultWallet(walletExchangeName)
    const balancewalletName = await exchangeClient.getBalance()
    if (balancewalletName <= 0) {
        const newAddress = await exchangeClient.getNewAddress()
        const newBlock = await exchangeClient.getNewCoin({ newAddress: newAddress, amount: 50 })
        const info = await exchangeClient.getBlockById(newBlock[0])
        console.log(info)
    }
    const info = await exchangeClient.getBalance()
    console.log(info)
}
async function main() {
    await initialExchange()
    await testClientBuy()
}
async function testClientBuy() {
    const walletName = 'test1'
    const client = btc()
    const isExist = await client.checkWalletExistence({ walletName })
    if (!isExist) await client.createWallet({ name: walletName })
    client.setDefaultWallet(walletName)
    console.log('before ', await client.getBalance())
    const newAddress = await client.getNewAddress()
    const txId = await exchangeClient?.clientTransaction({
        amount: 20, destinationAddress: newAddress
    })
    console.log(await client.getInfoTransaction({ txId: txId }))
    const balance = await client.getBalance()
    console.log('customer ', balance)
}
main()