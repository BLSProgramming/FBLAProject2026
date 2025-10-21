namespace Api.Models
{
    public class Review
    {
        public int Id { get; set; }
        public int BusinessUserId { get; set; }  // FK to the business being reviewed
        public int UserId { get; set; }          // FK to the user who wrote the review
        public int Rating { get; set; }          // 1-5 stars
        public string ReviewText { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public BusinessUser BusinessUser { get; set; } = null!;
        // Note: We don't have a User model yet, but we'll use UserId for now
    }
}