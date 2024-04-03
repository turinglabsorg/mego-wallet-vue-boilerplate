<template>
  <p>Welcome back:<br>{{ wallet.address }}</p>
  <button v-if="!wallet.abstracted_address" type="button"
    @click="wallet.getAbstractedAccountAddress()">CREATE
    AA</button><br>
  <div v-if="wallet.abstracted_address">
    Your abstracted address is:<br>{{ wallet.abstracted_address }}<br><br>
    <button type="button" @click="prepareTxAndSend">MINT TOKENS WITH AA</button><br>
  </div>
  <button v-if="wallet.type === 'mego'" type="button" @click="wallet.logout()">LOGOUT</button>
</template>

<script>
import { useWalletStore } from '../stores/wallet'

export default {
  data() {
    return {
      megoWalletApi: 'https://wallet.mego.tools',
      wallet: useWalletStore(),
      isWorking: false,
      workingMessage: ""
    }
  },
  async mounted() {
    const app = this
    console.log('Connect component mounted.')
    await app.wallet.init()
  },
  methods: {
    async prepareTxAndSend() {
      const app = this
      // DEMO CONTRACT, SIMPLE ERC20
      console.log('Preparing transaction...')
      const abi = [
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            }
          ],
          "name": "mint",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ]
      const contract = '0x4533072ECe26A1b46d8723fD68d3FB2eF8f843f2'
      app.wallet.sendTxWithAbstractedAccount(abi, contract, 'mint', [app.wallet.abstracted_address, 20000000000000000000000])
    }
  }
}
</script>