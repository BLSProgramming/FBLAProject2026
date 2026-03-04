using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Api.Services
{
    public class TurnstileService : ITurnstileService
    {
        private readonly HttpClient _httpClient;
        private readonly string? _secret;
        private readonly ILogger<TurnstileService> _logger;

        public TurnstileService(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<TurnstileService> logger)
        {
            _httpClient = httpClientFactory.CreateClient();
            _secret = config["Turnstile:Secret"];
            _logger = logger;
        }

        public async Task<bool> VerifyAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token)) return false;

            // If secret not configured, skip verification (development)
            if (string.IsNullOrWhiteSpace(_secret)) return true;

            var values = new Dictionary<string, string>
            {
                { "secret", _secret },
                { "response", token }
            };

            try
            {
                using var resp = await _httpClient.PostAsync(
                    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                    new FormUrlEncodedContent(values));

                if (!resp.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Turnstile API returned {StatusCode}", resp.StatusCode);
                    return false;
                }

                var json = await resp.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(json);

                if (doc.RootElement.TryGetProperty("success", out var success))
                    return success.GetBoolean();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Turnstile verification failed");
            }

            return false;
        }
    }
}
