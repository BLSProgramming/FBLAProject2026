using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;
using System.Linq;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BusinessRegistrationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Api.Services.IPasswordHasher _passwordHasher;

        public BusinessRegistrationController(AppDbContext context, Api.Services.IPasswordHasher passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] BusinessUser request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.BusinessName) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "All fields are required." });

            if (request.BusinessName.Length < 6 || request.BusinessName.Length > 40)
                return BadRequest(new { message = "Business Name must be between 6 and 40 characters." });

            if (!System.Text.RegularExpressions.Regex.IsMatch(request.BusinessName, "^[_A-Za-z0-9 ]+$"))
                return BadRequest(new { message = "Business Name may only contain letters, numbers, underscores and spaces." });

            if (request.Password.Length < 8)
                return BadRequest(new { message = "Password must be at least 8 characters long." });

            // Normalize email to lower-case for consistent comparisons/storage
            request.Email = request.Email.Trim().ToLowerInvariant();

            try
            {
                var addr = new System.Net.Mail.MailAddress(request.Email);
                if (addr.Address != request.Email) return BadRequest(new { message = "Invalid email address." });
            }
            catch
            {
                return BadRequest(new { message = "Invalid email address." });
            }

            if (_context.BusinessUsers.Any(u => u.BusinessName == request.BusinessName))
                return BadRequest(new { message = "Business is already registered. Contact Support." });


            if (_context.BusinessUsers.Any(u => u.Email == request.Email))
                return BadRequest(new { message = "Email already registered." });

            // Prevent reusing an email already registered as a normal user
            if (_context.Users.Any(u => u.Email == request.Email))
                return BadRequest(new { message = "Email already registered as a user. Contact support" });

            // BusinessCategory is now optional at registration; businesses can set it later in ManageBusiness

            var hashed = _passwordHasher.Hash(request.Password);

            var business = new BusinessUser
            {
                BusinessName = request.BusinessName,
                Password = hashed,
                Email = request.Email,
                // BusinessCategory moved to BusinessCard; do not persist here
            };

            _context.BusinessUsers.Add(business);
            _context.SaveChanges();

            return Ok(new { message = "Business registered successfully!" });
        }

        [HttpGet("all")]
        public IActionResult GetAll()
        {
            var users = _context.BusinessUsers
                .Select(u => new { u.Id, u.BusinessName, u.Email })
                .ToList();

            return Ok(users);
        }
    }
}

