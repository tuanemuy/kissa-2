import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import {
  type AdminListUsersInput,
  adminListUsers,
  deleteUser,
  type UpdateUserRoleInput,
  type UpdateUserStatusInput,
  updateUserRole,
  updateUserStatus,
} from "./userManagement";

describe("userManagement", () => {
  let context: Context;
  let adminUser: User;
  let editorUser: User;
  let regularUser1: User;
  let regularUser2: User;
  let regularUser3: User;
  let suspendedUser: User;
  let inactiveAdminUser: User;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    // Create admin user
    const adminResult = await context.userRepository.create({
      email: "admin@example.com",
      password: hashedPassword.value,
      name: "Admin User",
    });
    if (adminResult.isErr()) {
      throw new Error("Failed to create admin user");
    }
    adminUser = adminResult.value;
    await context.userRepository.updateRole(adminUser.id, "admin");

    // Create editor user
    const editorResult = await context.userRepository.create({
      email: "editor@example.com",
      password: hashedPassword.value,
      name: "Editor User",
    });
    if (editorResult.isErr()) {
      throw new Error("Failed to create editor user");
    }
    editorUser = editorResult.value;
    await context.userRepository.updateRole(editorUser.id, "editor");

    // Create regular users
    const regular1Result = await context.userRepository.create({
      email: "regular1@example.com",
      password: hashedPassword.value,
      name: "Regular User 1",
    });
    if (regular1Result.isErr()) {
      throw new Error("Failed to create regular user 1");
    }
    regularUser1 = regular1Result.value;

    const regular2Result = await context.userRepository.create({
      email: "regular2@example.com",
      password: hashedPassword.value,
      name: "Regular User 2",
    });
    if (regular2Result.isErr()) {
      throw new Error("Failed to create regular user 2");
    }
    regularUser2 = regular2Result.value;

    const regular3Result = await context.userRepository.create({
      email: "regular3@example.com",
      password: hashedPassword.value,
      name: "Regular User 3",
    });
    if (regular3Result.isErr()) {
      throw new Error("Failed to create regular user 3");
    }
    regularUser3 = regular3Result.value;

    // Create suspended user
    const suspendedResult = await context.userRepository.create({
      email: "suspended@example.com",
      password: hashedPassword.value,
      name: "Suspended User",
    });
    if (suspendedResult.isErr()) {
      throw new Error("Failed to create suspended user");
    }
    suspendedUser = suspendedResult.value;
    await context.userRepository.updateStatus(suspendedUser.id, "suspended");

    // Create inactive admin user
    const inactiveAdminResult = await context.userRepository.create({
      email: "inactiveadmin@example.com",
      password: hashedPassword.value,
      name: "Inactive Admin User",
    });
    if (inactiveAdminResult.isErr()) {
      throw new Error("Failed to create inactive admin user");
    }
    inactiveAdminUser = inactiveAdminResult.value;
    await context.userRepository.updateRole(inactiveAdminUser.id, "admin");
    await context.userRepository.updateStatus(
      inactiveAdminUser.id,
      "suspended",
    );
  });

  describe("adminListUsers", () => {
    it("should successfully list all users for admin", async () => {
      const input: AdminListUsersInput = {
        pagination: { page: 1, size: 20 },
      };

      const result = await adminListUsers(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBeGreaterThanOrEqual(6); // At least 6 users created
        expect(items.length).toBeGreaterThanOrEqual(6);

        // Check that admin can see all user details
        items.forEach((user) => {
          expect(user.id).toBeDefined();
          expect(user.email).toBeDefined();
          expect(user.name).toBeDefined();
          expect(user.role).toBeDefined();
          expect(user.status).toBeDefined();
          expect(user.createdAt).toBeDefined();
        });
      }
    });

    it("should filter users by role", async () => {
      const input: AdminListUsersInput = {
        pagination: { page: 1, size: 20 },
        filter: {
          role: "editor",
        },
      };

      const result = await adminListUsers(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(1);
        expect(items).toHaveLength(1);
        expect(items[0].role).toBe("editor");
        expect(items[0].id).toBe(editorUser.id);
      }
    });

    it("should filter users by status", async () => {
      const input: AdminListUsersInput = {
        pagination: { page: 1, size: 20 },
        filter: {
          status: "suspended",
        },
      };

      const result = await adminListUsers(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(2);
        expect(items).toHaveLength(2);
        items.forEach((item) => {
          expect(item.status).toBe("suspended");
        });
        expect(items.map((item) => item.id).sort()).toEqual(
          [suspendedUser.id, inactiveAdminUser.id].sort(),
        );
      }
    });

    it("should filter users by keyword (name/email)", async () => {
      const input: AdminListUsersInput = {
        pagination: { page: 1, size: 20 },
        filter: {
          keyword: "Regular",
        },
      };

      const result = await adminListUsers(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items } = result.value;
        expect(items.length).toBeGreaterThanOrEqual(3);
        items.forEach((user) => {
          expect(user.name.toLowerCase()).toContain("regular");
        });
      }
    });

    it("should handle pagination correctly", async () => {
      const input: AdminListUsersInput = {
        pagination: { page: 1, size: 3 },
      };

      const result = await adminListUsers(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBeGreaterThanOrEqual(6); // Total count
        expect(items).toHaveLength(3); // Page size
      }
    });

    it("should handle combined filters", async () => {
      const input: AdminListUsersInput = {
        pagination: { page: 1, size: 20 },
        filter: {
          role: "admin",
          status: "active",
        },
      };

      const result = await adminListUsers(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items } = result.value;
        items.forEach((user) => {
          expect(user.role).toBe("admin");
          expect(user.status).toBe("active");
        });
      }
    });

    it("should fail when user is not admin", async () => {
      const input: AdminListUsersInput = {
        pagination: { page: 1, size: 20 },
      };

      const result = await adminListUsers(context, regularUser1.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.ADMIN_PERMISSION_REQUIRED);
      }
    });

    it("should fail when admin user is inactive", async () => {
      const input: AdminListUsersInput = {
        pagination: { page: 1, size: 20 },
      };

      const result = await adminListUsers(context, inactiveAdminUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });

    it("should fail when admin user does not exist", async () => {
      const input: AdminListUsersInput = {
        pagination: { page: 1, size: 20 },
      };

      const result = await adminListUsers(
        context,
        "non-existent-user-id",
        input,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should use default pagination values", async () => {
      const input: AdminListUsersInput = {
        pagination: { page: 1, size: 20 },
      };

      const result = await adminListUsers(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBeGreaterThanOrEqual(6);
        expect(items.length).toBeGreaterThanOrEqual(6);
      }
    });
  });

  describe("updateUserRole", () => {
    it("should successfully update user role to editor", async () => {
      const input: UpdateUserRoleInput = {
        userId: regularUser1.id,
        role: "editor",
        reason: "User has demonstrated editing capabilities",
      };

      const result = await updateUserRole(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.role).toBe("editor");
        expect(updatedUser.id).toBe(regularUser1.id);
      }
    });

    it("should successfully update user role to admin", async () => {
      const input: UpdateUserRoleInput = {
        userId: editorUser.id,
        role: "admin",
        reason: "Promoting to admin role",
      };

      const result = await updateUserRole(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.role).toBe("admin");
        expect(updatedUser.id).toBe(editorUser.id);
      }
    });

    it("should successfully demote admin to editor", async () => {
      // First promote a user to admin
      await context.userRepository.updateRole(regularUser1.id, "admin");

      const input: UpdateUserRoleInput = {
        userId: regularUser1.id,
        role: "editor",
        reason: "Demoting from admin role",
      };

      const result = await updateUserRole(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.role).toBe("editor");
      }
    });

    it("should successfully update role without reason", async () => {
      const input: UpdateUserRoleInput = {
        userId: regularUser2.id,
        role: "editor",
      };

      const result = await updateUserRole(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.role).toBe("editor");
      }
    });

    it("should fail when admin tries to change their own role", async () => {
      const input: UpdateUserRoleInput = {
        userId: adminUser.id,
        role: "editor",
        reason: "Self demotion",
      };

      const result = await updateUserRole(context, adminUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CANNOT_MODIFY_SELF);
      }
    });

    it("should fail when target user does not exist", async () => {
      const input: UpdateUserRoleInput = {
        userId: "non-existent-user-id",
        role: "editor",
        reason: "Promotion",
      };

      const result = await updateUserRole(context, adminUser.id, input);

      expect(result.isErr()).toBe(true);
    });

    it("should fail when user is not admin", async () => {
      const input: UpdateUserRoleInput = {
        userId: regularUser1.id,
        role: "editor",
        reason: "Promotion",
      };

      const result = await updateUserRole(context, regularUser2.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.ADMIN_PERMISSION_REQUIRED);
      }
    });

    it("should fail when admin user is inactive", async () => {
      const input: UpdateUserRoleInput = {
        userId: regularUser1.id,
        role: "editor",
        reason: "Promotion",
      };

      const result = await updateUserRole(context, inactiveAdminUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });

    it("should handle all valid role transitions", async () => {
      const roles = ["visitor", "editor", "admin"] as const;

      for (const role of roles) {
        const input: UpdateUserRoleInput = {
          userId: regularUser3.id,
          role,
          reason: `Setting role to ${role}`,
        };

        const result = await updateUserRole(context, adminUser.id, input);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const updatedUser = result.value;
          expect(updatedUser.role).toBe(role);
        }
      }
    });

    it("should handle role update with maximum reason length", async () => {
      const longReason = "A".repeat(500);
      const input: UpdateUserRoleInput = {
        userId: regularUser1.id,
        role: "editor",
        reason: longReason,
      };

      const result = await updateUserRole(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.role).toBe("editor");
      }
    });
  });

  describe("updateUserStatus", () => {
    it("should successfully suspend a user", async () => {
      const input: UpdateUserStatusInput = {
        userId: regularUser1.id,
        status: "suspended",
        reason: "Violating community guidelines",
      };

      const result = await updateUserStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.status).toBe("suspended");
        expect(updatedUser.id).toBe(regularUser1.id);
      }
    });

    it("should successfully activate a suspended user", async () => {
      const input: UpdateUserStatusInput = {
        userId: suspendedUser.id,
        status: "active",
        reason: "Appeal approved",
      };

      const result = await updateUserStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.status).toBe("active");
        expect(updatedUser.id).toBe(suspendedUser.id);
      }
    });

    it("should successfully mark user as deleted", async () => {
      const input: UpdateUserStatusInput = {
        userId: regularUser2.id,
        status: "deleted",
        reason: "User requested account deletion",
      };

      const result = await updateUserStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.status).toBe("deleted");
      }
    });

    it("should successfully update status without reason", async () => {
      const input: UpdateUserStatusInput = {
        userId: regularUser3.id,
        status: "suspended",
      };

      const result = await updateUserStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.status).toBe("suspended");
      }
    });

    it("should fail when admin tries to change their own status", async () => {
      const input: UpdateUserStatusInput = {
        userId: adminUser.id,
        status: "suspended",
        reason: "Self suspension",
      };

      const result = await updateUserStatus(context, adminUser.id, input);

      expect(result.isErr()).toBe(true);
    });

    it("should fail when target user does not exist", async () => {
      const input: UpdateUserStatusInput = {
        userId: "non-existent-user-id",
        status: "suspended",
        reason: "Suspension",
      };

      const result = await updateUserStatus(context, adminUser.id, input);

      expect(result.isErr()).toBe(true);
    });

    it("should fail when user is not admin", async () => {
      const input: UpdateUserStatusInput = {
        userId: regularUser1.id,
        status: "suspended",
        reason: "Suspension",
      };

      const result = await updateUserStatus(context, editorUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.ADMIN_PERMISSION_REQUIRED);
      }
    });

    it("should handle all valid status transitions", async () => {
      const statuses = ["active", "suspended", "deleted"] as const;

      for (const status of statuses) {
        const input: UpdateUserStatusInput = {
          userId: regularUser3.id,
          status,
          reason: `Setting status to ${status}`,
        };

        const result = await updateUserStatus(context, adminUser.id, input);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const updatedUser = result.value;
          expect(updatedUser.status).toBe(status);
        }
      }
    });

    it("should handle status update with maximum reason length", async () => {
      const longReason = "B".repeat(500);
      const input: UpdateUserStatusInput = {
        userId: regularUser1.id,
        status: "suspended",
        reason: longReason,
      };

      const result = await updateUserStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.status).toBe("suspended");
      }
    });
  });

  describe("deleteUser", () => {
    it("should successfully delete a user", async () => {
      const result = await deleteUser(
        context,
        adminUser.id,
        regularUser1.id,
        "User requested account deletion",
      );

      expect(result.isOk()).toBe(true);

      // Verify user is deleted by trying to find them
      const findResult = await context.userRepository.findById(regularUser1.id);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it("should successfully delete user without reason", async () => {
      const result = await deleteUser(context, adminUser.id, regularUser2.id);

      expect(result.isOk()).toBe(true);

      // Verify user is deleted
      const findResult = await context.userRepository.findById(regularUser2.id);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it("should fail when admin tries to delete their own account", async () => {
      const result = await deleteUser(
        context,
        adminUser.id,
        adminUser.id,
        "Self deletion",
      );

      expect(result.isErr()).toBe(true);

      // Verify admin user still exists
      const findResult = await context.userRepository.findById(adminUser.id);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull();
      }
    });

    it("should fail when target user does not exist", async () => {
      const result = await deleteUser(
        context,
        adminUser.id,
        "non-existent-user-id",
        "Deletion",
      );

      expect(result.isErr()).toBe(true);
    });

    it("should fail when user is not admin", async () => {
      const result = await deleteUser(
        context,
        regularUser1.id,
        regularUser2.id,
        "Deletion",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.ADMIN_PERMISSION_REQUIRED);
      }
    });

    it("should fail when admin user is inactive", async () => {
      const result = await deleteUser(
        context,
        inactiveAdminUser.id,
        regularUser1.id,
        "Deletion",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });

    it("should handle deletion of users with different roles", async () => {
      // Delete editor user
      const editorResult = await deleteUser(
        context,
        adminUser.id,
        editorUser.id,
        "Editor cleanup",
      );
      expect(editorResult.isOk()).toBe(true);

      // Delete suspended user
      const suspendedResult = await deleteUser(
        context,
        adminUser.id,
        suspendedUser.id,
        "Suspended user cleanup",
      );
      expect(suspendedResult.isOk()).toBe(true);
    });

    it("should handle deletion of user with UUID validation", async () => {
      const result = await deleteUser(
        context,
        adminUser.id,
        "invalid-uuid-format",
        "Deletion",
      );

      expect(result.isErr()).toBe(true);
    });
  });

  describe("concurrent operations", () => {
    it("should handle concurrent role updates on different users", async () => {
      const input1: UpdateUserRoleInput = {
        userId: regularUser1.id,
        role: "editor",
        reason: "Promotion 1",
      };

      const input2: UpdateUserRoleInput = {
        userId: regularUser2.id,
        role: "editor",
        reason: "Promotion 2",
      };

      const [result1, result2] = await Promise.all([
        updateUserRole(context, adminUser.id, input1),
        updateUserRole(context, adminUser.id, input2),
      ]);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.role).toBe("editor");
        expect(result2.value.role).toBe("editor");
      }
    });

    it("should handle concurrent status updates on different users", async () => {
      const input1: UpdateUserStatusInput = {
        userId: regularUser1.id,
        status: "suspended",
        reason: "Violation 1",
      };

      const input2: UpdateUserStatusInput = {
        userId: regularUser2.id,
        status: "suspended",
        reason: "Violation 2",
      };

      const [result1, result2] = await Promise.all([
        updateUserStatus(context, adminUser.id, input1),
        updateUserStatus(context, adminUser.id, input2),
      ]);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.status).toBe("suspended");
        expect(result2.value.status).toBe("suspended");
      }
    });

    it("should handle concurrent operations by different admins", async () => {
      // Create another admin
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isErr()) {
        throw new Error("Failed to hash password");
      }

      const admin2Result = await context.userRepository.create({
        email: "admin2@example.com",
        password: hashedPassword.value,
        name: "Admin User 2",
      });
      expect(admin2Result.isOk()).toBe(true);

      if (admin2Result.isOk()) {
        const admin2 = admin2Result.value;
        await context.userRepository.updateRole(admin2.id, "admin");

        const roleInput: UpdateUserRoleInput = {
          userId: regularUser1.id,
          role: "editor",
          reason: "Admin 1 promotion",
        };

        const statusInput: UpdateUserStatusInput = {
          userId: regularUser2.id,
          status: "suspended",
          reason: "Admin 2 suspension",
        };

        const [roleResult, statusResult] = await Promise.all([
          updateUserRole(context, adminUser.id, roleInput),
          updateUserStatus(context, admin2.id, statusInput),
        ]);

        expect(roleResult.isOk()).toBe(true);
        expect(statusResult.isOk()).toBe(true);
      }
    });

    it("should handle concurrent listing and modification operations", async () => {
      const listInput: AdminListUsersInput = {
        pagination: { page: 1, size: 20 },
      };

      const roleInput: UpdateUserRoleInput = {
        userId: regularUser1.id,
        role: "editor",
        reason: "Concurrent promotion",
      };

      const [listResult, roleResult] = await Promise.all([
        adminListUsers(context, adminUser.id, listInput),
        updateUserRole(context, adminUser.id, roleInput),
      ]);

      expect(listResult.isOk()).toBe(true);
      expect(roleResult.isOk()).toBe(true);
    });
  });

  describe("edge cases and data integrity", () => {
    it("should maintain data integrity during role updates", async () => {
      const originalUser = regularUser1;

      const input: UpdateUserRoleInput = {
        userId: regularUser1.id,
        role: "admin",
        reason: "Promotion to admin",
      };

      const result = await updateUserRole(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;

        // Original data should be preserved
        expect(updatedUser.id).toBe(originalUser.id);
        expect(updatedUser.email).toBe(originalUser.email);
        expect(updatedUser.name).toBe(originalUser.name);
        expect(updatedUser.createdAt).toEqual(originalUser.createdAt);

        // Only role should be updated
        expect(updatedUser.role).toBe("admin");
      }
    });

    it("should maintain data integrity during status updates", async () => {
      const originalUser = regularUser1;

      const input: UpdateUserStatusInput = {
        userId: regularUser1.id,
        status: "suspended",
        reason: "Temporary suspension",
      };

      const result = await updateUserStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;

        // Original data should be preserved
        expect(updatedUser.id).toBe(originalUser.id);
        expect(updatedUser.email).toBe(originalUser.email);
        expect(updatedUser.name).toBe(originalUser.name);
        expect(updatedUser.role).toBe(originalUser.role);
        expect(updatedUser.createdAt).toEqual(originalUser.createdAt);

        // Only status should be updated
        expect(updatedUser.status).toBe("suspended");
      }
    });

    it("should handle complex filtering scenarios", async () => {
      // Create users with specific attributes for filtering
      await context.userRepository.updateRole(regularUser3.id, "editor");
      await context.userRepository.updateStatus(regularUser3.id, "suspended");

      const input: AdminListUsersInput = {
        pagination: { page: 1, size: 20 },
        filter: {
          role: "editor",
          status: "suspended",
          keyword: "Regular User 3",
        },
      };

      const result = await adminListUsers(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(1);
        expect(items).toHaveLength(1);
        expect(items[0].id).toBe(regularUser3.id);
        expect(items[0].role).toBe("editor");
        expect(items[0].status).toBe("suspended");
      }
    });

    it("should handle user management with special characters in data", async () => {
      // Create user with special characters
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isErr()) {
        throw new Error("Failed to hash password");
      }

      const specialUserResult = await context.userRepository.create({
        email: "special@exämple.com",
        password: hashedPassword.value,
        name: "Spéciàl Üser Ñame",
      });
      expect(specialUserResult.isOk()).toBe(true);

      if (specialUserResult.isOk()) {
        const specialUser = specialUserResult.value;

        const input: UpdateUserRoleInput = {
          userId: specialUser.id,
          role: "editor",
          reason: "Promoting user with special characters in name",
        };

        const result = await updateUserRole(context, adminUser.id, input);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const updatedUser = result.value;
          expect(updatedUser.role).toBe("editor");
          expect(updatedUser.name).toBe("Spéciàl Üser Ñame");
        }
      }
    });

    it("should handle pagination edge cases", async () => {
      const input: AdminListUsersInput = {
        pagination: { page: 100, size: 50 }, // Page way beyond available data
      };

      const result = await adminListUsers(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBeGreaterThanOrEqual(6); // Total count should still be correct
        expect(items).toHaveLength(0); // No items on this page
      }
    });

    it("should prevent privilege escalation through edge cases", async () => {
      // Editor should not be able to update roles even if they have valid admin-like input
      const input: UpdateUserRoleInput = {
        userId: regularUser1.id,
        role: "admin",
        reason: "Trying to escalate privileges",
      };

      const result = await updateUserRole(context, editorUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.ADMIN_PERMISSION_REQUIRED);
      }

      // Verify user role was not changed
      const userResult = await context.userRepository.findById(regularUser1.id);
      expect(userResult.isOk()).toBe(true);
      if (userResult.isOk() && userResult.value) {
        expect(userResult.value.role).toBe("visitor"); // Should remain unchanged
      }
    });
  });
});
