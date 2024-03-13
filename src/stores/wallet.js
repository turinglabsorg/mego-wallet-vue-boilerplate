import { defineStore } from 'pinia'
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi'
import { mainnet } from 'viem/chains'
import { reconnect } from '@wagmi/core'
import { watchAccount } from '@wagmi/core'

export const useWalletStore = defineStore('wallet', {
    state: () => {
        return {
            address: '',
            type: '',
            session: '',
            working: false,
            walletConnect: {
                projectId: '<YOUR_PROJECT_ID_FROM_WALLETCONNECT>',
                metadata: {
                    name: 'MEGO-WalletConnect',
                    description: 'Interact with the MEGO ecosystem',
                    url: window.location.href,
                    icons: ['https://mego.tickets/favicon.ico']
                },
                chains: [mainnet]
            }
        }
    },
    actions: {
        async init() {
            const store = this
            store.initWeb3Modal()
            console.log("Wallet store initialized")
            const storedWallet = localStorage.getItem('wallet')
            if (storedWallet) {
                const wallet = JSON.parse(storedWallet)
                store.address = wallet.address
                store.type = wallet.type
                store.session = wallet.session
            } else {
                console.log("No wallet found")
            }
            const url = new URL(window.location.href)
            if (url.searchParams.has('loggedAs')) {
                store.session = url.searchParams.get('session')
                localStorage.setItem('wallet', JSON.stringify({
                    address: url.searchParams.get('loggedAs'),
                    type: "mego",
                    session: ""
                }))
                store.type = "mego"
                store.address = url.searchParams.get('loggedAs')
                window.location.href = url.origin + url.pathname
                console.log("MEGO login found")
            }
        },
        initWeb3Modal() {
            const store = this
            const config = defaultWagmiConfig({
                chains: this.walletConnect.chains,
                projectId: this.walletConnect.projectId,
                metadata: this.walletConnect.metadata
            })
            reconnect(config)
            createWeb3Modal({
                wagmiConfig: config,
                projectId: this.walletConnect.projectId
            })
            console.log("Web3Modal initialized")
            watchAccount(config, {
                onChange(account) {
                    console.log('Account changed:', account)
                    if (account.address !== undefined) {
                        localStorage.setItem('wallet', JSON.stringify({
                            address: account.address,
                            type: "web3",
                            session: ""
                        }))
                        store.address = account.address
                        store.type = "web3"
                    } else {
                        if (localStorage.getItem('wallet') !== null && store.type === "web3") {
                            store.logout()
                        }
                    }
                },
            })
        },
        openWeb3Modal() {
            document.getElementById('w3modal-button').shadowRoot.querySelector('wui-connect-button').click()
        },
        logout() {
            const store = this
            store.working = 'Logging out...'
            localStorage.removeItem('wallet')
            store.address = ''
            store.type = ''
            store.session = ''
            window.location.reload()
        },
        async loginWithMegoWallet(provider) {
            const store = this
            console.log("Logging in with MEGO wallet")
            store.working = 'Redirecting to MEGO wallet...'
            setTimeout(() => {
                window.location.href = "https://wallet.mego.tools/auth/" + provider + "?origin=" + window.location.host
            }, 50)
        }
    },
})