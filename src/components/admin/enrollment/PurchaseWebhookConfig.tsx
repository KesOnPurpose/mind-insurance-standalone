// ============================================================================
// FEAT-GH-019: Purchase Webhook Configuration Component
// ============================================================================
// Display webhook URL for GHL/Stripe setup with example payload
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Webhook,
  Copy,
  CheckCircle,
  ExternalLink,
  Loader2,
  TestTube,
  Info,
  Code,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Types
// ============================================================================

interface PurchaseWebhookConfigProps {
  programId: string;
  programTitle?: string;
}

// ============================================================================
// Constants
// ============================================================================

const WEBHOOK_URL = 'https://n8n-n8n.vq00fr.easypanel.host/webhook/enrollment';

const EXAMPLE_PAYLOAD = {
  event: 'purchase.completed',
  program_id: '{{program_id}}',
  customer: {
    email: 'customer@example.com',
    name: 'John Doe',
  },
  purchase: {
    id: 'purchase_123',
    amount_cents: 9900,
    currency: 'USD',
  },
  source: 'gohighlevel',
};

const GHL_PAYLOAD_EXAMPLE = `{
  "event": "purchase.completed",
  "program_id": "{{program_id}}",
  "customer": {
    "email": "{{contact.email}}",
    "name": "{{contact.full_name}}"
  },
  "purchase": {
    "id": "{{order.id}}",
    "amount_cents": "{{order.total}}",
    "currency": "USD"
  },
  "source": "gohighlevel"
}`;

const STRIPE_PAYLOAD_EXAMPLE = `{
  "event": "purchase.completed",
  "program_id": "{{program_id}}",
  "customer": {
    "email": "{{customer.email}}",
    "name": "{{customer.name}}"
  },
  "purchase": {
    "id": "{{checkout_session.id}}",
    "amount_cents": "{{checkout_session.amount_total}}",
    "currency": "{{checkout_session.currency}}"
  },
  "source": "stripe"
}`;

// ============================================================================
// Main Component
// ============================================================================

export const PurchaseWebhookConfig = ({
  programId,
  programTitle,
}: PurchaseWebhookConfigProps) => {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState<'url' | 'payload' | 'programId' | null>(null);

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: 'url' | 'payload' | 'programId') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast({
        title: 'Copied to clipboard',
        description: `${type === 'url' ? 'Webhook URL' : type === 'programId' ? 'Program ID' : 'Payload'} copied successfully`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Please manually select and copy the text',
        variant: 'destructive',
      });
    }
  };

  // Send test webhook
  const handleTestWebhook = async () => {
    setIsTesting(true);
    try {
      const testPayload = {
        ...EXAMPLE_PAYLOAD,
        program_id: programId,
        test: true,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        toast({
          title: 'Test successful',
          description: 'The test webhook was received successfully',
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      console.error('Webhook test error:', err);
      toast({
        title: 'Test failed',
        description: 'Could not reach the webhook endpoint. Check if N8n is running.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Format payload with actual program ID
  const formattedPayload = JSON.stringify(
    { ...EXAMPLE_PAYLOAD, program_id: programId },
    null,
    2
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Purchase Webhook Configuration
        </CardTitle>
        <CardDescription>
          Configure GoHighLevel or Stripe to auto-enroll learners on purchase
          {programTitle && ` for "${programTitle}"`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Webhook URL */}
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <div className="flex gap-2">
            <Input
              id="webhook-url"
              value={WEBHOOK_URL}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(WEBHOOK_URL, 'url')}
            >
              {copied === 'url' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure this URL as a webhook endpoint in your payment processor
          </p>
        </div>

        {/* Program ID */}
        <div className="space-y-2">
          <Label htmlFor="program-id">Program ID</Label>
          <div className="flex gap-2">
            <Input
              id="program-id"
              value={programId}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(programId, 'programId')}
            >
              {copied === 'programId' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Include this ID in your webhook payload to identify the program
          </p>
        </div>

        {/* Test Webhook Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleTestWebhook}
            disabled={isTesting}
            variant="outline"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Send Test Webhook
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Sends a test request to verify the webhook endpoint is working
          </p>
        </div>

        {/* Payload Examples */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="payload">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Expected Payload Format
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Tabs defaultValue="generic" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="generic">Generic</TabsTrigger>
                  <TabsTrigger value="ghl">GoHighLevel</TabsTrigger>
                  <TabsTrigger value="stripe">Stripe</TabsTrigger>
                </TabsList>

                <TabsContent value="generic" className="space-y-2 mt-4">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(formattedPayload, 'payload')}
                    >
                      {copied === 'payload' ? (
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      Copy
                    </Button>
                  </div>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                    {formattedPayload}
                  </pre>
                </TabsContent>

                <TabsContent value="ghl" className="space-y-2 mt-4">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          GHL_PAYLOAD_EXAMPLE.replace('{{program_id}}', programId),
                          'payload'
                        )
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                    {GHL_PAYLOAD_EXAMPLE.replace('{{program_id}}', programId)}
                  </pre>
                  <p className="text-sm text-muted-foreground">
                    Use GoHighLevel variables (e.g., {`{{contact.email}}`}) in your
                    webhook configuration
                  </p>
                </TabsContent>

                <TabsContent value="stripe" className="space-y-2 mt-4">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          STRIPE_PAYLOAD_EXAMPLE.replace('{{program_id}}', programId),
                          'payload'
                        )
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                    {STRIPE_PAYLOAD_EXAMPLE.replace('{{program_id}}', programId)}
                  </pre>
                  <p className="text-sm text-muted-foreground">
                    Use Stripe session variables in your webhook or automation
                  </p>
                </TabsContent>
              </Tabs>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How it works</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              When a purchase is completed, your payment processor sends a webhook
              to the URL above. The N8n workflow processes the webhook and
              automatically:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Creates or finds the user account by email</li>
              <li>Enrolls them in this program</li>
              <li>Sends a welcome email with access instructions</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Documentation Links */}
        <div className="flex flex-wrap gap-4 pt-2">
          <Button variant="link" asChild className="p-0 h-auto">
            <a
              href="https://docs.gohighlevel.com/webhooks"
              target="_blank"
              rel="noopener noreferrer"
            >
              GoHighLevel Docs
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
          <Button variant="link" asChild className="p-0 h-auto">
            <a
              href="https://stripe.com/docs/webhooks"
              target="_blank"
              rel="noopener noreferrer"
            >
              Stripe Webhooks Docs
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseWebhookConfig;
