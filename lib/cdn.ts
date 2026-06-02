// lib/cdn.ts

/**
 * Replaces the default Supabase URL with your custom Cloudflare CDN domain
 * to prevent massive Egress billing overages.
 */
export function getCDNUrl(originalUrl: string | null | undefined): string | null {
  if (!originalUrl) return null;
  
  // Your custom domain routed through Cloudflare
  const CDN_DOMAIN = 'cdn.jpmtz.online';
  const SUPABASE_DOMAIN = 'tgfuufsgkelgjjktbugg.supabase.co';

  // TEMPORARILY DISABLED: User hasn't finished DNS setup
  // if (originalUrl.includes(SUPABASE_DOMAIN)) {
  //   return originalUrl.replace(SUPABASE_DOMAIN, CDN_DOMAIN);
  // }

  return originalUrl;
}
