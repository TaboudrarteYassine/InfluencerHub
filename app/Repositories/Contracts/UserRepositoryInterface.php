<?php

namespace App\Repositories\Contracts;

interface UserRepositoryInterface
{
    public function findById(int $id);
    public function findByEmail(string $email);
    public function create(array $data);
    public function update(int $id, array $data);
    public function incrementFailedAttempts(string $email): void;
    public function resetFailedAttempts(int $userId): void;
    public function lockAccount(string $email, int $minutes = 30): void;
    public function updateLastLogin(int $userId, string $ip): void;
}
