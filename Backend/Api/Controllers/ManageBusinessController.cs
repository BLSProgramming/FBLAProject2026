using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;

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
            // optional ownership tags from frontend (multiple selection)
            public string[]? OwnershipTags { get; set; }
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

            // persist category on the BusinessCard (migrated from BusinessUser)

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
                        ,
                        OwnershipTags = dto.OwnershipTags != null ? string.Join(',', dto.OwnershipTags.Where(t => !string.IsNullOrWhiteSpace(t))) : string.Empty,
                        BusinessCategory = dto.BusinessCategory ?? string.Empty,
                        IsPublished = dto.IsPublished ?? true
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
                    if (dto.OwnershipTags != null)
                    {
                        card.OwnershipTags = string.Join(',', dto.OwnershipTags.Where(t => !string.IsNullOrWhiteSpace(t)));
                    }
                    if (!string.IsNullOrWhiteSpace(dto.BusinessCategory))
                    {
                        card.BusinessCategory = dto.BusinessCategory;
                    }
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

            return Ok(new { message = publish ? "Card published" : "Card unpublished", isPublished = card.IsPublished, cardId = card.Id, slug = card.Slug });
        }

        [HttpGet("cards")]
        public IActionResult ListCards()
        {
            // Load entities with related BusinessUser then map to DTO to allow parsing OwnershipTags in-memory
            var entities = _context.BusinessCards
                .Include(bc => bc.BusinessUser)
                .ToList();
            var list = entities.Select(bc => new
            {
                bc.Id,
                BusinessUserId = bc.BusinessUserId,
                bc.Slug,
                IsPublished = bc.IsPublished,
                BusinessName = bc.BusinessUser != null ? bc.BusinessUser.BusinessName : string.Empty,
                Category = bc.BusinessCategory ?? string.Empty,
                bc.City,
                bc.Description,
                OwnershipTags = string.IsNullOrWhiteSpace(bc.OwnershipTags)
                    ? new string[0]
                    : bc.OwnershipTags.Split(new[] {','}, System.StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToArray()
            }).ToList();

            return Ok(list);
        }

        [HttpGet("slug/{slug}")]
        public IActionResult GetBySlug(string slug)
        {
            // Load the card entity with its BusinessUser first to avoid translating string.Split in EF queries
            var cardEntity = _context.BusinessCards
                .Include(bc => bc.BusinessUser)
                .FirstOrDefault(bc => bc.Slug == slug);
            if (cardEntity == null) return NotFound();

            var ownershipTagsArray = new string[0];
            if (!string.IsNullOrWhiteSpace(cardEntity.OwnershipTags))
            {
                ownershipTagsArray = cardEntity.OwnershipTags
                    .Split(new[] {','}, System.StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim()).ToArray();
            }

            var card = new
            {
                Id = cardEntity.BusinessUserId,
                cardEntity.Slug,
                IsPublished = cardEntity.IsPublished,
                BusinessName = cardEntity.BusinessUser != null ? cardEntity.BusinessUser.BusinessName : string.Empty,
                Email = cardEntity.BusinessUser != null ? cardEntity.BusinessUser.Email : string.Empty,
                Category = cardEntity.BusinessCategory ?? string.Empty,
                cardEntity.Address,
                cardEntity.City,
                cardEntity.Phone,
                cardEntity.Description,
                OwnershipTags = ownershipTagsArray
            };

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
