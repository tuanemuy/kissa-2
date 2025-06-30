"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { createPlaceAction, updatePlaceAction } from "@/actions/place";
import { ImageUploader } from "@/components/common/ImageUploader";
import {
  type BusinessHour,
  BusinessHoursForm,
} from "@/components/place/BusinessHoursForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Place, PlaceWithStats } from "@/core/domain/place/types";
import type { RegionWithStats } from "@/core/domain/region/types";
import type { ActionState } from "@/lib/actionState";
import type { AnyError } from "@/lib/error";

interface UploadedImage {
  url: string;
  name: string;
  size: number;
  file?: File;
}

const formSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  shortDescription: z.string().max(300).optional(),
  category: z.enum([
    "restaurant",
    "cafe",
    "hotel",
    "shopping",
    "entertainment",
    "culture",
    "nature",
    "historical",
    "religious",
    "transportation",
    "hospital",
    "education",
    "office",
    "other",
  ]),
  regionId: z.string().uuid(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  address: z.string().min(1).max(500),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()),
  tags: z.array(z.string().max(50)),
  businessHours: z.array(
    z.object({
      dayOfWeek: z.string(),
      openTime: z.string().optional(),
      closeTime: z.string().optional(),
      isClosed: z.boolean(),
    }),
  ),
  status: z.enum(["draft", "published", "archived"]),
});
type FormInput = z.infer<typeof formSchema>;

const categoryOptions = [
  { value: "restaurant", label: "レストラン" },
  { value: "cafe", label: "カフェ" },
  { value: "hotel", label: "ホテル" },
  { value: "shopping", label: "ショッピング" },
  { value: "entertainment", label: "エンターテイメント" },
  { value: "culture", label: "文化" },
  { value: "nature", label: "自然" },
  { value: "historical", label: "歴史" },
  { value: "religious", label: "宗教" },
  { value: "transportation", label: "交通" },
  { value: "hospital", label: "病院" },
  { value: "education", label: "教育" },
  { value: "office", label: "オフィス" },
  { value: "other", label: "その他" },
];

// Common type for place form actions
type PlaceFormAction = (
  prevState: ActionState<Place, AnyError>,
  formData: FormData,
) => Promise<ActionState<Place, AnyError>>;

interface PlaceFormProps {
  place?: PlaceWithStats;
  regions: RegionWithStats[];
  isEdit?: boolean;
}

