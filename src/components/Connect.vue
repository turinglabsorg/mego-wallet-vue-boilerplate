<template>
  <h1>MEGO + WalletConnect</h1>
  <p>Please connect wallet first to enter.</p>
  <div class="card">
    <w3m-connect-button id="w3modal-button" v-show="false" />
    <button type="button" @click="wallet.openWeb3Modal()">CONNECT WITH WALLET</button><br>
    <button type="button" @click="wallet.loginWithMegoWallet('google')">CONNECT WITH GOOGLE</button><br>
    <button type="button" @click="wallet.loginWithMegoWallet('apple')">CONNECT WITH APPLE</button>
  </div>
</template>

<script>
import { useWalletStore } from '../stores/wallet'

export default {
  data() {
    return {
      megoWalletApi: 'https://wallet.mego.tools',
      wallet: useWalletStore()
    }
  },
  async mounted() {
    const app = this
    console.log('Connect component mounted.')
    await app.wallet.init()
  }
}
</script>