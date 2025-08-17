import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse mx-auto mb-2"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
