'use strict';

var utils = require('../utils');
var VirgilCryptoError = require('../virgil-crypto-error');

module.exports = makePublicKey;

/**
 * Converts the publicKey argument to canonical public key representation.
 *
 * @param {(Buffer|PublicKeyInfo)} publicKey
 * @param {Buffer} [recipientId]
 * @returns {PublicKey}
 */
function makePublicKey(publicKey, recipientId) {
	if (utils.isBuffer(publicKey)) {
		if (!!recipientId && !utils.isBuffer(recipientId)) {
			throw new VirgilCryptoError('Unexpected type of "recipientId" argument. ' +
				'Expected recipientId to be a Buffer.');
		}

		return new PublicKey(publicKey, recipientId);
	}

	if (utils.isObjectLike(publicKey) && !!publicKey.publicKey) {
		return new PublicKey(publicKey.publicKey, publicKey.recipientId);
	}

	throw new VirgilCryptoError('Unexpected type of "publicKey" argument. ' +
		'Expected publicKey to be a Buffer or a hash with "publicKey" property.');
}

/**
 * Creates a new PublicKey.
 *
 * @class
 * @classdesc A wrapper around the public key value and id.
 * 		Byte array properties of instances are represented as
 * 		VirgilByteArray - type consumable by native VirgilCrypto.
 */
function PublicKey(key, recipientId) {
	this.publicKey = utils.bufferToByteArray(key);
	this.recipientId = recipientId ? utils.bufferToByteArray(recipientId) : null;
}

