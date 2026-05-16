import { NextRequest, NextResponse } from 'next/server'
import { rollDice, rollWithAdvantage, rollWithDisadvantage } from '@/lib/dice'
import { parseBody, DiceSchema } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req, DiceSchema)
    if (body instanceof NextResponse) return body
    const { notation, advantage, disadvantage } = body

    if (advantage) {
      const result = rollWithAdvantage()
      return NextResponse.json(result)
    }

    if (disadvantage) {
      const result = rollWithDisadvantage()
      return NextResponse.json(result)
    }

    if (!notation) {
      return NextResponse.json({ error: 'Missing notation' }, { status: 400 })
    }

    const result = rollDice(notation)
    return NextResponse.json(result)

  } catch (error) {
    return NextResponse.json({ error: 'Invalid dice notation' }, { status: 400 })
  }
}