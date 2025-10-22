using System;

namespace Api.Models
{
    public class Bookmark
    {
        public int Id { get; set; }

        
        public int? UserId { get; set; }

        
        public int? BusinessUserId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        
        public BusinessUser? BusinessUser { get; set; }
    }
}
