<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * AI Moderation Service
 *
 * Uses OpenAI Moderation API.
 * Falls back to rule-based detection if API is unavailable.
 */
class AiModerationService
{
    private const CACHE_TTL = 3600; // 1 hour cache for repeated content

    private array $blockedPatterns = [
        '/\b(scam|fraud|fake|cheat)\b/i',
        '/\b(whatsapp|telegram|wire|transfer)\b.*\b(money|payment|pay)\b/i',
        '/\b\d{10,}\b/', // Phone numbers
    ];

    public function moderateText(string $text): array
    {
        $cacheKey = 'moderation:' . md5($text);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($text) {
            try {
                return $this->callOpenAiModeration($text);
            } catch (\Exception $e) {
                Log::warning('OpenAI moderation API failed, using fallback', ['error' => $e->getMessage()]);
                return $this->ruleBased($text);
            }
        });
    }

    private function callOpenAiModeration(string $text): array
    {
        if (empty(config('services.openai.key'))) {
            return $this->ruleBased($text);
        }

        $response = Http::withToken(config('services.openai.key'))
            ->timeout(5)
            ->post('https://api.openai.com/v1/moderations', [
                'input' => $text,
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException('OpenAI API error: ' . $response->status());
        }

        $result     = $response->json('results.0');
        $categories = $result['categories'] ?? [];
        $scores     = $result['category_scores'] ?? [];
        $flagged    = $result['flagged'] ?? false;
        $maxScore   = $scores ? max(array_values($scores)) : 0;

        return [
            'flagged'    => $flagged,
            'score'      => round($maxScore, 4),
            'categories' => $categories,
            'source'     => 'openai',
        ];
    }

    /**
     * Rule-based fallback moderation.
     */
    private function ruleBased(string $text): array
    {
        $flagged    = false;
        $categories = [];

        foreach ($this->blockedPatterns as $pattern) {
            if (preg_match($pattern, $text)) {
                $flagged      = true;
                $categories[] = 'rule_based_match';
            }
        }

        // Simple spam detection: excessive links
        $linkCount = preg_match_all('/https?:\/\//i', $text);
        if ($linkCount > 3) {
            $flagged      = true;
            $categories[] = 'spam_links';
        }

        return [
            'flagged'    => $flagged,
            'score'      => $flagged ? 0.9 : 0.0,
            'categories' => $categories,
            'source'     => 'rule_based',
        ];
    }
}
