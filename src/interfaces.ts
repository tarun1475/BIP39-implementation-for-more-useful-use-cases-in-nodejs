import { HashAlgorithm, KeyPairType } from './common';

/**
 * Interface for objects that represent a private key in cryptographic operations.
 *
 * Matches the `IPrivateKey` interface from {@link https://bit.ly/2IYRPme|virgil-sdk}.
 */
export interface IPrivateKey {}

/**
 * Interface for objects represent a public key in cryptographic operations.
 *
 * Matches the `IPublicKey` interface from {@link https://bit.ly/2rWQBy0|virgil-sdk}.
 */
export interface IPublicKey {}

/**
 * Represents a private key for operations with {@link IVirgilCrypto}.
 *
 * `VirgilPrivateKey` objects are not meant to be created directly using the `new` keyword.
 * Use the {@link IVirgilCrypto.generateKeys} and {@link IVirgilCrypto.importPrivateKey} methods
 * to create `VirgilPrivateKey` instances.
 *
 * @protected
 */
export interface VirgilPrivateKey extends IPrivateKey {
	/**
	 * Private key identifier. Note that the private key and its
	 * corresponding public key will have the same identifier.
	 * */
	readonly identifier: Buffer;
}

/**
 * Represents a public key for operations with {@link IVirgilCrypto}.
 *
 * `VirgilPublicKey` objects are not meant to be created directly using the `new` keyword.
 * Use the {@link IVirgilCrypto.generateKeys} and {@link IVirgilCrypto.importPublicKey} methods
 * to create `VirgilPublicKey` instances.
 *
 * @protected
 */
export interface VirgilPublicKey extends IPublicKey {
	/**
	 * Public key identifier. Note that the public key and its
	 * corresponding private key will have the same identifier.
	 * */
	readonly identifier: Buffer;

	/**
	 * The public key material. Unlike the private keys, the public
	 * key material is available as a property of the `PublicKey` object.
	 */
	readonly key: Buffer;
}

/**
 * Object representation of private and public keys pair.
 *
 * @protected
 */
export interface VirgilKeyPair {
	privateKey: VirgilPrivateKey;
	publicKey: VirgilPublicKey;
}

/**
 * `VirgilCrypto` initialization options.
 */
export interface VirgilCryptoOptions {
	/**
	 * Indicates whether to use old algorithm to calculate keypair identifiers.
	 */
	useSha256Identifiers?: boolean;

	/**
	 * Type of keys to generate by default. Optional. Default is {@link KeyPairType.Default}.
	 */
	defaultKeyPairType?: KeyPairType;
}

/**
 * Represents input bytes as either a string, Buffer or ArrayBuffer.
 * If data is a string - assumed encoding depends on the method the input is being
 * passed to.
 *
 * If data is Buffer, it is used as is, without copying.
 *
 * If data is ArrayBuffer, the view of the ArrayBuffer will be created without copying the
 * underlying memory.
 */
export type Data = string|Buffer|ArrayBuffer;

/**
 * Interface of object implementing high-level cryptographic operations using Virgil Crypto Library.
 */
export interface IVirgilCrypto {

	/**
	 * Indicates whether to use old algorithm to calculate keypair identifiers.
	 *
	 * Current algorithm: first 8 bytes of SHA512 hash of public key in DER format.
	 *
	 * Old algorithm: SHA256 hash of public key in DER format.
	 *
	 * Use SHA256 identifiers only if you need to be compatible with version 2 of
	 * this library (i.e. decrypt data that were encrypted using the version 2).
	 *
	 * Default is `false` (new algorithm)
	 */
	readonly useSha256Identifiers: boolean;

	/**
	 * Type of keys to generate by default.
	 */
	readonly defaultKeyPairType: KeyPairType;

	/**
	 * Generates a new key pair.
	 *
	 * @param {KeyPairType} [type] - Optional type of the key pair.
	 * See {@link KeyPairType} for available options. Default is Ed25519.
	 * @returns {KeyPair} - The newly generated key pair.
	 * */
	generateKeys(type?: KeyPairType): VirgilKeyPair;

	/**
	 * Generates a new key pair from the given key material.
	 * @param {Data} keyMaterial - The data to be used for key generation,
	 * must be strong enough (have high entropy). If `keyMaterial` is a
	 * string, base64 encoding is assumed.
	 * @param {KeyPairType} [type] - Optional type of the key pair.
	 * See {@link KeyPairType} for available options. Default is Ed25519.
	 * @returns {VirgilKeyPair}
	 */
	generateKeysFromKeyMaterial(keyMaterial: Data, type?: KeyPairType): VirgilKeyPair;

	/**
	 * Creates a `VirgilPrivateKey` object from private key material in PEM or DER format.
	 *
	 * @param {Data} rawPrivateKey - The private key bytes. If `rawPrivateKey` is a
	 * string, base64 encoding is assumed.
	 * @param {string} [password] - Optional password the key material is encrypted with.
	 *
	 * @returns {VirgilPrivateKey} - The private key object.
	 * */
	importPrivateKey(rawPrivateKey: Data, password?: string): VirgilPrivateKey;

