import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type {
  InviteEditorParams,
  PlacePermission,
  PlaceWithStats,
  UpdatePermissionParams,
} from "@/core/domain/place/types";
import type { User } from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class PlacePermissionError extends AnyError {
  override readonly name = "PlacePermissionError";
}

export const inviteEditorInputSchema = z.object({
  placeId: z.string().uuid(),
  email: z.string().email(),
  canEdit: z.boolean().default(true),
  canDelete: z.boolean().default(false),
  customMessage: z.string().max(500).optional(),
});
export type InviteEditorInput = z.infer<typeof inviteEditorInputSchema>;

export const acceptInvitationInputSchema = z.object({
  permissionId: z.string().uuid(),
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationInputSchema>;

export const updatePermissionInputSchema = z.object({
  permissionId: z.string().uuid(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});
export type UpdatePermissionInput = z.infer<typeof updatePermissionInputSchema>;

/**
 * Invite an editor to a place with email and app notifications
 */
export async function inviteEditorToPlace(
  context: Context,
  inviterId: string,
  input: InviteEditorInput,
): Promise<Result<PlacePermission, PlacePermissionError>> {
  try {
    // Verify inviter exists and has permission to invite
    const inviterResult = await context.userRepository.findById(inviterId);
    if (inviterResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to find inviter",
          ERROR_CODES.INTERNAL_ERROR,
          inviterResult.error,
        ),
      );
    }

    const inviter = inviterResult.value;
    if (!inviter) {
      return err(
        new PlacePermissionError(
          "Inviter not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Verify place exists
    const placeResult = await context.placeRepository.findById(input.placeId);
    if (placeResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to find place",
          ERROR_CODES.INTERNAL_ERROR,
          placeResult.error,
        ),
      );
    }

    const place = placeResult.value;
    if (!place) {
      return err(
        new PlacePermissionError(
          "Place not found",
          ERROR_CODES.PLACE_NOT_FOUND,
        ),
      );
    }

    // Check if inviter has permission to invite editors to this place
    const hasPermissionResult =
      await context.placeRepository.checkEditPermission(
        input.placeId,
        inviterId,
      );
    if (hasPermissionResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to check inviter permissions",
          ERROR_CODES.INTERNAL_ERROR,
          hasPermissionResult.error,
        ),
      );
    }

    if (!hasPermissionResult.value) {
      return err(
        new PlacePermissionError(
          "Insufficient permissions to invite editors",
          ERROR_CODES.PLACE_EDIT_PERMISSION_REQUIRED,
        ),
      );
    }

    // Check if user being invited exists
    const inviteeResult = await context.userRepository.findByEmail(input.email);
    if (inviteeResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to find invitee",
          ERROR_CODES.INTERNAL_ERROR,
          inviteeResult.error,
        ),
      );
    }

    const invitee = inviteeResult.value;
    if (!invitee) {
      return err(
        new PlacePermissionError(
          "User with this email not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Check if invitee already has permission for this place
    const existingPermissionResult =
      await context.placePermissionRepository.findByUserAndPlace(
        invitee.id,
        input.placeId,
      );
    if (existingPermissionResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to check existing permissions",
          ERROR_CODES.INTERNAL_ERROR,
          existingPermissionResult.error,
        ),
      );
    }

    if (existingPermissionResult.value) {
      return err(
        new PlacePermissionError(
          "User already has permission for this place",
          ERROR_CODES.ALREADY_EXISTS,
        ),
      );
    }

    // Create the invitation
    const inviteParams: InviteEditorParams = {
      placeId: input.placeId,
      email: input.email,
      canEdit: input.canEdit,
      canDelete: input.canDelete,
    };

    const inviteResult = await context.placePermissionRepository.invite(
      inviterId,
      inviteParams,
    );
    if (inviteResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to create invitation",
          ERROR_CODES.INTERNAL_ERROR,
          inviteResult.error,
        ),
      );
    }

    const permission = inviteResult.value;

    // Send email notification
    const emailResult = await context.emailService.sendEditorInvitationEmail(
      input.email,
      inviter.name,
      place.name,
      permission.id,
    );

    if (emailResult.isErr()) {
      // Log error but don't fail the invitation creation
      console.error("Failed to send invitation email:", emailResult.error);
    }

    return ok(permission);
  } catch (error) {
    return err(
      new PlacePermissionError(
        "Unexpected error during editor invitation",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Accept an editor invitation
 */
export async function acceptEditorInvitation(
  context: Context,
  userId: string,
  input: AcceptInvitationInput,
): Promise<Result<PlacePermission, PlacePermissionError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to find user",
          ERROR_CODES.INTERNAL_ERROR,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new PlacePermissionError("User not found", ERROR_CODES.USER_NOT_FOUND),
      );
    }

    // Accept the invitation
    const acceptResult = await context.placePermissionRepository.accept(
      input.permissionId,
    );
    if (acceptResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to accept invitation",
          ERROR_CODES.INTERNAL_ERROR,
          acceptResult.error,
        ),
      );
    }

    return ok(acceptResult.value);
  } catch (error) {
    return err(
      new PlacePermissionError(
        "Unexpected error during invitation acceptance",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Update permission settings for an editor
 */
export async function updateEditorPermission(
  context: Context,
  userId: string,
  input: UpdatePermissionInput,
): Promise<Result<PlacePermission, PlacePermissionError>> {
  try {
    // Verify user has permission to update permissions
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to find user",
          ERROR_CODES.INTERNAL_ERROR,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new PlacePermissionError("User not found", ERROR_CODES.USER_NOT_FOUND),
      );
    }

    // Update the permission
    const updateParams: UpdatePermissionParams = {};
    if (input.canEdit !== undefined) {
      updateParams.canEdit = input.canEdit;
    }
    if (input.canDelete !== undefined) {
      updateParams.canDelete = input.canDelete;
    }

    const updateResult = await context.placePermissionRepository.update(
      input.permissionId,
      updateParams,
    );
    if (updateResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to update permission",
          ERROR_CODES.INTERNAL_ERROR,
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new PlacePermissionError(
        "Unexpected error during permission update",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Remove an editor's permission from a place
 */
export async function removeEditorPermission(
  context: Context,
  userId: string,
  permissionId: string,
): Promise<Result<void, PlacePermissionError>> {
  try {
    // Verify user has permission to remove permissions
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to find user",
          ERROR_CODES.INTERNAL_ERROR,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new PlacePermissionError("User not found", ERROR_CODES.USER_NOT_FOUND),
      );
    }

    // Remove the permission
    const removeResult =
      await context.placePermissionRepository.remove(permissionId);
    if (removeResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to remove permission",
          ERROR_CODES.INTERNAL_ERROR,
          removeResult.error,
        ),
      );
    }

    return ok(removeResult.value);
  } catch (error) {
    return err(
      new PlacePermissionError(
        "Unexpected error during permission removal",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get all editors for a place
 */
export async function getPlaceEditors(
  context: Context,
  placeId: string,
  userId: string,
): Promise<Result<PlacePermission[], PlacePermissionError>> {
  try {
    // Verify user has permission to view editors
    const hasPermissionResult =
      await context.placeRepository.checkEditPermission(placeId, userId);
    if (hasPermissionResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to check user permissions",
          ERROR_CODES.INTERNAL_ERROR,
          hasPermissionResult.error,
        ),
      );
    }

    if (!hasPermissionResult.value) {
      return err(
        new PlacePermissionError(
          "Insufficient permissions to view editors",
          ERROR_CODES.PLACE_EDIT_PERMISSION_REQUIRED,
        ),
      );
    }

    // Get all permissions for the place
    const permissionsResult =
      await context.placePermissionRepository.findByPlace(placeId);
    if (permissionsResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to get place editors",
          ERROR_CODES.INTERNAL_ERROR,
          permissionsResult.error,
        ),
      );
    }

    return ok(permissionsResult.value);
  } catch (error) {
    return err(
      new PlacePermissionError(
        "Unexpected error getting place editors",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get all places a user has editor permissions for
 */
export async function getUserEditablePlaces(
  context: Context,
  userId: string,
): Promise<Result<PlaceWithStats[], PlacePermissionError>> {
  try {
    // Get shared places for the user
    const sharedPlacesResult =
      await context.placePermissionRepository.getSharedPlaces(userId);
    if (sharedPlacesResult.isErr()) {
      return err(
        new PlacePermissionError(
          "Failed to get editable places",
          ERROR_CODES.INTERNAL_ERROR,
          sharedPlacesResult.error,
        ),
      );
    }

    return ok(sharedPlacesResult.value);
  } catch (error) {
    return err(
      new PlacePermissionError(
        "Unexpected error getting editable places",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
