<?php

namespace App\Repositories\Contracts;

interface CampaignRepositoryInterface
{
    public function findById(int $id);
    public function create(array $data);
    public function update(int $id, array $data);
    public function delete(int $id): void;
    public function listForClient(int $clientId, array $filters, int $perPage = 15);
    public function listPublished(array $filters, int $perPage = 15);
    public function updateStatus(int $id, string $status): void;
}
