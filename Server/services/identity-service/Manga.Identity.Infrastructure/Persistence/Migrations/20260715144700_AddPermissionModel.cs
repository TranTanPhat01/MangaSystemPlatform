using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Manga.Identity.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPermissionModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "permissions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    group_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_system = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permissions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "role_permissions",
                columns: table => new
                {
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    permission_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_permissions", x => new { x.role_id, x.permission_id });
                    table.ForeignKey(
                        name: "FK_role_permissions_permissions_permission_id",
                        column: x => x.permission_id,
                        principalTable: "permissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_role_permissions_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "permissions",
                columns: new[] { "id", "created_at", "description", "group_name", "is_system", "key", "name" },
                values: new object[,]
                {
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de301"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "View user accounts.", "Admin", true, "ADMIN_USER_READ", "Read users" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de302"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Change user status and roles.", "Admin", true, "ADMIN_USER_MANAGE", "Manage users" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de303"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "View configured roles.", "Admin", true, "ADMIN_ROLE_READ", "Read roles" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de304"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "View service health.", "Admin", true, "ADMIN_MONITORING_READ", "Read monitoring" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de305"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "View outbox messages.", "Admin", true, "ADMIN_OUTBOX_READ", "Read outbox" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de306"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Retry failed outbox messages.", "Admin", true, "ADMIN_OUTBOX_RETRY", "Retry outbox" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de307"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "View audit history.", "Admin", true, "ADMIN_AUDIT_READ", "Read audit" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de308"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "View system settings.", "Admin", true, "ADMIN_SYSTEM_SETTINGS_READ", "Read system settings" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de309"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, "Business", true, "SERIES_CREATE", "Create series" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de310"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, "Business", true, "SERIES_MANAGE_OWN", "Manage own series" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de311"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, "Business", true, "PAGE_UPLOAD", "Upload page" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de312"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, "Business", true, "TASK_READ_ASSIGNED", "Read assigned tasks" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de313"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, "Business", true, "TASK_SUBMIT", "Submit task" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de314"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, "Business", true, "EDITORIAL_REVIEW_READ", "Read editorial review" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de315"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, "Business", true, "EDITORIAL_REVIEW_MANAGE", "Manage editorial review" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de316"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, "Business", true, "BOARD_PROPOSAL_READ", "Read board proposals" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de317"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, "Business", true, "BOARD_PROPOSAL_VOTE", "Vote board proposals" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de318"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, "Business", true, "BOARD_RANKING_READ", "Read rankings" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de319"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, "Business", true, "FILE_READ_OWN_OR_ASSIGNED", "Read related files" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de320"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, "Business", true, "NOTIFICATION_READ_OWN", "Read own notifications" }
                });

            migrationBuilder.InsertData(
                table: "role_permissions",
                columns: new[] { "permission_id", "role_id", "created_at" },
                values: new object[,]
                {
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de309"), new Guid("1d168ea4-8484-4b3c-8c6a-8cefe7a4f512"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de310"), new Guid("1d168ea4-8484-4b3c-8c6a-8cefe7a4f512"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de311"), new Guid("1d168ea4-8484-4b3c-8c6a-8cefe7a4f512"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de319"), new Guid("1d168ea4-8484-4b3c-8c6a-8cefe7a4f512"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de320"), new Guid("1d168ea4-8484-4b3c-8c6a-8cefe7a4f512"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de301"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de302"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de303"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de304"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de305"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de306"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de307"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de308"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de309"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de310"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de311"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de312"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de313"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de314"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de315"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de316"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de317"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de318"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de319"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de320"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de312"), new Guid("68e9e703-6f32-4b17-9503-6c8d01d56421"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de313"), new Guid("68e9e703-6f32-4b17-9503-6c8d01d56421"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de319"), new Guid("68e9e703-6f32-4b17-9503-6c8d01d56421"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de320"), new Guid("68e9e703-6f32-4b17-9503-6c8d01d56421"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de314"), new Guid("91a754e2-2f2d-43c1-825b-c6c861c9f9d2"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de315"), new Guid("91a754e2-2f2d-43c1-825b-c6c861c9f9d2"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de320"), new Guid("91a754e2-2f2d-43c1-825b-c6c861c9f9d2"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de316"), new Guid("cf69bb84-449d-40c6-a5a3-31abbb8fe1f0"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de317"), new Guid("cf69bb84-449d-40c6-a5a3-31abbb8fe1f0"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de318"), new Guid("cf69bb84-449d-40c6-a5a3-31abbb8fe1f0"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de320"), new Guid("cf69bb84-449d-40c6-a5a3-31abbb8fe1f0"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_permissions_key",
                table: "permissions",
                column: "key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_permission_id",
                table: "role_permissions",
                column: "permission_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "role_permissions");

            migrationBuilder.DropTable(
                name: "permissions");
        }
    }
}
