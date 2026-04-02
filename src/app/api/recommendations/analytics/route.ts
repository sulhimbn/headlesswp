import { NextResponse } from 'next/server'
import { getAllCTRData, clearCTRData } from '@/lib/services/recommendationEngine'
import { RECOMMENDATION_CONFIG, RECOMMENDATION_ALGORITHM, ANALYTICS_CONFIG } from '@/lib/api/recommendationConfig'

export async function GET() {
  try {
    const ctrData = getAllCTRData()
    
    return NextResponse.json({
      ctrData,
      config: {
        algorithm: RECOMMENDATION_ALGORITHM,
        recommendation: RECOMMENDATION_CONFIG,
        analytics: ANALYTICS_CONFIG
      },
      featureFlags: {
        aiRecommendations: process.env.NEXT_PUBLIC_FEATURE_AI_RECOMMENDATIONS === 'true',
        personalizedRecommendations: process.env.NEXT_PUBLIC_FEATURE_PERSONALIZED_RECOMMENDATIONS === 'true',
        recommendationAnalytics: process.env.NEXT_PUBLIC_FEATURE_RECOMMENDATION_ANALYTICS === 'true'
      }
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    clearCTRData()
    return NextResponse.json({ success: true, message: 'CTR data cleared' })
  } catch {
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 })
  }
}