import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Settings } from "lucide-react";

export function ConfigurationRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Settings className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle className="text-xl">Configuration Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Supabase credentials are missing</p>
              <p>Please add the following environment variables to run this application:</p>
            </div>
          </div>
          
          <div className="space-y-2 font-mono text-sm">
            <div className="p-2 bg-muted rounded">
              <span className="text-muted-foreground">VITE_SUPABASE_URL</span>
            </div>
            <div className="p-2 bg-muted rounded">
              <span className="text-muted-foreground">VITE_SUPABASE_ANON_KEY</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            You can find these values in your Supabase project dashboard under Settings &gt; API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
