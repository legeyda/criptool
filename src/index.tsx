import * as React from 'react'
const ReactDOM = require('react-dom/client')
import $ = require('jquery')
const QRCode = require('qrcode')

const criplib = require('criptool/crypto')

function useLazyState<T> (defaultValue: T): [T, (T) => boolean] {
  const [value, reactSetter] = React.useState<T>(defaultValue)
  return [
    value,
    function (newValue: T) {
      if (value != newValue) {
        reactSetter(newValue)
        return true
      }
      return false
    }
  ]
}

function Mnemonic ({
  value,
  onChange
}: {
  value: string
  onChange: (_: string) => void
}) {
  const [lengthState, setLengthState] = useLazyState(24)
  const [validHalfsState, setValidHalfsState] = useLazyState(false)
  const [valueState, setValueState] = useLazyState('')

  const [generationParametersErrorMessage, valueErrorMessage] = evaluateState()

  function evaluateState (): [string, string] {
    if (value) {
      const [valueError, normalizedValue, valueLength, valueValidHalfs] =
        criplib.normalizeMnemonic(value)
      if (valueLength) {
        setLengthState(valueLength)
      }
      if (valueError) {
        setValueState(value)
        return [getGenerationParametersErrorMessage(), valueError]
      } else {
        setValueState(value)
        return ['', '']
      }
    } else {
      return [getGenerationParametersErrorMessage(), getValueErrorMessage()]
    }
  }

  function getGenerationParametersErrorMessage (): string {
    return criplib.generateMnemonic(lengthState, validHalfsState)[0]
  }

  function getValueErrorMessage (): string {
    if (valueState) {
      const [valueStateError, normalizedValueState] = criplib.normalizeMnemonic(
        valueState,
        lengthState,
        validHalfsState
      )
      if (valueStateError) {
        return 'wrong mnemonic: ' + valueStateError
      }
    }
    return ''
  }

  function fireChangeIfValid (
    mnemonic: string,
    length: number,
    validHalfsRequired: boolean
  ) {
    const [error, normalizedMnemonic, mnemonicLength, mnemonicValidHalfs] =
      criplib.normalizeMnemonic(mnemonic, length, validHalfsRequired)
    fireChange(!error ? normalizedMnemonic : '')
  }

  function onLengthChange (event) {
    const newLength = parseInt(event.target.value, 10)
    setLengthState(newLength)
    fireChangeIfValid(valueState, newLength, validHalfsState)
  }

  function onValidHalfsChange (event) {
    const newValidHalfs = event.target.checked
    setValidHalfsState(newValidHalfs)
    fireChangeIfValid(valueState, lengthState, newValidHalfs)
  }

  function onValueChange (event) {
    const newValue = event.target.value
    setValueState(newValue)
    fireChangeIfValid(newValue, lengthState, validHalfsState)
  }

  function fireChange (newValue: string) {
    if (!onChange) {
      return
    }
    if (newValue == value) {
      return
    }
    onChange(newValue)
  }

  function onGenerateClick (_) {
    if (generationParametersErrorMessage) {
      fireChange('')
      setValueState(generationParametersErrorMessage)
    }
    const [err, newValue, _length] = criplib.generateMnemonic(
      lengthState,
      validHalfsState
    )
    if (err) {
      fireChange('')
      setValueState(err)
    } else {
      fireChange(newValue)
      setValueState(newValue)
    }
  }

  return (
    <div>
      <div>
        <select value={lengthState} onChange={onLengthChange}>
          {criplib.validMnemonicLengths.map(len => {
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
          value={valueState}
          onChange={onValueChange}
          rows={5}
          cols={100}
        />
        <div>{valueErrorMessage && <p>{valueErrorMessage}</p>}</div>
        <p>{criplib.normalizeMnemonic(valueState)[1]}</p>
      </div>
      <div>
        <label>
          <input
            type='checkbox'
            checked={validHalfsState}
            onChange={onValidHalfsChange}
          ></input>
          Each of the halfs should be valid seed phrase
        </label>
      </div>
      <div>
        <button
          onClick={onGenerateClick}
          disabled={generationParametersErrorMessage ? true : false}
        >
          Generate
        </button>
        <div>
          {generationParametersErrorMessage && (
            <p>{generationParametersErrorMessage}</p>
          )}
        </div>
      </div>
    </div>
  )
}

class CriptoolApp extends React.Component {
  state = { phrase: '', publicText: '', publicQR: '' }
  render () {
    if (this.state.phrase && !this.state.publicText) {
      const publicText = criplib.deriveAddresses(this.state.phrase)
      this.setState({ publicText: publicText })
      const that = this
      setInterval(function () {
        QRCode.toDataURL(publicText, function (err, url) {
          if (err) {
            console.log('error generation qr: ' + err)
          } else if (
            publicText == that.state.publicText &&
            that.state.publicQR != url
          ) {
            that.setState({ publicQR: url })
          }
        })
      })
    }

    return (
      <div>
        <Mnemonic value={this.state.phrase} onChange={this.onSeedChange} />
        <pre>{this.state.publicText || '<empty>'}</pre>
        {this.state.publicQR && <img src={this.state.publicQR} />}
      </div>
    )
  }
  onSeedChange = (value: string) => {
    this.setState({ phrase: value, publicText: '', publicQR: '' })
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
