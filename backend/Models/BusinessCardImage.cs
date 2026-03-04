using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models
{
    [Table("Images")]
    public class BusinessCardImage
    {
        public int Id { get; set; }

        // FK to BusinessCard
        public int BusinessCardId { get; set; }
        public BusinessCard? BusinessCard { get; set; }

        // Image URL uploaded/hosted by frontend (could be blob storage URL)
        public string Url { get; set; } = string.Empty;

        // Optional alt text or description
        public string AltText { get; set; } = string.Empty;

        // Order for display
        public int SortOrder { get; set; }

        // Mark one image as the primary/cover image
        public bool IsPrimary { get; set; }

        // Optional text overlay/caption for the image (typically 3 words)
        public string? ImageText { get; set; } = string.Empty;

        // When uploaded
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
