using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Models;
using System.ComponentModel.DataAnnotations;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OffersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OffersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Offers/business/{businessUserId}
        [HttpGet("business/{businessUserId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetOffersByBusiness(int businessUserId)
        {
            var offers = await _context.Offers
                .Where(o => o.BusinessUserId == businessUserId)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new {
                    o.Id,
                    o.Label,
                    o.Description,
                    o.ExpirationDate,
                    o.PromoCode,
                    o.CreatedAt,
                    o.IsActive
                })
                .ToListAsync();

            return Ok(offers);
        }

        // POST: api/Offers
        [HttpPost]
        public async Task<ActionResult<object>> CreateOffer(CreateOfferDto dto)
        {
            try
            {
                Console.WriteLine($"Creating offer for BusinessUser ID: {dto.BusinessUserId}");
                
                if (!ModelState.IsValid)
                {
                    Console.WriteLine("Model validation failed");
                    return BadRequest(ModelState);
                }

                // Verify business user exists
                var businessUser = await _context.BusinessUsers.FindAsync(dto.BusinessUserId);
                if (businessUser == null)
                {
                    Console.WriteLine($"BusinessUser with ID {dto.BusinessUserId} not found");
                    return BadRequest($"Business user with ID {dto.BusinessUserId} not found.");
                }
                
                Console.WriteLine($"BusinessUser found: {businessUser.BusinessName}");

                var offer = new Offer
                {
                    BusinessUserId = dto.BusinessUserId,
                    Label = dto.Label?.Trim() ?? "",
                    Description = dto.Description?.Trim() ?? "",
                    ExpirationDate = DateTime.SpecifyKind(dto.ExpirationDate.Date, DateTimeKind.Utc), // Ensure UTC
                    PromoCode = !string.IsNullOrWhiteSpace(dto.PromoCode) ? dto.PromoCode.Trim() : null,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                Console.WriteLine("Adding offer to context...");
                _context.Offers.Add(offer);
                
                Console.WriteLine("Saving changes to database...");
                await _context.SaveChangesAsync();
                Console.WriteLine($"Offer created successfully with ID: {offer.Id}");

                return Ok(new { 
                    message = "Offer created successfully", 
                    offerId = offer.Id,
                    createdAt = offer.CreatedAt
                });
            }
            catch (Exception ex)
            {
                // Log the exception details
                Console.WriteLine($"Error creating offer: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new { 
                    message = "Internal server error", 
                    error = ex.Message 
                });
            }
        }

        // PUT: api/Offers/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOffer(int id, UpdateOfferDto dto)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null)
            {
                return NotFound("Offer not found.");
            }

            // Verify the offer belongs to the requesting business user
            if (offer.BusinessUserId != dto.BusinessUserId)
            {
                return Forbid("You can only update your own offers.");
            }

            offer.Label = dto.Label.Trim();
            offer.Description = dto.Description.Trim();
            offer.ExpirationDate = dto.ExpirationDate;
            offer.PromoCode = !string.IsNullOrWhiteSpace(dto.PromoCode) ? dto.PromoCode.Trim() : null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Offer updated successfully" });
        }

        // PUT: api/Offers/{id}/toggle
        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> ToggleOfferStatus(int id, [FromQuery] int businessUserId)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null)
            {
                return NotFound("Offer not found.");
            }

            // Verify the offer belongs to the requesting business user
            if (offer.BusinessUserId != businessUserId)
            {
                return Forbid("You can only modify your own offers.");
            }

            offer.IsActive = !offer.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = $"Offer {(offer.IsActive ? "activated" : "deactivated")} successfully",
                isActive = offer.IsActive
            });
        }

        // DELETE: api/Offers/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOffer(int id, [FromQuery] int businessUserId)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null)
            {
                return NotFound("Offer not found.");
            }

            // Verify the offer belongs to the requesting business user
            if (offer.BusinessUserId != businessUserId)
            {
                return Forbid("You can only delete your own offers.");
            }

            // Hard delete the offer
            _context.Offers.Remove(offer);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Offer deleted successfully" });
        }

        // TEMPORARY: Debug data - check what businesses and offers exist
        [HttpGet("debug-data")]
        public async Task<IActionResult> DebugData()
        {
            var businesses = await _context.BusinessUsers
                .Select(b => new { b.Id, b.BusinessName, b.Email })
                .ToListAsync();

            var offers = await _context.Offers
                .Select(o => new { o.Id, o.BusinessUserId, o.Label, o.Description })
                .ToListAsync();

            var cards = await _context.BusinessCards
                .Select(c => new { c.Id, c.BusinessUserId, c.Slug, c.Address, c.City })
                .ToListAsync();

            return Ok(new { 
                businesses = businesses,
                offers = offers,
                cards = cards,
                summary = new {
                    businessCount = businesses.Count,
                    offerCount = offers.Count,
                    cardCount = cards.Count
                }
            });
        }
    }

    public class CreateOfferDto
    {
        public int BusinessUserId { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Label { get; set; } = "";
        
        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = "";
        
        [Required]
        public DateTime ExpirationDate { get; set; }
        
        [StringLength(50)]
        public string? PromoCode { get; set; }
    }

    public class UpdateOfferDto
    {
        public int BusinessUserId { get; set; }
        public string Label { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTime ExpirationDate { get; set; }
        public string? PromoCode { get; set; }
    }
}