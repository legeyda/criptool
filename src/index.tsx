import * as React from 'react'
const ReactDOM = require('react-dom/client')
const bip39 = require('bip39')
import $ = require('jquery')
import { Buffer } from 'buffer'
const hash_utils = require('@noble/hashes/utils')
import * as ecc from '@bitcoinerlab/secp256k1'
import { BIP32Interface } from 'bip32'
import { isValidChecksumAddress } from 'ethereumjs-util'
const { BIP32Factory } = require('bip32')
const ethUtil = require('ethereumjs-util')
import hash160 from 'hash160'
import * as bitcoinjslib from 'bitcoinjs-lib'
import { Keypair as SolanaKeypair, Account as SolanaAccount } from '@solana/web3.js'
import * as nacl from 'tweetnacl'
import * as ed25519 from 'ed25519-hd-key'

function hasStrongRandom () {
  return 'crypto' in window && window['crypto'] !== null
}

function calcBip32RootKeyFromPhrase (mnemonic: string) {
  const bip32 = BIP32Factory(ecc)
  const root = bip32.fromSeed(bip39.mnemonicToSeedSync(mnemonic))
  return (
    'Bitcoin: ' +
    getBitcoinAddress(root) +
    '\n Ethereum: ' +
    getEthereumAddress(root) +
    '\n Tron: ' +
    getTronAddress(root) +
    '\n Solana: ' +
    getSolanaAddress(mnemonic)
  )

  return ': ' + getEthereumAddress(root) + '; : ' + getBitcoinAddress(root)
}

function getBitcoinAddress (root: BIP32Interface) {
  const node = root.derivePath("m/84'/0'/0'/0/0") // = key
  const { address } = bitcoinjslib.payments.p2wpkh({ pubkey: node.publicKey })
  return address
}

function getEthereumAddress (root: BIP32Interface) {
  const node = root.derivePath("m/44'/60'/0'/0/0")
  var ethPubkey = ethUtil.importPublic(node.publicKey)
  var addressBuffer = ethUtil.publicToAddress(ethPubkey)
  var hexAddress = addressBuffer.toString('hex')
  var checksumAddress = ethUtil.toChecksumAddress('0x' + hexAddress)
  return ethUtil.addHexPrefix(checksumAddress)
}

function getTronAddress (root: BIP32Interface) {
  const node = root.derivePath("m/44'/195'/0'/0/0")
  var ethPubkey = ethUtil.importPublic(node.publicKey)
  var addressBuffer = ethUtil.publicToAddress(ethPubkey)
  return bitcoinjslib.address.toBase58Check(addressBuffer, 0x41)
}

// solana: https://community.trustwallet.com/t/solana/451578/6
// Phantom:      m/44’/501’/0’/0’
// Trust Wallet: m/44’/501’/0’

function getSolanaAddress4 (root: BIP32Interface) {
	const node = root.derivePath("m/44'/501'/0'/0'")
	return ''
	//return SolanaKeypair.fromSeed(node.privateKey).publicKey.toString()
  }
  
function getSolanaAddress3 (root: BIP32Interface) {
	// const node = root.derivePath("m/44'/501'/0'/0'") // Bfk9KZk1et7b7b1MggYvdoquatH7tfyUM28beEx9XhPP
	// const node = root.derivePath("m/44'/501'/0'/0/0") // 7PGZySuqzPzwzn7Sf3wsbF83A9j2eJEjKDSiUdPSxKxf
	// const node = root.derivePath("m/44'/501'/0'/0'/0") // 2pzE5AYypSfxDJzRUun17wFDRNAWKthdpmPBFxnhsVrf
	// const node = root.derivePath("m/44'/501'/0'") // 3kETVPtALUUGmaQ5c6C8ovGnz78AFumyrPNv8R2nX2J1
	// const node = root.derivePath("m/501'/0'/0/0") // DrXASV1yfncMnr75LHdCFvDBnq63nkCB2FZJTJnGddiS
	// const node = root.derivePath("m/44'/501'/0'/0") // F8ZL9kNoWG1cqK4VpKyuEC1DWYb94iKJSQoUgp6Bt1i5
	const node = root.derivePath("blabla")
	return SolanaKeypair.fromSeed(node.privateKey).publicKey.toString()
}

