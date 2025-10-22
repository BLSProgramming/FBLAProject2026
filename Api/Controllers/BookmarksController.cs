using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookmarksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BookmarksController(AppDbContext context)
        {
            _context = context;
        }

        public class ToggleDto
        {
            public int? UserId { get; set; }
            public int? BusinessUserId { get; set; }
        }

        // GET: api/Bookmarks/user/{userId}
        [HttpGet("user/{userId}")]
        public IActionResult GetForUser(int userId)
        {
            var list = _context.Bookmarks
                .Where(b => b.UserId == userId)
                .Select(b => new { b.Id, b.UserId, b.BusinessUserId, b.CreatedAt })
                .ToList();
            return Ok(list);
        }

        // GET: api/Bookmarks/byBusiness/{businessId}
        [HttpGet("byBusiness/{businessId}")]
        public IActionResult GetByBusiness(int businessId)
        {
            var list = _context.Bookmarks
                .Where(b => b.BusinessUserId == businessId)
                .Select(b => new { b.Id, b.UserId, b.BusinessUserId, b.CreatedAt })
                .ToList();
            return Ok(list);
        }

        // POST: api/Bookmarks/toggle
        // body: { userId, businessUserId }
        [HttpPost("toggle")]
        public IActionResult Toggle([FromBody] ToggleDto dto)
        {
            if (dto == null || (!dto.UserId.HasValue && !dto.BusinessUserId.HasValue))
            {
                return BadRequest(new { message = "Invalid payload." });
            }

            // Prefer authenticated claim for user if available
            int? callerId = null;
            if (User?.Identity?.IsAuthenticated == true)
            {
                var sub = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type.EndsWith("/nameidentifier"));
                if (sub != null && int.TryParse(sub.Value, out var parsed)) callerId = parsed;
                var idClaim = User.Claims.FirstOrDefault(c => c.Type == "id");
                if (idClaim != null && int.TryParse(idClaim.Value, out parsed)) callerId = parsed;
            }

            var uid = dto.UserId ?? callerId;
            var bid = dto.BusinessUserId;
            if (!uid.HasValue || !bid.HasValue) return BadRequest(new { message = "userId and businessUserId required." });

            var existing = _context.Bookmarks.FirstOrDefault(b => b.UserId == uid.Value && b.BusinessUserId == bid.Value);
            if (existing != null)
            {
                _context.Bookmarks.Remove(existing);
                _context.SaveChanges();
                return Ok(new { message = "Bookmark removed." });
            }

            var bm = new Bookmark { UserId = uid.Value, BusinessUserId = bid.Value, CreatedAt = DateTime.UtcNow };
            _context.Bookmarks.Add(bm);
            _context.SaveChanges();
            return Ok(new { message = "Bookmark added.", id = bm.Id });
        }

        // DELETE: api/Bookmarks/{id}
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var bm = _context.Bookmarks.FirstOrDefault(b => b.Id == id);
            if (bm == null) return NotFound(new { message = "Bookmark not found." });
            _context.Bookmarks.Remove(bm);
            _context.SaveChanges();
            return Ok(new { message = "Deleted." });
        }
    }
}
