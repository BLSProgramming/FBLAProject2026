using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Models;
using System.ComponentModel.DataAnnotations;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ReviewsController> _logger;

        public ReviewsController(AppDbContext context, ILogger<ReviewsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Reviews/business/{businessUserId}
        [HttpGet("business/{businessUserId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetReviewsByBusiness(int businessUserId)
        {
            var reviews = await (from r in _context.Reviews
                                 where r.BusinessUserId == businessUserId
                                 orderby r.CreatedAt descending
                                 join u in _context.Users on r.UserId equals u.Id into userJoin
                                 from uj in userJoin.DefaultIfEmpty()
                                 select new
                                 {
                                     r.Id,
                                     r.UserId,
                                     r.Rating,
                                     r.ReviewText,
                                     r.CreatedAt,
                                     ReviewerName = uj != null && !string.IsNullOrEmpty(uj.Username) ? uj.Username : ("User " + r.UserId),
                                     Username = uj != null ? uj.Username : null
                                 }).ToListAsync();

            return Ok(reviews);
        }

        // POST: api/Reviews
        [HttpPost]
        public async Task<ActionResult<object>> CreateReview(CreateReviewDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var businessUser = await _context.BusinessUsers.FindAsync(dto.BusinessUserId);
            if (businessUser == null)
                return BadRequest(new { message = $"Business with ID {dto.BusinessUserId} not found." });

            // One review per user per business
            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(r => r.BusinessUserId == dto.BusinessUserId && r.UserId == dto.UserId);

            if (existingReview != null)
                return BadRequest(new { message = "You have already reviewed this business. You can only submit one review per business." });

            try
            {
                var review = new Review
                {
                    BusinessUserId = dto.BusinessUserId,
                    UserId = dto.UserId,
                    Rating = dto.Rating,
                    ReviewText = dto.ReviewText?.Trim() ?? "",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Reviews.Add(review);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Review {ReviewId} created by user {UserId} for business {BusinessId}",
                    review.Id, dto.UserId, dto.BusinessUserId);

                return Ok(new
                {
                    message = "Review submitted successfully.",
                    reviewId = review.Id,
                    createdAt = review.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating review for business {BusinessId}", dto.BusinessUserId);
                return StatusCode(500, new { message = "An error occurred while submitting the review." });
            }
        }

        // DELETE: api/Reviews/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id, [FromQuery] int userId)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
                return NotFound(new { message = "Review not found." });

            if (review.UserId != userId)
                return Forbid();

            try
            {
                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Review deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review {ReviewId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the review." });
            }
        }

        // GET: api/Reviews/stats/{businessUserId}
        [HttpGet("stats/{businessUserId}")]
        public async Task<ActionResult<object>> GetReviewStats(int businessUserId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.BusinessUserId == businessUserId)
                .ToListAsync();

            if (reviews.Count == 0)
            {
                return Ok(new
                {
                    totalReviews = 0,
                    averageRating = 0.0,
                    starBreakdown = new { five = 0, four = 0, three = 0, two = 0, one = 0 }
                });
            }

            var averageRating = reviews.Average(r => r.Rating);

            return Ok(new
            {
                totalReviews = reviews.Count,
                averageRating = Math.Round(averageRating, 1),
                starBreakdown = new
                {
                    five = reviews.Count(r => r.Rating == 5),
                    four = reviews.Count(r => r.Rating == 4),
                    three = reviews.Count(r => r.Rating == 3),
                    two = reviews.Count(r => r.Rating == 2),
                    one = reviews.Count(r => r.Rating == 1)
                }
            });
        }
    }

    public class CreateReviewDto
    {
        public int BusinessUserId { get; set; }
        public int UserId { get; set; }

        [Required]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5.")]
        public int Rating { get; set; }

        [Required]
        [StringLength(1000, MinimumLength = 10, ErrorMessage = "Review must be between 10 and 1000 characters.")]
        public string ReviewText { get; set; } = "";
    }
}