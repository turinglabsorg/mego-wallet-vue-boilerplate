import { BaseError } from "@alchemy/aa-core";
export class InvalidSessionError extends BaseError {
    override name = "InvalidSessionError";
    constructor() {
        super(
            [
                "Can't use provided session.",
            ].join("\n")
        );
    }
}

export class CreateSessionFailed extends BaseError {
    override name = "CreateSessionFailed";
    constructor() {
        super(
            [
                "Failed to create a session.",
            ].join("\n")
        );
    }
}

export class SignMessageFailed extends BaseError {
    override name = "SignMessageFailed";
    constructor() {
        super(
            [
                "Failed to sign the message.",
            ].join("\n")
        );
    }
}