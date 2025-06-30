"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { simpleSearchRegionsAction } from "@/actions/region";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const searchSchema = z.object({
  keyword: z.string().min(1, "検索キーワードを入力してください"),
});

type SearchFormData = z.infer<typeof searchSchema>;

interface RegionSearchFormProps {
  initialKeyword?: string;
}

export function RegionSearchForm({
  initialKeyword = "",
}: RegionSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      keyword: initialKeyword,
    },
  });

  const [_actionState, _formAction, isPending] = useActionState(
    simpleSearchRegionsAction,
    { result: undefined, error: null },
  );

  const onSubmit = (data: SearchFormData) => {
    // Navigate to search results page instead of using server action
    const params = new URLSearchParams(searchParams);
    params.set("keyword", data.keyword);
    params.delete("page"); // Reset to first page
    router.push(`/regions?${params.toString()}`);
  };

  return (
    <div className="bg-card p-6 rounded-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <FormField
                control={form.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">検索キーワード</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="地域名、キーワードで検索..."
                          className="pl-10"
                          disabled={isPending}
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? "検索中..." : "検索"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.setValue("keyword", "東京");
                form.handleSubmit(onSubmit)();
              }}
            >
              <MapPin className="h-3 w-3 mr-1" />
              東京
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.setValue("keyword", "大阪");
                form.handleSubmit(onSubmit)();
              }}
            >
              <MapPin className="h-3 w-3 mr-1" />
              大阪
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.setValue("keyword", "京都");
                form.handleSubmit(onSubmit)();
              }}
            >
              <MapPin className="h-3 w-3 mr-1" />
              京都
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.setValue("keyword", "沖縄");
                form.handleSubmit(onSubmit)();
              }}
            >
              <MapPin className="h-3 w-3 mr-1" />
              沖縄
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
