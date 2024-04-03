<template>
  <p>Welcome back:<br>{{ wallet.address }}</p>
  <button v-if="wallet.abstracted_address?.length === 0" type="button"
    @click="wallet.getAbstractedAccountAddress()">CREATE
    AA</button><br>
  <div v-if="wallet.abstracted_address?.length > 0">
    Your abstracted address is:<br>{{ wallet.abstracted_address }}<br><br>
    <button type="button" @click="wallet.sendTxWithAbstractedAccount()">SEND A TRANSACTION WITH AA</button><br>
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
  }
}
</script>