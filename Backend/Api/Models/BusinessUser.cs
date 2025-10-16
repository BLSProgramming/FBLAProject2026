namespace Api.Models
{
    public class BusinessUser
    {
        public int Id { get; set; }
        public string BusinessName { get; set; } = "";
        public string Password { get; set; } = "";
        public string Email { get; set; } = "";
        public string BusinessCategory { get; set; } = "";
        
    }
}