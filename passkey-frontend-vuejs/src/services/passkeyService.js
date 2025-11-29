import { startRegistration } from "@simplewebauthn/browser";
import { getPassKeyChallenge, verifyPassKeyRegistration } from "./backendServices";

export async function handlePasskeyWorkflow(email) {
    const { options, userId, passKeyId } = await getPassKeyChallenge(email);
    let data;
    try {
        data = await startRegistration({ optionsJSON: options });
        const resp = await verifyPassKeyRegistration(userId, passKeyId, data);
        return resp;
    } catch (error) {
        console.error("Error during passkey registration:", error);

        await verifyPassKeyRegistration(userId, passKeyId, data, true);
        throw error;
    }
}