	/**
	 * Exports private key material in DER format from the given private key object.
	 *
	 * @param {VirgilPrivateKey} privateKey - The private key object.
	 * @param {string} [password] - Optional password to encrypt the key material with.
	 *
	 * @returns {Buffer} - The private key material in DER format.
	 * */
	exportPrivateKey(privateKey: VirgilPrivateKey, password?: string): Buffer;

	/**
	 * Creates a `VirgilPublicKey` object from public key material in PEM or DER format.
	 *
	 * @param {Data} rawPublicKey - The public key bytes. If `rawPublicKey` is a
	 * string, base64 encoding is assumed.
	 *
	 * @returns {VirgilPublicKey} - The imported key handle.
	 * */
	importPublicKey(rawPublicKey: Data): VirgilPublicKey;

	/**
	 * Exports public key material in DER format from the given public key object.
	 *
	 * @param {VirgilPublicKey} publicKey - The public key object.
	 *
	 * @returns {Buffer} - The public key bytes.
	 * */
	exportPublicKey(publicKey: VirgilPublicKey): Buffer;

	/**
	 * Encrypts the data for the given public key(s) following the algorithm below:
	 *
	 * 1. Generates random AES-256 key - KEY1
	 * 2. Encrypts the data with KEY1 using AES-256-GCM
	 * 3. Generates ephemeral keypair for each recipient public key
	 * 4. Uses Diffie-Hellman to obtain shared secret with each recipient public key & ephemeral private key
	 * 5. Computes KDF to obtain AES-256 key - KEY2 - from shared secret for each recipient
	 * 6. Encrypts KEY1 with KEY2 using AES-256-CBC for each recipient
	 *
	 * @param {Data} data - The data to be encrypted. If `data` is a
	 * string, utf-8 encoding is assumed.
	 * @param {VirgilPublicKey|VirgilPublicKey[]} publicKey - Public key or an array of public keys
	 * of the intended recipients.
	 *
	 * @returns {Buffer} - Encrypted data.
	 * */
	encrypt(data: Data, publicKey: VirgilPublicKey|VirgilPublicKey[]): Buffer;

	/**
	 * Decrypts the data with the given private key following the algorithm below:
	 *
	 * 1. Uses Diffie-Hellman to obtain shared secret with sender ephemeral public key & the `privateKey`
	 * 2. Computes KDF to obtain AES-256 KEY2 from shared secret
	 * 3. Decrypts KEY1 using AES-256-CBC and KEY2
	 * 4. Decrypts data using KEY1 and AES-256-GCM
	 *
	 * @param {Data} encryptedData - The data to be decrypted. If `encryptedData` is a
	 * string, base64 encoding is assumed.
	 * @param {VirgilPrivateKey} privateKey - The private key to decrypt with.
	 *
	 * @returns {Buffer} - Decrypted data
	 * */
	decrypt(encryptedData: Data, privateKey: VirgilPrivateKey): Buffer;

	/**
	 * Calculates the hash of the given data.
	 *
	 * @param {Data} data - The data to calculate the hash of. If `data` is a
	 * string, utf-8 encoding is assumed.
	 * @param {string} [algorithm] - Optional name of the hash algorithm to use.
	 * See {@link HashAlgorithm} for available options. Default is SHA256.
	 *
	 * @returns {Buffer} - The hash.
	 * */
	calculateHash(data: Data, algorithm?: HashAlgorithm): Buffer;

	/**
	 * Extracts a public key from the private key handle.
	 *
	 * @param {VirgilPrivateKey} privateKey - The private key object to extract from.
	 *
	 * @returns {VirgilPublicKey} - The handle to the extracted public key.
	 * */
	extractPublicKey(privateKey: VirgilPrivateKey): VirgilPublicKey;

	/**
	 * Calculates the signature of the data using the private key.
	 *
	 * NOTE: Returned value contains only digital signature, not data itself.
	 *
	 * NOTE: Data inside this function is guaranteed to be hashed with SHA512 at least one time.
	 *
	 * It's secure to pass raw data here.
	 *
	 * @param {Data} data - The data to be signed. If `data` is a
	 * string, utf-8 encoding is assumed.
	 * @param {VirgilPrivateKey} privateKey - The private key object.
	 *
	 * @returns {Buffer} - The signature.
	 * */
	calculateSignature(data: Data, privateKey: VirgilPrivateKey): Buffer;

	/**
	 * Verifies the provided data using the given signature and public key.
	 * Note: Verification algorithm depends on PublicKey type. Default: EdDSA
	 *
	 * @param {Data} data - The data to be verified. If `data` is a
	 * string, utf-8 encoding is assumed.
	 * @param {Data} signature - The signature to verify. If `signature` is a
	 * string, base64 encoding is assumed.
	 * @param {VirgilPublicKey} publicKey - The public key object.
	 *
	 * @returns {boolean} - True or False depending on the validity of the signature for the data
	 * and public key.
	 * */
	verifySignature(data: Data, signature: Data, publicKey: VirgilPublicKey): boolean;

