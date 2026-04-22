import { NextRequest, NextResponse } from 'next/server'
import { rollDice, rollWithAdvantage, rollWithDisadvantage } from '@/lib/dice'

export async function POST(req: NextRequest) {
  try {
    const { notation, advantage, disadvantage } = await req.json()

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