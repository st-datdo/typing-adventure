import { NextResponse } from 'next/server'

interface ApiResponseOk<T> {
  success: true
  data: T
  meta?: { total: number; page: number; limit: number }
}

interface ApiResponseErr {
  success: false
  error: string
}

export type ApiResponse<T> = ApiResponseOk<T> | ApiResponseErr

export function ok<T>(data: T, meta?: { total: number; page: number; limit: number }) {
  const body: ApiResponseOk<T> = { success: true, data }
  if (meta) body.meta = meta
  return NextResponse.json(body)
}

export function err(message: string, status = 400) {
  const body: ApiResponseErr = { success: false, error: message }
  return NextResponse.json(body, { status })
}

export function unauthorized() {
  return err('Unauthorized', 401)
}