function getSolanaAddress1 (root: BIP32Interface) {
  // const node = root.derivePath("m/44'/501'/0'/0'") // Bfk9KZk1et7b7b1MggYvdoquatH7tfyUM28beEx9XhPP
  // const node = root.derivePath("m/44'/501'/0'/0/0") // 7PGZySuqzPzwzn7Sf3wsbF83A9j2eJEjKDSiUdPSxKxf
  // const node = root.derivePath("m/44'/501'/0'/0'/0") // 2pzE5AYypSfxDJzRUun17wFDRNAWKthdpmPBFxnhsVrf
  // const node = root.derivePath("m/44'/501'/0'") // 3kETVPtALUUGmaQ5c6C8ovGnz78AFumyrPNv8R2nX2J1
  // const node = root.derivePath("m/501'/0'/0/0") // DrXASV1yfncMnr75LHdCFvDBnq63nkCB2FZJTJnGddiS
  // const node = root.derivePath("m/44'/501'/0'/0") // F8ZL9kNoWG1cqK4VpKyuEC1DWYb94iKJSQoUgp6Bt1i5

  // https://solana.stackexchange.com/questions/9108/how-do-i-create-a-keypair-using-a-custom-derivation-path-with-javascript
  const node = root.derivePath("m/44'/501'/0'/0'")
  // Generate a keypair from the derived seed using tweetnacl (NaCl = Networking and Cryptography library)
  const derivedUint8Keypair = nacl.sign.keyPair.fromSeed(node.publicKey) // added .publicKey

  // This is a Uint8Array, not a Solana web3.js Keypair object, so you will need to convert it
  const customPathKeypair = SolanaKeypair.fromSecretKey(
    Uint8Array.from(derivedUint8Keypair.secretKey)
  )
  return customPathKeypair

  //return SolanaKeypair.fromSeed(node.privateKey).publicKey.toString()
}

function getSolanaAddress2 (mnemonic: string) {
  //solana.stackexchange.com/questions/9108/how-do-i-create-a-keypair-using-a-custom-derivation-path-with-javascript
  https: const seed = bip39.mnemonicToSeedSync(mnemonic).slice(0, 32)

  //const derivedSeed = ed25519.derivePath("m/44'/501'/0'/0'", seed).key;

  const derivedSeed = BIP32Factory(ecc)
    .fromSeed(seed)
    .derivePath("m/44'/501'/0'/0'")

  // Generate a keypair from the derived seed using tweetnacl (NaCl = Networking and Cryptography library)
  const derivedUint8Keypair = nacl.sign.keyPair.fromSeed(
    Uint8Array.from(derivedSeed)
  )

  // This is a Uint8Array, not a Solana web3.js Keypair object, so you will need to convert it
  const customPathKeypair = SolanaKeypair.fromSecretKey(
    Uint8Array.from(derivedUint8Keypair.secretKey)
  )

  return customPathKeypair.publicKey.toBase58()
}

function getSolanaAddress5 (mnemonic: string) {
	https://stackoverflow.com/questions/70668877/unable-to-derive-sollet-wallet-address-using-mnemonic-phrases-in-solana-web3
	const seed = bip39.mnemonicToSeedSync(mnemonic); 
	const derivedSeed = ed25519.derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
	const account = new SolanaAccount(nacl.sign.keyPair.fromSeed(derivedSeed).secretKey);
	const keypair = SolanaKeypair.fromSecretKey(account.secretKey);
	return keypair.publicKey;

}

function getSolanaAddress (mnemonic: string) {

	const bip32 = BIP32Factory(ecc)
	const root = bip32.fromSeed(bip39.mnemonicToSeedSync(mnemonic))
	const node = root.derivePath("m/44'/501'/0'/0'")
	
	//const derivedSeed = ed25519.derivePath("m/44'/501'/0'/0'", bip39.mnemonicToSeedSync(mnemonic).toString('hex')).key;


	const account = new SolanaAccount(nacl.sign.keyPair.fromSeed(derivedSeed).secretKey);
	const keypair = SolanaKeypair.fromSecretKey(account.secretKey);
	return keypair.publicKey;

}

