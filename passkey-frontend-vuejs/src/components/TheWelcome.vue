<script setup>
</script>

<template>
  <h1>Basic Passkey Example</h1>
  <h2>Create a passkey-enabled login system to know the passkey behaviors.</h2>
  <ul>
    <li>The passkey is a modern authentication method that leverages public key cryptography
      to provide secure and passwordless login experiences.</li>
    <li>By implementing passkeys, we can enhance the security of our application
      while improving user convenience.</li>
    <li>The user registers a passkey which generates a public-private key pair.
      The private key is securely stored on the user's device, while the public key
      is sent to the server during registration.</li>
    <li>
      During login, the server sends a challenge to the user's device,
      which uses the private key to sign the challenge and sends it back.
    </li>
    <li>The server verifies the signature using the stored public key,
      allowing secure authentication without transmitting sensitive information.</li>
  </ul>
</template>
