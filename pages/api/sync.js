export default async function handler(req, res) {
  const EDGE_CONFIG_ID = "ecfg_olqtcm5znsesyitqrtmihfcqtuy7";
  const TEAM_OWNER_IDS = ["82408554","92171634","203235164","85111884","89147863","80246179","86572223","83119534"];
  const LATAM_COUNTRIES = ["Mexico","Brazil","Argentina","Colombia","Ecuador","Panama","Uruguay","Peru","Chile","Bolivia","Venezuela","Costa Rica","Guatemala","Honduras","El Salvador","Nicaragua","Dominican Republic","Cuba","Paraguay"];

  // GET — read cached deals from Edge Config
  if (req.method === "GET") {
    try {
      const { get } = await import("@vercel/edge-config");
      const deals = await get("deals");
      const lastSynced = await get("lastSynced");
      if (!deals) return res.status(200).json({ deals: [], lastSynced: null });
      return res.status(200).json({ deals, lastSynced });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — fetch from HubSpot and write to Edge Config
  if (req.method === "POST") {
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) return res.status(500).json({ error: "VERCEL_TOKEN not configured" });

    try {
      // Fetch from HubSpot via Anthropic
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a HubSpot data extraction assistant. Use the HubSpot MCP tools to fetch ALL deals. Include a deal if owner ID is one of: ${TEAM_OWNER_IDS.join(",")} OR country is in: ${LATAM_COUNTRIES.join(",")} OR region is LATAM. Return ONLY a valid JSON array. Each object: id, dealname, pipeline, dealstage, owner (hubspot_owner_id), country, region, use_case, lastActivity (YYYY-MM-DD), description, lastmod (YYYY-MM-DD), companyId (company_id__auto_synched_).`,
          messages: [{ role: "user", content: "Fetch all qualifying LatAm deals and return the JSON array." }],
          mcp_servers: [{ type: "url", url: "https://mcp.hubspot.com/anthropic", name: "hubspot-mcp" }]
        })
      });

      const data = await anthropicRes.json();
      if (data.error) throw new Error(data.error.message);
      const textBlock = data.content?.find(b => b.type === "text");
      if (!textBlock) throw new Error("No response from model");
      const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
      const deals = JSON.parse(cleaned);
      if (!Array.isArray(deals)) throw new Error("Invalid format");

      // Write to Edge Config
      const writeRes = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?teamId=team_x5JCBLhRsSkrHLSbAmUwclbY`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${vercelToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: [
            { operation: "upsert", key: "deals", value: deals },
            { operation: "upsert", key: "lastSynced", value: new Date().toISOString() }
          ]
        })
      });

      if (!writeRes.ok) {
        const errText = await writeRes.text();
        throw new Error(`Edge Config write failed: ${errText}`);
      }

      return res.status(200).json({ success: true, count: deals.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
