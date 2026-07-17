using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Manga.Management.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOutboxMessagesRuntimeFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The preceding AddOutboxMessages migration owns this schema change.
            // Retained as a no-op to preserve migration history without creating the table twice.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op: the preceding migration owns the outbox table.
        }
    }
}
