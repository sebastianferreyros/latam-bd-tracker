export default async function handler(req, res) {
  const TEAM_OWNER_IDS = ["82408554","92171634","203235164","85111884","89147863","80246179","86572223","83119534"];
  const LATAM_COUNTRIES = ["Mexico","Brazil","Argentina","Colombia","Ecuador","Panama","Uruguay","Peru","Chile","Bolivia","Venezuela","Costa Rica","Guatemala","Honduras","El Salvador","Nicaragua","Dominican Republic","Cuba","Paraguay"];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are a HubSpot data extraction assistant. Use the HubSpot MCP tools to fetch ALL deals. Include a deal if the owner ID is one of: ${TEAM_OWNER_IDS.join(",")} OR the country is in: ${LATAM_COUNTRIES.join(",")} OR region is LATAM. Return ONLY a valid JSON array. Each object: id, dealname, pipeline, dealstage, owner (hubspot_owner_id), country, region, use_case, lastActivity (YYYY-MM-DD), description, lastmod (YYYY-MM-DD), companyId (company_id__auto_synched_).`,
        messages: [{ role: "user", content: "Fetch all qualifying LatAm deals and return the JSON array." }],
        mcp_servers: [{ type: "url", url: "https://mcp.hubspot.com/anthropic", name: "hubspot-mcp" }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const textBlock = data.content?.find(b => b.type === "text");
    if (!textBlock) return res.status(500).json({ error: "No response from model" });

    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const deals = JSON.parse(cleaned);
    if (!Array.isArray(deals)) return res.status(500).json({ error: "Invalid response format" });

    res.status(200).json({ deals });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
