using System.Collections.Generic;

namespace Api.Models
{
    public class BusinessCard
    {
        public int Id { get; set; }
        // FK to the owning BusinessUser
        public int BusinessUserId { get; set; }
        public string Address { get; set; } = "";
        public string City { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Description { get; set; } = "";

        // URL-friendly slug for public pages
        public string Slug { get; set; } = "";

        // Whether this card is published and visible publicly
        public bool IsPublished { get; set; } = true;

        // Optional navigation property
        public BusinessUser? BusinessUser { get; set; }

        // Comma-separated ownership tags (stored for simplicity). Examples: "Black-Owned,Women-Owned"
        public string OwnershipTags { get; set; } = "";
        
        // Category stored per-card (migrated from BusinessUser.BusinessCategory)
        public string BusinessCategory { get; set; } = "";

        // Navigation: images uploaded/managed for this business card
        public ICollection<BusinessCardImage> Images { get; set; } = new List<BusinessCardImage>();
    }
}
