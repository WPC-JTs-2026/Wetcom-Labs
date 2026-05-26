import { Header } from "@/components/header"
import { CustomDeploymentForm } from "@/components/custom-deployment-form"

export default function CustomDeploymentPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Despliegue Personalizado
          </h1>
          <p className="mt-2 text-muted-foreground">
            Configura tu entorno vSphere a medida seleccionando los componentes y recursos que necesitas.
          </p>
        </div>
        <div className="max-w-4xl">
          <CustomDeploymentForm />
        </div>
      </main>
    </div>
  )
}
