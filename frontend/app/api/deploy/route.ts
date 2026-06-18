import { NextResponse } from "next/server"
import { deploymentManager } from "@/lib/deployment-manager"

export async function POST(request: Request) {
  try {
    const { milestoneId, customConfig } = await request.json()
    
    if (!milestoneId) {
      return NextResponse.json({ success: false, error: "Falta milestoneId" }, { status: 400 })
    }

    // Start deployment asynchronously
    deploymentManager.startDeployment(milestoneId, customConfig).catch((err) => {
      console.error("Async deployment error:", err)
    })

    return NextResponse.json({ success: true, message: "Despliegue iniciado correctamente" })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    deploymentManager.cancel()
    return NextResponse.json({ success: true, message: "Petición de cancelación enviada" })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
