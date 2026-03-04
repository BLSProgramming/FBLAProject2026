using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;
using Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserRegistrationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITurnstileService _turnstile;
        private readonly ILogger<UserRegistrationController> _logger;

        public UserRegistrationController(
            AppDbContext context,
            IPasswordHasher passwordHasher,
            ITurnstileService turnstile,
            ILogger<UserRegistrationController> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _turnstile = turnstile;
            _logger = logger;
        }

        public class RegisterDto
        {
            public string? Username { get; set; }
            public string? Password { get; set; }
            public string? Email { get; set; }
            public string? FullName { get; set; }
            public string? TurnstileToken { get; set; }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            // Verify turnstile token if provided
            var token = request?.TurnstileToken ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(token))
            {
                var ok = await _turnstile.VerifyAsync(token);
                if (!ok) return BadRequest(new { message = "Turnstile verification failed." });
            }

            if (request == null
                || string.IsNullOrEmpty(request.Username)
                || string.IsNullOrEmpty(request.Password)
                || string.IsNullOrEmpty(request.FullName))
            {
                return BadRequest(new { message = "All fields are required." });
            }

            var username = request.Username.Trim();
            var fullName = request.FullName.Trim();

            if (username.Length < 6 || username.Length > 14)
                return BadRequest(new { message = "Username must be between 6 and 14 characters." });

            if (!System.Text.RegularExpressions.Regex.IsMatch(username, "^[A-Za-z0-9_ ]+$"))
                return BadRequest(new { message = "Username may not contain special characters." });

            if (request.Password.Length < 8)
                return BadRequest(new { message = "Password must be at least 8 characters long." });

            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Email is required." });

            if (fullName.Length < 2)
                return BadRequest(new { message = "Full name must be at least 2 characters." });

            // Normalize email for consistent storage
            var email = request.Email.Trim().ToLowerInvariant();

            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                if (addr.Address != email) return BadRequest(new { message = "Invalid email address." });
            }
            catch
            {
                return BadRequest(new { message = "Invalid email address." });
            }

            var normalizedUsername = username.ToLowerInvariant();

            if (await _context.Users.AnyAsync(u => u.Username.ToLower() == normalizedUsername))
                return BadRequest(new { message = "Username already exists." });

            if (await _context.Users.AnyAsync(u => u.Email == email))
                return BadRequest(new { message = "Email already registered." });

            if (await _context.BusinessUsers.AnyAsync(b => b.Email == email))
                return BadRequest(new { message = "Email already registered as a business. Contact Support." });

            var hashed = _passwordHasher.Hash(request.Password);

            var user = new User
            {
                Username = username,
                Password = hashed,
                Email = email,
                FullName = fullName
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User registered: {Username}", username);

            return Ok(new { message = "User registered successfully!" });
        }
    }
}

