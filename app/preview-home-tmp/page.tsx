import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { GettingStartedSteps } from "@/components/dashboard/getting-started-steps"
import { FeatureCards } from "@/components/dashboard/feature-cards"

export default function PreviewPage() {
  return (
    <div className="@container/main mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardHero />
      <GettingStartedSteps />
      <FeatureCards />
    </div>
  )
}
