"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { createRegionAction, updateRegionAction } from "@/actions/region";
import { ImageUploader } from "@/components/common/ImageUploader";
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
import type { Region, RegionWithStats } from "@/core/domain/region/types";
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
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  address: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()),
  tags: z.array(z.string().max(50)),
  status: z.enum(["draft", "published", "archived"]),
});
type FormInput = z.infer<typeof formSchema>;

// Common type for region form actions
type RegionFormAction = (
  prevState: ActionState<Region, AnyError>,
  formData: FormData,
) => Promise<ActionState<Region, AnyError>>;

interface RegionFormProps {
  region?: RegionWithStats;
  isEdit?: boolean;
}

export function RegionForm({ region, isEdit = false }: RegionFormProps) {
  const action = isEdit ? updateRegionAction : createRegionAction;
  const [actionState, formAction, isPending] = useActionState(
    action as RegionFormAction,
    {
      result: undefined,
      error: null,
    },
  );

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(
    region?.images?.map((url, index) => ({
      url,
      name: `existing-image-${index}`,
      size: 0,
    })) || [],
  );
  const [coverImageUrl, setCoverImageUrl] = useState(region?.coverImage || "");

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: region?.name ?? "",
      description: region?.description,
      shortDescription: region?.shortDescription,
      coordinates: region?.coordinates
        ? {
            latitude: region.coordinates.latitude,
            longitude: region.coordinates.longitude,
          }
        : undefined,
      address: region?.address,
      coverImage: region?.coverImage,
      images: region?.images ?? [],
      tags: region?.tags ?? [],
      status: (region?.status as "draft" | "published" | "archived") ?? "draft",
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
    if (data.address) formData.append("address", data.address);

    // Cover image
    if (coverImageUrl) {
      formData.append("coverImage", coverImageUrl);
    }

    formData.append("status", data.status);

    // Coordinates
    if (data.coordinates) {
      formData.append("latitude", data.coordinates.latitude.toString());
      formData.append("longitude", data.coordinates.longitude.toString());
    }

    // Tags (handle comma-separated input)
    if (data.tags && data.tags.length > 0) {
      const tagsString = Array.isArray(data.tags)
        ? data.tags.join(", ")
        : data.tags;
      const tagsArray = tagsString
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      tagsArray.forEach((tag) => formData.append("tags", tag));
    }

    // Images from uploader
    uploadedImages.forEach((image) => {
      formData.append("images", image.url);
    });

    // Add region ID for edit mode
    if (isEdit && region) {
      formData.append("regionId", region.id);
    }

    formAction(formData);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/editor/regions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            地域管理に戻る
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "地域を編集" : "新しい地域を作成"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? `${region?.name}の情報を更新します`
              : "新しい地域の基本情報を入力してください"}
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
                        <FormLabel>地域名 *</FormLabel>
                        <FormControl>
                          <Input placeholder="例: 渋谷区" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>住所</FormLabel>
                        <FormControl>
                          <Input placeholder="例: 東京都渋谷区" {...field} />
                        </FormControl>
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
                            placeholder="地域の特徴を一言で表現してください"
                            maxLength={100}
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
                            placeholder="地域の詳細な説明、歴史、特色などを記述してください"
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="coordinates.latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>緯度</FormLabel>
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
                          <FormLabel>経度</FormLabel>
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
                      地域の代表的な画像のURLを入力するか、下記の画像アップローダーを使用してください
                    </FormDescription>
                  </div>

                  {/* Image Uploader */}
                  <div>
                    <FormLabel>画像ギャラリー</FormLabel>
                    <div className="mt-2">
                      <ImageUploader
                        initialImages={uploadedImages}
                        onImagesChange={setUploadedImages}
                        maxImages={5}
                        disabled={isPending}
                      />
                    </div>
                    <FormDescription className="mt-1">
                      地域の魅力を伝える画像をアップロードしてください
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
                            placeholder="観光, グルメ, ショッピング（カンマ区切り）"
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
                          地域の特徴をタグで表現してください（カンマ区切り）
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

              {/* Statistics (edit mode only) */}
              {isEdit && region && (
                <Card>
                  <CardHeader>
                    <CardTitle>統計情報</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        場所数:
                      </span>
                      <span className="font-medium">{region.placeCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        お気に入り:
                      </span>
                      <span className="font-medium">
                        {region.favoriteCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        作成日:
                      </span>
                      <span className="font-medium">
                        {new Date(region.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        更新日:
                      </span>
                      <span className="font-medium">
                        {new Date(region.updatedAt).toLocaleDateString("ja-JP")}
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
                      : "地域を作成"}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/editor/regions">キャンセル</Link>
                </Button>
                {isEdit && region && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/regions/${region.id}`}>プレビュー</Link>
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
