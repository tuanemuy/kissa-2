import { beforeEach, describe, expect, it } from "vitest";
import type { MockEmailService } from "@/core/adapters/mock/emailService";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Place } from "@/core/domain/place/types";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import {
  type AcceptInvitationInput,
  acceptEditorInvitation,
  getPlaceEditors,
  getUserEditablePlaces,
  type InviteEditorInput,
  inviteEditorToPlace,
  removeEditorPermission,
  type UpdatePermissionInput,
  updateEditorPermission,
} from "./managePermissions";

describe("managePermissions", () => {
  let context: Context;
  let placeOwner: User;
  let editorUser: User;
  let inviteeUser: User;
  let visitorUser: User;
  let testRegion: Region;
  let testPlace: Place;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    // Create place owner
    const ownerResult = await context.userRepository.create({
      email: "owner@example.com",
      password: hashedPassword.value,
      name: "Place Owner",
    });
    if (ownerResult.isErr()) {
      throw new Error("Failed to create place owner");
    }
    placeOwner = ownerResult.value;
    await context.userRepository.updateRole(placeOwner.id, "editor");

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

    // Create invitee user
    const inviteeResult = await context.userRepository.create({
      email: "invitee@example.com",
      password: hashedPassword.value,
      name: "Invitee User",
    });
    if (inviteeResult.isErr()) {
      throw new Error("Failed to create invitee user");
    }
    inviteeUser = inviteeResult.value;

    // Create visitor user
    const visitorResult = await context.userRepository.create({
      email: "visitor@example.com",
      password: hashedPassword.value,
      name: "Visitor User",
    });
    if (visitorResult.isErr()) {
      throw new Error("Failed to create visitor user");
    }
    visitorUser = visitorResult.value;

    // Create test region
    const regionResult = await context.regionRepository.create(placeOwner.id, {
      name: "Test Region",
      description: "A test region for place permission testing",
      coordinates: { latitude: 35.6762, longitude: 139.6503 },
      address: "Test Address, Japan",
      images: [],
      tags: ["test"],
    });
    if (regionResult.isErr()) {
      throw new Error("Failed to create test region");
    }
    testRegion = regionResult.value;
    await context.regionRepository.updateStatus(testRegion.id, "published");

    // Create test place
    const placeResult = await context.placeRepository.create(placeOwner.id, {
      name: "Test Place",
      description: "A test place for permission testing",
      shortDescription: "Test place",
      category: "restaurant",
      regionId: testRegion.id,
      coordinates: { latitude: 35.6795, longitude: 139.6516 },
      address: "1-1-1 Test, Tokyo, Japan",
      images: [],
      tags: ["test"],
      businessHours: [],
    });
    if (placeResult.isErr()) {
      throw new Error("Failed to create test place");
    }
    testPlace = placeResult.value;
    await context.placeRepository.updateStatus(testPlace.id, "published");
  });

  describe("inviteEditorToPlace", () => {
    it("should successfully invite an editor to a place", async () => {
      const input: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      const result = await inviteEditorToPlace(context, placeOwner.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const permission = result.value;
        expect(permission.placeId).toBe(testPlace.id);
        expect(permission.userId).toBe(inviteeUser.id);
        expect(permission.canEdit).toBe(true);
        expect(permission.canDelete).toBe(false);
        expect(permission.invitedBy).toBe(placeOwner.id);
        expect(permission.acceptedAt).toBeUndefined();
      }

      // Verify invitation email was sent
      const mockEmailService = context.emailService as MockEmailService;
      const sentEmails = mockEmailService.getSentEmails();
      const invitationEmail = sentEmails.find(
        (email) => email.type === "editorInvitation",
      );

      expect(invitationEmail).toBeDefined();
      if (invitationEmail) {
        expect(invitationEmail.to).toBe(inviteeUser.email);
        expect(invitationEmail.inviterName).toBe(placeOwner.name);
        expect(invitationEmail.placeName).toBe(testPlace.name);
        expect(invitationEmail.token).toBeDefined();
      }
    });

    it("should successfully invite an editor with delete permissions", async () => {
      const input: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: true,
      };

      const result = await inviteEditorToPlace(context, placeOwner.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const permission = result.value;
        expect(permission.canEdit).toBe(true);
        expect(permission.canDelete).toBe(true);
      }
    });

    it("should still create invitation even if email sending fails", async () => {
      // Set email service to fail
      const mockEmailService = context.emailService as MockEmailService;
      mockEmailService.setShouldFail(true);

      const input: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      const result = await inviteEditorToPlace(context, placeOwner.id, input);

      // Invitation should still be created even if email fails
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const permission = result.value;
        expect(permission.placeId).toBe(testPlace.id);
        expect(permission.userId).toBe(inviteeUser.id);
      }

      // Reset email service
      mockEmailService.setShouldFail(false);
    });

    it("should fail when inviter does not exist", async () => {
      const input: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      const result = await inviteEditorToPlace(
        context,
        "non-existent-id",
        input,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should fail when place does not exist", async () => {
      const input: InviteEditorInput = {
        placeId: "non-existent-place-id",
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      const result = await inviteEditorToPlace(context, placeOwner.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PLACE_NOT_FOUND);
      }
    });

    it("should fail when inviter lacks edit permissions", async () => {
      const input: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      const result = await inviteEditorToPlace(context, visitorUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          ERROR_CODES.PLACE_EDIT_PERMISSION_REQUIRED,
        );
      }
    });

    it("should fail when invitee email does not exist", async () => {
      const input: InviteEditorInput = {
        placeId: testPlace.id,
        email: "nonexistent@example.com",
        canEdit: true,
        canDelete: false,
      };

      const result = await inviteEditorToPlace(context, placeOwner.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should fail when user already has permission", async () => {
      // First invitation
      const input: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      await inviteEditorToPlace(context, placeOwner.id, input);

      // Second invitation should fail
      const result = await inviteEditorToPlace(context, placeOwner.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.ALREADY_EXISTS);
      }
    });

    it("should handle invalid email format", async () => {
      const input: InviteEditorInput = {
        placeId: testPlace.id,
        email: "invalid-email",
        canEdit: true,
        canDelete: false,
      };

      // This should be caught by Zod validation, but we test the application logic
      const result = await inviteEditorToPlace(context, placeOwner.id, input);

      expect(result.isErr()).toBe(true);
    });
  });

  describe("acceptEditorInvitation", () => {
    it("should successfully accept an editor invitation", async () => {
      // Create invitation first
      const inviteInput: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      const inviteResult = await inviteEditorToPlace(
        context,
        placeOwner.id,
        inviteInput,
      );
      expect(inviteResult.isOk()).toBe(true);

      if (inviteResult.isOk()) {
        const permission = inviteResult.value;

        const acceptInput: AcceptInvitationInput = {
          permissionId: permission.id,
        };

        const result = await acceptEditorInvitation(
          context,
          inviteeUser.id,
          acceptInput,
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const acceptedPermission = result.value;
          expect(acceptedPermission.acceptedAt).toBeDefined();
        }
      }
    });

    it("should fail when user does not exist", async () => {
      const acceptInput: AcceptInvitationInput = {
        permissionId: "some-permission-id",
      };

      const result = await acceptEditorInvitation(
        context,
        "non-existent-user",
        acceptInput,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should fail when permission ID is invalid", async () => {
      const acceptInput: AcceptInvitationInput = {
        permissionId: "non-existent-permission-id",
      };

      const result = await acceptEditorInvitation(
        context,
        inviteeUser.id,
        acceptInput,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });

  describe("updateEditorPermission", () => {
    it("should successfully update editor permissions", async () => {
      // Create and accept invitation first
      const inviteInput: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      const inviteResult = await inviteEditorToPlace(
        context,
        placeOwner.id,
        inviteInput,
      );
      expect(inviteResult.isOk()).toBe(true);

      if (inviteResult.isOk()) {
        const permission = inviteResult.value;

        const updateInput: UpdatePermissionInput = {
          permissionId: permission.id,
          canEdit: true,
          canDelete: true,
        };

        const result = await updateEditorPermission(
          context,
          placeOwner.id,
          updateInput,
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const updatedPermission = result.value;
          expect(updatedPermission.canEdit).toBe(true);
          expect(updatedPermission.canDelete).toBe(true);
        }
      }
    });

    it("should successfully update only canEdit permission", async () => {
      // Create invitation first
      const inviteInput: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: true,
      };

      const inviteResult = await inviteEditorToPlace(
        context,
        placeOwner.id,
        inviteInput,
      );
      expect(inviteResult.isOk()).toBe(true);

      if (inviteResult.isOk()) {
        const permission = inviteResult.value;

        const updateInput: UpdatePermissionInput = {
          permissionId: permission.id,
          canEdit: false,
        };

        const result = await updateEditorPermission(
          context,
          placeOwner.id,
          updateInput,
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const updatedPermission = result.value;
          expect(updatedPermission.canEdit).toBe(false);
          expect(updatedPermission.canDelete).toBe(true); // Should remain unchanged
        }
      }
    });

    it("should fail when user does not exist", async () => {
      const updateInput: UpdatePermissionInput = {
        permissionId: "some-permission-id",
        canEdit: false,
      };

      const result = await updateEditorPermission(
        context,
        "non-existent-user",
        updateInput,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should fail when permission does not exist", async () => {
      const updateInput: UpdatePermissionInput = {
        permissionId: "non-existent-permission-id",
        canEdit: false,
      };

      const result = await updateEditorPermission(
        context,
        placeOwner.id,
        updateInput,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });

  describe("removeEditorPermission", () => {
    it("should successfully remove editor permission", async () => {
      // Create invitation first
      const inviteInput: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      const inviteResult = await inviteEditorToPlace(
        context,
        placeOwner.id,
        inviteInput,
      );
      expect(inviteResult.isOk()).toBe(true);

      if (inviteResult.isOk()) {
        const permission = inviteResult.value;

        const result = await removeEditorPermission(
          context,
          placeOwner.id,
          permission.id,
        );

        expect(result.isOk()).toBe(true);

        // Verify permission is removed by trying to get place editors
        const editorsResult = await getPlaceEditors(
          context,
          testPlace.id,
          placeOwner.id,
        );
        expect(editorsResult.isOk()).toBe(true);
        if (editorsResult.isOk()) {
          const editors = editorsResult.value;
          expect(editors.find((p) => p.id === permission.id)).toBeUndefined();
        }
      }
    });

    it("should fail when user does not exist", async () => {
      const result = await removeEditorPermission(
        context,
        "non-existent-user",
        "permission-id",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should fail when permission does not exist", async () => {
      const result = await removeEditorPermission(
        context,
        placeOwner.id,
        "non-existent-permission-id",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });

  describe("getPlaceEditors", () => {
    it("should successfully get place editors", async () => {
      // Create invitation first
      const inviteInput: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      const inviteResult = await inviteEditorToPlace(
        context,
        placeOwner.id,
        inviteInput,
      );
      expect(inviteResult.isOk()).toBe(true);

      const result = await getPlaceEditors(
        context,
        testPlace.id,
        placeOwner.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const editors = result.value;
        expect(editors).toHaveLength(1);
        expect(editors[0].placeId).toBe(testPlace.id);
        expect(editors[0].userId).toBe(inviteeUser.id);
      }
    });

    it("should return empty array when no editors exist", async () => {
      const result = await getPlaceEditors(
        context,
        testPlace.id,
        placeOwner.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const editors = result.value;
        expect(editors).toHaveLength(0);
      }
    });

    it("should fail when user lacks edit permissions", async () => {
      const result = await getPlaceEditors(
        context,
        testPlace.id,
        visitorUser.id,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          ERROR_CODES.PLACE_EDIT_PERMISSION_REQUIRED,
        );
      }
    });

    it("should get multiple editors correctly", async () => {
      // Create first invitation
      const invite1Input: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      await inviteEditorToPlace(context, placeOwner.id, invite1Input);

      // Create second invitation
      const invite2Input: InviteEditorInput = {
        placeId: testPlace.id,
        email: editorUser.email,
        canEdit: true,
        canDelete: true,
      };

      await inviteEditorToPlace(context, placeOwner.id, invite2Input);

      const result = await getPlaceEditors(
        context,
        testPlace.id,
        placeOwner.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const editors = result.value;
        expect(editors).toHaveLength(2);

        const userIds = editors.map((e) => e.userId);
        expect(userIds).toContain(inviteeUser.id);
        expect(userIds).toContain(editorUser.id);
      }
    });
  });

  describe("getUserEditablePlaces", () => {
    it("should successfully get user's editable places", async () => {
      // Create invitation first
      const inviteInput: InviteEditorInput = {
        placeId: testPlace.id,
        email: editorUser.email,
        canEdit: true,
        canDelete: false,
      };

      const inviteResult = await inviteEditorToPlace(
        context,
        placeOwner.id,
        inviteInput,
      );
      expect(inviteResult.isOk()).toBe(true);

      if (inviteResult.isOk()) {
        // Accept the invitation
        const acceptInput: AcceptInvitationInput = {
          permissionId: inviteResult.value.id,
        };
        await acceptEditorInvitation(context, editorUser.id, acceptInput);

        const result = await getUserEditablePlaces(context, editorUser.id);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const places = result.value;
          expect(places).toHaveLength(1);
          expect(places[0].id).toBe(testPlace.id);
          expect(places[0].hasEditPermission).toBe(true);
        }
      }
    });

    it("should return empty array when user has no editable places", async () => {
      const result = await getUserEditablePlaces(context, visitorUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const places = result.value;
        expect(places).toHaveLength(0);
      }
    });

    it("should get multiple editable places correctly", async () => {
      // Create another place
      const place2Result = await context.placeRepository.create(placeOwner.id, {
        name: "Test Place 2",
        description: "Another test place",
        shortDescription: "Test place 2",
        category: "cafe",
        regionId: testRegion.id,
        coordinates: { latitude: 35.68, longitude: 139.652 },
        address: "2-2-2 Test, Tokyo, Japan",
        images: [],
        tags: ["test2"],
        businessHours: [],
      });
      expect(place2Result.isOk()).toBe(true);

      if (place2Result.isOk()) {
        const testPlace2 = place2Result.value;
        await context.placeRepository.updateStatus(testPlace2.id, "published");

        // Create invitations for both places
        const invite1Input: InviteEditorInput = {
          placeId: testPlace.id,
          email: editorUser.email,
          canEdit: true,
          canDelete: false,
        };

        const invite2Input: InviteEditorInput = {
          placeId: testPlace2.id,
          email: editorUser.email,
          canEdit: true,
          canDelete: true,
        };

        const invite1Result = await inviteEditorToPlace(
          context,
          placeOwner.id,
          invite1Input,
        );
        const invite2Result = await inviteEditorToPlace(
          context,
          placeOwner.id,
          invite2Input,
        );

        expect(invite1Result.isOk()).toBe(true);
        expect(invite2Result.isOk()).toBe(true);

        if (invite1Result.isOk() && invite2Result.isOk()) {
          // Accept both invitations
          await acceptEditorInvitation(context, editorUser.id, {
            permissionId: invite1Result.value.id,
          });
          await acceptEditorInvitation(context, editorUser.id, {
            permissionId: invite2Result.value.id,
          });

          const result = await getUserEditablePlaces(context, editorUser.id);

          expect(result.isOk()).toBe(true);
          if (result.isOk()) {
            const places = result.value;
            expect(places).toHaveLength(2);

            const placeIds = places.map((p) => p.id);
            expect(placeIds).toContain(testPlace.id);
            expect(placeIds).toContain(testPlace2.id);
          }
        }
      }
    });
  });

  describe("concurrent operations", () => {
    it("should handle concurrent invitation attempts", async () => {
      const input: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      // Attempt concurrent invitations
      const [result1, result2] = await Promise.all([
        inviteEditorToPlace(context, placeOwner.id, input),
        inviteEditorToPlace(context, placeOwner.id, input),
      ]);

      // One should succeed, one should fail with ALREADY_EXISTS
      const successCount = [result1, result2].filter((r) => r.isOk()).length;
      const errorResults = [result1, result2].filter((r) =>
        r.isErr(),
      ) as Array<{ error: { code: string } }>;

      expect(successCount).toBe(1);
      expect(errorResults).toHaveLength(1);
      expect(errorResults[0].error.code).toBe(ERROR_CODES.ALREADY_EXISTS);
    });

    it("should handle concurrent permission updates", async () => {
      // Create invitation first
      const inviteInput: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      const inviteResult = await inviteEditorToPlace(
        context,
        placeOwner.id,
        inviteInput,
      );
      expect(inviteResult.isOk()).toBe(true);

      if (inviteResult.isOk()) {
        const permission = inviteResult.value;

        const update1: UpdatePermissionInput = {
          permissionId: permission.id,
          canEdit: false,
        };

        const update2: UpdatePermissionInput = {
          permissionId: permission.id,
          canDelete: true,
        };

        // Attempt concurrent updates
        const [result1, result2] = await Promise.all([
          updateEditorPermission(context, placeOwner.id, update1),
          updateEditorPermission(context, placeOwner.id, update2),
        ]);

        // Both should succeed as they update different fields
        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle invitation with custom message", async () => {
      const input: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
        customMessage: "Welcome to our place editing team!",
      };

      const result = await inviteEditorToPlace(context, placeOwner.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const permission = result.value;
        expect(permission.placeId).toBe(testPlace.id);
        expect(permission.userId).toBe(inviteeUser.id);
      }
    });

    it("should handle removing permission before acceptance", async () => {
      // Create invitation
      const inviteInput: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      const inviteResult = await inviteEditorToPlace(
        context,
        placeOwner.id,
        inviteInput,
      );
      expect(inviteResult.isOk()).toBe(true);

      if (inviteResult.isOk()) {
        const permission = inviteResult.value;

        // Remove permission before acceptance
        const removeResult = await removeEditorPermission(
          context,
          placeOwner.id,
          permission.id,
        );
        expect(removeResult.isOk()).toBe(true);

        // Try to accept the removed invitation
        const acceptInput: AcceptInvitationInput = {
          permissionId: permission.id,
        };

        const acceptResult = await acceptEditorInvitation(
          context,
          inviteeUser.id,
          acceptInput,
        );
        expect(acceptResult.isErr()).toBe(true);
      }
    });

    it("should handle permission update with no changes", async () => {
      // Create invitation
      const inviteInput: InviteEditorInput = {
        placeId: testPlace.id,
        email: inviteeUser.email,
        canEdit: true,
        canDelete: false,
      };

      const inviteResult = await inviteEditorToPlace(
        context,
        placeOwner.id,
        inviteInput,
      );
      expect(inviteResult.isOk()).toBe(true);

      if (inviteResult.isOk()) {
        const permission = inviteResult.value;

        // Update with no actual changes
        const updateInput: UpdatePermissionInput = {
          permissionId: permission.id,
        };

        const result = await updateEditorPermission(
          context,
          placeOwner.id,
          updateInput,
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const updatedPermission = result.value;
          expect(updatedPermission.canEdit).toBe(true); // Should remain the same
          expect(updatedPermission.canDelete).toBe(false); // Should remain the same
        }
      }
    });
  });
});
