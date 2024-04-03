import {
  getAddress,
  type Hex,
  type SignableMessage,
  type TypedData,
  type TypedDataDefinition,
} from "viem";
import { InvalidSignerTypeError } from "@alchemy/aa-core";
import type { SmartAccountAuthenticator } from "./types";
import { SignMessageFailed, InvalidSessionError } from "./errors";
import axios from "axios";

export type MegoParams = {
  session: string;
};

export type MegoDetails = {
  address: string;
};

export type Mego = {
  getAddresses: () => Promise<string[]>;
  signMessage: (params: { message: SignableMessage }) => Promise<Hex>;
  signTypedData: (params: { typedData: TypedData }) => Promise<Hex>;
  account?: string;
};

export class MegoSigner implements SmartAccountAuthenticator<MegoParams, MegoDetails, Mego> {
  readonly signerType: string = "mego";
  inner: Mego;
  megoWalletUrl: string = "https://wallet.mego.tools";
  address: string;
  session: string;

  constructor(signerType: string) {
    if (!signerType) {
      throw new InvalidSignerTypeError(signerType);
    }
    // Implementation of the signer
    this.inner = {
      getAddresses: async () => {
        return [this.address];
      },
      signMessage: async ({ message }) => {
        let msg: any = message;
        console.log("Signing message:", msg.raw)
        const signature = await axios.post(`${this.megoWalletUrl}/transactions/sign`, {
          session: this.session,
          message: msg.raw,
          arrayfy: true
        })
        if (signature.data.error || signature.data.signature === undefined || signature.data.signature[0] === undefined) {
          console.error(signature.data.message);
          throw new Error("Failed to sign message");
        }
        console.log("Signature:", signature.data.signature[0])
        return `0x${signature.data.signature[0].replace("0x", "")}`;
      },
      signTypedData: async ({ typedData: TypedDataDefinition }) => {
        console.log("Signing typed data..")
        const signature = "TODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODO";
        return `0x${signature}`;
      },
    };
  }

  getAddress: () => Promise<`0x${string}`> = async () => {
    let addresses = await this.inner.getAddresses();
    return getAddress(addresses[0]);
  };

  readonly signMessage: (message: SignableMessage) => Promise<`0x${string}`> =
    async (message) => {
      return this.inner.signMessage({ message });
    };

  signTypedData = async <
    const TTypedData extends TypedData | { [key: string]: unknown },
    TPrimaryType extends string = string
  >(
    typedData: TypedDataDefinition<TTypedData, TPrimaryType>
  ): Promise<Hex> => {
    const typedSig = "TODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODO";
    return `0x${typedSig}`;
  };

  // Authenticate the signer
  authenticate = async (params: MegoParams): Promise<MegoDetails> => {
    let { session } = params;
    let info = {
      address: '',
    }
    // Check if the email and password are valid
    console.log("Authenticating..")
    const check = await axios.post(`${this.megoWalletUrl}/sessions/check`, {
      session
    })
    if (check.data.error) {
      console.error(check.data.message);
      throw new InvalidSessionError();
    }
    this.address = check.data.details.address;
    info.address = this.address;
    this.session = session;
    return info;
  };

  // Get the authentication details
  getAuthDetails = async (): Promise<MegoDetails> => {
    return {
      address: this.address,
    };
  }
}