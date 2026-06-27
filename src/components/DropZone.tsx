import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import styles from './DropZone.module.css'

interface Props {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  children?: React.ReactNode
  className?: string
}

export function DropZone({ onFiles, accept = 'image/*', multiple = true, children, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) onFiles(files)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    if (files.length) onFiles(files)
    e.target.value = ''
  }

  return (
    <div
      className={`${styles.zone}${className ? ` ${className}` : ''}`}
      data-dragging={dragging}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
    >
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}
