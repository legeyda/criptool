const bip39 = require('bip39')
import { Buffer } from 'buffer'
import * as ecc from '@bitcoinerlab/secp256k1'
const { BIP32Factory } = require('bip32')
const ethUtil = require('ethereumjs-util')
import * as bitcoinjslib from 'bitcoinjs-lib'
import { Keypair as SolanaKeypair } from '@solana/web3.js'
import * as ed25519 from 'ed25519-hd-key'

const bip32 = BIP32Factory(ecc)






export function hasStrongRandom() {
	return 'crypto' in window && window['crypto'] !== null
}

export function normalizeMnemonic(value: string): [string, string, number] {
	let entropy
	try {
		entropy = bip39.mnemonicToEntropy(value)
	} catch (error) {
		return ['invalid mnemonic (' + error + ')', '', 0]
	}
	return ['', bip39.entropyToMnemonic(entropy), (entropy.length * 4) / 3]
}

export function generateMnemonic(numWords: number, validHalfs: boolean = false): [string, string] {
	if (!hasStrongRandom()) {
		throw new Error('This browser does not support strong randomness')
	}
	if (validHalfs) {
		if (numWords % 6 != 0) {
			return ['not divisible evenly', null]
		}
		while (true) {
			const left = bip39.generateMnemonic((numWords * 32) / 3 / 2)
			const right = bip39.generateMnemonic((numWords * 32) / 3 / 2)
			const [valueError, maybeMnemonic, _] = normalizeMnemonic(
				left + ' ' + right
			)

			if (!valueError) {
				return [null, maybeMnemonic]
			}

		}
	} else {
		return [null, bip39.generateMnemonic((numWords * 32) / 3)]
	}
}


export function deriveAddresses(mnemonic: string) {
	const root = bip39.mnemonicToSeedSync(mnemonic)
	return (
		'Bitcoin: ' + getBitcoinAddress(root) +
		'\nEthereum: ' + getEthereumAddress(root) +
		'\nTron: ' + getTronAddress(root) +
		'\nSolana: ' + getSolanaAddress(root)
	)
}

function getBitcoinAddress(seed: Buffer) {
	const node = bip32.fromSeed(seed).derivePath("m/84'/0'/0'/0/0")
	const { address } = bitcoinjslib.payments.p2wpkh({ pubkey: node.publicKey })
	return address
}

function getEthereumAddress(seed: Buffer) {
	const node = bip32.fromSeed(seed).derivePath("m/44'/60'/0'/0/0")
	var ethPubkey = ethUtil.importPublic(node.publicKey)
	var addressBuffer = ethUtil.publicToAddress(ethPubkey)
	var hexAddress = addressBuffer.toString('hex')
	var checksumAddress = ethUtil.toChecksumAddress('0x' + hexAddress)
	return ethUtil.addHexPrefix(checksumAddress)
}

function getTronAddress(seed: Buffer) {
	const node = bip32.fromSeed(seed).derivePath("m/44'/195'/0'/0/0")
	var ethPubkey = ethUtil.importPublic(node.publicKey)
	var addressBuffer = ethUtil.publicToAddress(ethPubkey)
	return bitcoinjslib.address.toBase58Check(addressBuffer, 0x41)
}

function getSolanaAddress(seed: Buffer) {
	const trustwallet = SolanaKeypair.fromSeed(
		ed25519.derivePath("m/44'/501'/0'", seed.toString('hex')).key
	).publicKey
	const solflare = SolanaKeypair.fromSeed(
		ed25519.derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key
	).publicKey
	return trustwallet + ' (trustwallet), ' + solflare + ' (solflare)'
}