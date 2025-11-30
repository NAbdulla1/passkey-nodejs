import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { getPassKeyChallenge, verifyPassKeyRegistration, getPasskeyAuthChallenge, verifyPasskeyAuth } from "./backendServices";

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

export async function handlePasskeyLogin(email) {
    const  {passKeyId, userId, options} = await getPasskeyAuthChallenge(email);
    let data;
    try {
        data = await startAuthentication({ optionsJSON: options });
        const resp = await verifyPasskeyAuth(userId, passKeyId, data);
        return resp;
    } catch (error) {
        console.error("Error during passkey authentication:", error);

        await verifyPasskeyAuth(userId, passKeyId, data, true);
        throw error;
    }
}
