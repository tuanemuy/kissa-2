# Frontend Implementation

## Server Action

```typescript
// src/actions/post.ts
import { revalidatePath } from "next/navigation";
import { updatePost, updatePostInputSchema, type UpdatePostInput } from "@/core/application/post/updatePost";
import { ApplicationServiceError } from "@/core/application/error";
import { listUserPosts } from "@/core/application/post/listPosts";
import { validate, type ValidationError } from "@/lib/validation";
import type { Pagination } from "@/lib/pagination";
import type { ActionState } from "@/lib/actionState";
import { context } from "./context";

export async function listUserPostsAction(
  userId: string,
  pagination: Pagination
): Promise<ActionState<Post[]>> {
  const result = await listUserPosts(context, { userId, pagination });

  if (result.isErr()) {
    return {
      result: [],
      error: result.error,
    };
  }

  return {
    result: result.value,
    error: null,
  };
}

export async function updatePostFormAction(
  prevState: ActionState<Post, ValidationError<UpdatePostInput> | ApplicationServiceError>,
  formData: FormData
): Promise<ActionState<Post, ValidationError<UpdatePostInput> | ApplicationServiceError>> {
  const input = {
    id: formData.get("id"),
    content: formData.get("content"),
  };

  const validation = validate(updatePostInputSchema, input);
  if (validation.isErr()) {
    return {
      result: prevState.result,
      error: validation.error,
    };
  }

  const result = updateUserProfile(context, validation.value);

  if (result.isErr()) {
    return {
      result: prevState.result,
      error: result.error,
    };
  }

  revalidatePath(`/post/${input.id}`);

  return {
    result: result.value,
    error: null
  };
}
```

## Client Component

```typescript
// src/components/post/UserPostList.tsx
import { listUserPostsAction } from "@/actions/post";

export async function UserPostList({
  userId,
  pagination,
}: {
  userId: string;
  pagination: Pagination;
}) {
  const { result, error } = await listUserPostsAction(userId, pagination);

  return (
    // Render the list of posts or handle errors
  );
}
```

```typescript
// src/components/post/PostUpdateForm.tsx
"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePostFormAction } from "@/actions/post";
// ...

const inputSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1)
});
type Input = z.infer<typeof inputSchema>;

interface Props {
  post: Post;
}

export function ProfileUpdateForm({ post }: Props) {
  const form = useForm<UpdateUserProfileInput>({
    resolver: zodResolver(inputSchema),
    defaultValues: post,
  });

  const [actionState, formAction, isPending] = useActionState(
    updatePostFormAction,
    { result: undefined, error: null }
  );

  const onSubmit = (data: Input) => {
    startTransition(() => {
      formAction(data);
    });
  };

  return (
      <Form {...form}>
        <form 
          action={formAction} 
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => /* FormItem */}
          />

          // ...
        </form>
      </Form>
    </div>
  );
}
```
