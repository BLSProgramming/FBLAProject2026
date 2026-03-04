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
        private readonly ILogger<ManageBusinessController> _logger;

        // Upload constraints
        private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
            { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg" };
        private const long MaxUploadBytes = 10 * 1024 * 1024; // 10 MB

        // Input length limits
        private const int MaxAddressLength = 200;
        private const int MaxCityLength = 100;
        private const int MaxPhoneLength = 30;
        private const int MaxDescriptionLength = 2000;
        private const int MaxCategoryLength = 100;

        public ManageBusinessController(AppDbContext context, ILogger<ManageBusinessController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ---------- DTOs ----------

        public class SaveDto
        {
            public int Id { get; set; }
            public string? Address { get; set; }
            public string? City { get; set; }
            public string? Phone { get; set; }
            public string? Description { get; set; }
            public string? BusinessCategory { get; set; }
            public bool? IsPublished { get; set; }
            public string[]? OwnershipTags { get; set; }
        }

        public class ImageDto
        {
            public int? Id { get; set; }
            public string Url { get; set; } = string.Empty;
            public string? AltText { get; set; }
            public int SortOrder { get; set; }
            public bool IsPrimary { get; set; }
            public string? ImageText { get; set; } = string.Empty;
        }

        // ---------- Save ----------

        [HttpPost("save")]
        public async Task<IActionResult> Save([FromBody] SaveDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid payload." });

            // Input length validation
            if (dto.Address?.Length > MaxAddressLength)
                return BadRequest(new { message = $"Address must be {MaxAddressLength} characters or fewer." });
            if (dto.City?.Length > MaxCityLength)
                return BadRequest(new { message = $"City must be {MaxCityLength} characters or fewer." });
            if (dto.Phone?.Length > MaxPhoneLength)
                return BadRequest(new { message = $"Phone must be {MaxPhoneLength} characters or fewer." });
            if (dto.Description?.Length > MaxDescriptionLength)
                return BadRequest(new { message = $"Description must be {MaxDescriptionLength} characters or fewer." });
            if (dto.BusinessCategory?.Length > MaxCategoryLength)
                return BadRequest(new { message = $"Category must be {MaxCategoryLength} characters or fewer." });

            var business = await _context.BusinessUsers.FirstOrDefaultAsync(b => b.Id == dto.Id);
            if (business == null) return NotFound(new { message = "Business not found." });

            var ownershipTags = dto.OwnershipTags != null
                ? string.Join(',', dto.OwnershipTags.Where(t => !string.IsNullOrWhiteSpace(t)))
                : string.Empty;

            // Upsert: update existing card or create a new one
            var card = await _context.BusinessCards.FirstOrDefaultAsync(c => c.BusinessUserId == dto.Id);

            if (card == null)
            {
                card = new BusinessCard
                {
                    BusinessUserId = dto.Id,
                    Address = dto.Address ?? string.Empty,
                    City = dto.City ?? string.Empty,
                    Phone = dto.Phone ?? string.Empty,
                    Description = dto.Description ?? string.Empty,
                    OwnershipTags = ownershipTags,
                    BusinessCategory = dto.BusinessCategory ?? string.Empty,
                    IsPublished = dto.IsPublished ?? true,
                    Slug = await GenerateUniqueSlugAsync(business.BusinessName, dto.Id)
                };
                _context.BusinessCards.Add(card);
            }
            else
            {
                card.Address = dto.Address ?? string.Empty;
                card.City = dto.City ?? string.Empty;
                card.Phone = dto.Phone ?? string.Empty;
                card.Description = dto.Description ?? string.Empty;

                if (dto.OwnershipTags != null)
                    card.OwnershipTags = ownershipTags;

                if (!string.IsNullOrWhiteSpace(dto.BusinessCategory))
                    card.BusinessCategory = dto.BusinessCategory;

                if (dto.IsPublished.HasValue)
                    card.IsPublished = dto.IsPublished.Value;

                if (string.IsNullOrWhiteSpace(card.Slug))
                    card.Slug = await GenerateUniqueSlugAsync(business.BusinessName, dto.Id, card.Id);

                _context.BusinessCards.Update(card);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Business card saved for {BusinessId}, cardId={CardId}", dto.Id, card.Id);

            return Ok(new { message = "Business card saved.", cardId = card.Id, slug = card.Slug });
        }

        // ---------- Toggle Publish ----------

        [HttpPost("toggle-publish/{businessId}")]
        public async Task<IActionResult> TogglePublish(int businessId, [FromQuery] bool publish)
        {
            var business = await _context.BusinessUsers.FirstOrDefaultAsync(b => b.Id == businessId);
            if (business == null) return NotFound(new { message = "Business not found." });

            var card = await _context.BusinessCards.FirstOrDefaultAsync(c => c.BusinessUserId == businessId);
            if (card == null) return NotFound(new { message = "Business card not found." });

            card.IsPublished = publish;
            _context.BusinessCards.Update(card);
            await _context.SaveChangesAsync();

            return Ok(new { message = publish ? "Card published." : "Card unpublished.", isPublished = card.IsPublished, cardId = card.Id, slug = card.Slug });
        }

        // ---------- List Cards ----------

        [HttpGet("cards")]
        public async Task<IActionResult> ListCards()
        {
            var entities = await _context.BusinessCards
                .Include(bc => bc.BusinessUser)
                .ToListAsync();

            var list = entities.Select(bc => new
            {
                bc.Id,
                bc.BusinessUserId,
                bc.Slug,
                bc.IsPublished,
                BusinessName = bc.BusinessUser?.BusinessName ?? string.Empty,
                Category = bc.BusinessCategory ?? string.Empty,
                bc.City,
                bc.Address,
                bc.Description,
                OwnershipTags = string.IsNullOrWhiteSpace(bc.OwnershipTags)
                    ? Array.Empty<string>()
                    : bc.OwnershipTags.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(s => s.Trim()).ToArray()
            }).ToList();

            return Ok(list);
        }

        // ---------- Get by Slug ----------

        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var cardEntity = await _context.BusinessCards
                .Include(bc => bc.BusinessUser)
                .FirstOrDefaultAsync(bc => bc.Slug == slug);

            if (cardEntity == null) return NotFound(new { message = "Business card not found." });

            var ownershipTagsArray = string.IsNullOrWhiteSpace(cardEntity.OwnershipTags)
                ? Array.Empty<string>()
                : cardEntity.OwnershipTags.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim()).ToArray();

            return Ok(new
            {
                Id = cardEntity.BusinessUserId,
                cardEntity.Slug,
                cardEntity.IsPublished,
                BusinessName = cardEntity.BusinessUser?.BusinessName ?? string.Empty,
                Email = cardEntity.BusinessUser?.Email ?? string.Empty,
                Category = cardEntity.BusinessCategory ?? string.Empty,
                cardEntity.Address,
                cardEntity.City,
                cardEntity.Phone,
                cardEntity.Description,
                OwnershipTags = ownershipTagsArray
            });
        }

        // ---------- Upload Image ----------

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage()
        {
            if (!Request.HasFormContentType)
                return BadRequest(new { message = "Expected multipart/form-data." });

            var form = await Request.ReadFormAsync();
            var file = form.Files.FirstOrDefault();

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            // Validate file size
            if (file.Length > MaxUploadBytes)
                return BadRequest(new { message = $"File exceeds the {MaxUploadBytes / (1024 * 1024)} MB limit." });

            // Validate file extension
            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(ext) || !AllowedImageExtensions.Contains(ext))
                return BadRequest(new { message = $"Only image files are allowed ({string.Join(", ", AllowedImageExtensions)})." });

            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
            if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

            var fileName = Guid.NewGuid().ToString() + ext;
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            var request = HttpContext.Request;
            var baseUrl = $"{request.Scheme}://{request.Host.Value}";
            var publicPath = $"{baseUrl}/uploads/{fileName}";

            _logger.LogInformation("Image uploaded: {FileName} ({Bytes} bytes)", fileName, file.Length);

            return Ok(new { path = publicPath });
        }

        // ---------- Get Images ----------

        [HttpGet("images/{businessId}")]
        public async Task<IActionResult> GetImages(int businessId)
        {
            var card = await _context.BusinessCards
                .Include(bc => bc.Images)
                .FirstOrDefaultAsync(bc => bc.BusinessUserId == businessId);

            if (card == null) return NotFound(new { message = "Business card not found." });

            var images = card.Images
                .OrderBy(i => i.SortOrder)
                .Select(i => new ImageDto
                {
                    Id = i.Id,
                    Url = i.Url,
                    AltText = i.AltText,
                    SortOrder = i.SortOrder,
                    IsPrimary = i.IsPrimary,
                    ImageText = i.ImageText
                }).ToArray();

            return Ok(images);
        }

        // ---------- Save Images (transactional) ----------

        [HttpPost("images/{businessId}")]
        public async Task<IActionResult> SaveImages(int businessId, [FromBody] ImageDto[] images)
        {
            if (images == null) return BadRequest(new { message = "Invalid payload." });

            var business = await _context.BusinessUsers.FirstOrDefaultAsync(b => b.Id == businessId);
            if (business == null) return NotFound(new { message = "Business not found." });

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var card = await _context.BusinessCards
                    .Include(bc => bc.Images)
                    .FirstOrDefaultAsync(bc => bc.BusinessUserId == businessId);

                if (card == null)
                {
                    card = new BusinessCard
                    {
                        BusinessUserId = businessId,
                        Address = string.Empty,
                        City = string.Empty,
                        Phone = string.Empty,
                        Description = string.Empty,
                        OwnershipTags = string.Empty,
                        BusinessCategory = string.Empty,
                        IsPublished = false,
                        Slug = await GenerateUniqueSlugAsync(business.BusinessName, businessId)
                    };
                    _context.BusinessCards.Add(card);
                    await _context.SaveChangesAsync();

                    card = await _context.BusinessCards
                        .Include(bc => bc.Images)
                        .FirstAsync(bc => bc.BusinessUserId == businessId);
                }

                // Remove old images
                if (card.Images != null && card.Images.Any())
                {
                    _context.Images.RemoveRange(card.Images);
                }

                // Ensure only one image is primary
                var primaryCount = 0;
                foreach (var img in images)
                {
                    if (img.IsPrimary) primaryCount++;
                    if (primaryCount > 1) img.IsPrimary = false;
                }

                var newImages = images.Select(i => new BusinessCardImage
                {
                    BusinessCardId = card.Id,
                    Url = i.Url ?? string.Empty,
                    AltText = i.AltText ?? string.Empty,
                    SortOrder = i.SortOrder,
                    IsPrimary = i.IsPrimary,
                    ImageText = i.ImageText ?? string.Empty
                }).ToList();

                if (newImages.Any()) _context.Images.AddRange(newImages);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Images saved for business {BusinessId}: {Count} images", businessId, newImages.Count);

                return Ok(new { message = "Images saved.", count = newImages.Count });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to save images for business {BusinessId}", businessId);
                return StatusCode(500, new { message = "An error occurred while saving images." });
            }
        }

        // ---------- Helpers ----------

        private async Task<string> GenerateUniqueSlugAsync(string? businessName, int businessId, int? excludeCardId = null)
        {
            var baseSlug = GenerateSlug(businessName ?? "business") + "-" + businessId;
            var slug = baseSlug;
            var suffix = 1;

            while (await _context.BusinessCards.AnyAsync(bc => bc.Slug == slug && (excludeCardId == null || bc.Id != excludeCardId)))
            {
                slug = $"{baseSlug}-{suffix++}";
            }

            return slug;
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

            var result = sb.ToString();
            while (result.Contains("--")) result = result.Replace("--", "-");
            return result.Trim('-');
        }
    }
}
