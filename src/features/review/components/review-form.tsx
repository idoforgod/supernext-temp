'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { createReviewSchema, type CreateReviewInput } from '../backend/schema';
import { useCreateReview } from '../hooks/use-reviews';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/rating/star-rating';

interface ReviewFormProps {
  placeId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ placeId, onSuccess }: ReviewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { mutate: createReview, isPending } = useCreateReview();

  const form = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    mode: 'onChange',
    defaultValues: {
      place_id: placeId,
      author_nickname: '',
      rating: 0,
      content: '',
      password: '',
    },
  });

  const onSubmit = (data: CreateReviewInput) => {
    createReview(data, {
      onSuccess: () => {
        toast({
          title: '리뷰가 등록되었습니다',
          description: '소중한 의견 감사합니다.',
        });
        onSuccess?.();
        router.back();
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: '리뷰 등록 실패',
          description: error.message || '잠시 후 다시 시도해주세요.',
        });
      },
    });
  };

  const contentLength = form.watch('content').length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Phase 3: 작성자 이메일 필드 */}
        <FormField
          control={form.control}
          name="author_nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                작성자 (닉네임 또는 이메일) <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="예: hong@example.com"
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phase 4: 평점 필드 */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                평점 <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <StarRating
                    value={field.value}
                    onChange={field.onChange}
                    size="lg"
                  />
                  {field.value > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({field.value}점)
                    </span>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phase 5: 리뷰 내용 필드 */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                리뷰 내용 <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="이 장소에 대한 솔직한 리뷰를 작성해주세요. (최소 10자, 최대 1000자)"
                  rows={5}
                />
              </FormControl>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>최소 10자 이상, 최대 1000자 이하</span>
                <span className={contentLength > 1000 ? 'text-red-500' : ''}>
                  {contentLength} / 1000자
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phase 6: 비밀번호 필드 */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                비밀번호 (리뷰 수정/삭제 시 사용){' '}
                <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  inputMode="numeric"
                  placeholder="4자리 숫자를 입력하세요"
                  maxLength={4}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                입력하신 비밀번호는 리뷰 수정 및 삭제 시 사용됩니다.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phase 7: 등록 버튼 */}
        <div className="pt-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !form.formState.isValid}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                등록 중...
              </>
            ) : (
              '등록하기'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
