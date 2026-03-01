import { Canvas } from "@react-three/fiber"
import {
  OrbitControls,
  useGLTF,
  Html,
  useProgress,
  Center,
  Environment,
  Bounds
} from "@react-three/drei"
import { Suspense, useEffect } from "react"

/* ---------- Loader ---------- */

function Loader() {
  const { progress } = useProgress()

  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 bg-black/70 text-white px-6 py-4 rounded-xl shadow-xl backdrop-blur">
        <div className="w-44 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm font-semibold">
          Loading Model {Math.round(progress)}%
        </p>
      </div>
    </Html>
  )
}

/* ---------- Model ---------- */

function Model({ url, onLoaded }) {

  const gltf = useGLTF(url)

  useEffect(() => {

    if (!gltf?.scene) {
      console.error("GLTF failed to load")
      return
    }

    const scene = gltf.scene

    /* reduce GPU pressure */

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false
        child.receiveShadow = false
      }
    })

    onLoaded?.()

  }, [gltf, onLoaded])

  return (
    <Center>
      <primitive object={gltf.scene} scale={0.6} />
    </Center>
  )
}

/* ---------- Playground ---------- */

export default function Playground({ modelUrl, onLoaded }) {

  useEffect(() => {
    if (modelUrl) {
      useGLTF.preload(modelUrl)
    }
  }, [modelUrl])

  if (!modelUrl) {
    return (
      <div className="h-[500px] w-full flex items-center justify-center text-gray-400 bg-black/40 rounded-xl">
        Type an object and generate a 3D model
      </div>
    )
  }

  return (

    <div className="h-[520px] w-full rounded-xl overflow-hidden bg-black shadow-xl border border-white/10">

      <Canvas
        camera={{ position:[4,4,4], fov:60 }}
        dpr={[1,1.5]}
        gl={{
          antialias:true,
          powerPreference:"high-performance"
        }}
      >

        {/* Lighting */}

        <ambientLight intensity={0.8} />
        <directionalLight position={[5,5,5]} intensity={1} />

        {/* Environment */}

        <Environment preset="sunset" />

        {/* Model */}

        <Suspense fallback={<Loader />}>

          <Bounds fit clip observe margin={1.2}>
            <Model
              key={modelUrl}
              url={modelUrl}
              onLoaded={onLoaded}
            />
          </Bounds>

        </Suspense>

        {/* Controls */}

        <OrbitControls
          enableZoom
          enablePan
          enableRotate
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.8}
        />

      </Canvas>

    </div>
  )
}