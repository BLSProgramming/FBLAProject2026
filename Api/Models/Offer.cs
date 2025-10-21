namespace Api.Models
{
    public class Offer
    {
        public int Id { get; set; }
        public int BusinessUserId { get; set; }
        public string Label { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTime ExpirationDate { get; set; }
        public string? PromoCode { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
        
        // Navigation property
        public BusinessUser BusinessUser { get; set; } = null!;
    }
}