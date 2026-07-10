'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { RatingStars } from './RatingStars';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { showToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase/client';
import { getDB } from '@/lib/db/dexie';

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  matchId: string;
  reviewerId: string;
  revieweeId: string;
  revieweeName: string;
  revieweeProviderProfileId?: string;
  currentRating?: number;
  currentReviewCount?: number;
}

export function RatingModal({
  open,
  onClose,
  matchId,
  reviewerId,
  revieweeId,
  revieweeName,
  revieweeProviderProfileId,
  currentRating = 0,
  currentReviewCount = 0,
}: RatingModalProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      const db = getDB();
      const reviewId = crypto.randomUUID();
      const now = new Date().toISOString();

      const review = {
        id: reviewId,
        match_id: matchId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim(),
        created_at: now,
      };

      await db.reviews.add(review);
      await supabase.from('reviews').insert(review);

      // Update provider profile rating
      if (revieweeProviderProfileId) {
        const newAvg = ((currentRating * currentReviewCount) + rating) / (currentReviewCount + 1);
        const newCount = currentReviewCount + 1;
        const updates = { rating: Number(newAvg.toFixed(2)), review_count: newCount, updated_at: now };
        await db.provider_profiles.update(revieweeProviderProfileId, updates);
        await supabase.from('provider_profiles').update(updates).eq('id', revieweeProviderProfileId);
      }

      showToast(t('reviewSubmitted'), 'success');
      setRating(0);
      setComment('');
      onClose();
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast(t('errorOccurred'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('rateUser')}>
      <div className="p-4 space-y-4">
        <p className="text-sm text-slate-600">{revieweeName}</p>

        <div className="flex flex-col items-center gap-2">
          <RatingStars value={rating} onChange={setRating} size="lg" />
          <span className="text-sm text-slate-500">
            {rating > 0 ? `${rating} ${t('starsOutOf5')}` : 'Tap to rate'}
          </span>
        </div>

        <Textarea
          placeholder={t('optionalComment')}
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          rows={3}
          hint={`${comment.length}/500`}
        />

        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            fullWidth
            disabled={rating === 0}
            loading={loading}
            onClick={handleSubmit}
          >
            {t('submitRating')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
