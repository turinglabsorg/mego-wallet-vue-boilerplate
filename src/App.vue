<script setup>
import Connect from './components/Connect.vue'
import Contents from './components/Contents.vue'
</script>

<template>
  <div v-if="!isWorking">
    <Connect v-if="wallet.address.length === 0" />
    <Contents v-if="wallet.address.length > 0" />
  </div>
  <div v-if="isWorking">{{ workingMessage }}</div>
</template>

<script>
import { useWalletStore } from './stores/wallet'

export default {
  data() {
    return {
      megoWalletApi: 'https://wallet.mego.tools',
      wallet: useWalletStore(),
      isWorking: true,
      workingMessage: ""
    }
  },
  watch: {
    'wallet.working': function (message) {
      console.log('Wallet is working.')
      this.isWorking = true
      this.workingMessage = message
    }
  },
  async mounted() {
    const app = this
    app.workingMessage = "loading..."
    console.log('Connect component mounted.')
    await app.wallet.init()
    app.isWorking = false
  },
  methods: {
    work(message) {
      const app = this
      app.workingMessage = message
      app.isWorking = true
    }
  }
}
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
