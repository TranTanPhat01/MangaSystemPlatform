using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Manga.Identity.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIdentityAdminLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "deleted_by_user_id",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "lock_reason",
                table: "users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "locked_by_user_id",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "username",
                table: "users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                table: "roles",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "is_retired",
                table: "roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_system",
                table: "roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "roles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.InsertData(
                table: "permissions",
                columns: new[] { "id", "created_at", "description", "group_name", "is_system", "key", "name" },
                values: new object[,]
                {
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de321"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Create user accounts.", "Admin", true, "ADMIN_USER_CREATE", "Create users" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de322"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Update user profiles, status, and roles.", "Admin", true, "ADMIN_USER_UPDATE", "Update users" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de323"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Soft delete user accounts.", "Admin", true, "ADMIN_USER_DELETE", "Delete users" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de324"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Reset user passwords.", "Admin", true, "ADMIN_USER_RESET_PASSWORD", "Reset user passwords" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de325"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Revoke all active refresh tokens.", "Admin", true, "ADMIN_USER_SESSION_REVOKE", "Revoke user sessions" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de326"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Create, update, and retire custom roles.", "Admin", true, "ADMIN_ROLE_MANAGE", "Manage roles" },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de327"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Replace permissions assigned to custom roles.", "Admin", true, "ADMIN_ROLE_PERMISSION_MANAGE", "Manage role permissions" }
                });

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("1d168ea4-8484-4b3c-8c6a-8cefe7a4f512"),
                columns: new[] { "created_at", "is_retired", "is_system", "updated_at" },
                values: new object[] { new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), false, true, null });

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"),
                columns: new[] { "created_at", "is_retired", "is_system", "updated_at" },
                values: new object[] { new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), false, true, null });

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("68e9e703-6f32-4b17-9503-6c8d01d56421"),
                columns: new[] { "created_at", "is_retired", "is_system", "updated_at" },
                values: new object[] { new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), false, true, null });

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("91a754e2-2f2d-43c1-825b-c6c861c9f9d2"),
                columns: new[] { "created_at", "is_retired", "is_system", "updated_at" },
                values: new object[] { new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), false, true, null });

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("cf69bb84-449d-40c6-a5a3-31abbb8fe1f0"),
                columns: new[] { "created_at", "is_retired", "is_system", "updated_at" },
                values: new object[] { new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), false, true, null });

            migrationBuilder.InsertData(
                table: "role_permissions",
                columns: new[] { "permission_id", "role_id", "created_at" },
                values: new object[,]
                {
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de321"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de322"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de323"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de324"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de325"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de326"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de327"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01"), new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_users_deleted_at",
                table: "users",
                column: "deleted_at");

            migrationBuilder.CreateIndex(
                name: "IX_users_username",
                table: "users",
                column: "username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_admin_audit_events_action_created_at",
                table: "admin_audit_events",
                columns: new[] { "action", "created_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_deleted_at",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_username",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_admin_audit_events_action_created_at",
                table: "admin_audit_events");

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de321"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01") });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de322"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01") });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de323"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01") });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de324"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01") });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de325"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01") });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de326"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01") });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de327"), new Guid("5c7e1dc3-0271-4b6a-9b4c-0a57f77d8f01") });

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de321"));

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de322"));

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de323"));

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de324"));

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de325"));

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de326"));

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "id",
                keyValue: new Guid("b04211be-dc6a-4b5a-a1e7-28308a7de327"));

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "lock_reason",
                table: "users");

            migrationBuilder.DropColumn(
                name: "locked_by_user_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "username",
                table: "users");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "roles");

            migrationBuilder.DropColumn(
                name: "is_retired",
                table: "roles");

            migrationBuilder.DropColumn(
                name: "is_system",
                table: "roles");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "roles");
        }
    }
}
