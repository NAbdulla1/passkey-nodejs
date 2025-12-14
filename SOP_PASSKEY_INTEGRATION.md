## Prerequisites
* Almost any server side language can handle the it.
* All modern web browsers are compatible, will not work in Internet Explorer
* Need to URL of the frontend
* Ability to install WebAuthn related packages for the provided language

## High Level Architecture
* DB Tables
  - The user table
  - Another table to store PassKey data
    - id: Primary Key
    - userId: Foreign Key to User Table
    - challenge: String
    - credentialId: String
    - counter: Integer
    - publicKey: TEXT or Long Sring
    - transports: JSON or an array of string
    - deviceType: String
    - backedUp: Boolean

## Implementation Steps
1. Add db migration and models for Passkey storing tables
2. Install packages for the server and client(fontend)
3. Configure website/server specific parameters
   - rpID
   - rpName
   - origin
   - timeout
   - others as env var
4. The `userID` while registration should be a 'Buffer' or binary data
5. The public key should be a 'Buffer' or binary data and to store it we may use 'base64' encoding
6. Implement registration endpoints
   - An endpoint to start registration
     - need to remember the challenge for that particular user
   - An endpoint to verify registration and store passkey
7. Implement login endpoints
   - An endpoint to start authentication
     - need to remember the challenge for the particular authentication request
   - An endpoint to verify login and update counter

## Security Notes
1. Never log private key or full auth response
2. Set strict expectedOrigin and expected rpID

## Optional Tasks
1. Add button in user's account/profile page to add passkey so that the user can create passkey from different devices like
   - Computer
   - Phone
   - Different Password Manager
2. Allow user to list registered passkeys
3. Allow user to delete passkeys from server
