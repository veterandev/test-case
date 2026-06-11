"use client"

import Image from "next/image"
import { useState } from "react"

interface UserAvatarProps {
  user?: {
    name: string
    avatar?: string
  } | null
}

export function UserAvatar({ user }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false)

  // 1. If the user has not avatar or does not login show the app logo
  const avatarSrc = user?.avatar && !imgError ? user.avatar : "/logo.png"
  const userName = user?.name || "Guest"

  return (
    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
      <div className="relative w-8 h-8 overflow-hidden rounded-full border bg-white">
        <Image
          src={avatarSrc}
          alt={userName}
          fill
          sizes="32px"
          className="object-cover"
          // 2. In case of Error on loading 
          onError={() => setImgError(true)}
        />
      </div>
      <span className="text-sm font-medium text-gray-700">{userName}</span>
    </div>
  )
}