	/**
	 * Calculates the signature on the data using the private key,
	 * then encrypts the data along with the signature using the public key(s).
	 *
	 * 1. Generates signature depending on the type of private key
	 * 2. Generates random AES-256 key - KEY1
	 * 3. Encrypts both data and signature with KEY1 using AES-256-GCM
	 * 4. Generates ephemeral key pair for each recipient
	 * 5. Uses Diffie-Hellman to obtain shared secret with each recipient's public key & each ephemeral private key
	 * 6. Computes KDF to obtain AES-256 key - KEY2 - from shared secret for each recipient
	 * 7. Encrypts KEY1 with KEY2 using AES-256-CBC for each recipient
	 *
	 * @param {Data} data - The data to sign and encrypt. If `data` is a
	 * string, utf-8 encoding is assumed.
	 * @param {VirgilPrivateKey} privateKey - The private key to use to calculate signature.
	 * @param {VirgilPublicKey|VirgilPublicKey[]} publicKey - The public key of the intended recipient or an array
	 * of public keys of multiple recipients.
	 *
	 * @returns {Buffer} - Encrypted data with attached signature.
	 * */
	signThenEncrypt(
		data: Data,
		privateKey: VirgilPrivateKey,
		publicKey: VirgilPublicKey|VirgilPublicKey[]): Buffer;

	/**
	 * Decrypts the data using the private key, then verifies decrypted data
	 * using the attached signature and the given public key.
	 *
	 * 1. Uses Diffie-Hellman to obtain shared secret with sender ephemeral public key & recipient's private key
	 * 2. Computes KDF to obtain AES-256 key - KEY2 - from shared secret
	 * 3. Decrypts KEY1 using AES-256-CBC and KEY2
	 * 4. Decrypts both data and signature using KEY1 and AES-256-GCM
	 * 5. Verifies signature
	 *
	 * @param {Data} encryptedData - The data to be decrypted and verified. If `encryptedData` is a
	 * string, base64 encoding is assumed.
	 * @param {VirgilPrivateKey} privateKey - The private key object to use for decryption.
	 *
	 * @param {(VirgilPublicKey|VirgilPublicKey[])} publicKey - The public key object
	 * or an array of public key objects to use to verify data integrity. If `publicKey`
	 * is an array, the attached signature must be valid for any one of them.
	 *
	 * @returns {Buffer} - Decrypted data iff verification is successful,
	 * otherwise throws {@link IntegrityCheckFailedError}.
	 * */
	decryptThenVerify(
		encryptedData: Data,
		privateKey: VirgilPrivateKey,
		publicKey: VirgilPublicKey|VirgilPublicKey[]): Buffer;

	/**
	 * Generates a pseudo-random sequence of bytes of the given length.
	 * @param {number} length - The number of bytes to generate.
	 * @returns {Buffer}
	 */
	getRandomBytes (length: number): Buffer;

	/**
	 * Same as {@link IVirgilCrypto.signThenEncrypt} but returns the metadata (i.e. public
	 * algorithm parameters used for encryption) as a separate property on the response
	 * object rather than embedded in the encrypted data as regular `signThenEncrypt` does.
	 *
	 * @param {Data} data - The data to sign and encrypt. If `data` is a
	 * string, utf-8 encoding is assumed.
	 * @param {VirgilPrivateKey} privateKey - The private key to use to calculate signature.
	 * @param {VirgilPublicKey | VirgilPublicKey[]} publicKey - The public key of the intended
	 * recipient or an array of public keys of multiple recipients.
	 * @returns {{encryptedData: Buffer; metadata: Buffer}} - Encrypted data and metadata.
	 */
	signThenEncryptDetached (
		data: Data,
		privateKey: VirgilPrivateKey,
		publicKey: VirgilPublicKey|VirgilPublicKey[]): { encryptedData: Buffer, metadata: Buffer };

	/**
	 * Same as {@link IVirgilCrypto.decryptThenVerify} but expects the Virgil Cryptogram
	 * (the content info) to be passed as `contentInfo` parameter instead of be embedded
	 * in the `encryptedData`.
	 * @param {Data} encryptedData - The data to be decrypted and verified. If `encryptedData`
	 * is a string, base64 encoding is assumed.
	 * @param {Data} metadata - The metadata (i.e. public  algorithm parameters used for
	 * encryption) required for decryption.
	 * @param {VirgilPrivateKey} privateKey - The private key object to use for decryption.
	 * @param {VirgilPublicKey | VirgilPublicKey[]} publicKey - The public key object
	 * or an array of public key objects to use to verify data integrity. If the public key
	 * identifier specified in `metadata` does not correspond to the `publicKey` argument
	 * (or any of the keys in the `publicKey` array), an error is thrown.
	 * @returns {Buffer} - Decrypted data iff verification is successful,
	 * otherwise throws {@link IntegrityCheckFailedError}.
	 */
	decryptThenVerifyDetached (
		encryptedData: Data,
		metadata: Data,
		privateKey: VirgilPrivateKey,
		publicKey: VirgilPublicKey|VirgilPublicKey[]): Buffer;
}
