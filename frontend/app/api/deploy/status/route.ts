import { NextResponse } from "next/server"
import { deploymentManager } from "@/lib/deployment-manager"

export async function GET() {
  try {
    const state = deploymentManager.getState()
    return NextResponse.json(state)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json()
    if (action === "clear") {
      deploymentManager.clearLogs()
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ success: false, error: "Acción no reconocida" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