export function PlaceForm({ place, regions, isEdit = false }: PlaceFormProps) {
  const action = isEdit ? updatePlaceAction : createPlaceAction;
  const [actionState, formAction, isPending] = useActionState(
    action as PlaceFormAction,
    {
      result: undefined,
      error: null,
    },
  );

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(
    place?.images?.map((url, index) => ({
      url,
      name: `existing-image-${index}`,
      size: 0,
    })) || [],
  );
  const [coverImageUrl, setCoverImageUrl] = useState(place?.coverImage || "");

  // Business hours state
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(
    place?.businessHours || [],
  );

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: place?.name ?? "",
      description: place?.description,
      shortDescription: place?.shortDescription,
      category: place?.category ?? "other",
      regionId: place?.regionId ?? "",
      coordinates: place?.coordinates
        ? {
            latitude: place.coordinates.latitude,
            longitude: place.coordinates.longitude,
          }
        : { latitude: 0, longitude: 0 },
      address: place?.address ?? "",
      phone: place?.phone,
      website: place?.website,
      email: place?.email,
      coverImage: place?.coverImage,
      images: place?.images ?? [],
      tags: place?.tags ?? [],
      businessHours: businessHours,
      status: (place?.status as "draft" | "published" | "archived") ?? "draft",
    },
  });

  // Handle server action errors
  useEffect(() => {
    if (actionState.error) {
      if ("fieldErrors" in actionState.error && actionState.error.fieldErrors) {
        // Handle validation errors
        Object.entries(actionState.error.fieldErrors).forEach(
          ([field, errors]) => {
            if (errors && Array.isArray(errors) && errors.length > 0) {
              form.setError(field as keyof FormInput, {
                type: "server",
                message: errors[0],
              });
            }
          },
        );
      } else {
        // Handle general errors
        form.setError("root", {
          type: "server",
          message: actionState.error.message || "An error occurred",
        });
      }
    }
  }, [actionState.error, form]);

  const onSubmit = (data: FormInput) => {
    const formData = new FormData();

    // Basic fields
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.shortDescription)
      formData.append("shortDescription", data.shortDescription);
    formData.append("category", data.category);
    formData.append("regionId", data.regionId);
    formData.append("address", data.address);
    formData.append("status", data.status);

    // Optional fields
    if (data.phone) formData.append("phone", data.phone);
    if (data.website) formData.append("website", data.website);
    if (data.email) formData.append("email", data.email);

    // Cover image
    if (coverImageUrl) {
      formData.append("coverImage", coverImageUrl);
    }

    // Coordinates
    formData.append("latitude", data.coordinates.latitude.toString());
    formData.append("longitude", data.coordinates.longitude.toString());

    // Images from uploader
    uploadedImages.forEach((image) => {
      formData.append("images", image.url);
    });

    // Tags (handle comma-separated input)
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach((tag) => formData.append("tags", tag));
    }

    // Business hours
    if (businessHours.length > 0) {
      formData.append("businessHours", JSON.stringify(businessHours));
    }

    // Add place ID for edit mode
    if (isEdit && place) {
      formData.append("placeId", place.id);
    }

    formAction(formData);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/editor/places">
            <ArrowLeft className="h-4 w-4 mr-2" />
            場所管理に戻る
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "場所を編集" : "新しい場所を作成"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? `${place?.name}の情報を更新します`
              : "新しい場所の詳細情報を入力してください"}
          </p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>場所名 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例: カフェ・ドゥ・フルール"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>カテゴリー *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="カテゴリーを選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="regionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>地域 *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="地域を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {regions.map((region) => (
                              <SelectItem key={region.id} value={region.id}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>短い説明</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="場所の特徴を一言で表現してください"
                            maxLength={300}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>詳細説明</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="場所の詳細な説明、特色、サービスなどを記述してください"
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>位置情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>住所 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例: 東京都渋谷区渋谷1-1-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="coordinates.latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>緯度 *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.000001"
                              placeholder="例: 35.658581"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="coordinates.longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>経度 *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.000001"
                              placeholder="例: 139.745433"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>連絡先情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>電話番号</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="例: 03-1234-5678"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ウェブサイト</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>メールアドレス</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="info@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>メディア</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Cover Image URL Input */}
                  <div>
                    <FormLabel>カバー画像URL</FormLabel>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      className="mt-1"
                    />
                    <FormDescription className="mt-1">
                      場所の代表的な画像のURLを入力するか、下記の画像アップローダーを使用してください
                    </FormDescription>
                  </div>

                  {/* Image Uploader */}
                  <div>
                    <FormLabel>画像ギャラリー</FormLabel>
                    <div className="mt-2">
                      <ImageUploader
                        initialImages={uploadedImages}
                        onImagesChange={setUploadedImages}
                        maxImages={8}
                        disabled={isPending}
                      />
                    </div>
                    <FormDescription className="mt-1">
                      場所の魅力を伝える画像をアップロードしてください
                    </FormDescription>
                  </div>

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>タグ</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="美味しい, 静か, WiFi（カンマ区切り）"
                            value={
                              Array.isArray(field.value)
                                ? field.value.join(", ")
                                : field.value
                            }
                            onChange={(e) => {
                              const tags = e.target.value
                                .split(",")
                                .map((tag) => tag.trim())
                                .filter(Boolean);
                              field.onChange(tags);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          場所の特徴をタグで表現してください（カンマ区切り）
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>公開設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ステータス</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">下書き</SelectItem>
                            <SelectItem value="published">公開</SelectItem>
                            <SelectItem value="archived">
                              アーカイブ済み
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <BusinessHoursForm
                value={businessHours}
                onChange={setBusinessHours}
              />

              {/* Statistics (edit mode only) */}
              {isEdit && place && (
                <Card>
                  <CardHeader>
                    <CardTitle>統計情報</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        チェックイン数:
                      </span>
                      <span className="font-medium">
                        {place.checkinCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        お気に入り:
                      </span>
                      <span className="font-medium">
                        {place.favoriteCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        作成日:
                      </span>
                      <span className="font-medium">
                        {new Date(place.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        更新日:
                      </span>
                      <span className="font-medium">
                        {new Date(place.updatedAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="space-y-4">
                <Button type="submit" className="w-full" disabled={isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {isPending
                    ? "処理中..."
                    : isEdit
                      ? "変更を保存"
                      : "場所を作成"}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/editor/places">キャンセル</Link>
                </Button>
                {isEdit && place && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/places/${place.id}`}>プレビュー</Link>
                  </Button>
                )}
              </div>

              {/* Form errors */}
              {form.formState.errors.root && (
                <div className="text-sm text-destructive">
                  {form.formState.errors.root.message}
                </div>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
