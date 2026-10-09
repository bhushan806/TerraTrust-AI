"""Role and permission definitions and RBAC verification helpers."""

from typing import List, Sequence

# Standard System Roles
ROLE_LOAN_OFFICER = "LOAN_OFFICER"
ROLE_RISK_ANALYST = "RISK_ANALYST"
ROLE_INSTITUTION_ADMIN = "INSTITUTION_ADMIN"
ROLE_PLATFORM_OPERATOR = "PLATFORM_OPERATOR"

ALL_ROLES = [
    ROLE_LOAN_OFFICER,
    ROLE_RISK_ANALYST,
    ROLE_INSTITUTION_ADMIN,
    ROLE_PLATFORM_OPERATOR,
]

# Standard Granular Permission Codes
PERM_BORROWER_READ = "BORROWER_READ"
PERM_BORROWER_WRITE = "BORROWER_WRITE"
PERM_FARM_READ = "FARM_READ"
PERM_FARM_WRITE = "FARM_WRITE"
PERM_LOAN_READ = "LOAN_READ"
PERM_LOAN_WRITE = "LOAN_WRITE"
PERM_ASSESSMENT_READ = "ASSESSMENT_READ"
PERM_ASSESSMENT_CREATE = "ASSESSMENT_CREATE"
PERM_REPORT_READ = "REPORT_READ"
PERM_REPORT_CREATE = "REPORT_CREATE"
PERM_USER_READ = "USER_READ"
PERM_USER_MANAGE = "USER_MANAGE"
PERM_INSTITUTION_MANAGE = "INSTITUTION_MANAGE"


def has_any_role(user_roles: Sequence[str], allowed_roles: Sequence[str]) -> bool:
    """Check if the user has at least one of the allowed roles.
    PLATFORM_OPERATOR always has system-wide administrative access.
    """
    user_roles_set = set(user_roles)
    if ROLE_PLATFORM_OPERATOR in user_roles_set:
        return True
    return bool(user_roles_set.intersection(allowed_roles))


def has_permission(user_permissions: Sequence[str], required_permission: str) -> bool:
    """Check if the user has a specific permission."""
    return required_permission in set(user_permissions)
