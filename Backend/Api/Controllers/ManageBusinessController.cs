using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ManageBusinessController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ManageBusinessController(AppDbContext context)
        {
            _context = context;
        }

        public class SaveDto
        {
            public int Id { get; set; }
            public string? Address { get; set; }
            public string? City { get; set; }
            public string? Phone { get; set; }
            public string? Description { get; set; }
            public string? BusinessCategory { get; set; }
            public bool? IsPublished { get; set; }
        }

        [HttpPost("save")]
        public IActionResult Save([FromBody] SaveDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid payload." });

            // Determine caller id from claims if available
            int? callerId = null;
            if (User?.Identity?.IsAuthenticated == true)
            {
                // try common claim types
                var sub = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type.EndsWith("/nameidentifier"));
                if (sub != null && int.TryParse(sub.Value, out var parsed)) callerId = parsed;
                var idClaim = User.Claims.FirstOrDefault(c => c.Type == "id");
                if (idClaim != null && int.TryParse(idClaim.Value, out parsed)) callerId = parsed;
            }

            // If we have a callerId, require it to match dto.Id
            if (callerId.HasValue && callerId.Value != dto.Id)
            {
                return Forbid();
            }

            var business = _context.BusinessUsers.FirstOrDefault(b => b.Id == dto.Id);
            if (business == null) return NotFound(new { message = "Business not found." });

            // persist any business-level fields (category) to BusinessUser
            if (!string.IsNullOrWhiteSpace(dto.BusinessCategory))
            {
                business.BusinessCategory = dto.BusinessCategory;
                _context.BusinessUsers.Update(business);
            }

            // upsert: if a card exists for this business, update it; otherwise create a new one
            var card = _context.BusinessCards.FirstOrDefault(c => c.BusinessUserId == dto.Id);
            if (card == null)
            {
                card = new BusinessCard
                {
                    BusinessUserId = dto.Id,
                    Address = dto.Address ?? string.Empty,
                    City = dto.City ?? string.Empty,
                    Phone = dto.Phone ?? string.Empty,
                    Description = dto.Description ?? string.Empty
                    // default IsPublished remains true (model default)
                };
                // generate a slug on creation
                var baseSlug = GenerateSlug(business.BusinessName ?? "business") + "-" + dto.Id;
                var slug = baseSlug;
                var suffix = 1;
                while (_context.BusinessCards.Any(bc => bc.Slug == slug))
                {
                    slug = baseSlug + "-" + suffix++;
                }
                card.Slug = slug;
                _context.BusinessCards.Add(card);
            }
            else
            {
                card.Address = dto.Address ?? string.Empty;
                card.City = dto.City ?? string.Empty;
                card.Phone = dto.Phone ?? string.Empty;
                card.Description = dto.Description ?? string.Empty;
                // If IsPublished sent explicitly, update publish flag (publishing action)
                if (dto.IsPublished.HasValue)
                {
                    card.IsPublished = dto.IsPublished.Value;
                }
                
                if (string.IsNullOrWhiteSpace(card.Slug))
                {
                    var baseSlug = GenerateSlug(business.BusinessName ?? "business") + "-" + dto.Id;
                    var slug = baseSlug;
                    var suffix = 1;
                    while (_context.BusinessCards.Any(bc => bc.Slug == slug && bc.Id != card.Id))
                    {
                        slug = baseSlug + "-" + suffix++;
                    }
                    card.Slug = slug;
                }
                _context.BusinessCards.Update(card);
            }

            _context.SaveChanges();

            return Ok(new { message = "Business card saved.", cardId = card.Id, slug = card.Slug });
        }

        // POST: api/ManageBusiness/toggle-publish/{businessId}
        [HttpPost("toggle-publish/{businessId}")]
        public IActionResult TogglePublish(int businessId, [FromQuery] bool publish)
        {
            // Verify caller owns this business (if auth is available)
            int? callerId = null;
            if (User?.Identity?.IsAuthenticated == true)
            {
                var sub = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type.EndsWith("/nameidentifier"));
                if (sub != null && int.TryParse(sub.Value, out var parsed)) callerId = parsed;
                var idClaim = User.Claims.FirstOrDefault(c => c.Type == "id");
                if (idClaim != null && int.TryParse(idClaim.Value, out parsed)) callerId = parsed;
            }

            var business = _context.BusinessUsers.FirstOrDefault(b => b.Id == businessId);
            if (business == null) return NotFound(new { message = "Business not found." });

            if (callerId.HasValue && callerId.Value != businessId) return Forbid();

            var card = _context.BusinessCards.FirstOrDefault(c => c.BusinessUserId == businessId);
            if (card == null) return NotFound(new { message = "Business card not found." });

            card.IsPublished = publish;
            _context.BusinessCards.Update(card);
            _context.SaveChanges();

            return Ok(new { message = publish ? "Card published" : "Card unpublished", isPublished = card.IsPublished });
        }

        [HttpGet("cards")]
        public IActionResult ListCards()
        {
            var list = _context.BusinessCards
                .Select(bc => new
                {
                    bc.Id,
                    BusinessUserId = bc.BusinessUserId,
                    bc.Slug,
                    BusinessName = bc.BusinessUser != null ? bc.BusinessUser.BusinessName : string.Empty,
                    Category = bc.BusinessUser != null ? bc.BusinessUser.BusinessCategory : string.Empty,
                    bc.City,
                    bc.Description
                }).ToList();

            return Ok(list);
        }

        [HttpGet("slug/{slug}")]
        public IActionResult GetBySlug(string slug)
        {
            var card = _context.BusinessCards
                .Where(bc => bc.Slug == slug)
                .Select(bc => new
                {
                    Id = bc.BusinessUserId, // Return BusinessUserId, not Card ID
                    bc.Slug,
                    BusinessName = bc.BusinessUser != null ? bc.BusinessUser.BusinessName : string.Empty,
                    Email = bc.BusinessUser != null ? bc.BusinessUser.Email : string.Empty,
                    Category = bc.BusinessUser != null ? bc.BusinessUser.BusinessCategory : string.Empty,
                    bc.Address,
                    bc.City,
                    bc.Phone,
                    bc.Description
                }).FirstOrDefault();

            if (card == null) return NotFound();
            return Ok(card);
        }
        private static string GenerateSlug(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return "business";
            var s = input.ToLowerInvariant();
            
            var sb = new System.Text.StringBuilder();
            foreach (var ch in s)
            {
                if (char.IsLetterOrDigit(ch)) sb.Append(ch);
                else if (char.IsWhiteSpace(ch) || ch == '-' || ch == '_') sb.Append('-');
            }
            var outp = sb.ToString();
           
            while (outp.Contains("--")) outp = outp.Replace("--", "-");
            return outp.Trim('-');
        }
    }
}
