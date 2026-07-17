using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Manga.File.Infrastructure.Persistence.Migrations;
[DbContext(typeof(FileDbContext))]
[Migration("20260713000000_AddOutboxMessages")]
public partial class AddOutboxMessages : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(name: "outbox_messages", columns: table => new { Id = table.Column<Guid>(type: "uuid", nullable: false), MessageId = table.Column<Guid>(type: "uuid", nullable: false), EventType = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false), Payload = table.Column<string>(type: "text", nullable: false), RoutingKey = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false), Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false), RetryCount = table.Column<int>(type: "integer", nullable: false), LastError = table.Column<string>(type: "text", nullable: true), CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false), ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true), NextRetryAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true) }, constraints: table => table.PrimaryKey("PK_outbox_messages", x => x.Id));
        migrationBuilder.CreateIndex(name: "IX_outbox_messages_MessageId", table: "outbox_messages", column: "MessageId", unique: true);
        migrationBuilder.CreateIndex(name: "IX_outbox_messages_Status_NextRetryAt", table: "outbox_messages", columns: new[] { "Status", "NextRetryAt" });
    }
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable(name: "outbox_messages");
}
