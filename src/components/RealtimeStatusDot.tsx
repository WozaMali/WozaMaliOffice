"use client"
import React from 'react'
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus'

export default function RealtimeStatusDot({ className }: { className?: string }) {
  const { status } = useRealtimeStatus()

  const color = status === 'connected' ? 'bg-green-500' : status === 'reconnecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
  const tooltip = status === 'connected' ? 'Live: Connected' : status === 'reconnecting' ? 'Live: Reconnecting' : status === 'offline' ? 'Live: Offline' : 'Live: Disconnected'

  return (
    <div className={`flex items-center gap-2 ${className || ''}`} title={tooltip} aria-label={tooltip}>
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-xs text-gray-400 select-none">Live</span>
    </div>
  )
}


