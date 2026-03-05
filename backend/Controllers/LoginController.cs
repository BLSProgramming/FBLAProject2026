using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;
using Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LoginController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtService _jwt;
        private readonly ILogger<LoginController> _logger;

        public LoginController(AppDbContext context, IPasswordHasher passwordHasher, IJwtService jwt, ILogger<LoginController> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _jwt = jwt;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { message = "Email and password are required." });

            var email = req.Email.Trim().ToLowerInvariant();

            // Check regular users first
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                // Check business users
                var b = await _context.BusinessUsers.SingleOrDefaultAsync(bu => bu.Email == email);
                if (b == null) return Unauthorized(new { message = "Invalid credentials." });

                if (!_passwordHasher.Verify(req.Password, b.Password))
                    return Unauthorized(new { message = "Invalid credentials." });

                var bToken = _jwt.GenerateToken(b.Id, "business", b.Email);
                _logger.LogInformation("Business login: {Id}", b.Id);
                return Ok(new { message = "Login successful.", userType = "business", id = b.Id, token = bToken });
            }

            if (!_passwordHasher.Verify(req.Password, user.Password))
                return Unauthorized(new { message = "Invalid credentials." });

            var uToken = _jwt.GenerateToken(user.Id, "user", user.Email);
            _logger.LogInformation("User login: {Id}", user.Id);
            return Ok(new { message = "Login successful.", userType = "user", id = user.Id, token = uToken });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
