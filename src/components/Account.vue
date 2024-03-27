<template>
  <p>Welcome back<br>{{ wallet.address }}</p>
  <button type="button" @click="wallet.createAbstractedAccount()">CREATE AA</button><br>
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
  }
}
</script>