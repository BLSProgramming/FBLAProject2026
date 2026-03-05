using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Models;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OffersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<OffersController> _logger;

        public OffersController(AppDbContext context, ILogger<OffersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Offers/business/{businessUserId}
        [HttpGet("business/{businessUserId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetOffersByBusiness(int businessUserId)
        {
            var offers = await _context.Offers
                .Where(o => o.BusinessUserId == businessUserId)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
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
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<object>> CreateOffer(CreateOfferDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // IDOR check: authenticated user must own the business
            var authUserId = int.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "0");
            if (authUserId != dto.BusinessUserId)
                return Forbid();

            var businessUser = await _context.BusinessUsers.FindAsync(dto.BusinessUserId);
            if (businessUser == null)
                return BadRequest(new { message = $"Business user with ID {dto.BusinessUserId} not found." });

            try
            {
                var offer = new Offer
                {
                    BusinessUserId = dto.BusinessUserId,
                    Label = dto.Label?.Trim() ?? "",
                    Description = dto.Description?.Trim() ?? "",
                    ExpirationDate = DateTime.SpecifyKind(dto.ExpirationDate.Date, DateTimeKind.Utc),
                    PromoCode = !string.IsNullOrWhiteSpace(dto.PromoCode) ? dto.PromoCode.Trim() : null,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.Offers.Add(offer);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Offer {OfferId} created for business {BusinessId}", offer.Id, dto.BusinessUserId);

                return Ok(new
                {
                    message = "Offer created successfully.",
                    offerId = offer.Id,
                    createdAt = offer.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating offer for business {BusinessId}", dto.BusinessUserId);
                return StatusCode(500, new { message = "An error occurred while creating the offer." });
            }
        }

        // PUT: api/Offers/{id}
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOffer(int id, UpdateOfferDto dto)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null)
                return NotFound(new { message = "Offer not found." });

            // IDOR: verify via JWT
            var authUserId = int.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "0");
            if (offer.BusinessUserId != authUserId)
                return Forbid();

            offer.Label = dto.Label.Trim();
            offer.Description = dto.Description.Trim();
            offer.ExpirationDate = dto.ExpirationDate;
            offer.PromoCode = !string.IsNullOrWhiteSpace(dto.PromoCode) ? dto.PromoCode.Trim() : null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Offer updated successfully." });
        }

        // PUT: api/Offers/{id}/toggle
        [Authorize]
        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> ToggleOfferStatus(int id, [FromQuery] int businessUserId)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null)
                return NotFound(new { message = "Offer not found." });

            // IDOR: verify via JWT
            var authUserId = int.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "0");
            if (offer.BusinessUserId != authUserId)
                return Forbid();

            offer.IsActive = !offer.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Offer {(offer.IsActive ? "activated" : "deactivated")} successfully.",
                isActive = offer.IsActive
            });
        }

        // DELETE: api/Offers/{id}
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOffer(int id, [FromQuery] int businessUserId)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null)
                return NotFound(new { message = "Offer not found." });

            // IDOR: verify via JWT
            var authUserId = int.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "0");
            if (offer.BusinessUserId != authUserId)
                return Forbid();

            _context.Offers.Remove(offer);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Offer deleted successfully." });
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