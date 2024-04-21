import * as React from 'react'
const ReactDOM = require('react-dom/client')
const bip39 = require('bip39')
import $ = require('jquery')
import { Buffer } from 'buffer'
import * as ecc from '@bitcoinerlab/secp256k1'
const { BIP32Factory } = require('bip32')
const ethUtil = require('ethereumjs-util')
import * as bitcoinjslib from 'bitcoinjs-lib'
import { Keypair as SolanaKeypair } from '@solana/web3.js'
import * as ed25519 from 'ed25519-hd-key'
const QRCode = require('qrcode')

const bip32 = BIP32Factory(ecc)

function hasStrongRandom () {
  return 'crypto' in window && window['crypto'] !== null
}

function calcBip32RootKeyFromPhrase (mnemonic: string) {
  const root = bip39.mnemonicToSeedSync(mnemonic)
  return (
    'Bitcoin: ' +
    getBitcoinAddress(root) +
    '\nEthereum: ' +
    getEthereumAddress(root) +
    '\nTron: ' +
    getTronAddress(root) +
    '\nSolana: ' +
    getSolanaAddress(root)
  )
}

function getBitcoinAddress (seed: Buffer) {
  const node = bip32.fromSeed(seed).derivePath("m/84'/0'/0'/0/0")
  const { address } = bitcoinjslib.payments.p2wpkh({ pubkey: node.publicKey })
  return address
}

function getEthereumAddress (seed: Buffer) {
  const node = bip32.fromSeed(seed).derivePath("m/44'/60'/0'/0/0")
  var ethPubkey = ethUtil.importPublic(node.publicKey)
  var addressBuffer = ethUtil.publicToAddress(ethPubkey)
  var hexAddress = addressBuffer.toString('hex')
  var checksumAddress = ethUtil.toChecksumAddress('0x' + hexAddress)
  return ethUtil.addHexPrefix(checksumAddress)
}

function getTronAddress (seed: Buffer) {
  const node = bip32.fromSeed(seed).derivePath("m/44'/195'/0'/0/0")
  var ethPubkey = ethUtil.importPublic(node.publicKey)
  var addressBuffer = ethUtil.publicToAddress(ethPubkey)
  return bitcoinjslib.address.toBase58Check(addressBuffer, 0x41)
}

function getSolanaAddress (seed: Buffer) {
  const trustwallet = SolanaKeypair.fromSeed(
    ed25519.derivePath("m/44'/501'/0'", seed.toString('hex')).key
  ).publicKey
  const solflare = SolanaKeypair.fromSeed(
    ed25519.derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key
  ).publicKey
  return trustwallet + ' (truswallet), ' + solflare + ' (solflare)'
}


function SeedPhrase ({
  value,
  onChange
}: {
  value: string
  onChange: (_: string) => void
}) {
  const DEFAULT_LENGTH = 24

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
  state = { phrase: '', publicText: '<empty>', publicQR: '' }
  render () {
    return (
      <div>
        <SeedPhrase value={this.state.phrase} onChange={this.onSeedChange} />
        <pre>{this.state.publicText}</pre>
        <img src={this.state.publicQR} />
      </div>
    )
  }
  onSeedChange = (value: string) => {
    const publicText: string = this.state.phrase
      ? calcBip32RootKeyFromPhrase(this.state.phrase)
      : '<empty>'
    this.setState({ phrase: value, publicText: publicText })
    const that = this
    QRCode.toDataURL(publicText, function (err, url) {
      if (err) {
        console.log('error generation qr: ' + err)
      } else {
        that.setState({ publicQR: url })
      }
    })
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
