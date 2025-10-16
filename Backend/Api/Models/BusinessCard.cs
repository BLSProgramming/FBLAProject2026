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
    }
}
