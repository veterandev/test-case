class PCMProcessor extends AudioWorkletProcessor {

  process(inputs) {

    const input = inputs[0]
    if (!input || !input[0]) return true

    const channel = input[0]

    // --------- RMS volume ----------
    let sum = 0
    for (let i = 0; i < channel.length; i++) {
      sum += channel[i] * channel[i]
    }

    const rms = Math.sqrt(sum / channel.length)

    this.port.postMessage({
      type: "volume",
      value: rms
    })

    // --------- PCM for Vosk ----------
    const buffer = new ArrayBuffer(channel.length * 2)
    const view = new DataView(buffer)

    for (let i = 0; i < channel.length; i++) {
      let s = Math.max(-1, Math.min(1, channel[i]))
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }

    this.port.postMessage({
      type: "audio",
      buffer
    })

    return true
  }
}

registerProcessor("pcm-processor", PCMProcessor)
