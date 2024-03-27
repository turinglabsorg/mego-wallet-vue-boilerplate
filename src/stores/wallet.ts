import { defineStore } from 'pinia'
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi'
import { mainnet } from 'viem/chains'
import { reconnect, watchAccount, signMessage } from '@wagmi/core'
import { configs } from './config'

export const useWalletStore = defineStore('wallet', {
    state: () => {
        return {
            address: '',
            abstracted_address: '',
            type: '',
            provider: '',
            session: '',
            working: false,
            walletConnect: {
                projectId: configs.projectId,
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
                store.abstracted_address = wallet.abstracted_address
                let feedback = setInterval(() => {
                    if (store.session !== "" && store.abstracted_address === "" && store.type === "mego" && store.working === false) {
                        store.working = 'Creating abstracted account...'
                        store.createAbstractedAccount()
                    } else {
                        clearInterval(feedback)
                    }
                }, 10)
            } else {
                console.log("No wallet found")
            }
            // Search for login with MEGO wallet
            const url = new URL(window.location.href)
            if (url.searchParams.has('loggedAs')) {
                localStorage.setItem('wallet', JSON.stringify({
                    address: url.searchParams.get('loggedAs'),
                    type: "mego",
                    provider: url.searchParams.get('provider'),
                    session: "",
                    abstracted_address: ""
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
            // Search for session from MEGO wallet
            if (url.searchParams.has('session')) {
                const storedWallet = localStorage.getItem('wallet')
                if (storedWallet !== null) {
                    const wallet = JSON.parse(storedWallet)
                    wallet.session = url.searchParams.get('session')
                    localStorage.setItem('wallet', JSON.stringify(wallet))
                    store.session = url.searchParams.get('session')
                    window.location.href = url.origin + url.pathname
                }
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
            document.getElementById('w3modal-button')?.shadowRoot?.querySelector('wui-connect-button')?.click()
        },
        logout() {
            const store = this
            store.working = 'Logging out...'
            localStorage.removeItem('wallet')
            store.address = ''
            store.type = ''
            store.session = ''
            const url = new URL(window.location.href)
            window.location.href = url.origin + url.pathname
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
        },
        async createSessionWithMegoWallet() {
            const store = this
            console.log("Creating session with MEGO wallet")
            store.working = 'Redirecting to MEGO wallet...'
            setTimeout(() => {
                window.location.href = "https://wallet.mego.tools/auth/" + store.provider + "?origin=" + window.location.host + "&message=CREATE_SESSION&permissions=sign"
            }, 50)
        },
        async createAbstractedAccount() {
            const store = this
            if (store.type === "mego") {
                console.log("Creating abstracted account with MEGO wallet")
                if (store.session !== "") {
                    console.log("Creating abstracted account with session:", store.session)
                    store.working = 'Creating abstracted account...'
                } else {
                    store.createSessionWithMegoWallet()
                }
            } else {
                // TODO: Add Alchemy stuff here
                console.log("Creating AA with web3 wallet")
            }
        }
    },
})