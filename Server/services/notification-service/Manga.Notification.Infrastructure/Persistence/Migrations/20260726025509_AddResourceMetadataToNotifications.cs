using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Manga.Notification.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddResourceMetadataToNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActionUrl",
                table: "notifications",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ResourceId",
                table: "notifications",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResourceType",
                table: "notifications",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActionUrl",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "ResourceId",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "ResourceType",
                table: "notifications");
        }
    }
}
