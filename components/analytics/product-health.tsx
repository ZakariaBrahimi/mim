import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProductHealth as ProductHealthT } from "@/lib/roadmap-stats";

export function ProductHealth({ products }: { products: ProductHealthT[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {products.map((p) => (
          <div key={p.key}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{p.name}</span>
              <span className="font-semibold text-slate-900">{p.progress}%</span>
            </div>
            <Progress value={p.progress} className="h-1.5" indicatorColor={p.color} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
