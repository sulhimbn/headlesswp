// This file contains a reusable function that can be used to send errors to Sentry.
// It's useful for catching errors in places where Sentry's automatic error tracking might not catch them.

import * as Sentry from '@sentry/nextjs'

export interface ErrorContext {
  tags?: Record<string, string>
  extra?: Record<string, any>
  user?: {
    id?: string
    email?: string
    username?: string
  }
}

export const captureError = (error: Error | string, context?: ErrorContext) => {
  if (typeof error === 'string') {
    error = new Error(error)
  }

  if (context?.tags) {
    Sentry.setTags(context.tags)
  }

  if (context?.extra) {
    Sentry.setExtras(context.extra)
  }

  if (context?.user) {
    Sentry.setUser(context.user)
  }

  Sentry.captureException(error)
}

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: ErrorContext) => {
  if (context?.tags) {
    Sentry.setTags(context.tags)
  }

  if (context?.extra) {
    Sentry.setExtras(context.extra)
  }

  Sentry.captureMessage(message, level)
}

export const setUser = (user: ErrorContext['user']) => {
  if (user) {
    Sentry.setUser(user)
  } else {
    Sentry.setUser(null)
  }
}

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb)
}