using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;
using Api.Services;
using Microsoft.EntityFrameworkCore;
using Google.Apis.Auth;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IJwtService _jwt;
        private readonly ILogger<AuthController> _logger;

        public AuthController(AppDbContext context, IJwtService jwt, ILogger<AuthController> logger)
        {
            _context = context;
            _jwt = jwt;
            _logger = logger;
        }

        public class GoogleRequest
        {
            public string? IdToken { get; set; }
        }

        [HttpPost("google")]
        public async Task<IActionResult> Google([FromBody] GoogleRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.IdToken))
                return BadRequest(new { message = "idToken is required." });

            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings();
                var payload = await GoogleJsonWebSignature.ValidateAsync(req.IdToken, settings);

                if (payload == null || string.IsNullOrWhiteSpace(payload.Email))
                    return Unauthorized(new { message = "Invalid Google token." });

                var email = payload.Email.Trim().ToLowerInvariant();

                // Business accounts must use password login
                var existingBusiness = await _context.BusinessUsers.SingleOrDefaultAsync(b => b.Email == email);
                if (existingBusiness != null)
                {
                    return BadRequest(new { message = "This email is registered as a business account. Business accounts must sign in using their business credentials." });
                }

                // Try to find an existing regular user
                var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == email);
                if (user != null)
                {
                    var loginToken = _jwt.GenerateToken(user.Id, "user", user.Email);
                    _logger.LogInformation("Google login for user {Id}", user.Id);
                    return Ok(new { message = "Google login successful.", userType = "user", id = user.Id, token = loginToken });
                }

                // Create a new regular user (Google-only account)
                var newUser = new User
                {
                    Username = payload.Name ?? email.Split('@')[0],
                    Email = email,
                    Password = ""
                };
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                var regToken = _jwt.GenerateToken(newUser.Id, "user", newUser.Email);
                _logger.LogInformation("Google registration for new user {Id}", newUser.Id);
                return Ok(new { message = "Google registration successful.", userType = "user", id = newUser.Id, token = regToken });
            }
            catch (InvalidJwtException)
            {
                return Unauthorized(new { message = "Invalid Google token." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google auth error");
                return StatusCode(500, new { message = "An error occurred during Google authentication." });
            }
        }
    }
}
