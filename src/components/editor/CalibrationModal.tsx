// src/components/editor/CalibrationModal.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Line, Text as KonvaText, Circle } from 'react-konva'
import { XMarkIcon, ScaleIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'

interface CalibrationModalProps {
  isOpen: boolean
  onClose: () => void
  onCalibrationComplete: (pxPerCm: number) => void
  productImageUrl?: string
}

interface MeasurementPoint {
  x: number
  y: number
}

export default function CalibrationModal({ 
  isOpen, 
  onClose, 
  onCalibrationComplete,
  productImageUrl 
}: CalibrationModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<'instruction' | 'measuring' | 'input' | 'result'>('instruction')
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([])
  const [pxMeasured, setPxMeasured] = useState<number>(0)
  const [cmReal, setCmReal] = useState<string>('')
  const [pxPerCm, setPxPerCm] = useState<number>(0)
  const stageRef = useRef<any>(null)
  
  const canvasSize = { width: 500, height: 600 }

  useEffect(() => {
    if (measurementPoints.length === 2) {
      const distance = Math.sqrt(
        Math.pow(measurementPoints[1].x - measurementPoints[0].x, 2) +
        Math.pow(measurementPoints[1].y - measurementPoints[0].y, 2)
      )
      setPxMeasured(distance)
      setStep('input')
    }
  }, [measurementPoints])

  const handleStageClick = (e: any) => {
    if (step !== 'measuring') return

    const pos = e.target.getStage().getPointerPosition()
    
    if (measurementPoints.length < 2) {
      setMeasurementPoints(prev => [...prev, { x: pos.x, y: pos.y }])
    }
  }

  const handleCmRealChange = (value: string) => {
    setCmReal(value)
    const cmValue = parseFloat(value)
    if (cmValue > 0 && pxMeasured > 0) {
      const ratio = pxMeasured / cmValue
      setPxPerCm(ratio)
    }
  }

  const handleComplete = () => {
    if (pxPerCm <= 0) {
      toast.error('ข้อผิดพลาด', 'กรุณาทำการ calibration ให้ถูกต้อง')
      return
    }
    
    onCalibrationComplete(pxPerCm)
    toast.success('Calibration สำเร็จ', `อัตราส่วน: ${pxPerCm.toFixed(2)} px/cm`)
    onClose()
    resetCalibration()
  }

  const resetCalibration = () => {
    setStep('instruction')
    setMeasurementPoints([])
    setPxMeasured(0)
    setCmReal('')
    setPxPerCm(0)
  }

  const handleStartMeasuring = () => {
    setStep('measuring')
    setMeasurementPoints([])
  }

  const handleReset = () => {
    resetCalibration()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300" onClick={onClose} />

        {/* Modal */}
        <div className="relative inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all duration-300 animate-scaleIn sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <ScaleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Canvas Calibration
                </h3>
                <p className="text-sm text-gray-500">
                  ปรับแต่งขนาดให้แม่นยำในหน่วยเซนติเมตร
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-6">
            {/* Left: Canvas */}
            <div className="flex-1">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Canvas Preview</h4>
                <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                  <Stage
                    ref={stageRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onClick={handleStageClick}
                    className="cursor-crosshair"
                  >
                    <Layer>
                      {/* Background */}
                      <Rect
                        width={canvasSize.width}
                        height={canvasSize.height}
                        fill="white"
                      />
                      
                      {/* Sample T-shirt outline */}
                      <Rect
                        x={canvasSize.width / 2 - 120}
                        y={80}
                        width={240}
                        height={320}
                        fill="transparent"
                        stroke="#6b7280"
                        strokeWidth={2}
                        dash={[10, 5]}
                      />
                      
                      {/* Sample neckline */}
                      <Rect
                        x={canvasSize.width / 2 - 40}
                        y={80}
                        width={80}
                        height={30}
                        fill="transparent"
                        stroke="#6b7280"
                        strokeWidth={2}
                        dash={[5, 3]}
                      />

                      {/* Chest width reference line */}
                      {step === 'instruction' && (
                        <>
                          <Line
                            points={[
                              canvasSize.width / 2 - 120, 200,
                              canvasSize.width / 2 + 120, 200
                            ]}
                            stroke="#ef4444"
                            strokeWidth={3}
                            dash={[10, 5]}
                          />
                          <KonvaText
                            x={canvasSize.width / 2 - 50}
                            y={210}
                            text="วัดจุดนี้"
                            fontSize={14}
                            fill="#ef4444"
                            fontStyle="bold"
                          />
                        </>
                      )}
                      
                      {/* Measurement points and line */}
                      {measurementPoints.map((point, index) => (
                        <Circle
                          key={index}
                          x={point.x}
                          y={point.y}
                          radius={6}
                          fill="#3b82f6"
                          stroke="#1d4ed8"
                          strokeWidth={2}
                        />
                      ))}
                      
                      {measurementPoints.length === 2 && (
                        <>
                          <Line
                            points={[
                              measurementPoints[0].x,
                              measurementPoints[0].y,
                              measurementPoints[1].x,
                              measurementPoints[1].y
                            ]}
                            stroke="#3b82f6"
                            strokeWidth={3}
                          />
                          <KonvaText
                            x={(measurementPoints[0].x + measurementPoints[1].x) / 2 - 25}
                            y={(measurementPoints[0].y + measurementPoints[1].y) / 2 - 30}
                            text={`${pxMeasured.toFixed(0)} px`}
                            fontSize={12}
                            fill="#1d4ed8"
                            fontStyle="bold"
                          />
                        </>
                      )}
                    </Layer>
                  </Stage>
                </div>
              </div>
            </div>

            {/* Right: Instructions & Controls */}
            <div className="w-80">
              <div className="space-y-6">
                
                {/* Step Indicator */}
                <div className="flex items-center space-x-2">
                  {['instruction', 'measuring', 'input', 'result'].map((stepName, index) => (
                    <div key={stepName} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step === stepName
                          ? 'bg-blue-600 text-white'
                          : ['instruction', 'measuring', 'input'].indexOf(step) > index
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {['instruction', 'measuring', 'input'].indexOf(step) > index ? (
                          <CheckIcon className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {index < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
                    </div>
                  ))}
                </div>

                {/* Instructions */}
                {step === 'instruction' && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">วิธีการ Calibration</h4>
                    <ol className="text-sm text-blue-800 space-y-2">
                      <li>1. คลิก "เริ่มวัด" เพื่อเริ่มต้น</li>
                      <li>2. คลิกจุดที่ขอบซ้ายของเสื้อ</li>
                      <li>3. คลิกจุดที่ขอบขวาของเสื้อ</li>
                      <li>4. กรอกขนาดจริงเป็นเซนติเมตร</li>
                      <li>5. ระบบจะคำนวณอัตราส่วนอัตโนมัติ</li>
                    </ol>
                    <button
                      onClick={handleStartMeasuring}
                      className="mt-4 w-full btn btn-primary"
                    >
                      <ScaleIcon className="w-4 h-4 mr-2" />
                      เริ่มวัด
                    </button>
                  </div>
                )}

                {step === 'measuring' && (
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">กำลังวัด...</h4>
                    <p className="text-sm text-yellow-800 mb-4">
                      คลิกจุดที่ {measurementPoints.length === 0 ? 'ขอบซ้าย' : 'ขอบขวา'} ของเสื้อ
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span>จุดที่วัดแล้ว: {measurementPoints.length}/2</span>
                      <button
                        onClick={handleReset}
                        className="text-yellow-700 hover:text-yellow-900"
                      >
                        เริ่มใหม่
                      </button>
                    </div>
                  </div>
                )}

                {step === 'input' && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-2">กรอกขนาดจริง</h4>
                    <p className="text-sm text-green-800 mb-4">
                      ระยะที่วัดได้: <span className="font-bold">{pxMeasured.toFixed(0)} pixels</span>
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-2">
                          ขนาดจริงเป็นเซนติเมตร
                        </label>
                        <input
                          type="number"
                          value={cmReal}
                          onChange={(e) => handleCmRealChange(e.target.value)}
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="เช่น 42"
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      
                      {pxPerCm > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="text-sm text-green-800">
                            <div>อัตราส่วน: <span className="font-bold">{pxPerCm.toFixed(2)} px/cm</span></div>
                            <div>1 cm = {pxPerCm.toFixed(2)} pixels</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={handleReset}
                          className="flex-1 btn btn-secondary"
                        >
                          เริ่มใหม่
                        </button>
                        <button
                          onClick={handleComplete}
                          disabled={!cmReal || pxPerCm <= 0}
                          className="flex-1 btn btn-primary disabled:opacity-50"
                        >
                          <CheckIcon className="w-4 h-4 mr-2" />
                          ใช้อัตราส่วนนี้
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}