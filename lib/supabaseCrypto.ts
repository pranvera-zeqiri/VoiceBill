import * as ExpoCrypto from 'expo-crypto';
import expoWebCrypto from 'expo-standard-web-crypto';

if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: expoWebCrypto,
  });
}

if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder } = require('text-encoding') as {
    TextEncoder: new () => TextEncoder;
  };
  Object.defineProperty(globalThis, 'TextEncoder', {
    configurable: true,
    value: TextEncoder,
  });
}

if (typeof globalThis.crypto.subtle?.digest !== 'function') {
  Object.defineProperty(globalThis.crypto, 'subtle', {
    configurable: true,
    value: {
      digest: (algorithm: AlgorithmIdentifier, data: BufferSource) => {
        const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
        if (name !== 'SHA-256') {
          return Promise.reject(new Error(`Unsupported WebCrypto digest algorithm: ${name}`));
        }
        return ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, data);
      },
    },
  });
}
