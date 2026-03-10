using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;

    public ChatController(IHttpClientFactory httpClientFactory, IConfiguration configuration, AppDbContext context)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _context = context;
    }

    public class ChatRequest
    {
        public List<ChatMessage> Messages { get; set; } = new();
    }

    public class ChatMessage
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] ChatRequest request)
    {
        if (request.Messages == null || request.Messages.Count == 0)
            return BadRequest(new { error = "Messages are required." });

        // Limit message history to prevent abuse
        if (request.Messages.Count > 50)
            return BadRequest(new { error = "Too many messages in conversation." });

        // Validate message content length
        foreach (var msg in request.Messages)
        {
            if (string.IsNullOrWhiteSpace(msg.Content) || msg.Content.Length > 2000)
                return BadRequest(new { error = "Each message must be between 1 and 2000 characters." });

            if (msg.Role != "user" && msg.Role != "assistant" && msg.Role != "system")
                return BadRequest(new { error = "Invalid message role." });
        }

        var hfToken = _configuration["HuggingFace:ApiKey"];
        if (string.IsNullOrEmpty(hfToken))
            return StatusCode(500, new { error = "Chat service is not configured." });

        // Query published businesses from the database to give the AI real data
        // Extract the latest user message to filter businesses contextually
        var latestUserMessage = request.Messages.LastOrDefault(m => m.Role == "user")?.Content ?? "";
        var searchTerms = latestUserMessage.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 2).ToArray();

        var allBusinesses = await _context.BusinessCards
            .Include(bc => bc.BusinessUser)
            .Where(bc => bc.IsPublished)
            .Select(bc => new
            {
                Name = bc.BusinessUser != null ? bc.BusinessUser.BusinessName : "",
                bc.City,
                bc.Address,
                bc.Phone,
                bc.Description,
                Category = bc.BusinessCategory ?? "",
                bc.Slug
            })
            .ToListAsync();

        // If there are few businesses, include all. Otherwise, filter by relevance to the query.
        var businesses = allBusinesses.Count <= 20
            ? allBusinesses
            : allBusinesses.Where(b =>
                searchTerms.Any(term =>
                    (b.Name ?? "").Contains(term, StringComparison.OrdinalIgnoreCase) ||
                    (b.City ?? "").Contains(term, StringComparison.OrdinalIgnoreCase) ||
                    (b.Category ?? "").Contains(term, StringComparison.OrdinalIgnoreCase) ||
                    (b.Description ?? "").Contains(term, StringComparison.OrdinalIgnoreCase)
                )).Take(20).ToList();

        // If filtering returned nothing, fall back to all (capped)
        if (businesses.Count == 0 && allBusinesses.Count > 0)
            businesses = allBusinesses.Take(20).ToList();

        var businessList = businesses.Count > 0
            ? $"\n\nThere are {allBusinesses.Count} total businesses on Biz-Buzz. Here are the most relevant ones:\n" +
              string.Join("\n", businesses.Select(b =>
              {
                  var phone = b.Phone ?? "";
                  if (phone.Length == 10)
                      phone = $"({phone[..3]}) {phone[3..6]}-{phone[6..]}";
                  else if (phone.Length == 11 && phone[0] == '1')
                      phone = $"({phone[1..4]}) {phone[4..7]}-{phone[7..]}";
                  return $"- [{b.Name}](/cards/{b.Slug}) | Category: {b.Category} | City: {b.City} | Address: {b.Address} | Phone: {phone} | Description: {b.Description}";
              }))
            : "\n\nThere are currently no businesses listed on Biz-Buzz.";

        var systemMessage = new
        {
            role = "system",
            content = "You are Biz-Buzz Assistant, a helpful chatbot for the Biz-Buzz local business directory platform. Help users discover businesses listed on Biz-Buzz and understand how to use platform features (searching, bookmarking, leaving reviews, business registration). Keep responses concise and friendly. Use markdown formatting to make responses readable: use **bold** for important labels, bullet points for lists, and clear sections. IMPORTANT: When mentioning any business name, you MUST format it as a markdown link exactly like this: [Business Name](/cards/slug). The link paths are provided in the business list below — copy them exactly. Never write a business name as plain text. Only recommend businesses from the list provided below. If no matching businesses are found, let the user know and suggest they check back later." + businessList
        };

        var allMessages = new List<object> { systemMessage };
        allMessages.AddRange(request.Messages.Select(m => new { role = m.Role, content = m.Content }));

        var payload = new
        {
            model = "zai-org/GLM-5:novita",
            messages = allMessages,
            max_tokens = 512
        };

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", hfToken);

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync("https://router.huggingface.co/v1/chat/completions", content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = "Chat service error.", details = responseBody });

        using var doc = JsonDocument.Parse(responseBody);
        var reply = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return Ok(new { reply });
    }
}
