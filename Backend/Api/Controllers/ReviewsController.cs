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

        public ReviewsController(AppDbContext context)
        {
            _context = context;
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
                                 select new {
                                     r.Id,
                                     r.UserId,
                                     r.Rating,
                                     r.ReviewText,
                                     r.CreatedAt,
                                     // provide both a descriptive ReviewerName and a raw username field
                                     ReviewerName = uj != null && !string.IsNullOrEmpty(uj.Username) ? uj.Username : ("User " + r.UserId),
                                     Username = uj != null ? uj.Username : null
                                 }).ToListAsync();

            return Ok(reviews);
        }

        // POST: api/Reviews
        [HttpPost]
        public async Task<ActionResult<object>> CreateReview(CreateReviewDto dto)
        {
            try
            {
                Console.WriteLine($"Creating review for BusinessUser ID: {dto.BusinessUserId} by User ID: {dto.UserId}");
                
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
                    return BadRequest($"Business with ID {dto.BusinessUserId} not found.");
                }
                
                Console.WriteLine($"BusinessUser found: {businessUser.BusinessName}");

                // Check if user already reviewed this business
                var existingReview = await _context.Reviews
                    .FirstOrDefaultAsync(r => r.BusinessUserId == dto.BusinessUserId && r.UserId == dto.UserId);
                
                if (existingReview != null)
                {
                    Console.WriteLine("User has already reviewed this business");
                    return BadRequest("You have already reviewed this business. You can only submit one review per business.");
                }

                var review = new Review
                {
                    BusinessUserId = dto.BusinessUserId,
                    UserId = dto.UserId,
                    Rating = dto.Rating,
                    ReviewText = dto.ReviewText?.Trim() ?? "",
                    CreatedAt = DateTime.UtcNow
                };

                Console.WriteLine("Adding review to context...");
                _context.Reviews.Add(review);
                
                Console.WriteLine("Saving changes to database...");
                await _context.SaveChangesAsync();
                Console.WriteLine($"Review created successfully with ID: {review.Id}");

                return Ok(new { 
                    message = "Review submitted successfully", 
                    reviewId = review.Id,
                    createdAt = review.CreatedAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating review: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new { 
                    message = "Internal server error", 
                    error = ex.Message 
                });
            }
        }

        // DELETE: api/Reviews/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id, [FromQuery] int userId)
        {
            try
            {
                var review = await _context.Reviews.FindAsync(id);
                if (review == null)
                {
                    return NotFound("Review not found.");
                }

                // Verify the review belongs to the requesting user
                if (review.UserId != userId)
                {
                    return Forbid("You can only delete your own reviews.");
                }

                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Review deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting review: {ex.Message}");
                return StatusCode(500, new { 
                    message = "Internal server error", 
                    error = ex.Message 
                });
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
                return Ok(new { 
                    totalReviews = 0, 
                    averageRating = 0.0,
                    starBreakdown = new { five = 0, four = 0, three = 0, two = 0, one = 0 }
                });
            }

            var averageRating = reviews.Average(r => r.Rating);
            var starBreakdown = new
            {
                five = reviews.Count(r => r.Rating == 5),
                four = reviews.Count(r => r.Rating == 4),
                three = reviews.Count(r => r.Rating == 3),
                two = reviews.Count(r => r.Rating == 2),
                one = reviews.Count(r => r.Rating == 1)
            };

            return Ok(new { 
                totalReviews = reviews.Count, 
                averageRating = Math.Round(averageRating, 1),
                starBreakdown = starBreakdown
            });
        }
    }

    public class CreateReviewDto
    {
        public int BusinessUserId { get; set; }
        public int UserId { get; set; }
        
        [Required]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }
        
        [Required]
        [StringLength(1000, MinimumLength = 10, ErrorMessage = "Review must be between 10 and 1000 characters")]
        public string ReviewText { get; set; } = "";
    }
}