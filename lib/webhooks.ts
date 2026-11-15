import crypto from "crypto";
import { prisma } from "@/lib/prisma";

interface WebhookEvent {
  event: string;
  data: Record<string, unknown>;
}

function sign(secret: string, body: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * Fires the given event to every active WebhookEndpoint subscribed to it.
 * n8n listens on its own Webhook node URL, which is registered here as an endpoint.
 * Each request includes an HMAC signature (X-Webhook-Signature) so n8n can verify origin.
 */
export async function dispatchWebhookEvent({ event, data }: WebhookEvent) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { event, active: true }
  });

  const body = JSON.stringify({ event, data, timestamp: new Date().toISOString() });

  const deliveries = await Promise.allSettled(
    endpoints.map(async (endpoint) => {
      const signature = sign(endpoint.secret, body);
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event
        },
        body
      });

      await prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event,
          payload: data as never,
          responseCode: res.status,
          success: res.ok
        }
      });

      return res.ok;
    })
  );

  return {
    attempted: endpoints.length,
    succeeded: deliveries.filter((d) => d.status === "fulfilled" && d.value).length
  };
}

export function verifyIncomingSignature(secret: string, body: string, signature: string) {
  const expected = Buffer.from(sign(secret, body));
  const received = Buffer.from(signature);
  // timingSafeEqual throws (-> HTTP 500) on length mismatch, so a malformed
  // signature header must be rejected explicitly first.
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
