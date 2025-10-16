using Microsoft.EntityFrameworkCore;
using Api.Models;

namespace Api.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Api.Models.BusinessUser> BusinessUsers { get; set; }
        public DbSet<Api.Models.BusinessCard> BusinessCards { get; set; }
        public DbSet<Api.Models.Offer> Offers { get; set; }
        public DbSet<Api.Models.Review> Reviews { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }
    }
}