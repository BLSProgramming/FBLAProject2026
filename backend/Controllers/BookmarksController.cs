using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookmarksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<BookmarksController> _logger;

        public BookmarksController(AppDbContext context, ILogger<BookmarksController> logger)
        {
            _context = context;
            _logger = logger;
        }

        public class ToggleDto
        {
            public int? UserId { get; set; }
            public int? BusinessUserId { get; set; }
        }

        // GET: api/Bookmarks/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetForUser(int userId)
        {
            var list = await _context.Bookmarks
                .Where(b => b.UserId == userId)
                .Select(b => new { b.Id, b.UserId, b.BusinessUserId, b.CreatedAt })
                .ToListAsync();

            return Ok(list);
        }

        // GET: api/Bookmarks/byBusiness/{businessId}
        [HttpGet("byBusiness/{businessId}")]
        public async Task<IActionResult> GetByBusiness(int businessId)
        {
            var list = await _context.Bookmarks
                .Where(b => b.BusinessUserId == businessId)
                .Select(b => new { b.Id, b.UserId, b.BusinessUserId, b.CreatedAt })
                .ToListAsync();

            return Ok(list);
        }

        // POST: api/Bookmarks/toggle
        [Authorize]
        [HttpPost("toggle")]
        public async Task<IActionResult> Toggle([FromBody] ToggleDto dto)
        {
            if (dto == null || !dto.UserId.HasValue || !dto.BusinessUserId.HasValue)
                return BadRequest(new { message = "userId and businessUserId are required." });

            // IDOR: user can only toggle their own bookmarks
            var authUserId = int.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "0");
            if (authUserId != dto.UserId.Value)
                return Forbid();

            var uid = dto.UserId.Value;
            var bid = dto.BusinessUserId.Value;

            var existing = await _context.Bookmarks
                .FirstOrDefaultAsync(b => b.UserId == uid && b.BusinessUserId == bid);

            if (existing != null)
            {
                _context.Bookmarks.Remove(existing);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Bookmark removed." });
            }

            var bm = new Bookmark { UserId = uid, BusinessUserId = bid, CreatedAt = DateTime.UtcNow };
            _context.Bookmarks.Add(bm);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Bookmark added.", id = bm.Id });
        }

        // DELETE: api/Bookmarks/{id}
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var bm = await _context.Bookmarks.FirstOrDefaultAsync(b => b.Id == id);
            if (bm == null) return NotFound(new { message = "Bookmark not found." });

            // IDOR: only the bookmark owner can delete
            var authUserId = int.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "0");
            if (bm.UserId != authUserId)
                return Forbid();

            _context.Bookmarks.Remove(bm);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Deleted." });
        }
    }
}
