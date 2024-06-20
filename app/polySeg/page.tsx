"use client"
import React, { useEffect, useRef, useState } from "react"
import {
  RenderingEngine,
  Enums,
  setVolumesForViewports,
  volumeLoader,
} from "@cornerstonejs/core"
import {
  initDemo,
  createImageIdsAndCacheMetaData,
} from "../../lib"
import * as cornerstoneTools from "@cornerstonejs/tools"

const {
  SegmentationDisplayTool,
  ToolGroupManager,
  Enums: csToolsEnums,
  segmentation,
  PlanarFreehandContourSegmentationTool,
} = cornerstoneTools

const { MouseBindings, KeyboardBindings } = csToolsEnums
const { ViewportType } = Enums

const volumeName = "CT_VOLUME_ID"
const volumeLoaderScheme = "cornerstoneStreamingImageVolume"
const volumeId = `${volumeLoaderScheme}:${volumeName}`
const segmentationId = "MY_SEGMENTATION_ID"

const toolGroupId1 = "ToolGroup_Contour"
const toolGroupId2 = "ToolGroup_Labelmap"
const viewportId1 = "CT_SAGITTAL_CONTOUR"
const viewportId2 = "CT_SAGITTAL_LABELMAP"

const segmentIndexes = [1, 2, 3, 4, 5]

function ContourSegmentationComponent() {
  const element1Ref = useRef(null)
  const element2Ref = useRef(null)
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(
    segmentIndexes[0]
  )
  const running = useRef(false)

  useEffect(() => {
    const run = async () => {
      if (running.current) return
      running.current = true

      await initDemo()

      cornerstoneTools.addTool(SegmentationDisplayTool)
      cornerstoneTools.addTool(PlanarFreehandContourSegmentationTool)

      const toolGroup1 = ToolGroupManager.createToolGroup(toolGroupId1)
      const toolGroup2 = ToolGroupManager.createToolGroup(toolGroupId2)

      toolGroup1.addTool(PlanarFreehandContourSegmentationTool.toolName)
      toolGroup1.addTool(SegmentationDisplayTool.toolName)
      toolGroup2.addTool(SegmentationDisplayTool.toolName)

      toolGroup1.setToolEnabled(SegmentationDisplayTool.toolName)
      toolGroup2.setToolEnabled(SegmentationDisplayTool.toolName)

      toolGroup1.setToolActive(PlanarFreehandContourSegmentationTool.toolName, {
        bindings: [
          { mouseButton: MouseBindings.Primary },
          {
            mouseButton: MouseBindings.Primary,
            modifierKey: KeyboardBindings.Shift,
          },
        ],
      })

      const imageIds = await createImageIdsAndCacheMetaData({
        StudyInstanceUID:
          "1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463",
        SeriesInstanceUID:
          "1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561",
        wadoRsRoot: "https://d3t6nz73ql33tx.cloudfront.net/dicomweb",
      })

      const volume = await volumeLoader.createAndCacheEmptyVolume(volumeId, {
        imageIds,
      })

      const renderingEngineId = "myRenderingEngine"
      const renderingEngine = new RenderingEngine(renderingEngineId)

      const viewportInputArray = [
        {
          viewportId: viewportId1,
          type: ViewportType.ORTHOGRAPHIC,
          element: element1Ref.current,
          defaultOptions: { orientation: Enums.OrientationAxis.SAGITTAL },
        },
        {
          viewportId: viewportId2,
          type: ViewportType.ORTHOGRAPHIC,
          element: element2Ref.current,
          defaultOptions: { orientation: Enums.OrientationAxis.SAGITTAL },
        },
      ]

      renderingEngine.setViewports(viewportInputArray)

      toolGroup1.addViewport(viewportId1, renderingEngineId)
      toolGroup2.addViewport(viewportId2, renderingEngineId)

      volume.load()

      await setVolumesForViewports(
        renderingEngine,
        [{ volumeId,  }],
        [viewportId1, viewportId2]
      )

      await segmentation.addSegmentations([
        {
          segmentationId,
          representation: {
            type: csToolsEnums.SegmentationRepresentations.Contour,
          },
        },
      ])

      await segmentation.addSegmentationRepresentations(toolGroupId1, [
        {
          segmentationId,
          type: csToolsEnums.SegmentationRepresentations.Contour,
        },
      ])

      renderingEngine.renderViewports([viewportId1, viewportId2])
    }

    run()
  }, [])

  const handleConvertSegmentation = async () => {
    await segmentation.addSegmentationRepresentations(toolGroupId2, [
      {
        segmentationId,
        type: csToolsEnums.SegmentationRepresentations.Labelmap,
        options: {
          polySeg: {
            enabled: true,
          },
        },
      },
    ])
  }

  const handleSegmentIndexChange = (event) => {
    const newIndex = Number(event.target.value)
    setActiveSegmentIndex(newIndex)
    segmentation.segmentIndex.setActiveSegmentIndex(segmentationId, newIndex)
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div ref={element1Ref} style={{ width: "500px", height: "500px" }} />
        <div ref={element2Ref} style={{ width: "500px", height: "500px" }} />
      </div>
      <button onClick={handleConvertSegmentation}>
        Convert contour segmentation to labelmap segmentation
      </button>
      <div>
        <label htmlFor="segmentIndex">Segment Index: </label>
        <select
          id="segmentIndex"
          value={activeSegmentIndex}
          onChange={handleSegmentIndexChange}
        >
          {segmentIndexes.map((index) => (
            <option key={index} value={index}>
              {index}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default ContourSegmentationComponent
