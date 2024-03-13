<template>
  <p>Welcome back {{ wallet.address }}</p>
  <button v-if="wallet.type === 'mego'" type="button" @click="wallet.logout()">LOGOUT</button>
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