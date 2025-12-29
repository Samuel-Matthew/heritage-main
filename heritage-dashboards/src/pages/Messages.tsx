import { MessageSquare } from "lucide-react";

export default function Messages() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">RFQs & Messages</h1>
        <p className="text-muted-foreground mt-2">
          Manage your RFQs and communications
        </p>
      </div>

      <div className="bg-muted/50 border border-border rounded-lg p-8 text-center">
        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Messages Yet</h2>
        <p className="text-muted-foreground">
          Your messages and RFQs will appear here
        </p>
      </div>
    </div>
  );
}
