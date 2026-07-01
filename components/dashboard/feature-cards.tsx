import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { featureCards } from "@/components/dashboard/dashboard-content"

export function FeatureCards() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">أقسام النظام</h2>
        <p className="text-sm text-muted-foreground">
          نظرة سريعة على كل قسم ووصول مباشر إليه
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {featureCards.map((feature) => (
          <Card key={feature.href} className="justify-between">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={feature.href}>
                  {feature.cta}
                  <ArrowLeftIcon className="rtl:rotate-180" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
