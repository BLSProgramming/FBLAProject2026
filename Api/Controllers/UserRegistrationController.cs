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

        public UserRegistrationController(AppDbContext context, Api.Services.IPasswordHasher passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] User request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                return BadRequest(new { message = "All fields are required." });

            
            request.Username = request.Username.Trim();

            if (request.Username.Length < 6 || request.Username.Length > 14)
                return BadRequest(new { message = "Username must be between 6 and 14 characters." });

            // Allow internal spaces in usernames
            if (!System.Text.RegularExpressions.Regex.IsMatch(request.Username, "^[A-Za-z0-9_ ]+$"))
                return BadRequest(new { message = "Username may not contain special characters" });

            if (request.Password.Length < 8)
                return BadRequest(new { message = "Password must be at least 8 characters long." });

            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Email is required." });

            // Normalize email to lower-case for consistent comparisons/storage
            request.Email = request.Email.Trim().ToLowerInvariant();

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
            var normalizedUsername = request.Username.ToLowerInvariant();
            if (_context.Users.Any(u => u.Username.ToLower() == normalizedUsername))
                return BadRequest(new { message = "Username already exists." });

            if (_context.Users.Any(u => u.Email == request.Email))
                return BadRequest(new { message = "Email already registered." });

            // Prevent reusing an email already registered as a business
            if (_context.BusinessUsers.Any(b => b.Email == request.Email))
                return BadRequest(new { message = "Email already registered as a business. Contact Support" });

            var hashed = _passwordHasher.Hash(request.Password);

            var user = new User
            {
                Username = request.Username,
                Password = hashed
                ,
                Email = request.Email
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