function bufferPresent (value: Buffer): boolean {
  return value && 0 < value.length
}

function SeedPhrase ({
  value,
  onChange
}: {
  value: string
  onChange: (_: string) => void
}) {
  const DEFAULT_LENGTH = 15

  const [valueState, setValueState] = React.useState('')
  const [lengthState, setLengthState] = React.useState(DEFAULT_LENGTH)
  const [validHalfsState, setValidHalfsState] = React.useState(false)

  function normalizeValue (value: string): [string, string, number] {
    try {
      const entropy = bip39.mnemonicToEntropy(value)
      return ['', bip39.entropyToMnemonic(entropy), (entropy.length * 4) / 3]
    } catch (error) {
      return ['invalid mnemonic (' + error + ')', '', 0]
    }
  }
  const [valueError, maybeValidValue, _] = value
    ? normalizeValue(value)
    : ['', '', 0]
  if (valueError) {
    throw new Error('SeedPhrase: invalid value: ' + valueError) // todo needed?
  }

  function emitChangeEvent (newValue: string) {
    if (!onChange) {
      return
    }
    if (value == newValue) {
      return // todo needed?
    }
    const [newValueError, validNewValue, _] = normalizeValue(newValue)
    if (newValueError) {
      setValueState(newValue)
      onChange('')
    } else {
      setValueState('')
      onChange(validNewValue)
    }
  }

  function onLengthChange (event) {
    setLengthState(parseInt(event.target.value, 10))
  }

  function onValueChange (event) {
    const newValue = event.target.value
    emitChangeEvent(newValue)
  }

  function onValidHalfsChange (event) {
    setValidHalfsState(event.target.checked)
  }

  function onGenerateClick (_) {
    emitChangeEvent('')
    if (!hasStrongRandom()) {
      throw new Error('This browser does not support strong randomness')
    }
    if (validHalfsState) {
      if (lengthState % 6 != 0) {
        emitChangeEvent('not divisible evenly')
        return
      }
      while (true) {
        const left = bip39.generateMnemonic((lengthState * 32) / 3 / 2)
        const right = bip39.generateMnemonic((lengthState * 32) / 3 / 2)
        const [valueError, maybeValidValue, _] = normalizeValue(
          left + ' ' + right
        )
        if (!valueError) {
          emitChangeEvent(maybeValidValue)
          return
        }
      }
    } else {
      emitChangeEvent(bip39.generateMnemonic((lengthState * 32) / 3))
    }
  }

  return (
    <div>
      <div>
        <select value={lengthState} onChange={onLengthChange}>
          {[12, 15, 18, 21, 24].map(len => {
            return (
              <option key={len} value={len}>
                {len}
              </option>
            )
          })}
        </select>
      </div>
      <div>
        <textarea
          value={valueState || maybeValidValue}
          onChange={onValueChange}
          rows={5}
          cols={100}
        />
        <p>{normalizeValue(valueState || maybeValidValue)[0]}</p>
      </div>
      <div>
        <p>Valid halfs</p>
        <input
          type='checkbox'
          checked={validHalfsState}
          onChange={onValidHalfsChange}
        ></input>
      </div>
      <div>
        <button onClick={onGenerateClick}>Generate</button>
      </div>
    </div>
  )
}

class CriptoolApp extends React.Component {
  state = { phrase: '' }
  render () {
    const root: string = this.state.phrase
      ? calcBip32RootKeyFromPhrase(this.state.phrase)
      : '<empty>'

    return (
      <div>
        <SeedPhrase value={this.state.phrase} onChange={this.onSeedChange} />
        <p>{root}</p>
      </div>
    )
  }
  onSeedChange = (value: string) => {
    this.setState({ phrase: value })
  }
}

$(document).ready(function () {
  const root = ReactDOM.createRoot(document.getElementById('app'))
  root.render(
    <React.StrictMode>
      <CriptoolApp />
    </React.StrictMode>
  )
})
