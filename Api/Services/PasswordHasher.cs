using System;
using System.Security.Cryptography;

namespace Api.Services
{
    public class PasswordHasher : IPasswordHasher
    {
        private const int SaltSize = 16; 
        private const int HashSize = 32; 
        private const int Iterations = 100_000;

        
        public string Hash(string password)
        {
            if (password is null) throw new ArgumentNullException(nameof(password));

            var salt = new byte[SaltSize];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256);
            var hash = pbkdf2.GetBytes(HashSize);

            return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
        }

        public bool Verify(string password, string hashed)
        {
            if (password is null) throw new ArgumentNullException(nameof(password));
            if (string.IsNullOrWhiteSpace(hashed)) return false;

            var parts = hashed.Split('.');
            if (parts.Length != 3) return false;

            if (!int.TryParse(parts[0], out var iterations)) return false;
            var salt = Convert.FromBase64String(parts[1]);
            var storedHash = Convert.FromBase64String(parts[2]);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256);
            var candidate = pbkdf2.GetBytes(storedHash.Length);

            if (candidate.Length != storedHash.Length) return false;
            var diff = 0;
            for (int i = 0; i < storedHash.Length; i++) diff |= storedHash[i] ^ candidate[i];
            return diff == 0;
        }
    }
}
