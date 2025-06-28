import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import type {
  Checkin,
  CheckinPhoto,
  CheckinStats,
  CheckinStatus,
  CheckinWithDetails,
  CreateCheckinParams,
  ListCheckinsQuery,
  UpdateCheckinParams,
  UploadCheckinPhotosParams,
} from "../types";

export class CheckinRepositoryError extends AnyError {
  override readonly name = "CheckinRepositoryError";

  constructor(message: string, cause?: unknown) {
    super(message, undefined, cause);
  }
}

export interface CheckinRepository {
  create(
    userId: string,
    params: CreateCheckinParams,
  ): Promise<Result<Checkin, CheckinRepositoryError>>;

  findById(
    id: string,
  ): Promise<Result<CheckinWithDetails | null, CheckinRepositoryError>>;

  update(
    id: string,
    params: UpdateCheckinParams,
  ): Promise<Result<Checkin, CheckinRepositoryError>>;

  updateStatus(
    id: string,
    status: CheckinStatus,
  ): Promise<Result<Checkin, CheckinRepositoryError>>;

  delete(id: string): Promise<Result<void, CheckinRepositoryError>>;

  list(
    query: ListCheckinsQuery,
  ): Promise<
    Result<
      { items: CheckinWithDetails[]; count: number },
      CheckinRepositoryError
    >
  >;

  getByUser(
    userId: string,
    limit?: number,
  ): Promise<Result<CheckinWithDetails[], CheckinRepositoryError>>;

  getByPlace(
    placeId: string,
    limit?: number,
  ): Promise<Result<CheckinWithDetails[], CheckinRepositoryError>>;

  getRecentByUser(
    userId: string,
    limit?: number,
  ): Promise<Result<CheckinWithDetails[], CheckinRepositoryError>>;

  getUserStats(
    userId: string,
  ): Promise<Result<CheckinStats, CheckinRepositoryError>>;

  getPlaceStats(
    placeId: string,
  ): Promise<
    Result<
      { checkinCount: number; averageRating: number },
      CheckinRepositoryError
    >
  >;

  checkOwnership(
    id: string,
    userId: string,
  ): Promise<Result<boolean, CheckinRepositoryError>>;

  hasUserCheckedIn(
    userId: string,
    placeId: string,
  ): Promise<Result<boolean, CheckinRepositoryError>>;
}

export interface CheckinPhotoRepository {
  add(
    params: UploadCheckinPhotosParams,
  ): Promise<Result<CheckinPhoto[], CheckinRepositoryError>>;

  findByCheckin(
    checkinId: string,
  ): Promise<Result<CheckinPhoto[], CheckinRepositoryError>>;

  findById(
    id: string,
  ): Promise<Result<CheckinPhoto | null, CheckinRepositoryError>>;

  delete(id: string): Promise<Result<void, CheckinRepositoryError>>;

  deleteByCheckin(
    checkinId: string,
  ): Promise<Result<void, CheckinRepositoryError>>;

  updateCaption(
    id: string,
    caption: string,
  ): Promise<Result<CheckinPhoto, CheckinRepositoryError>>;

  reorderPhotos(
    checkinId: string,
    photoIds: string[],
  ): Promise<Result<void, CheckinRepositoryError>>;
}
