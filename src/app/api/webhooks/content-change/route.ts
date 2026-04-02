import { NextResponse } from 'next/server'
import { getContentChangeDetector } from '@/lib/services/contentChangeDetector'
import { logger } from '@/lib/utils/logger'
import type { ContentChange } from '@/lib/services/contentChangeDetector'

interface WebhookPayload {
  type: 'post' | 'category' | 'tag'
  action: 'created' | 'updated' | 'deleted'
  id: number
  slug?: string
  timestamp?: string
}

async function webhookHandler(request: Request) {
  try {
    const detector = getContentChangeDetector()

    if (!detector) {
      return NextResponse.json({
        error: 'Content change detector not initialized'
      }, {
        status: 503
      })
    }

    const body: WebhookPayload = await request.json()

    const requiredFields = ['type', 'action', 'id'] as const
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          error: `Missing required field: ${field}`
        }, {
          status: 400
        })
      }
    }

    if (!['post', 'category', 'tag'].includes(body.type)) {
      return NextResponse.json({
        error: 'Invalid type. Must be post, category, or tag'
      }, {
        status: 400
      })
    }

    if (!['created', 'updated', 'deleted'].includes(body.action)) {
      return NextResponse.json({
        error: 'Invalid action. Must be created, updated, or deleted'
      }, {
        status: 400
      })
    }

    const change: ContentChange = {
      type: body.type,
      id: body.id,
      slug: body.slug,
      action: body.action,
      timestamp: body.timestamp || new Date().toISOString()
    }

    await detector.checkForChanges()

    logger.info('Content change webhook received', {
      module: 'contentChangeWebhook',
      change
    })

    return NextResponse.json({
      success: true,
      received: change
    }, {
      status: 200
    })
  } catch (error) {
    logger.error('Error processing content change webhook', error, {
      module: 'contentChangeWebhook'
    })

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    })
  }
}

export const POST = webhookHandler