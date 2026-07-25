import { describe, it, expect } from 'vitest'
import { WebEnrollmentStrategy } from '@/services/mtls/webEnrollmentStrategy'

describe('WebEnrollmentStrategy', () => {
  const strategy = new WebEnrollmentStrategy()

  it('reports not enrolled and no HSM', async () => {
    expect(await strategy.checkStatus()).toEqual({
      enrolled: false,
      hasHSM: false,
      hsmType: 'None',
    })
  })

  it('ensureEnrolled succeeds without enrolling (web does not require it)', async () => {
    expect(await strategy.ensureEnrolled()).toEqual({
      success: true,
      enrolled: false,
    })
  })

  it('forceReEnroll fails with an explanatory error', async () => {
    const result = await strategy.forceReEnroll()
    expect(result.success).toBe(false)
    expect(result.error).toBe('Web platform does not support mTLS')
  })

  it('deleteAllCredentials resolves without throwing', async () => {
    await expect(strategy.deleteAllCredentials()).resolves.toBeUndefined()
  })
})
