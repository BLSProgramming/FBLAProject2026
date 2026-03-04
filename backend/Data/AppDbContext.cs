using Microsoft.EntityFrameworkCore;
using Api.Models;

namespace Api.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<BusinessUser> BusinessUsers { get; set; }
        public DbSet<BusinessCard> BusinessCards { get; set; }
        public DbSet<BusinessCardImage> Images { get; set; }
        public DbSet<Bookmark> Bookmarks { get; set; }
        public DbSet<Offer> Offers { get; set; }
        public DbSet<Review> Reviews { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ---------- User ----------
            modelBuilder.Entity<User>(e =>
            {
                e.HasIndex(u => u.Email).IsUnique();
                e.HasIndex(u => u.Username).IsUnique();
            });

            // ---------- BusinessUser ----------
            modelBuilder.Entity<BusinessUser>(e =>
            {
                e.HasIndex(b => b.Email).IsUnique();
                e.HasIndex(b => b.BusinessName).IsUnique();
            });

            // ---------- BusinessCard ----------
            modelBuilder.Entity<BusinessCard>(e =>
            {
                e.HasIndex(bc => bc.Slug).IsUnique();
                e.HasIndex(bc => bc.BusinessUserId);

                e.HasOne(bc => bc.BusinessUser)
                    .WithMany()
                    .HasForeignKey(bc => bc.BusinessUserId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasMany(bc => bc.Images)
                    .WithOne(i => i.BusinessCard)
                    .HasForeignKey(i => i.BusinessCardId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ---------- Bookmark ----------
            modelBuilder.Entity<Bookmark>(e =>
            {
                // Prevent duplicate bookmarks
                e.HasIndex(b => new { b.UserId, b.BusinessUserId }).IsUnique();

                e.HasOne(b => b.User)
                    .WithMany()
                    .HasForeignKey(b => b.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(b => b.BusinessUser)
                    .WithMany()
                    .HasForeignKey(b => b.BusinessUserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ---------- Offer ----------
            modelBuilder.Entity<Offer>(e =>
            {
                e.HasIndex(o => o.BusinessUserId);

                e.HasOne(o => o.BusinessUser)
                    .WithMany()
                    .HasForeignKey(o => o.BusinessUserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ---------- Review ----------
            modelBuilder.Entity<Review>(e =>
            {
                // One review per user per business
                e.HasIndex(r => new { r.UserId, r.BusinessUserId }).IsUnique();

                e.HasOne(r => r.BusinessUser)
                    .WithMany()
                    .HasForeignKey(r => r.BusinessUserId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(r => r.User)
                    .WithMany()
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}