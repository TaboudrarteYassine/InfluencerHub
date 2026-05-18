<?php

namespace App\Repositories\Contracts;

interface InfluencerRepositoryInterface
{
    public function findByUserId(int $userId);
    public function createOrUpdate(int $userId, array $data);
    public function search(array $filters, int $perPage = 20);
    public function updateTrustScore(int $profileId, float $score): void;
    public function getFeatured(int $limit = 10): array;
    public function findById(int $id);
}
