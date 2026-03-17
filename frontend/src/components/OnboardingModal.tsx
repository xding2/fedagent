/**
 * 新用户引导弹窗
 */
import { useState } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useT } from '../i18n'

export default function OnboardingModal() {
  const [step, setStep] = useState(0)
  const setShowOnboarding = useUIStore(s => s.setShowOnboarding)
  const t = useT()

  const STEPS = [
    { title: t('onboard.step1_title'), content: t('onboard.step1_content'), icon: '🏛️' },
    { title: t('onboard.step2_title'), content: t('onboard.step2_content'), icon: '📊' },
    { title: t('onboard.step3_title'), content: t('onboard.step3_content'), icon: '🎮' },
    { title: t('onboard.step4_title'), content: t('onboard.step4_content'), icon: '⚡' },
  ]

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl border border-white/10 shadow-2xl w-[440px] max-w-[90vw] overflow-hidden">
        {/* Progress */}
        <div className="flex gap-1.5 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-blue-400' : 'bg-white/10'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="text-4xl mb-4">{current.icon}</div>
          <h2 className="text-lg font-semibold text-gray-200 mb-3">{current.title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line text-left">
            {current.content}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between p-4 border-t border-white/5">
          <button
            onClick={() => setShowOnboarding(false)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            {t('onboard.skip')}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:bg-white/5 transition-colors"
              >
                {t('onboard.prev')}
              </button>
            )}
            <button
              onClick={() => isLast ? setShowOnboarding(false) : setStep(step + 1)}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-blue-500/20 text-blue-400
                hover:bg-blue-500/30 transition-colors border border-blue-500/20"
            >
              {isLast ? t('onboard.start') : t('onboard.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
