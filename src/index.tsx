

import * as React from 'react'
const ReactDOM = require('react-dom/client')
const bip39 = require('bip39')
import $ = require('jquery')
import { Buffer } from 'buffer'
const hash_utils = require("@noble/hashes/utils");
import * as ecc from '@bitcoinerlab/secp256k1';
import { BIP32Interface } from 'bip32'
import { isValidChecksumAddress } from 'ethereumjs-util'
const { BIP32Factory } = require('bip32')
const ethUtil = require('ethereumjs-util')

function hasStrongRandom() {
	return 'crypto' in window && window['crypto'] !== null;
}

function calcBip32RootKeyFromPhrase(phrase: string) {
	const bip32 = BIP32Factory(ecc)
	const root = bip32.fromSeed(bip39.mnemonicToSeedSync(phrase))
	return getEthereumAddress(root)
}

function getEthereumAddress(root: BIP32Interface) {
	const node = root.derivePath("m/44'/60'/0'/0/0")
	var ethPubkey = ethUtil.importPublic(node.publicKey);
	var addressBuffer = ethUtil.publicToAddress(ethPubkey);
	var hexAddress = addressBuffer.toString('hex');
	var checksumAddress = ethUtil.toChecksumAddress('0x' + hexAddress);
	return ethUtil.addHexPrefix(checksumAddress);
}


function bufferPresent(value: Buffer): boolean {
	return value && 0 < value.length
}

function SeedPhrase({ value, onChange }: { value: string, onChange: (_: string) => void }) {
	const DEFAULT_LENGTH=15;

	const [valueState, setValueState] = React.useState('');
	const [lengthState, setLengthState] = React.useState(DEFAULT_LENGTH);
	

	function normalizeValue(value: string): [string, string, number] {
		try {
			const entropy = bip39.mnemonicToEntropy(value)
			return ['', bip39.entropyToMnemonic(entropy), entropy.length * 4 / 3]
		} catch (error) {
			return ['invalid mnemonic (' + error + ')', '', 0]
		}
	}
	const [valueError, maybeValidValue, _] = value ? normalizeValue(value) : ['', '', 0]
	if (valueError) {
		throw new Error('SeedPhrase: invalid value: ' + valueError) // todo needed?
	}


	function emitChangeEvent(newValue: string) {
		if (!onChange) {
			return
		}
		if(value == newValue) {
			return // todo needed?
		}
		const [newValueError, validNewValue, _] = normalizeValue(newValue)
		if(newValueError) {
			setValueState(newValue)
			onChange('')
		} else {
			setValueState('')
			onChange(validNewValue)
		}
	}

	function onLengthChange(event) {
		setLengthState(parseInt(event.target.value, 10))
	}

	function onValueChange(event) {
		const newValue = event.target.value
		emitChangeEvent(newValue)
	}

	function onGenerateClick(_) {
		if (!hasStrongRandom()) {
			throw new Error("This browser does not support strong randomness")
		}
		emitChangeEvent(bip39.generateMnemonic(lengthState * 32 / 3))
	}

	return <div>
		<div>
			<select value={lengthState} onChange={onLengthChange}>
				{[12, 15, 18, 21, 24].map(len => {
					return <option key={len} value={len}>{len}</option>
				})}
			</select>
		</div>
		<div>
			<textarea value={valueState || maybeValidValue} onChange={onValueChange} rows={5} cols={100}/>
			<p>{normalizeValue(valueState || maybeValidValue)[0]}</p>
		</div>
		<div>
			<button onClick={onGenerateClick}>Generate</button>
		</div>
	</div>
}

class CriptoolApp extends React.Component {
	state = { phrase: '' }
	render() {
		const root: string = this.state.phrase ? calcBip32RootKeyFromPhrase(this.state.phrase) : '<empty>'

		return <div>
			<SeedPhrase value={this.state.phrase} onChange={this.onSeedChange} />
			<p>{root}</p>
		</div>
	}
	onSeedChange = (value: string) => {
		this.setState({ phrase: value })
	}
}

$(document).ready(function () {

	const root = ReactDOM.createRoot(document.getElementById("app"));
	root.render(
		<React.StrictMode>
			<CriptoolApp />
		</React.StrictMode>
	);
});

