// src/components/editor/PlacementPresetsModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, MapPinIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import { PLACEMENT_PRESETS } from '@/lib/canvas-utils'
import { useToast } from '@/components/ui/Toast'
import { PlacementPreset, CalibrationData } from '@/types'

interface PlacementPresetsModalProps {
  isOpen: boolean
  onClose: () => void
  calibration: CalibrationData
  onApplyPreset: (preset: PlacementPreset) => void
}

interface CustomPreset extends PlacementPreset {
  id: string
  isCustom: true
}

export default function PlacementPresetsModal({
  isOpen,
  onClose,
  calibration,
  onApplyPreset
}: PlacementPresetsModalProps) {
  const { toast } = useToast()
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([])
  const [isCreatingPreset, setIsCreatingPreset] = useState(false)
  const [editingPreset, setEditingPreset] = useState<CustomPreset | null>(null)
  const [presetForm, setPresetForm] = useState<Omit<CustomPreset, 'id' | 'isCustom'>>({
    name: '',
    view: 'front',
    x_cm: 0,
    y_cm: 0,
    w_cm: 10,
    h_cm: 10,
    mode: 'fixed',
    description: ''
  })

  useEffect(() => {
    loadCustomPresets()
  }, [isOpen])

  const loadCustomPresets = () => {
    // In a real app, this would load from database or localStorage
    const saved = localStorage.getItem('placement_presets')
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading custom presets:', error)
      }
    }
  }

  const saveCustomPresets = (presets: CustomPreset[]) => {
    localStorage.setItem('placement_presets', JSON.stringify(presets))
    setCustomPresets(presets)
  }

  const handleCreatePreset = () => {
    setIsCreatingPreset(true)
    setEditingPreset(null)
    setPresetForm({
      name: '',
      view: 'front',
      x_cm: 0,
      y_cm: 0,
      w_cm: 10,
      h_cm: 10,
      mode: 'fixed',
      description: ''
    })
  }

  const handleEditPreset = (preset: CustomPreset) => {
    setEditingPreset(preset)
    setIsCreatingPreset(true)
    setPresetForm({
      name: preset.name,
      view: preset.view,
      x_cm: preset.x_cm,
      y_cm: preset.y_cm,
      w_cm: preset.w_cm,
      h_cm: preset.h_cm,
      mode: preset.mode,
      description: preset.description || ''
    })
  }

  const handleSavePreset = () => {
    if (!presetForm.name.trim()) {
      toast.error('ข้อผิดพลาด', 'กรุณากรอกชื่อ Preset')
      return
    }

    const newPreset: CustomPreset = {
      ...presetForm,
      id: editingPreset?.id || Date.now().toString(),
      name: presetForm.name.trim(),
      isCustom: true
    }

    let updatedPresets
    if (editingPreset) {
      updatedPresets = customPresets.map(p => p.id === editingPreset.id ? newPreset : p)
    } else {
      updatedPresets = [...customPresets, newPreset]
    }

    saveCustomPresets(updatedPresets)
    setIsCreatingPreset(false)
    setEditingPreset(null)
    toast.success('บันทึกสำเร็จ', 'Preset ถูกบันทึกแล้ว')
  }

  const handleDeletePreset = (preset: CustomPreset) => {
    if (!confirm(`ต้องการลบ Preset "${preset.name}" หรือไม่?`)) return

    const updatedPresets = customPresets.filter(p => p.id !== preset.id)
    saveCustomPresets(updatedPresets)
    toast.success('ลบสำเร็จ', 'Preset ถูกลบแล้ว')
  }

  const handleApplyPreset = (preset: PlacementPreset) => {
    if (!calibration.isCalibrated) {
      toast.error('ข้อผิดพลาด', 'กรุณา Calibrate Canvas ก่อนใช้ Preset')
      return
    }

    onApplyPreset(preset)
    toast.success('ใช้ Preset สำเร็จ', `ใช้ preset "${preset.name}" แล้ว`)
    onClose()
  }

  const viewLabels = {
    front: 'ด้านหน้า',
    back: 'ด้านหลัง',
    sleeveL: 'แขนซ้าย',
    sleeveR: 'แขนขวา'
  }

  const modeLabels = {
    fixed: 'Fixed (ขนาดคงที่)',
    proportional: 'Proportional (ขนาดตามสัดส่วน)'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300" onClick={onClose} />

        <div className="relative inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all duration-300 animate-scaleIn sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                <MapPinIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Placement Presets</h3>
                <p className="text-sm text-gray-500">เลือก preset สำหรับการวางตำแหน่ง</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {!calibration.isCalibrated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    กรุณา Calibrate Canvas ก่อนใช้งาน Preset เพื่อให้การวางตำแหน่งถูกต้อง
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-6">
            {/* Left: Preset Categories */}
            <div className="flex-1">
              <div className="space-y-6">
                {/* Built-in Presets */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Built-in Presets</h4>
                    <span className="text-sm text-gray-500">{Object.keys(PLACEMENT_PRESETS).length} presets</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(PLACEMENT_PRESETS).map(([key, preset]) => (
                      <div
                        key={key}
                        className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                          calibration.isCalibrated
                            ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                        }`}
                        onClick={() => calibration.isCalibrated && handleApplyPreset(preset)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{preset.name}</h5>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {viewLabels[preset.view]}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Position: {preset.x_cm}×{preset.y_cm} cm</div>
                          <div>Size: {preset.w_cm}×{preset.h_cm} cm</div>
                          <div className="text-xs text-gray-500">{modeLabels[preset.mode]}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Presets */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Custom Presets</h4>
                    <button
                      onClick={handleCreatePreset}
                      className="btn btn-primary btn-sm"
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      สร้าง Preset
                    </button>
                  </div>
                  
                  {customPresets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className={`p-4 border-2 rounded-xl transition-all ${
                            calibration.isCalibrated
                              ? 'border-purple-200 bg-purple-50'
                              : 'border-gray-100 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{preset.name}</h5>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                {viewLabels[preset.view]}
                              </span>
                              <button
                                onClick={() => handleEditPreset(preset)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                              >
                                <PencilIcon className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeletePreset(preset)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                              >
                                <TrashIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1 mb-3">
                            <div>Position: {preset.x_cm}×{preset.y_cm} cm</div>
                            <div>Size: {preset.w_cm}×{preset.h_cm} cm</div>
                            <div className="text-xs text-gray-500">{modeLabels[preset.mode]}</div>
                            {preset.description && (
                              <div className="text-xs text-gray-500">{preset.description}</div>
                            )}
                          </div>
                          <button
                            onClick={() => handleApplyPreset(preset)}
                            className="w-full btn btn-secondary btn-sm"
                            disabled={!calibration.isCalibrated}
                          >
                            ใช้ Preset นี้
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                      <MapPinIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-3">ยังไม่มี Custom Preset</p>
                      <button
                        onClick={handleCreatePreset}
                        className="btn btn-primary btn-sm"
                      >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        สร้าง Preset แรก
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Create/Edit Form */}
            {isCreatingPreset && (
              <div className="w-80">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    {editingPreset ? 'แก้ไข Preset' : 'สร้าง Preset ใหม่'}
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อ Preset *
                      </label>
                      <input
                        type="text"
                        value={presetForm.name}
                        onChange={(e) => setPresetForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น Logo บนอก, ชื่อหลัง"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        View
                      </label>
                      <select
                        value={presetForm.view}
                        onChange={(e) => setPresetForm(prev => ({ ...prev, view: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(viewLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          X (cm)
                        </label>
                        <input
                          type="number"
                          value={presetForm.x_cm}
                          onChange={(e) => setPresetForm(prev => ({ ...prev, x_cm: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Y (cm)
                        </label>
                        <input
                          type="number"
                          value={presetForm.y_cm}
                          onChange={(e) => setPresetForm(prev => ({ ...prev, y_cm: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Width (cm)
                        </label>
                        <input
                          type="number"
                          value={presetForm.w_cm}
                          onChange={(e) => setPresetForm(prev => ({ ...prev, w_cm: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.1"
                          min="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          value={presetForm.h_cm}
                          onChange={(e) => setPresetForm(prev => ({ ...prev, h_cm: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.1"
                          min="0.1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mode
                      </label>
                      <select
                        value={presetForm.mode}
                        onChange={(e) => setPresetForm(prev => ({ ...prev, mode: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="fixed">Fixed (ขนาดคงที่)</option>
                        <option value="proportional">Proportional (ตามสัดส่วน)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        คำอธิบาย
                      </label>
                      <textarea
                        value={presetForm.description}
                        onChange={(e) => setPresetForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="คำอธิบายเพิ่มเติม (ไม่จำเป็น)"
                      />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => setIsCreatingPreset(false)}
                        className="flex-1 btn btn-secondary btn-sm"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleSavePreset}
                        className="flex-1 btn btn-primary btn-sm"
                        disabled={!presetForm.name.trim()}
                      >
                        {editingPreset ? 'บันทึก' : 'สร้าง'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}