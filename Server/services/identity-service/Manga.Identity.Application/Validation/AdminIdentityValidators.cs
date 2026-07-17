using FluentValidation;
using Manga.Identity.Application.DTOs;

namespace Manga.Identity.Application.Validation;

public sealed class CreateAdminUserRequestValidator : AbstractValidator<CreateAdminUserRequest>
{
    public CreateAdminUserRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(100).Matches("^[a-zA-Z0-9._-]+$");
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Password).MinimumLength(8).MaximumLength(128);
        RuleFor(x => x.Roles).NotEmpty();
    }
}

public sealed class UpdateAdminUserRequestValidator : AbstractValidator<UpdateAdminUserRequest>
{
    public UpdateAdminUserRequestValidator()
    {
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(100).Matches("^[a-zA-Z0-9._-]+$");
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
    }
}

public sealed class LockUserRequestValidator : AbstractValidator<LockUserRequest>
{
    public LockUserRequestValidator()
    {
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(500);
        RuleFor(x => x.LockoutUntil).GreaterThan(DateTime.UtcNow).When(x => x.LockoutUntil.HasValue);
    }
}

public sealed class ResetUserPasswordRequestValidator : AbstractValidator<ResetUserPasswordRequest>
{
    public ResetUserPasswordRequestValidator() => RuleFor(x => x.NewPassword).MinimumLength(8).MaximumLength(128);
}

public sealed class CreateRoleRequestValidator : AbstractValidator<CreateRoleRequest>
{
    public CreateRoleRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100).Matches("^[a-zA-Z0-9_-]+$");
        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public sealed class UpdateRoleRequestValidator : AbstractValidator<UpdateRoleRequest>
{
    public UpdateRoleRequestValidator() => RuleFor(x => x.Description).MaximumLength(500);
}

public sealed class ReplaceRolePermissionsRequestValidator : AbstractValidator<ReplaceRolePermissionsRequest>
{
    public ReplaceRolePermissionsRequestValidator() => RuleForEach(x => x.PermissionKeys).NotEmpty().MaximumLength(150);
}

public sealed class AdminAuditLogQueryValidator : AbstractValidator<AdminAuditLogQuery>
{
    public AdminAuditLogQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThan(0);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
        RuleFor(x => x.To).GreaterThanOrEqualTo(x => x.From).When(x => x.From.HasValue && x.To.HasValue);
        RuleFor(x => x.Action).MaximumLength(100);
    }
}
