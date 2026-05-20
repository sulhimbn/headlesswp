import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { REVALIDATE_SECRET } from '@/lib/api/config'

interface WebhookPayload {
  action: string
  post?: {
    id: number
    slug: string
    type: string
    status: string
  }
  post_type?: string
  post_id?: number
}

function validateSecret(req: NextRequest): boolean {
  const signature = req.headers.get('x-webhook-signature')
  const bodySecret = req.headers.get('x-webhook-secret')
  
  if (REVALIDATE_SECRET && signature) {
    return signature === REVALIDATE_SECRET
  }
  
  if (bodySecret && bodySecret === REVALIDATE_SECRET) {
    return true
  }
  
  return !REVALIDATE_SECRET
}

function extractRevalidatePaths(payload: WebhookPayload): string[] {
  const paths: string[] = []
  
  if (!payload.post && !payload.post_id) {
    return ['/berita']
  }
  
  const postId = payload.post?.id || payload.post_id
  
  if (postId) {
    paths.push(`/berita/${payload.post?.slug || postId}`)
  }
  
  paths.push('/berita')
  
  return paths
}

export async function POST(req: NextRequest) {
  try {
    if (!validateSecret(req)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid webhook secret' },
        { status: 401 }
      )
    }

    const payload: WebhookPayload = await req.json()
    
    const action = payload.action || 'unknown'
    const validActions = ['post_published', 'post_updated', 'post_deleted', 'post_created']
    
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Ignored', message: `Action '${action}' not supported for revalidation` },
        { status: 200 }
      )
    }

    const paths = extractRevalidatePaths(payload)
    
    const results = paths.map(path => {
      try {
        revalidatePath(path)
        return { path, status: 'revalidated' }
      } catch (err) {
        return { path, status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' }
      }
    })
    
    return NextResponse.json({
      success: true,
      action: payload.action,
      revalidated: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Revalidation endpoint ready. Send POST with WordPress webhook payload.',
    expected_headers: ['x-webhook-signature or x-webhook-secret'],
    example_body: {
      action: 'post_published',
      post: {
        id: 123,
        slug: 'example-post',
        type: 'post',
        status: 'publish'
      }
    }
  })
}