export default function(initialData, password, isEmbeddedContentInfo) {
	const deferred = this.deferred();
	const virgilCipher = new VirgilCryptoWorkerContext.VirgilCipher();
	const base64decode = VirgilCryptoWorkerContext.VirgilBase64.decode;
	const base64encode = VirgilCryptoWorkerContext.VirgilBase64.encode;

	try {
		if (password) {
			virgilCipher.addPasswordRecipient(base64decode(password));
		}

		let encryptedDataBase64 = base64encode(virgilCipher.encrypt(base64decode(initialData), isEmbeddedContentInfo));

		deferred.resolve(encryptedDataBase64);
	} catch (e) {
		deferred.reject(e.message);
	} finally {
		virgilCipher.delete();
	}
}
