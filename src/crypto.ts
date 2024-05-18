const bip39 = require('bip39')
import { Buffer } from 'buffer'
import * as ecc from '@bitcoinerlab/secp256k1'
const { BIP32Factory } = require('bip32')
const ethUtil = require('ethereumjs-util')
import * as bitcoinjslib from 'bitcoinjs-lib'
import { Keypair as SolanaKeypair } from '@solana/web3.js'
import * as ed25519 from 'ed25519-hd-key'

const bip32 = BIP32Factory(ecc)

export const validMnemonicLengths = [12, 15, 18, 21, 24]

export function hasStrongRandomness() {
	return 'crypto' in window && window['crypto'] !== null
}

export function isValidMnemonicLength(value: number) {
	return Number.isInteger(value) && validMnemonicLengths.includes(value);
}


function checkValidHalfs(value: string): string {
	const words = value.split(' ')
	const length = words.length
	if (!isValidMnemonicLength(length / 2)) {
		return 'mnemonic of length ' + length + ' cannot have valid halfs'
	}

	const [leftHalfError] = normalizeMnemonic(words.slice(0, length / 2).join(' '), length / 2, false)
	if (leftHalfError) {
		return 'left half error: ' + leftHalfError
	}

	const [rightHalfError] = normalizeMnemonic(words.slice(length / 2).join(' '), length / 2, false)
	if (rightHalfError) {
		return 'right half error: ' + rightHalfError
	}

	return ''
}

export function normalizeMnemonic(value: string, requiredLength: number = 0, requiredValidHalfs: boolean = false): [string, string, number, boolean] {
	if (requiredLength > 0 && !isValidMnemonicLength(requiredLength)) {
		return ['invalid required length ' + requiredLength, '', 0, false]
	}
	if (!value) {
		return ['empty mnemonic', '', 0, false]
	}

	let resultValue = value.normalize('NFKD').trim().replace(/\s+/g, ' ')
	let resultLength = resultValue.split(' ').length
	if (!isValidMnemonicLength(resultLength)) {
		return ['wrong number of words ' + resultLength, '', 0, false]
	}
	if (requiredLength > 0 && resultLength != requiredLength) {
		return ['number of words mismatch: required ' + requiredLength + ', found ' + resultLength, '', resultLength, false]
	}
	

	let entropy
	try {
		entropy = bip39.mnemonicToEntropy(value)
	} catch (error) {
		return ['invalid mnemonic (' + error + ')', '', resultLength, false]
	}
	resultValue = bip39.entropyToMnemonic(entropy)
	resultLength = resultValue.split(' ').length
	if (!isValidMnemonicLength(resultLength)) {
		return ['wrong number of words ' + resultLength, '', 0, false]
	}
	if (requiredLength > 0 && resultLength != requiredLength) {
		return ['number of words mismatch: required ' + requiredLength + ', found ' + resultLength, '', resultLength, false]
	}	

	const halfCheckError = checkValidHalfs(resultValue)
	if (requiredValidHalfs && halfCheckError) {
		return [halfCheckError, '', resultLength, false]
	}

	return ['', resultValue, resultValue.split(' ').length, !halfCheckError]
}



export function generateMnemonic(numWords: number, validHalfsRequired: boolean = false): [string, string] {
	if (!isValidMnemonicLength(numWords)) {
		return ['invalid mnemonic length: ' + numWords, '']
	}
	if (!hasStrongRandomness()) {
		return ['strong randomness is not supported', '']
	}

	if (!validHalfsRequired) {
		return ['', bip39.generateMnemonic((numWords * 32) / 3)]
	}

	if (!isValidMnemonicLength(numWords / 2)) {
		return ['invalid mnemonic half length: ' + numWords / 2, '']
	}
	while (true) {
		const left = bip39.generateMnemonic((numWords * 32) / 3 / 2)
		const right = bip39.generateMnemonic((numWords * 32) / 3 / 2)
		const [valueError, maybeMnemonic, unused] = normalizeMnemonic(
			left + ' ' + right
		)
		if (!valueError) {
			return ['', maybeMnemonic]
		}
	}
}


export function deriveAddresses(mnemonic: string) {
	const root = bip39.mnemonicToSeedSync(mnemonic)
	return (
		'Bitcoin: ' + deriveBitcoinAddress(root) +
		'\nEthereum: ' + deriveEthereumAddress(root) +
		'\nTron: ' + deriveTronAddress(root) +
		'\nSolana: ' + deriveSolanaAddress(root)
	)
}

function deriveBitcoinAddress(seed: Buffer) {
	const node = bip32.fromSeed(seed).derivePath("m/84'/0'/0'/0/0")
	const { address } = bitcoinjslib.payments.p2wpkh({ pubkey: node.publicKey })
	return address
}

function deriveEthereumAddress(seed: Buffer) {
	const node = bip32.fromSeed(seed).derivePath("m/44'/60'/0'/0/0")
	var ethPubkey = ethUtil.importPublic(node.publicKey)
	var addressBuffer = ethUtil.publicToAddress(ethPubkey)
	var hexAddress = addressBuffer.toString('hex')
	var checksumAddress = ethUtil.toChecksumAddress('0x' + hexAddress)
	return ethUtil.addHexPrefix(checksumAddress)
}

function deriveTronAddress(seed: Buffer) {
	const node = bip32.fromSeed(seed).derivePath("m/44'/195'/0'/0/0")
	var ethPubkey = ethUtil.importPublic(node.publicKey)
	var addressBuffer = ethUtil.publicToAddress(ethPubkey)
	return bitcoinjslib.address.toBase58Check(addressBuffer, 0x41)
}

function deriveSolanaAddress(seed: Buffer) {
	const trustwallet = SolanaKeypair.fromSeed(
		ed25519.derivePath("m/44'/501'/0'", seed.toString('hex')).key
	).publicKey
	const solflare = SolanaKeypair.fromSeed(
		ed25519.derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key
	).publicKey
	return trustwallet + ' (trustwallet), ' + solflare + ' (solflare)'
}