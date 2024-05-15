import * as React from 'react'
const ReactDOM = require('react-dom/client')
import $ = require('jquery')
const QRCode = require('qrcode')

const criplib = require('criptool/crypto')



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

  const [valueError, maybeValidValue, _] = value
    ? criplib.normalizeMnemonic(value)
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
    const [newValueError, validNewValue, _] = criplib.normalizeMnemonic(newValue)
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
    if (!criplib.hasStrongRandom()) {
      throw new Error('This browser does not support strong randomness')
    }
    const [err, mnemonic, _length] = criplib.generateMnemonic(lengthState, validHalfsState)
    if(!err) {
      emitChangeEvent(mnemonic)
    } else {
      emitChangeEvent(err)
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
        <p>{criplib.normalizeMnemonic(valueState || maybeValidValue)[0]}</p>
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
      ? criplib.deriveAddresses(this.state.phrase)
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
