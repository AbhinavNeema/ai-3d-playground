import { useState } from "react"
import axios from "axios"
import Playground from "../components/Playground"

export default function Home(){

  const [prompt,setPrompt] = useState("")
  const [model,setModel] = useState(null)
  const [loading,setLoading] = useState(false)

  const generate = async ()=>{

    if(!prompt || loading) return

    try{

      setLoading(true)

      const res = await axios.post(
        "https://ai-3d-playground.onrender.com/generate-model",
        {prompt}
      )

      if(res.data.success){
        setModel(res.data.url)
      } else {
        setLoading(false)
        alert("Model not found")
      }

    }catch(err){
      console.log(err)
      setLoading(false)
      alert("Server error")
    }
  }

  const handleLoaded = () => {
    setLoading(false)
  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-black p-6">

      <div className="w-full max-w-5xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-10 shadow-2xl">

        {/* Title */}

        <h1 className="text-4xl font-bold text-center text-white mb-2">
          3D Playground
        </h1>

        <p className="text-center text-gray-300 mb-8">
          Type anything and explore it as a 3D model
        </p>

        {/* Input + Button */}

        <div className="flex gap-3 mb-8">

          <input
            className="flex-1 px-5 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="robot, dragon, spaceship..."
            value={prompt}
            onChange={(e)=>setPrompt(e.target.value)}
          />

          <button
            disabled={loading}
            onClick={generate}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-indigo-500 hover:bg-indigo-600 text-white"
            }`}
          >
            {loading ? "Loading Model..." : "Generate"}
          </button>

        </div>

        {/* Quick suggestions */}

        <div className="flex gap-2 flex-wrap justify-center mb-6">

          {["robot","astronaut","dragon","car","spaceship","tree"].map((item)=>(
            <button
              key={item}
              onClick={()=>setPrompt(item)}
              className="px-3 py-1 text-sm bg-white/20 text-white rounded hover:bg-white/30"
            >
              {item}
            </button>
          ))}

        </div>

        {/* 3D Viewer */}

        <div className="h-[520px] w-full rounded-xl overflow-hidden bg-black/40 border border-white/10">

          <Playground
            modelUrl={model}
            onLoaded={handleLoaded}
          />

        </div>

      </div>

    </div>

  )
}