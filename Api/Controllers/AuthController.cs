using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;
using Google.Apis.Auth;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        public class GoogleRequest
        {
            public string? IdToken { get; set; }
        }

        [HttpPost("google")]
        public async Task<IActionResult> Google([FromBody] GoogleRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.IdToken)) return BadRequest(new { message = "idToken is required" });

            try
            {
                
                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    
                };
                var payload = await GoogleJsonWebSignature.ValidateAsync(req.IdToken, settings);

                if (payload == null || string.IsNullOrWhiteSpace(payload.Email)) return Unauthorized(new { message = "Invalid Google token" });

                var email = payload.Email.Trim().ToLowerInvariant();

                
                var existingBusiness = _context.BusinessUsers.SingleOrDefault(b => b.Email == email);
                if (existingBusiness != null)
                {
                    
                    return BadRequest(new { message = "This email is registered as a business account. Business accounts must sign in using their business credentials (create a password during business registration)." });
                }

                // Try to find an existing regular user
                var user = _context.Users.SingleOrDefault(u => u.Email == email);
                if (user != null)
                {
                    return Ok(new { message = "Google login successful.", userType = "user", id = user.Id });
                }

                // No user found: create a new regular user (Google-only account)
                var newUser = new User
                {
                    Username = payload.Name ?? email.Split('@')[0],
                    Email = email,
                    Password = ""
                };
                _context.Users.Add(newUser);
                _context.SaveChanges();

                return Ok(new { message = "Google registration successful.", userType = "user", id = newUser.Id });
            }
            catch (InvalidJwtException iv)
            {
                return Unauthorized(new { message = "Invalid token: " + iv.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Google auth error: " + ex.Message });
            }
        }
    }
}
