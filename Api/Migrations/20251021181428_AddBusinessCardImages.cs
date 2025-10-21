using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessCardImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTE: original scaffold attempted to drop BusinessUsers.BusinessCategory but that
            // column does not exist in the current database schema. Removing the drop to make
            // this migration safe to apply. The migration will only add the BusinessCardImages table.

            migrationBuilder.CreateTable(
                name: "BusinessCardImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BusinessCardId = table.Column<int>(type: "integer", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    AltText = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessCardImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessCardImages_BusinessCards_BusinessCardId",
                        column: x => x.BusinessCardId,
                        principalTable: "BusinessCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessCardImages_BusinessCardId",
                table: "BusinessCardImages",
                column: "BusinessCardId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessCardImages");

            migrationBuilder.AddColumn<string>(
                name: "BusinessCategory",
                table: "BusinessUsers",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
