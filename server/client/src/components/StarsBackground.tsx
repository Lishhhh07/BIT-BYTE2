import { Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

const StarsBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas>
        <Stars
          radius={300}
          depth={60}
          count={5000}
          factor={7}
          saturation={0}
          fade
          speed={0.5}
        />
      </Canvas>
    </div>
  )
}

export default StarsBackground

