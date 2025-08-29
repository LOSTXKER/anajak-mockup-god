// src/lib/canvas-utils.ts

/**
 * Canvas Utility Functions for Anajak Mockup System
 * Handles conversion between pixels and centimeters based on calibration
 */

export interface CalibrationData {
  pxPerCm: number
  isCalibrated: boolean
  calibratedAt?: Date
  productId?: string
  viewId?: string
}

export interface CanvasPoint {
  x: number
  y: number
}

export interface CanvasDimensions {
  width: number
  height: number
}

export interface PlacementData {
  id: string
  x_cm: number
  y_cm: number
  width_cm: number
  height_cm: number
  rotation?: number
  opacity?: number
  mode: 'fixed' | 'proportional'
}

/**
 * Convert centimeters to pixels using calibration ratio
 */
export function cmToPx(cm: number, pxPerCm: number): number {
  return cm * pxPerCm
}

/**
 * Convert pixels to centimeters using calibration ratio
 */
export function pxToCm(px: number, pxPerCm: number): number {
  return px / pxPerCm
}

/**
 * Convert placement data from cm to px for canvas rendering
 */
export function placementCmToPx(placement: PlacementData, pxPerCm: number) {
  return {
    ...placement,
    x: cmToPx(placement.x_cm, pxPerCm),
    y: cmToPx(placement.y_cm, pxPerCm),
    width: cmToPx(placement.width_cm, pxPerCm),
    height: cmToPx(placement.height_cm, pxPerCm)
  }
}

/**
 * Convert placement data from px to cm for storage
 */
export function placementPxToCm(
  placement: { x: number; y: number; width: number; height: number },
  pxPerCm: number,
  placementId: string,
  mode: 'fixed' | 'proportional' = 'fixed'
): PlacementData {
  return {
    id: placementId,
    x_cm: pxToCm(placement.x, pxPerCm),
    y_cm: pxToCm(placement.y, pxPerCm),
    width_cm: pxToCm(placement.width, pxPerCm),
    height_cm: pxToCm(placement.height, pxPerCm),
    mode
  }
}

/**
 * Calculate distance between two points in pixels
 */
export function calculateDistance(point1: CanvasPoint, point2: CanvasPoint): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  )
}

/**
 * Snap position to grid (in pixels)
 */
export function snapToGrid(position: number, gridSize: number, snapEnabled: boolean): number {
  if (!snapEnabled) return position
  return Math.round(position / gridSize) * gridSize
}

/**
 * Snap point to grid
 */
export function snapPointToGrid(
  point: CanvasPoint, 
  gridSize: number, 
  snapEnabled: boolean
): CanvasPoint {
  return {
    x: snapToGrid(point.x, gridSize, snapEnabled),
    y: snapToGrid(point.y, gridSize, snapEnabled)
  }
}

/**
 * Generate grid lines for canvas in pixels
 */
export function generateGridLines(
  canvasSize: CanvasDimensions,
  gridSizeCm: number,
  pxPerCm: number
): { vertical: number[]; horizontal: number[] } {
  const gridSizePx = cmToPx(gridSizeCm, pxPerCm)
  
  const vertical = []
  const horizontal = []
  
  // Vertical lines
  for (let x = 0; x <= canvasSize.width; x += gridSizePx) {
    vertical.push(x)
  }
  
  // Horizontal lines
  for (let y = 0; y <= canvasSize.height; y += gridSizePx) {
    horizontal.push(y)
  }
  
  return { vertical, horizontal }
}

/**
 * Generate ruler marks for canvas
 */
export function generateRulerMarks(
  length: number,
  pxPerCm: number,
  majorInterval: number = 1, // cm
  minorInterval: number = 0.5 // cm
): { major: number[]; minor: number[] } {
  const major = []
  const minor = []
  
  // Major marks (every cm)
  for (let i = 0; i <= length / pxPerCm; i += majorInterval) {
    major.push(cmToPx(i, pxPerCm))
  }
  
  // Minor marks (every 0.5 cm)
  for (let i = 0; i <= length / pxPerCm; i += minorInterval) {
    const pos = cmToPx(i, pxPerCm)
    if (!major.includes(pos)) {
      minor.push(pos)
    }
  }
  
  return { major, minor }
}

/**
 * Calculate proportional scaling for placement
 * Based on target size vs base size chest width ratio
 */
export function calculateProportionalScale(
  baseSizeChestWidth: number, // cm
  targetSizeChestWidth: number // cm
): number {
  return targetSizeChestWidth / baseSizeChestWidth
}

/**
 * Apply proportional scaling to placement
 */
export function scaleProportionalPlacement(
  placement: PlacementData,
  scaleFactor: number
): PlacementData {
  if (placement.mode !== 'proportional') {
    return placement
  }
  
  return {
    ...placement,
    width_cm: placement.width_cm * scaleFactor,
    height_cm: placement.height_cm * scaleFactor
  }
}

/**
 * Default placement presets (in cm)
 */
export const PLACEMENT_PRESETS = [
  {
    name: 'Left Chest',
    view: 'front' as const,
    x_cm: 3.0,
    y_cm: 7.5,
    w_cm: 9.0,
    h_cm: 7.5,
    mode: 'fixed' as const
  },
  {
    name: 'Center Chest (A4)',
    view: 'front' as const,
    x_cm: 10.5,
    y_cm: 15.0,
    w_cm: 21.0,
    h_cm: 29.7,
    mode: 'fixed' as const
  },
  {
    name: 'Back Center (A3)',
    view: 'back' as const,
    x_cm: 8.0,
    y_cm: 12.0,
    w_cm: 29.7,
    h_cm: 42.0,
    mode: 'fixed' as const
  },
  {
    name: 'Sleeve Logo',
    view: 'sleeveL' as const,
    x_cm: 2.0,
    y_cm: 6.0,
    w_cm: 8.0,
    h_cm: 8.0,
    mode: 'fixed' as const
  }
] as const

/**
 * Validate calibration data
 */
export function isValidCalibration(calibration: CalibrationData): boolean {
  return calibration.isCalibrated && calibration.pxPerCm > 0
}

/**
 * Format measurement for display
 */
export function formatMeasurement(value: number, unit: 'px' | 'cm', decimals: number = 1): string {
  return `${value.toFixed(decimals)} ${unit}`
}

/**
 * Calculate canvas size in cm based on pixel dimensions
 */
export function getCanvasSizeInCm(
  canvasSize: CanvasDimensions,
  pxPerCm: number
): CanvasDimensions {
  return {
    width: pxToCm(canvasSize.width, pxPerCm),
    height: pxToCm(canvasSize.height, pxPerCm)
  }
}