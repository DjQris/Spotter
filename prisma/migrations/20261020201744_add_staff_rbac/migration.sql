-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- SeedRoles
INSERT INTO "Role" ("id", "key", "name", "description", "createdAt", "updatedAt") VALUES
    ('role_owner', 'OWNER', 'Owner', 'Full gym administration.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role_staff', 'STAFF', 'Staff', 'Front desk operations.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- SeedPermissions
INSERT INTO "Permission" ("id", "key", "description", "createdAt") VALUES
    ('perm_staff_dashboard_access', 'staff.dashboard.access', 'Open the staff dashboard.', CURRENT_TIMESTAMP),
    ('perm_member_number_reserve', 'member_number.reserve', 'Reserve the next member number.', CURRENT_TIMESTAMP);

-- SeedRolePermissions
INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES
    ('role_owner', 'perm_staff_dashboard_access'),
    ('role_owner', 'perm_member_number_reserve'),
    ('role_staff', 'perm_staff_dashboard_access'),
    ('role_staff', 'perm_member_number_reserve');

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN "roleId" TEXT;

-- BackfillRoleIds
UPDATE "Staff"
SET "roleId" = CASE "role"
    WHEN 'OWNER' THEN 'role_owner'
    WHEN 'STAFF' THEN 'role_staff'
END;

ALTER TABLE "Staff" ALTER COLUMN "roleId" SET NOT NULL;

-- DropEnum
ALTER TABLE "Staff" DROP COLUMN "role";
DROP TYPE "StaffRole";

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
