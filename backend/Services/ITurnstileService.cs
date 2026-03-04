namespace Api.Services
{
    public interface ITurnstileService
    {
        Task<bool> VerifyAsync(string token);
    }
}
