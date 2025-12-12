import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type DecoderTextProps = {
  text: string
  className?: string
  delay?: number
}

const chars = '#$%&@*?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const DecoderText = ({ text, className = '', delay = 0 }: DecoderTextProps) => {
  const [displayText, setDisplayText] = useState<string[]>([])
  const [isDecoding, setIsDecoding] = useState(true)

  useEffect(() => {
    const textArray = text.split('')
    setDisplayText(textArray.map(() => chars[Math.floor(Math.random() * chars.length)]))

    const decodeInterval = setInterval(() => {
      setDisplayText((prev) =>
        prev.map((char, idx) => {
          if (Math.random() > 0.3) {
            return chars[Math.floor(Math.random() * chars.length)]
          }
          return char
        })
      )
    }, 50)

    setTimeout(() => {
      clearInterval(decodeInterval)
      setIsDecoding(false)
      setDisplayText(textArray)
    }, 1500 + delay)

    return () => clearInterval(decodeInterval)
  }, [text, delay])

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayText.map((char, idx) => (
        <motion.span
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, delay: idx * 0.02 }}
          className={isDecoding ? 'font-mono' : ''}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  )
}

export default DecoderText

