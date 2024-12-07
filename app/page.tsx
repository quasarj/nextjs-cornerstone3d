"use client"

import { useEffect, useRef } from "react"
import createImageIdsAndCacheMetaData from "../lib/createImageIdsAndCacheMetaData"
import {
  RenderingEngine,
  Enums,
  type Types,
  volumeLoader,
} from "@cornerstonejs/core"
import { init as csRenderInit } from "@cornerstonejs/core"
import { init as csToolsInit } from "@cornerstonejs/tools"
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader"

/**
 * This function just generates a set of imageIds using wadouri that
 * load a volume from TCIA. The final output looks like:
 * "wadouri:https://services.cancerimagingarchive.net/nbia-api/services/v1/getSingleImage?SeriesInstanceUID=1.3.6.1.4.1.14519.5.2.1.99.1071.85179820664090866578359430774215&SOPInstanceUID=1.3.6.1.4.1.14519.5.2.1.99.1071.17391246882265552538333790368843"
 */
async function genTCIAImageIds() {
  let base_url = 'https://services.cancerimagingarchive.net/nbia-api/services/v1/getSingleImage?';

  // These can be changed to any public study/series on TCIA
  let study = '1.3.6.1.4.1.14519.5.2.1.99.1071.28052166218470275068707230421869';
  let series = '1.3.6.1.4.1.14519.5.2.1.99.1071.85179820664090866578359430774215';

  let results = [];

  let response = await fetch(`https://nbia.cancerimagingarchive.net/studies/${study}/series/${series}`);
  if (response.ok) {
    let resjson = await response.json();
    for (let instance of resjson.studies[0].seriesList[0].instances) {
      let sop = instance.sopInstanceUid;
      let url = `wadouri:${base_url}SeriesInstanceUID=${series}&SOPInstanceUID=${sop}`;
      results.push(url);
    }
  }

  return results;
}


function App() {
  const elementRef = useRef<HTMLDivElement>(null)
  const running = useRef(false)

  useEffect(() => {
    const setup = async () => {
      if (running.current) {
        return
      }
      running.current = true

      await csRenderInit()
      await csToolsInit()
      dicomImageLoaderInit({ maxWebWorkers: 1 })

      const imageIds = await genTCIAImageIds();

      // Instantiate a rendering engine
      const renderingEngineId = "myRenderingEngine"
      const renderingEngine = new RenderingEngine(renderingEngineId)
      const viewportId = "CT"

      const viewportInput = {
        viewportId,
        type: Enums.ViewportType.ORTHOGRAPHIC,
        element: elementRef.current,
        defaultOptions: {
          orientation: Enums.OrientationAxis.SAGITTAL,
        },
      }

      renderingEngine.enableElement(viewportInput)

      // Get the stack viewport that was created
      const viewport = renderingEngine.getViewport(
        viewportId
      ) as Types.IVolumeViewport

      // Define a volume in memory
      const volumeId = "streamingImageVolume"
      const volume = await volumeLoader.createAndCacheVolume(volumeId, {
        imageIds,
      })

      // Set the volume to load
      // @ts-ignore
      volume.load()

      // Set the volume on the viewport and it's default properties
      viewport.setVolumes([{ volumeId }])

      // Render the image
      viewport.render()
    }

    setup()

    // Create a stack viewport
  }, [elementRef, running])

  return (
    <div
      ref={elementRef}
      style={{
        width: "512px",
        height: "512px",
        backgroundColor: "#000",
      }}
    ></div>
  )
}

export default App
