import { defineStore } from 'pinia'
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi'
import { mainnet } from 'viem/chains'
import { reconnect, watchAccount, signMessage, call } from '@wagmi/core'

export const useWalletStore = defineStore('wallet', {
    state: () => {
        return {
            address: '',
            type: '',
            provider: '',
            session: '',
            working: false,
            walletConnect: {
                projectId: '<YOUR_PROJECT_ID_FROM_WALLETCONNECT>',
                metadata: {
                    name: 'MEGO-WALLET',
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
                store.provider = wallet.provider
            } else {
                console.log("No wallet found")
            }
            // Search for login with MEGO wallet
            const url = new URL(window.location.href)
            if (url.searchParams.has('loggedAs')) {
                store.session = url.searchParams.get('session')
                localStorage.setItem('wallet', JSON.stringify({
                    address: url.searchParams.get('loggedAs'),
                    type: "mego",
                    provider: url.searchParams.get('provider'),
                    session: ""
                }))
                store.type = "mego"
                store.address = url.searchParams.get('loggedAs')
                window.location.href = url.origin + url.pathname
                console.log("MEGO login found")
            }
            // Search for signature from MEGO wallet
            if (url.searchParams.has('signature')) {
                const callback = localStorage.getItem('callback')
                if (callback !== null) {
                    console.log("MEGO signature found, running callback:", callback)
                    store[callback](url.searchParams.get('signature'))
                    localStorage.removeItem('callback')
                }
                window.location.href = url.origin + url.pathname
            }
        },
        initWeb3Modal() {
            const store = this
            const config = defaultWagmiConfig({
                chains: store.walletConnect.chains,
                projectId: store.walletConnect.projectId,
                metadata: store.walletConnect.metadata
            })
            reconnect(config)
            createWeb3Modal({
                wagmiConfig: config,
                projectId: store.walletConnect.projectId
            })
            console.log("Web3Modal initialized")
            watchAccount(config, {
                onChange(account) {
                    console.log('Account changed:', account)
                    if (account.address !== undefined) {
                        if (localStorage.getItem('wallet') === null || store.address !== account.address) {
                            localStorage.setItem('wallet', JSON.stringify({
                                address: account.address,
                                type: "web3",
                                session: ""
                            }))
                            store.address = account.address
                            store.type = "web3"
                        }
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
        async signWithWeb3Wallet(message, callback) {
            const store = this
            const config = defaultWagmiConfig({
                chains: store.walletConnect.chains,
                projectId: store.walletConnect.projectId,
                metadata: store.walletConnect.metadata
            })
            await reconnect(config)
            const signature = await signMessage(config, { message })
            callback(signature)
        },
        async loginWithMegoWallet(provider) {
            const store = this
            console.log("Logging in with MEGO wallet")
            store.working = 'Redirecting to MEGO wallet...'
            setTimeout(() => {
                window.location.href = "https://wallet.mego.tools/auth/" + provider + "?origin=" + window.location.host
            }, 50)
        },
        async signWithMegoWallet(message, callback) {
            const store = this
            console.log("Logging in with MEGO wallet")
            store.working = 'Redirecting to MEGO wallet...'
            setTimeout(() => {
                localStorage.setItem('callback', callback)
                window.location.href = "https://wallet.mego.tools/auth/" + store.provider + "?origin=" + window.location.host + "&message=" + message
            }, 50)
        }
    },
})