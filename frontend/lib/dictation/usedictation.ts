"use client"

import { useCallback, useRef, useState } from "react"

type DictationState =
  | "idle"
  | "connecting"
  | "active"
  | "stopping"

export function useDictation(
  onFinalText: (text: string) => void,
  onVolume?: (v: number) => void
) {

  const [state, setState] = useState<DictationState>("idle")

  const socketRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const cleanup = useCallback(async () => {

    try {

      workletNodeRef.current?.disconnect()
      workletNodeRef.current = null

      if (audioCtxRef.current) {
        await audioCtxRef.current.close()
        audioCtxRef.current = null
      }

      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null

      socketRef.current?.close()
      socketRef.current = null

    } catch (err) {
      console.error("Dictation cleanup error:", err)
    }

    setState("idle")

  }, [])

  const start = useCallback(async () => {

    if (state !== "idle") return

    setState("connecting")

    try {

      // تعیین آدرس وب‌سوکت از متغیر محیطی یا Fallback هوشمند
      let wsUrl = process.env.NEXT_PUBLIC_WS_URL

      if (!wsUrl && typeof window !== "undefined") {
        const isHttps = window.location.protocol === "https:"
        const protocol = isHttps ? "wss" : "ws"
        
        // در محیط پروداکشن (HTTPS) نباید پورت 8000 ذکر شود چون ترافیک از 443 Nginx رد می‌شود
        // در محیط لوکال مستقیماً به بک‌اَند روی 8000 وصل می‌شود
        const host = isHttps ? window.location.host : `${window.location.hostname}:8000`
        wsUrl = `${protocol}://${host}/ws/stt`
      }

      if (!wsUrl) {
        throw new Error("WebSocket URL is not configured.")
      }

      const socket = new WebSocket(wsUrl)

      socketRef.current = socket

/*       const protocol =
        window.location.protocol === "https:" ? "wss" : "ws"

      const socket = new WebSocket(
        `${protocol}://${window.location.hostname}:8000/ws/stt`
      )

      socketRef.current = socket
 */
      await new Promise<void>((resolve, reject) => {
        socket.onopen = () => resolve()
        socket.onerror = reject
      })

      socket.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.type === "final") {
          onFinalText(data.text + " ")
        }
      }

      socket.onclose = cleanup

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      streamRef.current = stream

      const audioCtx = new AudioContext({ sampleRate: 16000 })
      audioCtxRef.current = audioCtx

      await audioCtx.audioWorklet.addModule("/audioProcessor.js")

      const source =
        audioCtx.createMediaStreamSource(stream)

      const workletNode =
        new AudioWorkletNode(audioCtx, "pcm-processor")

      workletNodeRef.current = workletNode

      workletNode.port.onmessage = (event) => {

        const data = event.data

        if (data.type === "volume") {
          onVolume?.(data.value)
          return
        }

        if (data.type === "audio") {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(data.buffer)
          }
        }

      }

      source.connect(workletNode)

      setState("active")

    } catch (err) {
      console.error("Dictation start error:", err)
      await cleanup()
    }

  }, [cleanup, onFinalText, onVolume, state])

  const stop = useCallback(async () => {
    if (state !== "active") return
    setState("stopping")
    await cleanup()
  }, [cleanup, state])

  return {
    state,
    isActive: state === "active",
    start,
    stop
  }
}
