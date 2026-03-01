import express from "express"
import cors from "cors"
import "dotenv/config"

const app = express()

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ai-3d-playground.vercel.app"
  ]
}))
app.use(express.json())

const SKETCHFAB_TOKEN = process.env.SKETCHFAB_TOKEN

const cache = new Map()

/* ---------- debug helper ---------- */

function log(step, data = {}) {
  console.log(`[DEBUG] ${step}`, data)
}

app.post("/generate-model", async (req,res)=>{

  const requestId = Date.now()

  try{

    log("REQUEST_RECEIVED", { id: requestId })

    const { prompt } = req.body

    if(!prompt){
      log("PROMPT_MISSING", { id: requestId })
      return res.json({ success:false, message:"Prompt missing"})
    }

    const query = prompt.toLowerCase().trim()

    log("QUERY_PARSED", {
      id: requestId,
      query
    })

    /* ---------- cache check ---------- */

    if(cache.has(query)){
      log("CACHE_HIT", {
        id: requestId,
        query,
        cacheSize: cache.size
      })

      return res.json(cache.get(query))
    }

    log("CACHE_MISS", { id: requestId })

    /* ---------- search API ---------- */

    const searchStart = Date.now()

    const searchRes = await fetch(
      `https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(query)}&downloadable=true&sort_by=-likeCount`,
      {
        headers:{
          Authorization:`Token ${SKETCHFAB_TOKEN}`
        }
      }
    )

    const searchTime = Date.now() - searchStart

    log("SEARCH_API_RESPONSE", {
      id: requestId,
      status: searchRes.status,
      timeMs: searchTime
    })

    const searchData = await searchRes.json()

    const resultsCount = searchData?.results?.length || 0

    log("SEARCH_RESULTS", {
      id: requestId,
      resultsCount
    })

    if(!resultsCount){
      log("NO_MODELS_FOUND", { id: requestId })
      return res.json({
        success:false,
        message:"No model found"
      })
    }

    const model = searchData.results[0]

    log("MODEL_SELECTED", {
      id: requestId,
      name: model.name,
      uid: model.uid
    })

    /* ---------- download API ---------- */

    const downloadStart = Date.now()

    const downloadRes = await fetch(
      `https://api.sketchfab.com/v3/models/${model.uid}/download`,
      {
        headers:{
          Authorization:`Token ${SKETCHFAB_TOKEN}`
        }
      }
    )

    const downloadTime = Date.now() - downloadStart

    log("DOWNLOAD_API_RESPONSE", {
      id: requestId,
      status: downloadRes.status,
      timeMs: downloadTime
    })

    const downloadData = await downloadRes.json()

    log("DOWNLOAD_FORMATS", {
      id: requestId,
      hasGLB: !!downloadData.glb,
      hasGLTF: !!downloadData.gltf
    })

    let modelURL = null

    if(downloadData.glb?.url){

      log("GLB_FOUND", {
        id: requestId,
        sizeBytes: downloadData.glb.size
      })

      if(downloadData.glb.size > 30000000){
        log("MODEL_TOO_LARGE", {
          id: requestId,
          size: downloadData.glb.size
        })

        return res.json({
          success:false,
          message:"Model too large"
        })
      }

      modelURL = downloadData.glb.url
    }

    else if(downloadData.gltf?.url){

      log("GLTF_USED", { id: requestId })

      modelURL = downloadData.gltf.url
    }

    if(!modelURL){

      log("NO_SUPPORTED_FORMAT", { id: requestId })

      return res.json({
        success:false,
        message:"Unsupported model format"
      })
    }

    const response = {
      success:true,
      url:modelURL,
      name:model.name,
      preview:model.thumbnails?.images?.[0]?.url
    }

    cache.set(query,response)

    log("CACHE_STORE", {
      id: requestId,
      query,
      cacheSize: cache.size
    })

    log("REQUEST_SUCCESS", { id: requestId })

    res.json(response)

  }catch(err){

    log("SERVER_ERROR", {
      id: requestId,
      error: err.message
    })

    res.json({
      success:false,
      message:"Server error"
    })

  }

})

const PORT = process.env.PORT || 5001

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})