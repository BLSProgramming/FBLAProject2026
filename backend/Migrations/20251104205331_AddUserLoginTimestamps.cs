using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserLoginTimestamps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "NewLogin",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OldLogin",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NewLogin",
                table: "BusinessUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OldLogin",
                table: "BusinessUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUpdatedAt",
                table: "BusinessCards",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "BusinessCards",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NewLogin",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OldLogin",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "NewLogin",
                table: "BusinessUsers");

            migrationBuilder.DropColumn(
                name: "OldLogin",
                table: "BusinessUsers");

            migrationBuilder.DropColumn(
                name: "LastUpdatedAt",
                table: "BusinessCards");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "BusinessCards");
        }
    }
}
