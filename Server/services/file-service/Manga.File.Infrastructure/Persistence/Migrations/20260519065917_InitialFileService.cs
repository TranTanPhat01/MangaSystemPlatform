using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Manga.File.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialFileService : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "file_assets",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    original_file_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    stored_file_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    content_type = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    extension = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    size_in_bytes = table.Column<long>(type: "bigint", nullable: false),
                    storage_provider = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    storage_path = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    public_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    uploaded_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_category = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_file_assets", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "file_versions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    version_number = table.Column<int>(type: "integer", nullable: false),
                    stored_file_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    storage_path = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    size_in_bytes = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_file_versions", x => x.id);
                    table.ForeignKey(
                        name: "FK_file_versions_file_assets_file_asset_id",
                        column: x => x.file_asset_id,
                        principalTable: "file_assets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "thumbnails",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    width = table.Column<int>(type: "integer", nullable: false),
                    height = table.Column<int>(type: "integer", nullable: false),
                    storage_path = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_thumbnails", x => x.id);
                    table.ForeignKey(
                        name: "FK_thumbnails_file_assets_file_asset_id",
                        column: x => x.file_asset_id,
                        principalTable: "file_assets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_file_versions_file_asset_id_version_number",
                table: "file_versions",
                columns: new[] { "file_asset_id", "version_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_thumbnails_file_asset_id",
                table: "thumbnails",
                column: "file_asset_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "file_versions");

            migrationBuilder.DropTable(
                name: "thumbnails");

            migrationBuilder.DropTable(
                name: "file_assets");
        }
    }
}
