"use client"

import { useRef, useState, useEffect } from "react"
import { useDictation } from "@/lib/dictation/usedictation"
import { insertIntoFocusedEditor } from "@/lib/utils/insert-text"

const LOCK_THRESHOLD = 70
const CANCEL_THRESHOLD = -70

export default function DictateButton() {

  const [volume,setVolume] = useState(0)

  const { start, stop, state } =
    useDictation(insertIntoFocusedEditor, setVolume)

  const [locked,setLocked] = useState(false)
  const [hint,setHint] = useState(false)
  const [offset,setOffset] = useState({x:0,y:0})

  const startX = useRef(0)
  const startY = useRef(0)
  const dragging = useRef(false)

  const recording = state === "active"

  function haptic(pattern:any){
    if ("vibrate" in navigator){
      navigator.vibrate(pattern)
    }
  }

  const pointerDown = async (e:React.PointerEvent<HTMLButtonElement>)=>{

    e.preventDefault()

    if (locked) return

    e.currentTarget.setPointerCapture(e.pointerId)

    dragging.current = true

    startX.current = e.clientX
    startY.current = e.clientY

    setHint(true)

    haptic(10)

    await start()
  }

  const pointerMove = async (e:React.PointerEvent<HTMLButtonElement>)=>{

    if (!dragging.current) return

    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current

    setOffset({
      x: Math.max(CANCEL_THRESHOLD, Math.min(40, dx)),
      y: Math.max(-20, Math.min(LOCK_THRESHOLD, dy))
    })

    if (dy > LOCK_THRESHOLD){

      setLocked(true)
      dragging.current = false
      setHint(false)
      setOffset({x:0,y:0})

      haptic([10,30,10])
      return
    }

    if (dx < CANCEL_THRESHOLD){

      dragging.current = false
      setHint(false)
      setOffset({x:0,y:0})

      haptic(30)

      await stop()
    }
  }

  const pointerUp = async (e:React.PointerEvent<HTMLButtonElement>)=>{

    if (!dragging.current) return

    e.currentTarget.releasePointerCapture(e.pointerId)

    dragging.current = false
    setHint(false)
    setOffset({x:0,y:0})

    await stop()
  }

  const tapLocked = async ()=>{

    if (!locked) return

    setLocked(false)
    haptic(20)
    await stop()
  }

  const level = Math.min(1, volume * 10)

  return (

    <div className="fixed bottom-6 right-6 z-50">

      <div className="relative flex items-center justify-center">

        {hint && !locked && (
          <div className="absolute -top-24 flex flex-col items-center pointer-events-none">

            <div className="text-xs text-gray-500 mb-1">
              ↓ lock • ← cancel
            </div>

            <div className="w-1 h-16 bg-gray-300 rounded-full relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">
                🔒
              </div>
            </div>

          </div>
        )}

        {locked && (
          <div className="absolute -top-10 text-xs bg-cyan-600 text-white px-2 py-1 rounded-full">
            tap to stop
          </div>
        )}

        {recording && (
          <div className="absolute right-16 flex items-end gap-[3px] h-8">
            {[0,1,2,3,4].map(i=>(
              <div
                key={i}
                className="w-[4px] bg-cyan-500 rounded transition-all"
                style={{
                  height:`${8 + level*28*(0.6+Math.random()*0.4)}px`
                }}
              />
            ))}
          </div>
        )}

        <button
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          onClick={tapLocked}
          style={{
            transform:`translate(${offset.x}px,${offset.y}px)`
          }}
          className={`
            w-14 h-14
            rounded-full
            flex items-center justify-center
            text-xl
            border
            shadow-xl
            transition
            select-none
            ${
              locked
                ? "bg-cyan-600 text-white border-cyan-700"
                : recording
                ? "bg-cyan-500 text-white border-cyan-600"
                : "bg-white border-gray-300 hover:border-cyan-400"
            }
          `}
        >
          🎤
        </button>

      </div>

    </div>
  )
}
