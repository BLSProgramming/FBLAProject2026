using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;
using System.Linq;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserRegistrationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Api.Services.IPasswordHasher _passwordHasher;
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public UserRegistrationController(AppDbContext context, Api.Services.IPasswordHasher passwordHasher, IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _config = config;
            _httpClient = httpClientFactory.CreateClient();
        }

        private async Task<bool> VerifyTurnstileAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token)) return false;
            var secret = _config["Turnstile:Secret"];
            if (string.IsNullOrWhiteSpace(secret)) return true; // if secret not configured, skip verification (dev)

            var values = new Dictionary<string, string> { { "secret", secret }, { "response", token } };
            try
            {
                using var resp = await _httpClient.PostAsync("https://challenges.cloudflare.com/turnstile/v0/siteverify", new FormUrlEncodedContent(values));
                if (!resp.IsSuccessStatusCode) return false;
                var json = await resp.Content.ReadAsStringAsync();
                var doc = System.Text.Json.JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("success", out var success)) return success.GetBoolean();
            }
            catch { }
            return false;
        }

        public class RegisterDto {
            public string? Username { get; set; }
            public string? Password { get; set; }
            public string? Email { get; set; }
            public string? TurnstileToken { get; set; }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            // verify turnstile token if provided
            string token = request?.TurnstileToken ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(token))
            {
                var ok = await VerifyTurnstileAsync(token);
                if (!ok) return BadRequest(new { message = "Turnstile verification failed." });
            }

            if (request == null || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                return BadRequest(new { message = "All fields are required." });

            var username = request.Username.Trim();

            if (username.Length < 6 || username.Length > 14)
                return BadRequest(new { message = "Username must be between 6 and 14 characters." });

            // Allow internal spaces in usernames
            if (!System.Text.RegularExpressions.Regex.IsMatch(username, "^[A-Za-z0-9_ ]+$"))
                return BadRequest(new { message = "Username may not contain special characters" });

            if (request.Password.Length < 8)
                return BadRequest(new { message = "Password must be at least 8 characters long." });

            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Email is required." });

            // Normalize email to lower-case for consistent comparisons/storage
            var email = request.Email.Trim().ToLowerInvariant();

            // basic email format check
            try
            {
                var addr = new System.Net.Mail.MailAddress(request.Email);
                if (addr.Address != request.Email) return BadRequest(new { message = "Invalid email address." });
            }
            catch
            {
                return BadRequest(new { message = "Invalid email address." });
            }

            // Use case-insensitive comparison to avoid duplicate usernames that differ only by case
            var normalizedUsername = username.ToLowerInvariant();
            if (_context.Users.Any(u => u.Username.ToLower() == normalizedUsername))
                return BadRequest(new { message = "Username already exists." });
            if (_context.Users.Any(u => u.Email == email))
                return BadRequest(new { message = "Email already registered." });
            // Prevent reusing an email already registered as a business
            if (_context.BusinessUsers.Any(b => b.Email == email))
                return BadRequest(new { message = "Email already registered as a business. Contact Support" });

            var hashed = _passwordHasher.Hash(request.Password);

            var user = new User
            {
                Username = username,
                Password = hashed,
                Email = email
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(new { message = "User registered successfully!" });
        }

        [HttpGet("all")]
        public IActionResult GetAll()
        {
            var users = _context.Users
                .Select(u => new { u.Id, u.Username, u.Email })
                .ToList();

            return Ok(users);
        }
    }
}

