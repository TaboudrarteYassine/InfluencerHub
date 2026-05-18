<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\InfluencerProfile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * AI Influencer Matching Service
 *
 * Primary: OpenAI text-embedding-3-small + cosine similarity
 * Fallback: Rule-based weighted scoring
 */
class AiMatchingService
{
    private const TOP_K = 20;

    public function matchInfluencersForCampaign(Campaign $campaign, int $limit = 10): array
    {
        try {
            if (!empty(config('services.openai.key'))) {
                return $this->embeddingMatch($campaign, $limit);
            }
        } catch (\Exception $e) {
            Log::warning('AI matching failed, using rule-based fallback', ['error' => $e->getMessage()]);
        }

        return $this->ruleBasedMatch($campaign, $limit);
    }

    // ─── Embedding-based matching ────────────────────────────────────

    private function embeddingMatch(Campaign $campaign, int $limit): array
    {
        $campaignText    = $this->buildCampaignText($campaign);
        $campaignEmbedding = $this->getEmbedding($campaignText);

        $candidates = InfluencerProfile::with(['user', 'socialAccounts'])
            ->whereHas('user', fn ($q) => $q->where('status', 'active'))
            ->where('availability', 'available')
            ->get();

        $scored = [];
        foreach ($candidates as $profile) {
            $profileText      = $this->buildInfluencerText($profile);
            $profileEmbedding = $this->getEmbedding($profileText);

            $similarity = $this->cosineSimilarity($campaignEmbedding, $profileEmbedding);

            // Boost by trust score
            $trustBoost = ($profile->trust_score / 100) * 0.2;
            $finalScore = ($similarity * 0.8) + $trustBoost;

            $scored[] = [
                'profile'     => $profile,
                'score'       => round($finalScore, 4),
                'similarity'  => round($similarity, 4),
                'explanation' => $this->buildExplanation($profile, $campaign, $finalScore),
            ];
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($scored, 0, $limit);
    }

    private function getEmbedding(string $text): array
    {
        $cacheKey = 'embedding:' . md5($text);

        return Cache::remember($cacheKey, 86400, function () use ($text) {
            $response = Http::withToken(config('services.openai.key'))
                ->timeout(15)
                ->post('https://api.openai.com/v1/embeddings', [
                    'model' => 'text-embedding-3-small',
                    'input' => substr($text, 0, 8000),
                ]);

            if (!$response->successful()) {
                throw new \RuntimeException('OpenAI Embeddings API error');
            }

            return $response->json('data.0.embedding');
        });
    }

    private function cosineSimilarity(array $a, array $b): float
    {
        $dotProduct = 0;
        $normA      = 0;
        $normB      = 0;

        foreach ($a as $i => $val) {
            $dotProduct += $val * ($b[$i] ?? 0);
            $normA      += $val * $val;
            $normB      += ($b[$i] ?? 0) * ($b[$i] ?? 0);
        }

        $denom = sqrt($normA) * sqrt($normB);
        return $denom > 0 ? $dotProduct / $denom : 0;
    }

    // ─── Rule-based fallback ─────────────────────────────────────────

    private function ruleBasedMatch(Campaign $campaign, int $limit): array
    {
        $candidates = InfluencerProfile::with(['socialAccounts'])
            ->whereHas('user', fn ($q) => $q->where('status', 'active'))
            ->where('availability', 'available')
            ->when($campaign->country, fn ($q) => $q->where('country', $campaign->country))
            ->get();

        $scored = [];
        foreach ($candidates as $profile) {
            $score = 0;

            // Budget fit (0–25 pts)
            if ($campaign->budget_max && $profile->price_min) {
                if ($profile->price_min <= $campaign->budget_max) $score += 25;
            } else {
                $score += 15; // No budget constraint bonus
            }

            // Niche match (0–25 pts)
            $campaignNiches  = $campaign->target_niches ?? [];
            $profileNiches   = $profile->niches ?? [];
            if (!empty($campaignNiches) && !empty($profileNiches)) {
                $overlap  = count(array_intersect($campaignNiches, $profileNiches));
                $score   += min(25, $overlap * 8);
            }

            // Followers (0–20 pts)
            if ($campaign->min_followers) {
                $maxFollowers = $profile->socialAccounts->max('followers_count');
                if ($maxFollowers >= $campaign->min_followers) $score += 20;
            } else {
                $score += 10;
            }

            // Trust score (0–20 pts)
            $score += ($profile->trust_score / 100) * 20;

            // Engagement rate (0–10 pts)
            $avgEngagement = $profile->socialAccounts->avg('engagement_rate');
            $score        += min(10, $avgEngagement * 2);

            $scored[] = [
                'profile'     => $profile,
                'score'       => round($score, 2),
                'similarity'  => null,
                'explanation' => $this->buildExplanation($profile, $campaign, $score / 100),
            ];
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($scored, 0, $limit);
    }

    // ─── Text builders ───────────────────────────────────────────────

    private function buildCampaignText(Campaign $campaign): string
    {
        return implode(' ', array_filter([
            $campaign->title,
            $campaign->description,
            $campaign->deliverables,
            implode(', ', $campaign->target_niches ?? []),
            implode(', ', $campaign->platforms ?? []),
            $campaign->country,
        ]));
    }

    private function buildInfluencerText(InfluencerProfile $profile): string
    {
        $socialInfo = $profile->socialAccounts->map(fn ($a) =>
            "{$a->platform}: {$a->followers_count} followers, {$a->engagement_rate}% engagement"
        )->implode('. ');

        return implode(' ', array_filter([
            $profile->display_name,
            $profile->bio,
            implode(', ', $profile->niches ?? []),
            implode(', ', $profile->languages ?? []),
            $profile->country,
            $profile->city,
            $socialInfo,
        ]));
    }

    private function buildExplanation(InfluencerProfile $profile, Campaign $campaign, float $score): array
    {
        return [
            'score'       => round($score * 100, 1),
            'trust_score' => $profile->trust_score,
            'rating'      => $profile->rating_avg,
            'niche_match' => !empty(array_intersect($profile->niches ?? [], $campaign->target_niches ?? [])),
            'verified'    => $profile->is_verified,
            'availability'=> $profile->availability,
        ];
    }
}
