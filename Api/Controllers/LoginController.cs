using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LoginController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Api.Services.IPasswordHasher _passwordHasher;

        public LoginController(AppDbContext context, Api.Services.IPasswordHasher passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { message = "Email and password are required." });

            var email = req.Email.Trim();

            
            var user = _context.Users.SingleOrDefault(u => u.Email == email);

            
            if (user == null)
            {
                var b = _context.BusinessUsers.SingleOrDefault(bu => bu.Email == email);
                if (b == null) return Unauthorized(new { message = "Invalid credentials." });

                if (!_passwordHasher.Verify(req.Password, b.Password))
                    return Unauthorized(new { message = "Invalid credentials." });

                return Ok(new { message = "Login successful.", userType = "business", id = b.Id });
            }

            if (!_passwordHasher.Verify(req.Password, user.Password))
                return Unauthorized(new { message = "Invalid credentials." });

            return Ok(new { message = "Login successful.", userType = "user", id = user.Id });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
