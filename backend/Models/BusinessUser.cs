namespace Api.Models
{
    public class BusinessUser
    {
        public int Id { get; set; }
        public string BusinessName { get; set; } = "";
        public string Password { get; set; } = "";
        public string Email { get; set; } = "";
        // BusinessCategory was migrated to BusinessCard.BusinessCategory and removed from BusinessUser
        
    }
}