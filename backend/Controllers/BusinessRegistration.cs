using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;
using Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BusinessRegistrationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITurnstileService _turnstile;
        private readonly ILogger<BusinessRegistrationController> _logger;

        public BusinessRegistrationController(
            AppDbContext context,
            IPasswordHasher passwordHasher,
            ITurnstileService turnstile,
            ILogger<BusinessRegistrationController> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _turnstile = turnstile;
            _logger = logger;
        }

        public class BusinessRegisterDto
        {
            public string? BusinessName { get; set; }
            public string? Password { get; set; }
            public string? Email { get; set; }
            public string? TurnstileToken { get; set; }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] BusinessRegisterDto request)
        {
            // Verify turnstile
            var token = request?.TurnstileToken ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(token))
            {
                var ok = await _turnstile.VerifyAsync(token);
                if (!ok) return BadRequest(new { message = "Turnstile verification failed." });
            }

            if (request == null
                || string.IsNullOrWhiteSpace(request.BusinessName)
                || string.IsNullOrWhiteSpace(request.Password)
                || string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { message = "All fields are required." });
            }

            if (request.BusinessName.Length < 6 || request.BusinessName.Length > 40)
                return BadRequest(new { message = "Business Name must be between 6 and 40 characters." });

            if (!System.Text.RegularExpressions.Regex.IsMatch(request.BusinessName, "^[_A-Za-z0-9 ]+$"))
                return BadRequest(new { message = "Business Name may only contain letters, numbers, underscores and spaces." });

            if (request.Password.Length < 8)
                return BadRequest(new { message = "Password must be at least 8 characters long." });

            // Normalize email
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

            if (await _context.BusinessUsers.AnyAsync(u => u.BusinessName == request.BusinessName))
                return BadRequest(new { message = "Business is already registered. Contact Support." });

            if (await _context.BusinessUsers.AnyAsync(u => u.Email == email))
                return BadRequest(new { message = "Email already registered." });

            if (await _context.Users.AnyAsync(u => u.Email == email))
                return BadRequest(new { message = "Email already registered as a user. Contact Support." });

            var hashed = _passwordHasher.Hash(request.Password);

            var business = new BusinessUser
            {
                BusinessName = request.BusinessName,
                Password = hashed,
                Email = email
            };

            _context.BusinessUsers.Add(business);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Business registered: {BusinessName}", request.BusinessName);

            return Ok(new { message = "Business registered successfully!" });
        }
    }
}

