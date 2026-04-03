-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `free_trial_exams_used` INTEGER NOT NULL DEFAULT 0;

-- Backfill: users who are effectively on free plan get min(2, exam count); active subscribers stay 0
UPDATE `profiles` p
LEFT JOIN (
  SELECT `user_id`, LEAST(2, COUNT(*)) AS `cnt`
  FROM `exams`
  GROUP BY `user_id`
) e ON e.`user_id` = p.`id`
SET p.`free_trial_exams_used` = COALESCE(e.`cnt`, 0)
WHERE NOT (
  p.`subscription_tier` IN ('monthly', 'semester', 'annual')
  AND p.`subscription_expires_at` IS NOT NULL
  AND p.`subscription_expires_at` > NOW()
);
