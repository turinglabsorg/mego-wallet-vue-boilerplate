import { defineStore } from 'pinia'
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi'
import { reconnect, watchAccount, signMessage } from '@wagmi/core'
import { configs } from './config'
import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy";
import { optimismSepolia, type Hex, Address, WalletClientSigner } from "@alchemy/aa-core";
import { MegoSigner } from "../signer/mego";
import { encodeFunctionData, createWalletClient, custom } from "viem";

declare global {
    interface Window {
        ethereum: any;
    }
}

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
                chains: [optimismSepolia]
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
                        store.getAbstractedAccountAddress()
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
        async getAbstractedAccountAddress() {
            const store = this
            try {
                if (store.type === "mego") {
                    console.log("Creating abstracted account with MEGO wallet")
                    if (store.session !== "") {
                        store.working = 'Validating session...'
                        // console.log("Creating abstracted account with session:", store.session)
                        const chain = optimismSepolia;
                        // Authenticate with your smart account
                        const signer = new MegoSigner("mego");
                        const authenticated = await signer.authenticate({
                            session: store.session
                        })
                        store.working = 'Calculating address...'
                        console.log("Authenticated with:", authenticated.address);

                        // Create a smart account client to send user operations from your smart account
                        const client = await createModularAccountAlchemyClient({
                            // get your Alchemy API key at https://dashboard.alchemy.com
                            apiKey: configs.alchemyKey as string,
                            chain,
                            signer,
                        });
                        store.abstracted_address = await client.getAddress();
                        localStorage.setItem('wallet', JSON.stringify({
                            address: store.address,
                            type: store.type,
                            provider: store.provider,
                            session: store.session,
                            abstracted_address: store.abstracted_address
                        }))
                        console.log("Abstracted address:", store.abstracted_address)
                        store.working = false
                    } else {
                        console.log("Redirecting to create session with MEGO wallet")
                        store.createSessionWithMegoWallet()
                    }
                } else {
                    store.working = 'Creating abstracted account...'
                    console.log("Creating AA with web3 wallet")
                    const walletClient = createWalletClient({
                        chain: optimismSepolia,
                        transport: custom(window.ethereum),
                    });
                    // this can now be used as an signer for a Smart Contract Account
                    const eoaSigner = new WalletClientSigner(
                        walletClient,
                        "json-rpc" //signerType
                    );
                    // Create a smart account client to send user operations from your smart account
                    const chain = optimismSepolia;
                    const client = await createModularAccountAlchemyClient({
                        apiKey: configs.alchemyKey as string,
                        chain,
                        signer: eoaSigner,
                    });
                    store.abstracted_address = await client.getAddress();
                    console.log("Abstracted address:", store.abstracted_address)
                    localStorage.setItem('wallet', JSON.stringify({
                        address: store.address,
                        type: store.type,
                        provider: store.provider,
                        session: store.session,
                        abstracted_address: store.abstracted_address
                    }))
                    console.log("Abstracted address:", store.abstracted_address)
                    store.working = false
                }
            } catch (e) {
                console.error(e)
                store.working = false
            }
        },
        async sendTxWithAbstractedAccount(abi, contract, fn, args) {
            const store = this
            try {
                let client
                if (store.type === "mego") {
                    console.log("Creating abstracted account with MEGO wallet")
                    store.working = 'Validating session...'
                    // console.log("Creating abstracted account with session:", store.session)
                    const chain = optimismSepolia;
                    // Authenticate with your smart account
                    const signer = new MegoSigner("mego");
                    const authenticated = await signer.authenticate({
                        session: store.session
                    })
                    store.working = 'Creating client...'
                    console.log("Authenticated with:", authenticated.address);

                    // Create a smart account client to send user operations from your smart account
                    client = await createModularAccountAlchemyClient({
                        apiKey: configs.alchemyKey as string,
                        chain,
                        signer,
                        gasManagerConfig: {
                            policyId: configs.accountKitPolicyId as string,
                        },
                    });
                } else {
                    // TODO: Add Alchemy stuff here
                    console.log("Creating tx with web3 wallet")
                    store.working = 'Creating abstracted account...'
                    console.log("Creating AA with web3 wallet")
                    const walletClient = createWalletClient({
                        chain: optimismSepolia,
                        transport: custom(window.ethereum),
                    });
                    // this can now be used as an signer for a Smart Contract Account
                    const eoaSigner = new WalletClientSigner(
                        walletClient,
                        "json-rpc" //signerType
                    );
                    // Create a smart account client to send user operations from your smart account
                    const chain = optimismSepolia;
                    client = await createModularAccountAlchemyClient({
                        apiKey: configs.alchemyKey as string,
                        chain,
                        signer: eoaSigner,
                        gasManagerConfig: {
                            policyId: configs.accountKitPolicyId as string,
                        },
                    });
                }
                console.log("Abstracted address:", store.abstracted_address)
                store.working = 'Sending transaction to contract...'
                // Calculating the call data
                const uoCallData = encodeFunctionData({
                    abi: abi,
                    functionName: fn,
                    args: args,
                });
                // Send a user operation to the target contract
                const { hash: uoHash } = await client.sendUserOperation({
                    uo: {
                        target: contract as Address,
                        data: uoCallData,
                        value: 0n, // (Optional) value to send the target contract address, but smart contract needs to be filled with eth
                    },
                });
                store.working = 'UserOperation Hash is: ' + uoHash + ', waiting for transaction...'
                console.log("UserOperation Hash: ", uoHash); // Log the user operation hash

                // Wait for the user operation to be mined
                const txHash = await client.waitForUserOperationTransaction({
                    hash: uoHash,
                });
                store.working = 'Transaction Hash is: ' + txHash + ', use it to check tx with block explorer.'
                console.log("Transaction Hash: ", txHash);
                setTimeout(function () {
                    store.working = false
                }, 5000)
            } catch (e) {
                console.error(e)
                store.working = false
            }
        }
    },
})