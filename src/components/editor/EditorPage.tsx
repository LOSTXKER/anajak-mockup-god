// src/components/editor/EditorPage.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Line } from 'react-konva'
import { useAppStore } from '@/store'
import { 
  ArrowLeftIcon, 
  PhotoIcon,
  Squares2X2Icon,
  EyeIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  ScaleIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import { Mockup, Project } from '@/types'
import CalibrationModal from './CalibrationModal'
import { useToast } from '@/components/ui/Toast'
import { 
  CalibrationData, 
  cmToPx, 
  pxToCm, 
  generateGridLines, 
  generateRulerMarks,
  formatMeasurement,
  getCanvasSizeInCm,
  PLACEMENT_PRESETS 
} from '@/lib/canvas-utils'
import { PlacementPreset } from '@/types'
import ImageUpload from '@/components/ui/ImageUpload'
import { storageService } from '@/lib/storage'

interface EditorPageProps {
  project: Project
  mockup: Mockup
  onBack: () => void
}

export default function EditorPage({ project, mockup, onBack }: EditorPageProps) {
  const { user, showGrid, setShowGrid, snapToGrid, setSnapToGrid } = useAppStore()
  const { toast } = useToast()
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'image'>('select')
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [zoom, setZoom] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('L')
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false)
  const [showRulers, setShowRulers] = useState(true)
  const [calibration, setCalibration] = useState<CalibrationData>({
    pxPerCm: 0,
    isCalibrated: false
  })
  const [productImage, setProductImage] = useState<HTMLImageElement | null>(null)
  const [currentView, setCurrentView] = useState<'front' | 'back' | 'sleeveL' | 'sleeveR'>('front')
  const [customImageUrl, setCustomImageUrl] = useState<string>('')
  const [showImageUpload, setShowImageUpload] = useState(false)
  
  // Form states for placement properties
  const [placementProps, setPlacementProps] = useState({
    x: '15.5',
    y: '8.0',
    width: '9.0',
    height: '9.0',
    opacity: '100',
    mode: 'fixed'
  })
  
  const stageRef = useRef<any>(null)

  // Sample product data with view sets and size charts
  const sampleProducts = [
    { 
      id: '1', 
      name: 'เสื้อยืดคอกลม', 
      code: 'PO100',
      baseSize: 'L',
      sizeChart: {
        id: 'sc1',
        name: 'Standard T-Shirt',
        sizes: [
          { size: 'S', chestCm: 40 },
          { size: 'M', chestCm: 42 },
          { size: 'L', chestCm: 44 },
          { size: 'XL', chestCm: 46 },
          { size: 'XXL', chestCm: 48 }
        ]
      },
      viewSets: [
        {
          id: 'vs1',
          name: 'Basic T-Shirt Views',
          views: [
            { view: 'front', image_path: 'https://your-image-url.com/tshirt-front.jpg', px_per_cm: 28.35, baseSize: 'L' },
            { view: 'back', image_path: '/sample-images/placeholder.svg', px_per_cm: 28.35, baseSize: 'L' }
          ]
        }
      ]
    },
    { 
      id: '2', 
      name: 'เสื้อโปโล', 
      code: 'PO200',
      baseSize: 'L',
      sizeChart: {
        id: 'sc2',
        name: 'Polo Shirt',
        sizes: [
          { size: 'S', chestCm: 42 },
          { size: 'M', chestCm: 44 },
          { size: 'L', chestCm: 46 },
          { size: 'XL', chestCm: 48 },
          { size: 'XXL', chestCm: 50 }
        ]
      },
      viewSets: [
        {
          id: 'vs2',
          name: 'Polo Shirt Views',
          views: [
            { view: 'front', image_path: '/sample-images/placeholder.svg', px_per_cm: 30.0, baseSize: 'L' },
            { view: 'back', image_path: '/sample-images/placeholder.svg', px_per_cm: 30.0, baseSize: 'L' }
          ]
        }
      ]
    }
  ]

  const sampleVariants = [
    { id: '1', name: 'สีดำ', color: '#000000' },
    { id: '2', name: 'สีขาว', color: '#FFFFFF' },
    { id: '3', name: 'สีกรม', color: '#1e3a8a' }
  ]

  const tools = [
    { id: 'select', name: 'Select', icon: '↖' },
    { id: 'text', name: 'Text', icon: 'T' },
    { id: 'image', name: 'Image', icon: '🖼' }
  ]

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1))

  // Load product image based on selected product and view
  const loadProductImage = (productId: string, view: string) => {
    // Check if custom image URL is provided
    if (customImageUrl) {
      loadImageFromUrl(customImageUrl)
      return
    }

    const product = sampleProducts.find(p => p.id === productId)
    if (!product?.viewSets?.[0]?.views) return

    const viewData = product.viewSets[0].views.find(v => v.view === view)
    if (!viewData?.image_path) return

    loadImageFromUrl(viewData.image_path, viewData.px_per_cm)
  }

  // Load image from URL
  const loadImageFromUrl = (imageUrl: string, px_per_cm?: number) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setProductImage(img)
      
      // Auto-set calibration if available
      if (px_per_cm && !calibration.isCalibrated) {
        setCalibration({
          pxPerCm: px_per_cm,
          isCalibrated: true,
          calibratedAt: new Date(),
          productId: selectedProduct,
          viewId: currentView
        })
        toast.success('Auto Calibration', `ใช้ข้อมูล calibration: ${px_per_cm.toFixed(2)} px/cm`)
      }
      toast.success('โหลดรูปสำเร็จ', 'รูปเสื้อถูกโหลดลง Canvas แล้ว')
    }
    img.onerror = () => {
      console.warn(`Could not load image: ${imageUrl}`)
      toast.error('ไม่สามารถโหลดรูปได้', 'กรุณาตรวจสอบ URL หรือเลือกรูปใหม่')
      setProductImage(null)
    }
    img.src = imageUrl
  }

  // Handle custom image URL
  const handleCustomImage = () => {
    if (customImageUrl.trim()) {
      loadImageFromUrl(customImageUrl.trim())
    }
  }

  // Handle product selection change
  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId)
    if (productId) {
      loadProductImage(productId, currentView)
    } else {
      setProductImage(null)
    }
  }

  // Handle view change
  const handleViewChange = (view: 'front' | 'back' | 'sleeveL' | 'sleeveR') => {
    setCurrentView(view)
    if (selectedProduct) {
      loadProductImage(selectedProduct, view)
    }
  }

  // Handle size change - calculate scale factor based on chest measurements
  const handleSizeChange = (newSize: string) => {
    setSelectedSize(newSize)
    
    const product = sampleProducts.find(p => p.id === selectedProduct)
    if (!product?.sizeChart) return

    const baseSize = product.sizeChart.sizes.find(s => s.size === product.baseSize)
    const targetSize = product.sizeChart.sizes.find(s => s.size === newSize)
    
    if (baseSize && targetSize) {
      const scaleFactor = targetSize.chestCm / baseSize.chestCm
      toast.info('ปรับขนาดตามสัดส่วน', `${product.baseSize} → ${newSize} (×${scaleFactor.toFixed(2)})`)
      
      // ใน production จะปรับ canvas size และ placement proportionally
      console.log(`Scale factor: ${scaleFactor} (${baseSize.chestCm}cm → ${targetSize.chestCm}cm)`)
    }
  }

  // Handle calibration completion
  const handleCalibrationComplete = (pxPerCm: number) => {
    setCalibration({
      pxPerCm,
      isCalibrated: true,
      calibratedAt: new Date(),
      productId: selectedProduct,
      viewId: 'front' // Default view
    })
    toast.success('Calibration Complete', `อัตราส่วน: ${pxPerCm.toFixed(2)} px/cm`)
  }

  // Handle placement property changes
  const handlePlacementChange = (field: string, value: string) => {
    setPlacementProps(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle image upload
  const handleImageUpload = async (url: string) => {
    setCustomImageUrl(url)
    setShowImageUpload(false)
    toast.success('อัปโหลดสำเร็จ', 'รูปภาพถูกอัปโหลดและโหลดใน Canvas แล้ว')
    
    // Load the uploaded image as product image
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setProductImage(img)
    }
    img.onerror = () => {
      toast.error('โหลดรูปภาพไม่ได้', 'กรุณาตรวจสอบ URL รูปภาพ')
    }
    img.src = url
  }

  const handleImageUploadError = (error: string) => {
    toast.error('เกิดข้อผิดพลาด', error)
  }

  // Apply preset placement
  const applyPreset = (preset: PlacementPreset) => {
    setPlacementProps({
      x: preset.x_cm.toString(),
      y: preset.y_cm.toString(),
      width: preset.w_cm.toString(),
      height: preset.h_cm.toString(),
      opacity: '100',
      mode: preset.mode
    })
  }

  // Get canvas dimensions in cm
  const canvasSizeInCm = calibration.isCalibrated 
    ? getCanvasSizeInCm(canvasSize, calibration.pxPerCm)
    : { width: 0, height: 0 }

  // Generate grid lines if calibrated
  const gridLines = calibration.isCalibrated && showGrid 
    ? generateGridLines(canvasSize, 1, calibration.pxPerCm) // 1cm grid
    : { vertical: [], horizontal: [] }

  // Generate ruler marks
  const rulerMarks = calibration.isCalibrated 
    ? {
        horizontal: generateRulerMarks(canvasSize.width, calibration.pxPerCm),
        vertical: generateRulerMarks(canvasSize.height, calibration.pxPerCm)
      }
    : { horizontal: { major: [], minor: [] }, vertical: { major: [], minor: [] } }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 mr-3"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Editor: {mockup.name}</h2>
              <p className="text-sm text-gray-700">Project: {project.code}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Calibration Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                calibration.isCalibrated ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-gray-600">
                {calibration.isCalibrated 
                  ? `${calibration.pxPerCm.toFixed(2)} px/cm` 
                  : 'Not Calibrated'
                }
              </span>
              <button
                onClick={() => setIsCalibrationModalOpen(true)}
                className={`btn btn-xs ${calibration.isCalibrated ? 'btn-secondary' : 'btn-warning'}`}
              >
                <ScaleIcon className="h-3 w-3 mr-1" />
                {calibration.isCalibrated ? 'Re-calibrate' : 'Calibrate'}
              </button>
            </div>
            
            <div className="h-4 w-px bg-gray-300" />
            
            <button className="btn btn-secondary btn-sm">
              <EyeIcon className="h-4 w-4 mr-1" />
              Generate Proof
            </button>
            <button className="btn btn-secondary btn-sm">
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Export
            </button>
            <button className="btn btn-primary btn-sm">
              <CloudArrowUpIcon className="h-4 w-4 mr-1" />
              Handoff to ERP
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Tools & Product Selection */}
        <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Product Selection */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Product</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เสื้อ</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={selectedProduct}
                    onChange={(e) => handleProductChange(e.target.value)}
                  >
                    <option value="">เลือกผลิตภัณฑ์</option>
                    {sampleProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.code})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สี</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                  >
                    <option value="">เลือกสี</option>
                    {sampleVariants.map(variant => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ไซส์</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={selectedSize}
                    onChange={(e) => handleSizeChange(e.target.value)}
                    disabled={!selectedProduct}
                  >
                    {selectedProduct && sampleProducts.find(p => p.id === selectedProduct)?.sizeChart?.sizes.map(size => (
                      <option key={size.size} value={size.size}>
                        {size.size} (รอบอก {size.chestCm} cm)
                      </option>
                    ))}
                  </select>
                  {selectedProduct && (
                    <p className="text-xs text-gray-700 mt-1">
                      Base Size: {sampleProducts.find(p => p.id === selectedProduct)?.baseSize} 
                      ({sampleProducts.find(p => p.id === selectedProduct)?.sizeChart?.sizes.find(s => s.size === sampleProducts.find(p => p.id === selectedProduct)?.baseSize)?.chestCm} cm)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">มุมมอง</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'front', label: 'ด้านหน้า' },
                      { value: 'back', label: 'ด้านหลัง' },
                      { value: 'sleeveL', label: 'แขนซ้าย' },
                      { value: 'sleeveR', label: 'แขนขวา' }
                    ].map(view => (
                      <button
                        key={view.value}
                        onClick={() => handleViewChange(view.value as any)}
                        className={`px-3 py-2 text-xs border rounded transition-colors ${
                          currentView === view.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        disabled={!selectedProduct}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Upload Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">รูปภาพสินค้า</label>
                    <button
                      onClick={() => setShowImageUpload(!showImageUpload)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {showImageUpload ? 'ปิด Upload' : 'อัปโหลดรูป'}
                    </button>
                  </div>
                  
                  {showImageUpload && (
                    <div className="mb-3">
                      <ImageUpload
                        onUploadComplete={handleImageUpload}
                        onUploadError={handleImageUploadError}
                        bucket="assets"
                        folder="editor/products"
                        accept="image/*"
                        maxSize={5}
                      />
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-700 mb-1">หรือใส่ URL โดยตรง:</div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => loadImageFromUrl(customImageUrl)}
                      disabled={!customImageUrl}
                      className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                    >
                      โหลด
                    </button>
                  </div>
                </div>

              </div>
            </div>

            <hr />

            {/* Tools */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Tools</h3>
              <div className="grid grid-cols-3 gap-2">
                {tools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id as any)}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      selectedTool === tool.id
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{tool.icon}</div>
                    <div className="text-xs">{tool.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <hr />

            {/* Canvas Settings */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Canvas</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Show Grid</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Snap to Grid</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={snapToGrid}
                      onChange={(e) => setSnapToGrid(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <hr />

            {/* Layers */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Layers</h3>
              <div className="space-y-2">
                <div className="p-2 border-2 border-brand-500 bg-brand-50 rounded-md cursor-pointer">
                  <p className="text-sm font-medium text-brand-700">Logo SCG.png</p>
                  <p className="text-xs text-brand-600">9x9 cm</p>
                </div>
                <div className="p-2 border border-gray-200 rounded-md cursor-pointer hover:border-gray-300">
                  <p className="text-sm font-medium text-gray-700">Text: "Marathon 2025"</p>
                  <p className="text-xs text-gray-700">14pt Sarabun</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel: Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas Controls */}
          <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Zoom: {Math.round(zoom * 100)}%</span>
              <div className="flex space-x-1">
                <button
                  onClick={handleZoomOut}
                  className="px-2 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50"
                >
                  -
                </button>
                <button
                  onClick={handleZoomIn}
                  className="px-2 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              
              {/* Canvas dimensions */}
              {calibration.isCalibrated && (
                <div className="text-sm text-gray-600">
                  Canvas: {formatMeasurement(canvasSizeInCm.width, 'cm')} × {formatMeasurement(canvasSizeInCm.height, 'cm')}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Rulers toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Rulers</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={showRulers}
                    onChange={(e) => setShowRulers(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <button className="p-1 rounded hover:bg-gray-200">
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600">Units: cm</span>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto">
            <div className="bg-white shadow-lg rounded-lg" style={{ transform: `scale(${zoom})` }}>
              <Stage
                ref={stageRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="border border-gray-300"
              >
                <Layer>
                  {/* Background */}
                  <Rect
                    width={canvasSize.width}
                    height={canvasSize.height}
                    fill="white"
                  />
                  
                  {/* Product Image */}
                  {productImage && (
                    <KonvaImage
                      image={productImage}
                      width={canvasSize.width}
                      height={canvasSize.height}
                      listening={false}
                    />
                  )}
                  
                  {/* Rulers */}
                  {showRulers && calibration.isCalibrated && (
                    <>
                      {/* Horizontal ruler */}
                      <Rect
                        x={0}
                        y={0}
                        width={canvasSize.width}
                        height={20}
                        fill="#f9fafb"
                        stroke="#e5e7eb"
                        strokeWidth={1}
                      />
                      
                      {/* Horizontal ruler marks */}
                      {rulerMarks.horizontal.major.map((pos, i) => (
                        <g key={`h-major-${i}`}>
                          <Line
                            points={[pos, 0, pos, 15]}
                            stroke="#6b7280"
                            strokeWidth={1}
                          />
                          <Text
                            x={pos + 2}
                            y={12}
                            text={`${Math.round(pxToCm(pos, calibration.pxPerCm))}`}
                            fontSize={10}
                            fill="#374151"
                          />
                        </g>
                      ))}
                      
                      {rulerMarks.horizontal.minor.map((pos, i) => (
                        <Line
                          key={`h-minor-${i}`}
                          points={[pos, 0, pos, 10]}
                          stroke="#9ca3af"
                          strokeWidth={1}
                        />
                      ))}
                      
                      {/* Vertical ruler */}
                      <Rect
                        x={0}
                        y={0}
                        width={20}
                        height={canvasSize.height}
                        fill="#f9fafb"
                        stroke="#e5e7eb"
                        strokeWidth={1}
                      />
                      
                      {/* Vertical ruler marks */}
                      {rulerMarks.vertical.major.map((pos, i) => (
                        <g key={`v-major-${i}`}>
                          <Line
                            points={[0, pos, 15, pos]}
                            stroke="#6b7280"
                            strokeWidth={1}
                          />
                          <Text
                            x={2}
                            y={pos - 2}
                            text={`${Math.round(pxToCm(pos, calibration.pxPerCm))}`}
                            fontSize={10}
                            fill="#374151"
                            rotation={-90}
                          />
                        </g>
                      ))}
                      
                      {rulerMarks.vertical.minor.map((pos, i) => (
                        <Line
                          key={`v-minor-${i}`}
                          points={[0, pos, 10, pos]}
                          stroke="#9ca3af"
                          strokeWidth={1}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* Grid (1cm intervals) */}
                  {showGrid && calibration.isCalibrated && (
                    <>
                      {gridLines.vertical.map((x, i) => (
                        <Line
                          key={`grid-v-${i}`}
                          points={[x, 0, x, canvasSize.height]}
                          stroke="#f3f4f6"
                          strokeWidth={1}
                          dash={[2, 2]}
                        />
                      ))}
                      {gridLines.horizontal.map((y, i) => (
                        <Line
                          key={`grid-h-${i}`}
                          points={[0, y, canvasSize.width, y]}
                          stroke="#f3f4f6"
                          strokeWidth={1}
                          dash={[2, 2]}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* Sample T-shirt outline */}
                  <Rect
                    x={canvasSize.width / 2 - 150}
                    y={50}
                    width={300}
                    height={400}
                    fill="transparent"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dash={[10, 5]}
                  />
                  
                  {/* Sample placement area */}
                  <Rect
                    x={canvasSize.width / 2 - 75}
                    y={150}
                    width={150}
                    height={150}
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dash={[5, 5]}
                  />
                  
                  {/* Sample text */}
                  <Text
                    x={canvasSize.width / 2}
                    y={220}
                    text="Artwork Here"
                    fontSize={16}
                    fill="#3b82f6"
                    align="center"
                    offsetX={50}
                  />
                </Layer>
              </Stage>
            </div>
          </div>
        </div>

        {/* Right Panel: Properties */}
        <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
          <div className="p-4 space-y-6">
            <h3 className="font-semibold text-gray-900">Placement Properties</h3>
            
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">Logo SCG.png</p>
              
              {/* Position */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">X (cm)</label>
                  <input
                    type="number"
                    value={placementProps.x}
                    onChange={(e) => handlePlacementChange('x', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Y (cm)</label>
                  <input
                    type="number"
                    value={placementProps.y}
                    onChange={(e) => handlePlacementChange('y', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Size */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">W (cm)</label>
                  <input
                    type="number"
                    value={placementProps.width}
                    onChange={(e) => handlePlacementChange('width', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">H (cm)</label>
                  <input
                    type="number"
                    value={placementProps.height}
                    onChange={(e) => handlePlacementChange('height', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Mode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={placementProps.mode}
                  onChange={(e) => handlePlacementChange('mode', e.target.value)}
                >
                  <option value="fixed">Fixed Size</option>
                  <option value="proportional">Proportional</option>
                </select>
              </div>

              {/* Opacity */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={placementProps.opacity}
                  onChange={(e) => handlePlacementChange('opacity', e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-700">
                  <span>0%</span>
                  <span>{placementProps.opacity}%</span>
                </div>
              </div>
            </div>

            <hr />

            {/* Presets */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Placement Presets</h3>
              <div className="space-y-2">
                {PLACEMENT_PRESETS.map((preset, index) => (
                  <button 
                    key={index}
                    className="w-full text-left px-3 py-2 border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 text-sm transition-colors"
                    onClick={() => applyPreset(preset)}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-gray-700">
                      {preset.w_cm}×{preset.h_cm} cm • {preset.mode}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calibration Modal */}
      <CalibrationModal
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
        onCalibrationComplete={handleCalibrationComplete}
      />
    </div>
  )
}